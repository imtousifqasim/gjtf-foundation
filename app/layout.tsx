import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://gjtfoundation.com"),
  title: {
    default: "Ghais Jhuggi Taleem Foundation (GJTF) | Educating Nomadic Children in Pakistan",
    template: "%s | GJTF",
  },
  description:
    "Ghais Jhuggi Taleem Foundation (GJTF) is Pakistan's largest educational and skill development movement for over 20 million nomadic communities ('Jhuggi Nasheen'). Educating thousands through the Jhuggi Taleemi Project.",
  keywords: [
    "GJTF",
    "Ghais Jhuggi Taleem Foundation",
    "Jhuggi Taleemi Project",
    "nomadic education Pakistan",
    "slum children schools Pakistan",
    "charity Pakistan",
    "Zakat education",
    "donate to educate Pakistan",
  ],
  authors: [{ name: "Ghais Jhuggi Taleem Foundation" }],
  creator: "Ghais Jhuggi Taleem Foundation",
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: "https://gjtfoundation.com",
    title: "Ghais Jhuggi Taleem Foundation (GJTF)",
    description: "The largest educational and skill development movement for over 20 million nomadic communities in Pakistan.",
    siteName: "Ghais Jhuggi Taleem Foundation",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ghais Jhuggi Taleem Foundation (GJTF)",
    description: "Donate to educate less-privileged and nomadic children in Pakistan.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col antialiased selection:bg-accent-200 selection:text-accent-950">
        {children}
      </body>
    </html>
  );
}
