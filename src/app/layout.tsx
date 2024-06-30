import React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from '../components/Navigation';

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="container mx-auto px-4">
          {children}
        </div>
      </body>
    </html>
  );
}