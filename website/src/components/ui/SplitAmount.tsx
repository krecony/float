import { formatEuro, PAYMENT_TOTAL, SHARE_AMOUNT } from "@/lib/payment";

type SplitAmountProps = { compact?: boolean };

export function SplitAmount({ compact = false }: SplitAmountProps) {
  if (compact) {
    return (
      <div className="space-y-0.5">
        <p className="text-2xl font-bold tabular-nums">
          {formatEuro(PAYMENT_TOTAL)}
        </p>
        <p className="text-[11px] text-zinc-500">
          {formatEuro(SHARE_AMOUNT)} each · 3 people
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Row label="Total" value={formatEuro(PAYMENT_TOTAL)} large />
      <Row label="Your share" value={formatEuro(SHARE_AMOUNT)} accent />
    </div>
  );
}

function Row({
  label,
  value,
  large,
  accent,
}: {
  label: string;
  value: string;
  large?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-2 ${accent ? "border-t border-white/10 pt-2" : ""}`}
    >
      <span className="text-[10px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <span
        className={`tabular-nums font-semibold ${large ? "text-xl font-bold" : "text-base"} ${accent ? "text-cyan-400" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
