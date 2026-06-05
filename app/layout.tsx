import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '鸽子侠',
  description: '鸽子群、群摇人、指定摇人、弹窗提醒',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
