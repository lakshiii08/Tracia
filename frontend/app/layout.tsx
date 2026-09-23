import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import ClientProviders from "@/components/providers/ClientProviders";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "TRACIA - Trace, Relationship & Criminal Intelligence Analytics",
  description: "Trace, Relationship & Criminal Intelligence Analytics Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("tracia_theme")||"default";document.documentElement.setAttribute("data-theme",t);if(t==="pure-white"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light");}else{document.documentElement.classList.add("dark");document.documentElement.classList.remove("light");}}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen w-full overflow-x-hidden antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
