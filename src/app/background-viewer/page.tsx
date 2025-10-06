'use client';

import { primaryBackgrounds, backgroundStats, type PrimaryBackground, type BackgroundCategory } from '@/modules/Design/background/primaryBackgrounds';
import { useState, useMemo } from 'react';

export default function BackgroundViewerPage() {
  const [selectedVariation, setSelectedVariation] = useState<PrimaryBackground>(primaryBackgrounds[0]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Extract unique values for filters
  const categories = useMemo(() =>
    Array.from(new Set(primaryBackgrounds.map(v => v.category))).sort(),
    []
  );

  const colors = useMemo(() =>
    Array.from(new Set(primaryBackgrounds.map(v => v.baseColor))).sort(),
    []
  );

  // Filter variations
  const filteredVariations = useMemo(() => {
    return primaryBackgrounds.filter(v => {
      const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
      const matchesColor = filterColor === 'all' || v.baseColor === filterColor;
      const matchesSearch = searchTerm === '' ||
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.label.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesColor && matchesSearch;
    });
  }, [filterCategory, filterColor, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Primary Backgrounds Viewer
          </h1>
          <p className="text-gray-600">
            Curated collection: {backgroundStats.total} backgrounds ({backgroundStats.technical} technical, {backgroundStats.professional} professional, {backgroundStats.friendly} friendly) • Showing: {filteredVariations.length}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-28">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              {/* Search */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search variations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All ({backgroundStats.total})</option>
                  <option value="technical">Technical ({backgroundStats.technical})</option>
                  <option value="professional">Professional ({backgroundStats.professional})</option>
                  <option value="friendly">Friendly ({backgroundStats.friendly})</option>
                </select>
              </div>

              {/* Color Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Color
                </label>
                <select
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All ({backgroundStats.total})</option>
                  {colors.map(color => (
                    <option key={color} value={color}>
                      {color} ({primaryBackgrounds.filter(v => v.baseColor === color).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setFilterCategory('all');
                  setFilterColor('all');
                  setSearchTerm('');
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Reset Filters
              </button>

              {/* Current Selection Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Selected Background
                </h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><span className="font-medium">ID:</span> {selectedVariation.id}</p>
                  <p><span className="font-medium">Category:</span> {selectedVariation.category}</p>
                  <p><span className="font-medium">Base Color:</span> {selectedVariation.baseColor}</p>
                  <p className="pt-2"><span className="font-medium">CSS:</span></p>
                  <p className="font-mono text-xs break-all">{selectedVariation.css}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Preview & List */}
          <div className="lg:col-span-2 space-y-6">

            {/* Hero Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{selectedVariation.label}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedVariation.id}
                </p>
                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                  {selectedVariation.category}
                </span>
              </div>

              {/* Large Preview */}
              <div
                className="relative h-96 flex items-center justify-center"
                style={{ background: selectedVariation.css }}
              >
                <div className="text-center space-y-4 px-8">
                  <h1 className="text-5xl font-bold text-white drop-shadow-lg">
                    Your Hero Headline
                  </h1>
                  <p className="text-xl text-white/90 drop-shadow">
                    This is how your hero section will look with this background
                  </p>
                  <button className="px-8 py-3 bg-white text-gray-900 rounded-lg font-semibold shadow-lg hover:shadow-xl transition">
                    Call to Action
                  </button>
                </div>
              </div>

              {/* CSS Value */}
              <div className="p-4 bg-gray-50">
                <p className="text-xs text-gray-600 mb-1 font-medium">CSS Background:</p>
                <p className="text-xs font-mono text-gray-700 break-all">
                  {selectedVariation.css}
                </p>
              </div>
            </div>

            {/* Variations Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">
                All Backgrounds ({filteredVariations.length})
              </h2>

              {filteredVariations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No backgrounds match your filters
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredVariations.map((variation) => (
                    <button
                      key={variation.id}
                      onClick={() => setSelectedVariation(variation)}
                      className={`text-left p-3 rounded-lg border-2 transition ${
                        selectedVariation.id === variation.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Mini Preview */}
                      <div
                        className="h-24 rounded mb-2"
                        style={{ background: variation.css }}
                      ></div>

                      {/* Info */}
                      <p className="font-medium text-sm text-gray-900 truncate">
                        {variation.label}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {variation.category} • {variation.baseColor}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
