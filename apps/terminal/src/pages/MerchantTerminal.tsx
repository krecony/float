import {
  createTransactionRequest,
  listMembers,
  type GroupMemberWithUser,
} from '@grouppay/shared';
import { useEffect, useState } from 'react';
import { useSupabase } from '../providers/SupabaseProvider';

export function MerchantTerminal() {
  const supabase = useSupabase();
  const [groupId, setGroupId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<GroupMemberWithUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!groupId) {
      setMembers([]);
      return;
    }
    listMembers(supabase, groupId)
      .then(setMembers)
      .catch((e) => setStatus(e instanceof Error ? e.message : 'Failed to load members'));
  }, [groupId, supabase]);

  const toggleMember = (userId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const { data: auth } = await supabase.auth.getSession();
      const userId = auth.session?.user.id;
      if (!userId) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
      }
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error('Not authenticated');

      const cents = Math.round(parseFloat(amount) * 100);
      if (!groupId || !cents || selected.size === 0) {
        throw new Error('Group ID, amount, and at least one participant required');
      }

      await createTransactionRequest(supabase, {
        groupId,
        amountCents: cents,
        description,
        createdBy: session.user.id,
        participantUserIds: Array.from(selected),
      });
      setStatus('Payment request created — mobile users will see it in Approvals.');
      setAmount('');
      setDescription('');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={styles.main}>
      <h1 style={styles.title}>Merchant terminal</h1>
      <p style={styles.sub}>Create a payment request for a travel group (demo).</p>

      <label style={styles.label}>
        Group ID (UUID)
        <input
          style={styles.input}
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
          placeholder="Paste group UUID from mobile app"
        />
      </label>

      <label style={styles.label}>
        Amount (EUR)
        <input
          style={styles.input}
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>

      <label style={styles.label}>
        Description
        <input
          style={styles.input}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Dinner at..."
        />
      </label>

      {members.length > 0 ? (
        <fieldset style={styles.fieldset}>
          <legend>Participants (subset of group)</legend>
          {members.map((m) => (
            <label key={m.user_id} style={styles.check}>
              <input
                type="checkbox"
                checked={selected.has(m.user_id)}
                onChange={() => toggleMember(m.user_id)}
              />
              {m.users?.display_name ?? m.user_id}
            </label>
          ))}
        </fieldset>
      ) : null}

      <button style={styles.button} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Sending…' : 'Request payment'}
      </button>

      {status ? <p style={styles.status}>{status}</p> : null}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 480, margin: '0 auto', padding: 32 },
  title: { color: '#3dffa8', marginBottom: 8 },
  sub: { color: '#9898b0', marginBottom: 24 },
  label: { display: 'block', marginBottom: 16, color: '#9898b0', fontSize: 14 },
  input: {
    display: 'block',
    width: '100%',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    border: '1px solid #2a2a3d',
    background: '#14141f',
    color: '#f4f4f8',
  },
  fieldset: { border: '1px solid #2a2a3d', borderRadius: 8, padding: 16, marginBottom: 16 },
  check: { display: 'block', marginBottom: 8, color: '#f4f4f8' },
  button: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    border: 'none',
    background: '#3dffa8',
    color: '#0a0a0f',
    fontWeight: 700,
    fontSize: 16,
  },
  status: { marginTop: 16, color: '#9898b0' },
};
