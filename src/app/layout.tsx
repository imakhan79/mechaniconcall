import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const inter = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const interBody = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Mechanic On Call — Professional Help, Wherever You Need It",
  description:
    "Request a verified mechanic to your location for roadside assistance, emergency repairs, diagnostics, and vehicle maintenance.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${interBody.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground" suppressHydrationWarning>
        <MotionConfig reducedMotion="user" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </MotionConfig>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
