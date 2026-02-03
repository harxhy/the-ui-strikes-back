import './globals.css';

import type { ReactNode } from 'react';

export const metadata = {
  title: 'UI Copilot Demo',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="app-body">{children}</body>
    </html>
  );
}
