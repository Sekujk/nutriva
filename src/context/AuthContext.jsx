import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (email, password, captchaToken, studyOptIn) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { captchaToken, data: { study_opt_in: !!studyOptIn } },
    });
    if (error) throw error;
    return { requiresEmailConfirmation: !data.session };
  };

  const signIn = async (email, password, captchaToken) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const deleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete-account');
    if (error) throw error;
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ session, isLoading, signUp, signIn, signOut, deleteAccount, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
