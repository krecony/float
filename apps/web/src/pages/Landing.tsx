import { APP_NAME } from '@grouppay/shared';

const GITHUB_URL =
  import.meta.env.VITE_GITHUB_REPO_URL ?? 'https://github.com/your-org/grouppay';

export function Landing() {
  return (
    <main style={styles.main}>
      {/* TODO: 3D phones hero — see docs/plan.md */}
      <h1 style={styles.title}>{APP_NAME}</h1>
      <p style={styles.lead}>
        Collaborative travel cards with multi-person payment approval. Hackathon demo — simulated
        money only.
      </p>
      <ul style={styles.list}>
        <li>Group virtual debit card</li>
        <li>Merchant terminal payment requests</li>
        <li>Realtime approvals on mobile</li>
      </ul>
      <div style={styles.actions}>
        <a href="#" style={styles.primary}>
          Download app (coming soon)
        </a>
        <a href={GITHUB_URL} style={styles.secondary} target="_blank" rel="noreferrer">
          View source on GitHub
        </a>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: { maxWidth: 640, margin: '0 auto', padding: '80px 24px' },
  title: { fontSize: 48, color: '#3dffa8', marginBottom: 16 },
  lead: { fontSize: 18, lineHeight: 1.6, color: '#9898b0', marginBottom: 32 },
  list: { color: '#f4f4f8', lineHeight: 2, marginBottom: 40 },
  actions: { display: 'flex', gap: 16, flexWrap: 'wrap' },
  primary: {
    padding: '14px 24px',
    background: '#3dffa8',
    color: '#0a0a0f',
    borderRadius: 12,
    fontWeight: 700,
    textDecoration: 'none',
  },
  secondary: {
    padding: '14px 24px',
    border: '1px solid #2a2a3d',
    borderRadius: 12,
    color: '#f4f4f8',
    textDecoration: 'none',
  },
};
