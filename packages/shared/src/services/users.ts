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

export async function upsertProfile(
  client: GroupPayClient,
  userId: string,
  patch: Partial<Pick<User, 'display_name' | 'legal_name' | 'date_of_birth' | 'id_document_last4'>>,
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

export async function addPaymentMethod(
  client: GroupPayClient,
  userId: string,
  card: {
    label: string;
    last_four: string;
    brand: string;
    exp_month: number;
    exp_year: number;
    is_default?: boolean;
  },
): Promise<PaymentMethod> {
  const { data, error } = await client
    .from('payment_methods')
    .insert({
      user_id: userId,
      ...card,
      is_default: card.is_default ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
