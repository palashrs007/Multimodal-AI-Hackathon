export function buildImageAnalysisPrompt({
  sourcePlatform = 'unknown',
  destination = '',
  destinationHint = '',
  noteText = '',
} = {}) {
  const confirmedDest = destination || destinationHint || 'None provided';
  return `TASK: Analyze this travel-inspiration screenshot.
Confirmed destination (may be empty): ${confirmedDest}
User's trip description: <user_note>${noteText || 'None provided'}</user_note>

If a destination is confirmed, first check whether this image plausibly shows a place in or near ${confirmedDest}. If it depicts somewhere else, describe the place and its vibe accurately, but note in evidence that it appears to be outside ${confirmedDest}.

Source platform hint: ${sourcePlatform || 'unknown'}

Identify the place(s) shown. Use visual landmarks, architecture, natural features, signage, or readable text tags in the screenshot.
If multiple distinct places appear (e.g. a collage), return each as a separate place.
For each place, describe the visual style, category, and mood.
If you cannot identify the exact location with certainty, set is_identified: false and return a clear generic descriptive title (e.g., "Cliffside Sunset Beach Lounge") without inventing a fictitious name.
Return JSON matching the schema.`;
}

export const imageAnalysisJsonSchema = {
  type: 'object',
  properties: {
    image_summary: {
      type: 'string',
      description: '1-2 sentences describing what the screenshot shows',
    },
    detected_text: {
      type: 'array',
      items: { type: 'string' },
      description: 'Any readable captions, location tags, or signage visible in the image',
    },
    places: {
      type: 'array',
      description: 'Places identified or depicted in this screenshot',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Specific place name, or descriptive generic label if unidentified',
          },
          is_identified: {
            type: 'boolean',
            description: 'True if identified with high certainty, false if generic/unconfirmed',
          },
          category: {
            type: 'string',
            enum: [
              'food_cafe',
              'nature_outdoors',
              'beach',
              'culture_heritage',
              'religious_spiritual',
              'museum_art',
              'nightlife',
              'shopping_market',
              'adventure_sports',
              'wellness_spa',
              'viewpoint_photo_spot',
              'stay_accommodation',
              'local_experience',
              'transport_hub',
              'other',
            ],
          },
          city: { type: 'string', nullable: true },
          region: { type: 'string', nullable: true },
          country: { type: 'string', nullable: true },
          approx_lat: { type: 'number', nullable: true },
          approx_lng: { type: 'number', nullable: true },
          confidence: { type: 'number' },
          style_tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Up to 6 lowercase style tags (e.g. minimalist, aesthetic-cafe, tropical)',
          },
          description: {
            type: 'string',
            description: 'Up to 240 chars explaining why this place is appealing and key vibes',
          },
          evidence: {
            type: 'string',
            description: 'Visual clues or text clues that led to this identification',
          },
        },
        required: ['name', 'is_identified', 'category', 'confidence', 'style_tags', 'description', 'evidence'],
      },
    },
    overall_mood: {
      type: 'string',
      description: 'Overall vibe/mood of the image (e.g. serene and tropical)',
    },
  },
  required: ['image_summary', 'detected_text', 'places', 'overall_mood'],
};
