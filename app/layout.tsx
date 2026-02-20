import type { Metadata } from "next";
import Script from "next/script";
import { Suspense } from "react";
import { Poppins } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "../components/GoogleAnalytics";
import PublicHeader from "@/components/public/PublicHeader";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Welcome to Isha kerala page",
  description: "See details of upcoming programs in your city",
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XYC802D80H"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-XYC802D80H');
          `}
        </Script>
      </head>
      <body
        className={`${poppins.variable} font-sans min-h-screen bg-gray-50 text-gray-900 antialiased`}
      >
        {/* Root layout keeps global styling and metadata only. */}
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <PublicHeader />
        {children}
      </body>
    </html>
  );
}
