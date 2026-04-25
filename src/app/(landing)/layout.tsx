import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ServiceFlow — Internal Service Request Management",
  description:
    "Track, manage, and resolve every internal request with clarity. Built for modern teams.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
