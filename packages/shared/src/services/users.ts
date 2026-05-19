import {
  getDemoAuthPassword,
  loginNameToEmail,
  normalizeLoginName,
} from '../auth/demoLogin';
import type { GroupPayClient } from '../supabase/client';
import type { PaymentMethod, User } from '../types/domain';

export async function getProfile(
  client: GroupPayClient,
  userId: string,
): Promise<User | null> {
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findUserByLoginName(
  client: GroupPayClient,
  loginName: string,
): Promise<User | null> {
  const normalized = normalizeLoginName(loginName);
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('login_name', normalized)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function signUpWithLoginName(
  client: GroupPayClient,
  loginName: string,
  options?: { password?: string; displayName?: string },
): Promise<void> {
  const normalized = normalizeLoginName(loginName);
  const email = loginNameToEmail(normalized);
  const password = options?.password ?? getDemoAuthPassword();

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        login_name: normalized,
        display_name: options?.displayName?.trim() || loginName.trim(),
      },
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes('already registered')) {
      throw new Error('That name is already taken. Try logging in instead.');
    }
    throw error;
  }

  if (!data.session) {
    throw new Error(
      'Account created but email confirmation may be required. Disable confirm email in Supabase Auth settings for the demo.',
    );
  }
}

export async function signInWithLoginName(
  client: GroupPayClient,
  loginName: string,
  options?: { password?: string },
): Promise<void> {
  const email = loginNameToEmail(loginName);
  const password = options?.password ?? getDemoAuthPassword();

  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    if (
      error.message.toLowerCase().includes('invalid login') ||
      error.message.toLowerCase().includes('invalid credentials')
    ) {
      throw new Error('No account with that name. Create an account first.');
    }
    throw error;
  }
}

export async function upsertProfile(
  client: GroupPayClient,
  userId: string,
  patch: Partial<
    Pick<User, 'display_name' | 'legal_name' | 'date_of_birth' | 'id_document_last4' | 'login_name'>
  >,
): Promise<User> {
  const { data, error } = await client
    .from('users')
    .update(patch)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function setIdVerified(
  client: GroupPayClient,
  userId: string,
  legal: {
    legal_name: string;
    date_of_birth: string;
    id_document_last4: string;
  },
): Promise<User> {
  const { data, error } = await client
    .from('users')
    .update({
      ...legal,
      id_verified: true,
      id_verified_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listPaymentMethods(
  client: GroupPayClient,
  userId: string,
): Promise<PaymentMethod[]> {
  const { data, error } = await client
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

function digitsOnlyPan(pan: string): string {
  return pan.replace(/\D/g, '');
}

export async function addPaymentMethod(
  client: GroupPayClient,
  userId: string,
  card: {
    label: string;
    pan: string;
    brand: string;
    exp_month: number;
    exp_year: number;
    is_default?: boolean;
  },
): Promise<PaymentMethod> {
  const panDigits = digitsOnlyPan(card.pan);
  const last_four = panDigits.slice(-4);

  const { data, error } = await client
    .from('payment_methods')
    .insert({
      user_id: userId,
      label: card.label,
      pan: panDigits,
      last_four,
      brand: card.brand,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      is_default: card.is_default ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
