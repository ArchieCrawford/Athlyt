import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tayp Admin",
  description: "Admin dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "Inter, sans-serif", margin: 0 }}>{children}</body>
    </html>
  );
}
