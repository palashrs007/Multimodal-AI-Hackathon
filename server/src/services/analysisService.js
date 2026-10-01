import { callGeminiJson, verifyPlaceWithGrounding, MODEL_ROLES } from './gemini.js';
import { SYSTEM_INSTRUCTION } from '../prompts/system.js';
import { buildImageAnalysisPrompt, imageAnalysisJsonSchema } from '../prompts/imageAnalysis.js';
import { buildConstraintParsingPrompt, constraintParsingJsonSchema } from '../prompts/constraintParsing.js';
import { imageAnalysisSchema } from '../schemas/image.js';
import { constraintParseSchema } from '../schemas/constraints.js';
import { getMockImageAnalysis, getMockConstraintParsing } from './mockData.js';
import { classifyDestination } from './destinationService.js';
import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { AIServiceError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';

/**
 * Concurrency runner limiting simultaneous tasks to N.
 */
async function asyncPool(limit, array, iteratorFn) {
  const ret = [];
  const executing = new Set();
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item, array));
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

export async function analyzeTrip({ tripId, userId }) {
  logger.info({ tripId, userId }, 'Starting trip analysis');

  // 1. Fetch trip and images
  let trip;
  let images = [];

  if (isDevPlaceholderSupabase) {
    trip = devStore.trips.get(tripId);
    if (!trip || trip.user_id !== userId) throw new Error('Trip not found for analysis');
    images = Array.from(devStore.trip_images.values()).filter((img) => img.trip_id === tripId);
  } else {
    const { data: tripData, error: tripErr } = await supabaseAdmin
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .eq('user_id', userId)
      .single();
    if (tripErr || !tripData) throw new Error('Trip not found for analysis');
    trip = tripData;

    const { data: imgData, error: imgErr } = await supabaseAdmin
      .from('trip_images')
      .select('*')
      .eq('trip_id', tripId)
      .order('position', { ascending: true });
    if (imgErr) throw new Error(`Failed to load trip images: ${imgErr.message}`);
    images = imgData || [];
  }

  // Set status to analyzing
  if (isDevPlaceholderSupabase) {
    trip.status = 'analyzing';
    trip.error_message = null;
  } else {
    await supabaseAdmin.from('trips').update({ status: 'analyzing', error_message: null }).eq('id', tripId);
  }

  // 2. Run Prompt B for constraint parsing (note + optional voice) first or alongside
  let voiceBase64 = null;
  if (trip.voice_note_path) {
    if (isDevPlaceholderSupabase) {
      const v = devStore.storageFiles.get(trip.voice_note_path);
      if (v) voiceBase64 = v.buffer.toString('base64');
    } else {
      const { data: vBlob } = await supabaseAdmin.storage.from('trip-uploads').download(trip.voice_note_path);
      if (vBlob) {
        const arr = await vBlob.arrayBuffer();
        voiceBase64 = Buffer.from(arr).toString('base64');
      }
    }
  }

  const constraintParts = [];
  if (voiceBase64) {
    constraintParts.push({
      inlineData: {
        mimeType: 'audio/webm',
        data: voiceBase64,
      },
    });
  }

  const constraintText = buildConstraintParsingPrompt({
    noteText: trip.note_text,
    budgetAmount: trip.budget_amount,
    budgetCurrency: trip.budget_currency,
    durationDays: trip.duration_days,
    travelers: trip.travelers,
    pace: trip.pace,
  });
  constraintParts.push({ text: constraintText });

  const parsedConstraints = await callGeminiJson({
    systemInstruction: SYSTEM_INSTRUCTION,
    parts: constraintParts,
    schema: constraintParsingJsonSchema,
    zodSchema: constraintParseSchema,
    temperature: 0.2,
    kind: 'constraint_parsing',
    role: 'PRIMARY',
    userId,
    tripId,
    mockFallback: () => getMockConstraintParsing(trip.note_text, trip),
  });

  // Normalize budget if budget_scope is per_person or per_day
  let normalizedBudget = parsedConstraints.budget_amount;
  if (parsedConstraints.budget_scope === 'per_person' && parsedConstraints.budget_amount) {
    normalizedBudget = parsedConstraints.budget_amount * (trip.travelers || 1);
  } else if (parsedConstraints.budget_scope === 'per_day' && parsedConstraints.budget_amount) {
    normalizedBudget = parsedConstraints.budget_amount * (trip.duration_days || 1);
  }
  parsedConstraints.normalized_total_budget = normalizedBudget || trip.budget_amount;

  // 3. Resolve Destination following Source of Truth Priority
  let resolvedDestination = trip.destination || trip.destination_hint || null;
  let destinationSource = resolvedDestination ? 'user' : null;

  // Priority 2: Extract destination from note/voice (Prompt B)
  if (!resolvedDestination && parsedConstraints.destination_mentioned?.trim()) {
    resolvedDestination = parsedConstraints.destination_mentioned.trim();
    destinationSource = 'note';
  }

  // Preserve or update origin_city
  const resolvedOriginCity = trip.origin_city || parsedConstraints.origin_city || null;

  // 4. Image Analysis (if screenshots provided)
  const imageResults = [];
  if (images.length > 0) {
    const results = await asyncPool(3, images, async (img) => {
      try {
        let base64 = null;
        if (isDevPlaceholderSupabase) {
          const stored = devStore.storageFiles.get(img.storage_path);
          if (stored) base64 = stored.buffer.toString('base64');
        } else {
          const { data: fileBlob, error: downloadErr } = await supabaseAdmin.storage
            .from('trip-uploads')
            .download(img.storage_path);
          if (!downloadErr && fileBlob) {
            const arrayBuf = await fileBlob.arrayBuffer();
            base64 = Buffer.from(arrayBuf).toString('base64');
          }
        }

        const promptText = buildImageAnalysisPrompt({
          sourcePlatform: img.source_platform,
          destination: resolvedDestination,
          destinationHint: trip.destination_hint,
          noteText: trip.note_text,
        });

        const parts = [];
        if (base64) {
          parts.push({
            inlineData: {
              mimeType: img.mime_type || 'image/jpeg',
              data: base64,
            },
          });
        }
        parts.push({ text: promptText });

        // Primary analysis call on PRIMARY model (gemini-3.8-flash)
        let analysis = await callGeminiJson({
          systemInstruction: SYSTEM_INSTRUCTION,
          parts,
          schema: imageAnalysisJsonSchema,
          zodSchema: imageAnalysisSchema,
          temperature: 0.2,
          kind: 'image_analysis',
          role: 'PRIMARY',
          userId,
          tripId,
          mockFallback: () => getMockImageAnalysis(img.position || 0, resolvedDestination || trip.destination || trip.destination_hint),
        });

        // Check if escalation needed:
        // "If an image's best place has confidence < 0.6 or is_identified = false, re-run that image once on ESCALATION with destination as strong prior"
        const bestConfidence = analysis.places?.reduce(
          (max, p) => Math.max(max, p.confidence ?? 0),
          0
        ) ?? 0;
        const hasUnidentified = analysis.places?.some((p) => p.is_identified === false);

        if (bestConfidence < 0.6 || hasUnidentified) {
          logger.info(
            { imgId: img.id, bestConfidence, hasUnidentified },
            'Escalating image analysis to ESCALATION model'
          );

          try {
            const escalationPrompt = `${promptText}\n\nNOTE FOR DEEP RECOGNITION: The previous pass had low confidence or unidentified spots. Focus heavily on readable text, street signage, storefront names, architectural styles, and distinctive landmarks. Target destination: ${resolvedDestination || 'Infer from image'}.`;
            const escalationParts = [];
            if (base64) {
              escalationParts.push({
                inlineData: {
                  mimeType: img.mime_type || 'image/jpeg',
                  data: base64,
                },
              });
            }
            escalationParts.push({ text: escalationPrompt });

            const escalatedAnalysis = await callGeminiJson({
              systemInstruction: SYSTEM_INSTRUCTION,
              parts: escalationParts,
              schema: imageAnalysisJsonSchema,
              zodSchema: imageAnalysisSchema,
              temperature: 0.2,
              kind: 'image_analysis_escalation',
              role: 'ESCALATION',
              userId,
              tripId,
              mockFallback: () => analysis,
            });

            // Keep the higher-confidence result
            const escalatedConfidence = escalatedAnalysis.places?.reduce(
              (max, p) => Math.max(max, p.confidence ?? 0),
              0
            ) ?? 0;

            if (escalatedConfidence > bestConfidence) {
              analysis = escalatedAnalysis;
            }
          } catch (escErr) {
            logger.warn({ escErr: escErr.message, imgId: img.id }, 'Escalation call failed; keeping primary result');
          }
        }

        // Optional Search Grounding for remaining unidentified places
        if (env.GEMINI_GROUNDING && resolvedDestination) {
          for (const p of analysis.places || []) {
            if (!p.is_identified && p.name) {
              const groundedInfo = await verifyPlaceWithGrounding({
                placeName: p.name,
                destination: resolvedDestination,
              });
              if (groundedInfo && !groundedInfo.toLowerCase().includes('not found')) {
                p.description = `${p.description ? p.description + '. ' : ''}${groundedInfo}`.slice(0, 240);
                p.is_identified = true;
                p.confidence = Math.max(p.confidence, 0.75);
              }
            }
          }
        }

        // Update image record
        if (isDevPlaceholderSupabase) {
          img.analysis = analysis;
          img.analysis_status = 'done';
        } else {
          await supabaseAdmin
            .from('trip_images')
            .update({
              analysis,
              analysis_status: 'done',
            })
            .eq('id', img.id);
        }

        return { image: img, analysis };
      } catch (err) {
        // Isolate failures per image: one failed image must never fail the trip!
        logger.error({ err: err.message, imgId: img.id }, 'Image analysis failed for image');
        if (isDevPlaceholderSupabase) {
          img.analysis_status = 'failed';
        } else {
          await supabaseAdmin.from('trip_images').update({ analysis_status: 'failed' }).eq('id', img.id);
        }
        return { image: img, analysis: null };
      }
    });

    imageResults.push(...results);
  }

  // 5. Destination Resolution Priority 3: Inferred from screenshots
  // Only if confidence >= 0.75 and at least 2 images agree, or 1 image with a readable location tag
  if (!resolvedDestination && imageResults.length > 0) {
    const cityCandidates = new Map(); // city -> { count, hasReadableTag, maxConfidence }
    for (const item of imageResults) {
      if (!item.analysis?.places) continue;
      const detectedText = (item.analysis.detected_text || []).join(' ').toLowerCase();

      for (const place of item.analysis.places) {
        if (!place.city) continue;
        const c = place.city.trim();
        const conf = place.confidence ?? 0;
        const hasTag = detectedText.includes(c.toLowerCase());

        const current = cityCandidates.get(c) || { count: 0, hasReadableTag: false, maxConfidence: 0 };
        current.count += 1;
        if (hasTag) current.hasReadableTag = true;
        current.maxConfidence = Math.max(current.maxConfidence, conf);
        cityCandidates.set(c, current);
      }
    }

    // Check criteria: count >= 2 and maxConfidence >= 0.75, OR hasReadableTag and maxConfidence >= 0.75
    let bestInferredCity = null;
    let highestCount = 0;
    for (const [city, stats] of cityCandidates.entries()) {
      if (stats.maxConfidence >= 0.75 && (stats.count >= 2 || stats.hasReadableTag)) {
        if (stats.count > highestCount) {
          highestCount = stats.count;
          bestInferredCity = city;
        }
      }
    }

    if (bestInferredCity) {
      resolvedDestination = bestInferredCity;
      destinationSource = 'screenshot';
      logger.info({ resolvedDestination, destinationSource }, 'Destination inferred from screenshots');
    }
  }

  // 6. Destination Priority 4: Error if no destination resolved!
  if (!resolvedDestination) {
    const errorMsg = 'Tell us where you want to go so we can plan accurately.';
    if (isDevPlaceholderSupabase) {
      trip.status = 'error';
      trip.error_message = errorMsg;
    } else {
      await supabaseAdmin.from('trips').update({ status: 'error', error_message: errorMsg }).eq('id', tripId);
    }
    throw new AIServiceError('NEEDS_DESTINATION', errorMsg);
  }

  // 7. Save extracted places (Idempotent: preserve user_edited ones)
  const destInfo = classifyDestination(resolvedDestination);
  parsedConstraints.destination_info = destInfo;

  const newPlaces = [];
  for (const item of imageResults) {
    if (!item.analysis || !item.analysis.places) continue;
    for (const place of item.analysis.places) {
      // Check if place is geographically outside destination
      let isMismatch = false;
      const placeCountry = (place.country || '').trim().toLowerCase();
      const expectedCountry = (destInfo.country || '').trim().toLowerCase();

      if (placeCountry && expectedCountry && expectedCountry !== 'unknown') {
        const matches = placeCountry.includes(expectedCountry) || expectedCountry.includes(placeCountry);
        if (!matches) isMismatch = true;
      }

      const warningText = isMismatch
        ? `[Warning: This place appears to be in ${place.city || ''}, ${place.country || ''}, outside your destination ${destInfo.canonical_name}. Exclude or change destination?] `
        : '';

      newPlaces.push({
        id: crypto.randomUUID(),
        trip_id: tripId,
        user_id: userId,
        image_id: item.image.id,
        name: place.name,
        is_identified: place.is_identified ?? true,
        category: place.category || 'other',
        city: place.city || null,
        region: place.region || null,
        country: place.country || null,
        confidence: place.confidence ?? 0.8,
        style_tags: place.style_tags || [],
        description: `${warningText}${place.description || ''}`.trim(),
        approx_lat: place.approx_lat || null,
        approx_lng: place.approx_lng || null,
        included: !isMismatch, // Default to false if outside destination
        user_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
  }

  const finalStatus = images.length === 0 ? 'review-skipped' : 'review';

  const tripUpdates = {
    destination: resolvedDestination,
    destination_source: destinationSource,
    origin_city: resolvedOriginCity,
    destination_hint: resolvedDestination,
    parsed_constraints: parsedConstraints,
    voice_transcript: parsedConstraints.transcript || trip.voice_transcript,
    status: finalStatus,
    updated_at: new Date().toISOString(),
  };

  if (isDevPlaceholderSupabase) {
    // Delete non user_edited places
    for (const [key, p] of devStore.extracted_places.entries()) {
      if (p.trip_id === tripId && !p.user_edited) {
        devStore.extracted_places.delete(key);
      }
    }
    for (const p of newPlaces) {
      devStore.extracted_places.set(p.id, p);
    }
    Object.assign(trip, tripUpdates);
  } else {
    // DB: Delete non user-edited
    await supabaseAdmin
      .from('extracted_places')
      .delete()
      .eq('trip_id', tripId)
      .eq('user_edited', false);

    if (newPlaces.length > 0) {
      await supabaseAdmin.from('extracted_places').insert(newPlaces);
    }

    await supabaseAdmin.from('trips').update(tripUpdates).eq('id', tripId);
  }

  logger.info(
    { tripId, status: finalStatus, destination: resolvedDestination, destinationSource, placesCount: newPlaces.length },
    'Trip analysis successfully completed'
  );

  return {
    tripId,
    status: finalStatus,
    nextStep: images.length === 0 ? 'generate' : 'review',
    destination: resolvedDestination,
    destinationSource,
    placesCount: newPlaces.length,
  };
}
