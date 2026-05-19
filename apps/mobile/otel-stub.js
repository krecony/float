// Stub for @opentelemetry/api — Supabase uses this optionally for tracing.
// Hermes can't compile the dynamic import() it contains, so we replace it
// with a no-op shim. Nothing in this app relies on OTel tracing.
module.exports = {
  trace: {
    getTracer: () => ({
      startActiveSpan: (_name, fn) => fn({ end: () => {} }),
      startSpan: () => ({ end: () => {}, setAttribute: () => {} }),
    }),
    setSpan: (ctx) => ctx,
    getActiveSpan: () => null,
  },
  context: {
    with: (_ctx, fn) => fn(),
    active: () => ({}),
  },
  propagation: { inject: () => {}, extract: (_ctx) => _ctx },
  SpanStatusCode: { OK: 1, ERROR: 2, UNSET: 0 },
  SpanKind: { INTERNAL: 0, CLIENT: 2 },
  diag: { setLogger: () => {}, warn: () => {}, error: () => {} },
};
