import type { Metadata, Viewport } from "next";
import { Montserrat, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// The Kennedy Forum primary typeface — body copy and UI.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  display: "swap",
});

// TKF accent typeface — headlines, large statistics, select accents.
const bespokeSerif = localFont({
  src: "../fonts/BespokeSerif-Variable.woff2",
  variable: "--font-bespoke-serif",
  display: "swap",
  weight: "300 800",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Interactive Policy Explorer | The Kennedy Forum",
  description:
    "Explore how policy choices shape mental health and economic outcomes over time. Adjust inputs and watch the impact update in real time.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FDFBF5" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

// Set the theme before paint to avoid a flash; defaults to light.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("ipe-theme");
    var theme = stored || "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${bespokeSerif.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
