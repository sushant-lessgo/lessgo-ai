/**
 * UIBlock Index Page - Lists all available UIBlocks for testing
 */

'use client';

import Link from 'next/link';
import { componentRegistry } from '@/modules/generatedLanding/componentRegistry';

export default function UIBlockIndexPage() {
  // Get all section types and their layouts
  const sections = Object.entries(componentRegistry);

  // Count total blocks
  const totalBlocks = sections.reduce(
    (acc, [, layouts]) => acc + Object.keys(layouts).length,
    0
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          UIBlock Test Page
        </h1>
        <p className="text-gray-600">
          {totalBlocks} blocks available across {sections.length} section types
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Click any block to test in isolation with mock data
        </p>
      </header>

      <div className="space-y-8">
        {sections.map(([sectionType, layouts]) => {
          const layoutNames = Object.keys(layouts);
          if (layoutNames.length === 0) return null;

          return (
            <section key={sectionType} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 capitalize border-b pb-2">
                {sectionType}
                <span className="text-gray-400 font-normal ml-2 text-sm">
                  ({layoutNames.length})
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {layoutNames.map((layoutName) => (
                  <Link
                    key={layoutName}
                    href={`/dev/uiblock/${layoutName}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-colors text-sm font-medium text-gray-700 hover:text-blue-700"
                  >
                    {layoutName}
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <footer className="mt-12 pt-6 border-t text-center text-sm text-gray-500">
        <p>Query params: <code className="bg-gray-100 px-1 rounded">?bg=primary|secondary|neutral</code> <code className="bg-gray-100 px-1 rounded">?mode=edit|preview</code></p>
      </footer>
    </div>
  );
}
