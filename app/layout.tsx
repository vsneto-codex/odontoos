import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OdontoOS — Sistema Operacional para Clínicas",
  description: "Sistema de gestão para clínicas odontológicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className="h-full bg-[#13161C] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
