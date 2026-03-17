import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coffee Sommelier | Find Your Perfect Coffee",
  description: "Personalized coffee recommendations for specialty roasters",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-coffee-50 text-coffee-900">
        <header className="border-b border-coffee-200 bg-white/80 backdrop-blur">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <h1 className="text-lg font-semibold text-coffee-800">
              Coffee Sommelier
            </h1>
            <p className="text-sm text-coffee-600">
              Your taste. Our picks. No guessing.
            </p>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
