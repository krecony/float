import { generateVirtualCardPan } from '../constants';
import type { GroupPayClient } from '../supabase/client';
import type { VirtualCard } from '../types/domain';

function buildExpiry() {
  const now = new Date();
  return {
    exp_month: now.getMonth() + 1,
    exp_year: now.getFullYear() + 3,
  };
}

export async function createGroupCard(
  client: GroupPayClient,
  groupId: string,
): Promise<VirtualCard> {
  const { exp_month, exp_year } = buildExpiry();
  const { data, error } = await client
    .from('virtual_cards')
    .insert({
      group_id: groupId,
      pan: generateVirtualCardPan(),
      exp_month,
      exp_year,
      status: 'active',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getGroupCard(
  client: GroupPayClient,
  groupId: string,
): Promise<VirtualCard | null> {
  const { data, error } = await client
    .from('virtual_cards')
    .select('*')
    .eq('group_id', groupId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
