import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Parrot Classroom Agent",
  description:
    "Real-time multimodal classroom assistant with sentiment analysis, summarization, and interactive Q&A.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-zinc-950 text-zinc-100">{children}</body>
    </html>
  );
}
