import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legacy Markets | Predikt — AI-first evaluation studio",
  description: "Legacy prediction markets view. Try the new AI-first Studio for creating insights.",
};

export default function MarketsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
