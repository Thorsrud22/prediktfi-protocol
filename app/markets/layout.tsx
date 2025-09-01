import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Markets | Predikt — Tokenized predictions",
  description: "Browse and trade on all prediction markets on Predikt",
};

export default function MarketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
