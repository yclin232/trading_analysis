import type { Metadata } from "next";
import { I18nProvider } from "@/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Market Intelligence",
  description: "Local-first public market intelligence dashboard.",
};

const preferenceInitScript = `
try {
  var migratedKey = "omi:theme:v4_dark_high_contrast";
  if (!window.localStorage.getItem(migratedKey)) {
    window.localStorage.setItem("omi:settings:color", "dark");
    window.localStorage.setItem("omi:settings:high-contrast", "true");
    window.localStorage.setItem(migratedKey, "true");
  }

  var omiTheme = window.localStorage.getItem("omi:settings:color");
  var omiHighContrast = window.localStorage.getItem("omi:settings:high-contrast");
  if (omiTheme === "light") {
    document.documentElement.dataset.theme = "light";
  } else {
    document.documentElement.dataset.theme = "dark";
  }

  if (omiHighContrast === "false") {
    delete document.documentElement.dataset.contrast;
  } else {
    document.documentElement.dataset.contrast = "high";
  }

  var omiLocale = window.localStorage.getItem("omi:settings:language");
  var htmlLang = {
    "zh-TW": "zh-Hant",
    "en-US": "en",
    "ja-JP": "ja"
  }[omiLocale];
  if (htmlLang) {
    document.documentElement.lang = htmlLang;
    document.documentElement.dataset.locale = omiLocale;
  }
} catch (error) {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-Hant"
      data-theme="dark"
      data-contrast="high"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferenceInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
