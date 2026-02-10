'use client';

import { palettes, getPalettesByMode, getColorFamilies, type Palette } from '@/modules/Design/background/palettes';
import { useState, useMemo } from 'react';

export default function BackgroundViewerPage() {
  const [selectedPalette, setSelectedPalette] = useState<Palette>(palettes[0]);
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterColor, setFilterColor] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const darkCount = getPalettesByMode('dark').length;
  const lightCount = getPalettesByMode('light').length;

  const colors = useMemo(() =>
    Array.from(new Set(palettes.map(p => p.baseColor))).sort(),
    []
  );

  const filteredPalettes = useMemo(() => {
    return palettes.filter(p => {
      const matchesMode = filterMode === 'all' || p.mode === filterMode;
      const matchesColor = filterColor === 'all' || p.baseColor === filterColor;
      const matchesSearch = searchTerm === '' ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.colorFamily.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesMode && matchesColor && matchesSearch;
    });
  }, [filterMode, filterColor, searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Palette Viewer
          </h1>
          <p className="text-gray-600">
            Curated palettes: {palettes.length} total ({darkCount} dark, {lightCount} light) &bull; Showing: {filteredPalettes.length}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search palettes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mode Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Mode</label>
                <select
                  value={filterMode}
                  onChange={(e) => setFilterMode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All ({palettes.length})</option>
                  <option value="dark">Dark ({darkCount})</option>
                  <option value="light">Light ({lightCount})</option>
                </select>
              </div>

              {/* Color Filter */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Color</label>
                <select
                  value={filterColor}
                  onChange={(e) => setFilterColor(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All</option>
                  {colors.map(color => (
                    <option key={color} value={color}>
                      {color} ({palettes.filter(p => p.baseColor === color).length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setFilterMode('all'); setFilterColor('all'); setSearchTerm(''); }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
              >
                Reset Filters
              </button>

              {/* Selected Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Selected Palette</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><span className="font-medium">ID:</span> {selectedPalette.id}</p>
                  <p><span className="font-medium">Mode:</span> {selectedPalette.mode}</p>
                  <p><span className="font-medium">Temperature:</span> {selectedPalette.temperature}</p>
                  <p><span className="font-medium">Energy:</span> {selectedPalette.energy}</p>
                  <p><span className="font-medium">Color Family:</span> {selectedPalette.colorFamily}</p>
                  <p><span className="font-medium">Base Color:</span> {selectedPalette.baseColor}</p>
                  <p><span className="font-medium">Font Pairing:</span> {selectedPalette.fontPairing}</p>
                  <p><span className="font-medium">Accents:</span> {selectedPalette.compatibleAccents.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Trio Preview */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold">{selectedPalette.label}</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedPalette.id}</p>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">{selectedPalette.mode}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">{selectedPalette.temperature}</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">{selectedPalette.energy}</span>
                </div>
              </div>

              {/* Primary */}
              <div className="relative h-64 flex items-center justify-center" style={{ background: selectedPalette.primary }}>
                <div className="text-center space-y-3 px-8">
                  <p className="text-xs font-mono opacity-60 text-white">PRIMARY</p>
                  <h1 className="text-4xl font-bold text-white drop-shadow-lg">Hero Headline</h1>
                  <p className="text-lg text-white/90 drop-shadow">Hero subheadline text</p>
                  <button className="px-6 py-2 bg-white text-gray-900 rounded-lg font-semibold shadow-lg">CTA Button</button>
                </div>
              </div>

              {/* Secondary */}
              <div className="relative h-40 flex items-center justify-center" style={{ background: selectedPalette.secondary }}>
                <div className="text-center space-y-2 px-8">
                  <p className="text-xs font-mono opacity-40">SECONDARY</p>
                  <h2 className="text-2xl font-semibold text-gray-900">Content Section</h2>
                  <p className="text-gray-600">Alternating content sections use this background</p>
                </div>
              </div>

              {/* Neutral */}
              <div className="relative h-32 flex items-center justify-center" style={{ background: selectedPalette.neutral }}>
                <div className="text-center space-y-2 px-8">
                  <p className="text-xs font-mono opacity-40">NEUTRAL</p>
                  <h3 className="text-xl font-semibold text-gray-900">Neutral Section</h3>
                  <p className="text-gray-500 text-sm">Clean, neutral background</p>
                </div>
              </div>

              {/* CSS Values */}
              <div className="p-4 bg-gray-50 space-y-2">
                <p className="text-xs text-gray-600"><span className="font-medium">Primary:</span> <span className="font-mono">{selectedPalette.primary}</span></p>
                <p className="text-xs text-gray-600"><span className="font-medium">Secondary:</span> <span className="font-mono">{selectedPalette.secondary}</span></p>
                <p className="text-xs text-gray-600"><span className="font-medium">Neutral:</span> <span className="font-mono">{selectedPalette.neutral}</span></p>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">All Palettes ({filteredPalettes.length})</h2>

              {filteredPalettes.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No palettes match your filters</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredPalettes.map((palette) => (
                    <button
                      key={palette.id}
                      onClick={() => setSelectedPalette(palette)}
                      className={`text-left p-3 rounded-lg border-2 transition ${
                        selectedPalette.id === palette.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {/* Mini trio preview */}
                      <div className="flex h-20 rounded overflow-hidden mb-2">
                        <div className="flex-[3]" style={{ background: palette.primary }}></div>
                        <div className="flex-[2]" style={{ background: palette.secondary }}></div>
                        <div className="flex-1" style={{ background: palette.neutral }}></div>
                      </div>
                      <p className="font-medium text-sm text-gray-900 truncate">{palette.label}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {palette.mode} &bull; {palette.temperature} &bull; {palette.colorFamily}
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
