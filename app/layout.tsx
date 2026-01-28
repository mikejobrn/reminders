import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./fonts.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Lembretes",
  description: "Aplicativo de lembretes estilo iPhone",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Lembretes",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const oneSignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {oneSignalAppId && (
          <>
            <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer></script>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.OneSignal = window.OneSignal || [];
                  OneSignal.push(function() {
                    OneSignal.init({
                      appId: "${oneSignalAppId}",
                      safari_web_id: "${oneSignalAppId}",
                      notifyButton: {
                        enable: false,
                      },
                      allowLocalhostAsSecureOrigin: true,
                    });
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
          <PWAInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
