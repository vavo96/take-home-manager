import React from "react";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Take home assignment",
  description: "Take home assignment",
  authors: [{ name: "Osmar Vasquez Vera", url: "https://vavohportfolio.vercel.app/" }],
  creator: "Osmar Vasquez Vera",
  publisher: "PII Detector Team",
  metadataBase: new URL("https://vavohportfolio.vercel.app/"),
  openGraph: {
    title: "Take home assignment",
    description: "Take home assignment",
    url: "https://vavohportfolio.vercel.app/",
    siteName: "Take home assignment",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
