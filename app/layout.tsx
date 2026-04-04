import type { Metadata } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Homesol Digital - Daily Digital Tasks",
  description: "Manage your daily tasks, content calendar, and digital strategy with Homesol Digital.",
  icons: {
    icon: '/logo.ico',
    apple: '/logo.png',
  },
  openGraph: {
    title: "Homesol Digital - Daily Execution Calendar",
    description: "Premium dashboard for managing daily digital tasks.",
    images: [{ url: '/logo.png' }]
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
