import { observable } from '@legendapp/state';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const auth$ = observable<AuthState>({
  user: null,
  session: null,
  loading: true,
  error: null,
});

// Initialize auth state and listen for changes
supabase.auth.getSession().then(({ data: { session } }) => {
  auth$.session.set(session);
  auth$.user.set(session?.user ?? null);
  auth$.loading.set(false);
});

supabase.auth.onAuthStateChange((_event, session) => {
  auth$.session.set(session);
  auth$.user.set(session?.user ?? null);
});

// Auth actions
export async function signIn(email: string, password: string) {
  auth$.error.set(null);
  auth$.loading.set(true);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    auth$.error.set(error.message);
  }

  auth$.loading.set(false);
}

export async function signOut() {
  auth$.loading.set(true);
  await supabase.auth.signOut();
  auth$.loading.set(false);
}
