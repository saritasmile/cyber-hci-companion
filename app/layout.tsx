import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Cyber × HCI",
  description: "A cybersecurity learning companion for UX designers and researchers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased flex flex-col md:flex-row min-h-screen">
        <Sidebar />
        <main className="flex-1 min-h-screen overflow-y-auto" style={{ backgroundColor: "var(--bg)" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
