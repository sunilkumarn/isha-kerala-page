import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

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
      <body
        className={`${poppins.variable} font-sans min-h-screen bg-gray-50 text-gray-900 antialiased`}
      >
        {/* Root layout keeps global styling and metadata only. */}
        {children}
      </body>
    </html>
  );
}
