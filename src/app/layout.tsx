import type { Metadata } from "next";
import { Poppins, Open_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { MotionConfig } from "framer-motion";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const openSans = Open_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Mechanic On Call — Book a Service Appointment",
  description:
    "Request a maintenance or service appointment with our workshop: pick a date and time, and we'll confirm it with you.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <MotionConfig reducedMotion="user" transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
          {children}
        </MotionConfig>
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
