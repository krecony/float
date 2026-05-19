"use client";

import { colors } from "@/lib/colors";

export function DownloadSection() {
  return (
    <section
      className="flex flex-col items-center justify-center px-6 py-16 pb-24"
      style={{ background: colors.bgDeep }}
    >
      <a
        href="#"
        className="inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${colors.gradientA}, ${colors.gradientB})`,
          boxShadow: `0 8px 32px ${colors.gradientA}44`,
        }}
      >
        Download now
      </a>
    </section>
  );
}
