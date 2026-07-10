import type { Metadata, Viewport } from "next";
import { Inter_Tight, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/ui/confirm";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

// The app's display font (--font-unio). Previously referenced in CSS but never
// actually loaded, so everything fell back to system sans-serif.
const interTight = Inter_Tight({
  variable: "--font-unio",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PFCC • E-Register",
  description: "Official Attendance & Management Portal for Christ Embassy PFCC.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "E-Register",
  },
  icons: {
    icon: "/BLW.png",
    shortcut: "/BLW.png",
    apple: "/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FDFBFC",
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${geistMono.variable} antialiased`}
      >
        <ConfirmProvider>{children}</ConfirmProvider>
        <Toaster richColors position="top-center" />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
