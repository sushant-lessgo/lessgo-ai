/**
 * Layout for UIBlock dev testing pages
 * Provides minimal context for isolated UIBlock rendering
 */

import '@/app/globals.css';

export const metadata = {
  title: 'UIBlock Dev Testing',
  description: 'Isolated UIBlock testing environment',
};

export default function UIBlockDevLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  );
}
