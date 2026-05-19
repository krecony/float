import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Float — Collaborative group payments",
  description:
    "A cinematic demo of realtime group transactions: tap to pay, multi-person approval, shared balance updates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body
        className="min-h-full overflow-x-hidden bg-[#050508] text-zinc-100"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
