import localFont from "next/font/local";
import { Inter, Playfair_Display } from 'next/font/google';
import "./globals.css";
import 'react-toastify/dist/ReactToastify.css';
import './styles/toast.css';
import { ToastContainer } from 'react-toastify';

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
const playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata = {
  title: "SimpleSwap Clone",
  description: "A modern cryptocurrency exchange platform",
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
        <ToastContainer
          position="top-right"
          autoClose={2000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
          toastClassName="backdrop-blur-md"
        />
      </body>
    </html>
  );
}
