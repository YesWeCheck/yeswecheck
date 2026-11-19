import Script from "next/script";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "Sign up" };

// Optional: the YesWeCheck widget checks the address while it is typed (public ID, no secret).
// The server action re-checks it anyway, since a bot can post the form without running any JavaScript.
const widgetId = process.env.NEXT_PUBLIC_YWC_WIDGET_ID;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        {children}
        {widgetId && (
          <Script src="https://api.yeswecheck.fr/widget/ywc-email-widget.js" data-ywc-widget={widgetId} strategy="afterInteractive" />
        )}
      </body>
    </html>
  );
}
