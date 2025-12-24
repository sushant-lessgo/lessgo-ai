import { Inter, Bricolage_Grotesque } from 'next/font/google';
import '@/app/globals.css';

// Load only fonts used in published pages
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
});

export default function PublishedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`${inter.variable} ${bricolage.variable}`}>
      {children}
    </div>
  );
}
