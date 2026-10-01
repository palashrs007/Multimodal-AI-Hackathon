import { supabaseAdmin, isDevPlaceholderSupabase, devStore } from '../lib/supabase.js';
import { NotFoundError } from '../lib/errors.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.user.id;

    if (isDevPlaceholderSupabase) {
      const profile = devStore.profiles.get(userId) || {
        id: userId,
        display_name: 'Wanderer',
        default_currency: 'INR',
      };
      return res.json({ success: true, data: profile });
    }

    const { data, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // Auto create if missing
      const newProfile = {
        id: userId,
        display_name: req.user.email?.split('@')[0] || 'Traveler',
        default_currency: 'INR',
      };
      await supabaseAdmin.from('profiles').insert(newProfile);
      return res.json({ success: true, data: newProfile });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.user.id;
    const { display_name, default_currency } = req.body;

    if (isDevPlaceholderSupabase) {
      let profile = devStore.profiles.get(userId) || { id: userId };
      profile = {
        ...profile,
        ...(display_name && { display_name }),
        ...(default_currency && { default_currency }),
        updated_at: new Date().toISOString(),
      };
      devStore.profiles.set(userId, profile);
      return res.json({ success: true, data: profile });
    }

    const { data, error } = await req.supabase
      .from('profiles')
      .update({
        ...(display_name && { display_name }),
        ...(default_currency && { default_currency }),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function deleteUserData(req, res, next) {
  try {
    const userId = req.user.id;

    if (isDevPlaceholderSupabase) {
      // Delete all trips and storage objects for user
      const userTrips = Array.from(devStore.trips.values()).filter((t) => t.user_id === userId);
      for (const t of userTrips) {
        devStore.trips.delete(t.id);
      }
      for (const [key, f] of devStore.storageFiles.entries()) {
        if (key.startsWith(`${userId}/`)) devStore.storageFiles.delete(key);
      }
      devStore.profiles.delete(userId);
      return res.json({ success: true, message: 'All user data wiped completely' });
    }

    // Supabase cascade delete handles tables referencing user_id
    await supabaseAdmin.from('trips').delete().eq('user_id', userId);

    // List and delete storage files
    const { data: files } = await supabaseAdmin.storage
      .from('trip-uploads')
      .list(userId);

    if (files && files.length > 0) {
      const paths = files.map((f) => `${userId}/${f.name}`);
      await supabaseAdmin.storage.from('trip-uploads').remove(paths);
    }

    res.json({ success: true, message: 'All user data and storage assets wiped' });
  } catch (err) {
    next(err);
  }
}
