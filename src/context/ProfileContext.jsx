import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

const ProfileContext = createContext();

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile debe usarse dentro de ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setProfile(null);
      setLoaded(true);
      return () => { cancelled = true; };
    }

    setLoaded(false);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error) setProfile(data);
        setLoaded(true);
      });

    return () => { cancelled = true; };
  }, [userId]);

  const updateProfile = async (updates) => {
    if (!userId) throw new Error('No hay sesión activa');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
    return data;
  };

  const completeOnboarding = async ({ username, birthDate }) => {
    await updateProfile({ username, birth_date: birthDate, onboarding_complete: true });
  };

  const uploadAvatar = async (uri, mimeType) => {
    if (!userId) throw new Error('No hay sesión activa');

    const ext = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const arrayBuffer = await fetch(uri).then((res) => res.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, arrayBuffer, { contentType: mimeType || 'image/jpeg', upsert: true });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;
    await updateProfile({ avatar_url: avatarUrl });
    return avatarUrl;
  };

  if (!loaded) {
    return null;
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, completeOnboarding, uploadAvatar }}>
      {children}
    </ProfileContext.Provider>
  );
};
