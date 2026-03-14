import type { Metadata } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ProfileProvider } from "@/lib/profile-context";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vyrll.com";

export const metadata: Metadata = {
  title: "Vyrll — Turn your YouTube & Twitch videos into viral clips",
  description: "Turn your YouTube & Twitch videos into viral clips. AI-powered clip generator (9:16, 1:1). YouTube analysis secondary.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Vyrll — Turn your YouTube & Twitch videos into viral clips",
    description: "Turn your YouTube & Twitch videos into viral clips. AI-powered clip generator (9:16, 1:1). YouTube analysis secondary.",
    url: siteUrl,
    siteName: "Vyrll",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Vyrll — Turn your YouTube & Twitch videos into viral clips",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vyrll — Turn your YouTube & Twitch videos into viral clips",
    description: "Turn your YouTube & Twitch videos into viral clips. AI-powered clip generator (9:16, 1:1). YouTube analysis secondary.",
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body
        className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable} antialiased bg-[#080809] text-zinc-300`}
      >
        <ProfileProvider>{children}</ProfileProvider>
      </body>
    </html>
  );
}
