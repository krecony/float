"use client";

import { colors } from "@/lib/colors";
import { withBasePath } from "@/lib/basePath";
import { APK_DOWNLOAD_PATH } from "@/lib/site";

interface DownloadOverlayProps {
  opacity: number;
}

export function DownloadOverlay({ opacity }: DownloadOverlayProps) {
  const visible = opacity > 0.02;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-8 z-50 flex justify-center px-6"
      style={{
        opacity,
        transform: `translateY(${(1 - opacity) * 20}px)`,
        transition: "opacity 0.08s linear, transform 0.08s linear",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <a
        href={withBasePath(APK_DOWNLOAD_PATH)}
        download
        className="pointer-events-auto inline-flex items-center justify-center rounded-full px-10 py-4 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98]"
        style={{
          background: `linear-gradient(135deg, ${colors.gradientA}, ${colors.gradientB})`,
          boxShadow: `0 8px 40px ${colors.gradientA}66`,
        }}
      >
        Download now
      </a>
    </div>
  );
}
