import localFont from "next/font/local";
import { Inter } from 'next/font/google';
import "./globals.css";
import ToastProvider from '@/components/ToastProvider';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SimpleSwap Clone',
  description: 'A clone of SimpleSwap cryptocurrency exchange',
  icons: {
    icon: null
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon1b66.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.className} antialiased`}
      >
        {children}
        <ToastProvider />
      </body>
    </html>
  );
}
