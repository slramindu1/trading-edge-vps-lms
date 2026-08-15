import { ThemeProvider } from "@/components/sidebar/theme-provider";
import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import "./globals.css";

// REMOVE these lines - they use the old syntax:
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });
// 
// const geistMono = GeistMono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// The variables from the new package are already set up
// No need to configure them manually

export const metadata: Metadata = {
  metadataBase: new URL("https://lms.tradingedgefx.com"),
  title: "Trading Edge",
  description: "Best Way To Learn Forex Trading Online",
  openGraph: {
    title: "Trading Edge",
    description: "Best Way To Learn Forex Trading Online",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trading Edge LMS",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}