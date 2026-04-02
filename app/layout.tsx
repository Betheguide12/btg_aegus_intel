import "./../styles/globals.css";
import React from "react";

export const metadata = {
  title: "BTG AEGIS AI – Global Intelligence",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
