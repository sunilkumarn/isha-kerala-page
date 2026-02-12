import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Welcome to Isha kerala page",
  description: "Minimal Next.js + Supabase starter",
  icons: {
    icon: "/isha-favicon.ico",
  },
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
