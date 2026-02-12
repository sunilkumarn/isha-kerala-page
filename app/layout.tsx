import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Isha Kerala",
  description: "Minimal Next.js + Supabase starter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {/* Root layout keeps global styling and metadata only. */}
        {children}
      </body>
    </html>
  );
}
