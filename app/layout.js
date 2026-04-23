import './globals.css';

export const metadata = {
  title: "Aviral's Notes",
  description: 'Long-form essays on technology, media, and culture',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}