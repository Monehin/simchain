import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIMChain - USSD-First Multichain Wallet Platform",
  description: "SIMChain revolutionizes blockchain accessibility through USSD technology, making Web3 identity and finance universally accessible. Transform any mobile number into a secure blockchain wallet.",
  keywords: ["SIMChain", "USSD", "Blockchain", "Wallet", "Financial Inclusion", "Web3", "Solana", "Mobile Money", "DeFi"],
  authors: [{ name: "SIMChain Team" }],
  creator: "SIMChain",
  publisher: "SIMChain",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://simchain.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "SIMChain - USSD-First Multichain Wallet Platform",
    description: "Revolutionizing blockchain accessibility through USSD technology. Make Web3 identity and finance universally accessible.",
    url: 'https://simchain.app',
    siteName: 'SIMChain',
    images: [
      {
        url: '/Logo.png',
        width: 1200,
        height: 630,
        alt: 'SIMChain Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SIMChain - USSD-First Multichain Wallet Platform",
    description: "Revolutionizing blockchain accessibility through USSD technology. Make Web3 identity and finance universally accessible.",
    images: ['/Logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
