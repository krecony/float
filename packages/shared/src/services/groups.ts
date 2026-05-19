import { generateInviteCode } from '../constants';
import type { GroupPayClient } from '../supabase/client';
import type { Group, GroupMemberWithUser } from '../types/domain';
import { createGroupCard } from './virtualCards';

export async function createGroup(
  client: GroupPayClient,
  userId: string,
  name: string,
): Promise<Group> {
  const invite_code = generateInviteCode();
  const { data: group, error: groupError } = await client
    .from('groups')
    .insert({ name, invite_code })
    .select()
    .single();
  if (groupError) throw groupError;

  const { error: memberError } = await client.from('group_members').insert({
    group_id: group.id,
    user_id: userId,
    role: 'admin',
  });
  if (memberError) throw memberError;

  await createGroupCard(client, group.id);

  return group;
}

export async function joinGroupByInviteCode(
  client: GroupPayClient,
  userId: string,
  inviteCode: string,
): Promise<Group> {
  const { data: group, error: findError } = await client
    .from('groups')
    .select('*')
    .eq('invite_code', inviteCode.toUpperCase())
    .maybeSingle();
  if (findError) throw findError;
  if (!group) throw new Error('Invalid invite code');

  const { error: memberError } = await client.from('group_members').upsert(
    {
      group_id: group.id,
      user_id: userId,
      role: 'member',
    },
    { onConflict: 'group_id,user_id' },
  );
  if (memberError) throw memberError;

  return group;
}

export async function getGroup(
  client: GroupPayClient,
  groupId: string,
): Promise<Group | null> {
  const { data, error } = await client
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listMembers(
  client: GroupPayClient,
  groupId: string,
): Promise<GroupMemberWithUser[]> {
  const { data, error } = await client
    .from('group_members')
    .select('group_id, user_id, role, joined_at, users(id, display_name, legal_name)')
    .eq('group_id', groupId);
  if (error) throw error;
  return (data ?? []) as unknown as GroupMemberWithUser[];
}

export async function listUserGroups(
  client: GroupPayClient,
  userId: string,
): Promise<Group[]> {
  const { data, error } = await client
    .from('group_members')
    .select('groups(*)')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? [])
    .map((row) => (row as unknown as { groups: Group | null }).groups)
    .filter((g): g is Group => g != null);
}
