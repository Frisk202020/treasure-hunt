import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Client from "./client";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Treasure Hunt",
  description: "An puzzle-solving game accross the internet held on the Ethereum blockchain",
};

const NAV_ID = "navigation";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Client children={children} navId={NAV_ID}></Client>
        <div id={NAV_ID}>
          <a href="/">Home</a>
          <a href="/join">Join the Hunt</a>
          <a href="/goals">Claim a Hunt goal</a>
          <a href="/hints">Hints</a>
        </div>
      </body>
    </html>
  );
}
