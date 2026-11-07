import React, { useState } from 'react';
import {
  Database,
  Filter,
  Eye,
  Sliders,
  Sparkles,
  Download,
  Layers,
  RotateCw,
  Sun,
  Shield,
  FileSpreadsheet
} from 'lucide-react';
import { buildDatasetManifest, CoinDatasetItem, OFFICIAL_CEMAC_SPECS } from '../utils/coinModelLogic.ts';
import { CoinSvg } from '../utils/coinVisuals.tsx';

export const DatasetTab: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<'all' | '100_fcfa' | '250_fcfa' | '500_fcfa'>('all');
  const [selectedSplit, setSelectedSplit] = useState<'all' | 'train' | 'val'>('all');
  const [activeCoin, setActiveCoin] = useState<CoinDatasetItem>(() => buildDatasetManifest()[0]);

  // Augmentation playground state
  const [augRotation, setAugRotation] = useState<number>(45);
  const [augBrightness, setAugBrightness] = useState<number>(100);
  const [augContrast, setAugContrast] = useState<number>(100);
  const [viewMode, setViewMode] = useState<'rgb' | 'edge' | 'tensor'>('rgb');

  const manifest = buildDatasetManifest();

  const filteredCoins = manifest.filter((coin) => {
    if (selectedClass !== 'all' && coin.denominationKey !== selectedClass) return false;
    if (selectedSplit !== 'all' && coin.split !== selectedSplit) return false;
    return true;
  });

  const activeSpec = OFFICIAL_CEMAC_SPECS[activeCoin.denominationKey];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Database className="w-3.5 h-3.5" />
            60-Image Central African CFA Franc Dataset
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Dataset Explorer & Data Augmentation Lab
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            20 images each across 100 FCFA, 250 FCFA, and 500 FCFA denominations. Partitioned into 80% Training (48 images) and 20% Validation (12 images).
          </p>
        </div>

        {/* Dataset Stats Summary */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono">
            <span className="text-slate-500 block text-[10px]">SPLIT RATIO</span>
            <span className="text-white font-bold">48 Train / 12 Val</span>
          </div>
          <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono">
            <span className="text-slate-500 block text-[10px]">CLASSES</span>
            <span className="text-amber-400 font-bold">3 Denominations</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filterable 60-image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              {/* Denomination tabs */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {[
                  { id: 'all', label: 'All (60)' },
                  { id: '100_fcfa', label: '100 FCFA (20)' },
                  { id: '250_fcfa', label: '250 FCFA (20)' },
                  { id: '500_fcfa', label: '500 FCFA (20)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedClass(tab.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      selectedClass === tab.id
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Split filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <button
                  onClick={() => setSelectedSplit('all')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedSplit === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setSelectedSplit('train')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedSplit === 'train' ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  Train (48)
                </button>
                <button
                  onClick={() => setSelectedSplit('val')}
                  className={`px-2 py-0.5 rounded cursor-pointer ${
                    selectedSplit === 'val' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-500'
                  }`}
                >
                  Val (12)
                </button>
              </div>
            </div>

            {/* Grid of Coin Thumbnails */}
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredCoins.map((coin) => {
                const isActive = activeCoin.id === coin.id;
                return (
                  <button
                    key={coin.id}
                    onClick={() => {
                      setActiveCoin(coin);
                      setAugRotation(coin.angleDeg);
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    {/* Split Badge */}
                    <span
                      className={`absolute top-1.5 left-1.5 text-[8px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        coin.split === 'val'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300'
                      }`}
                    >
                      {coin.split}
                    </span>

                    <CoinSvg
                      denominationKey={coin.denominationKey}
                      side={coin.side}
                      angleDeg={coin.angleDeg}
                      wearLevel={coin.wearLevel}
                      size={52}
                    />

                    <div className="mt-2 text-center w-full">
                      <div className="text-[11px] font-bold text-white truncate">{coin.label}</div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        #{coin.index} • {coin.angleDeg}°
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Augmentation & Inspection Lab */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Augmentation Lab: Sample #{activeCoin.index}
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {activeCoin.label} ({activeCoin.side})
              </span>
            </div>

            {/* View Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setViewMode('rgb')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'rgb' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                RGB Transform
              </button>
              <button
                onClick={() => setViewMode('edge')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'edge' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Edge / Seam
              </button>
              <button
                onClick={() => setViewMode('tensor')}
                className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  viewMode === 'tensor' ? 'bg-indigo-500 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Tensor Preview
              </button>
            </div>

            {/* Canvas / Visual Display */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[240px] relative overflow-hidden">
              <div
                style={{
                  filter:
                    viewMode === 'edge'
                      ? 'grayscale(100%) contrast(300%)'
                      : viewMode === 'tensor'
                      ? 'saturate(200%) contrast(150%) hue-rotate(45deg)'
                      : `brightness(${augBrightness}%) contrast(${augContrast}%)`,
                }}
              >
                <CoinSvg
                  denominationKey={activeCoin.denominationKey}
                  side={activeCoin.side}
                  angleDeg={augRotation}
                  wearLevel={activeCoin.wearLevel}
                  size={160}
                />
              </div>

              {/* View mode metadata badge */}
              <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded text-slate-400">
                {viewMode === 'tensor'
                  ? 'Normalized: 3x224x224'
                  : viewMode === 'edge'
                  ? 'Bimetallic Seam Focus'
                  : `Rot: ${augRotation}° | B:${augBrightness}%`}
              </div>
            </div>

            {/* Augmentation Sliders */}
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <RotateCw className="w-3 h-3 text-amber-400" />
                    Continuous Rotation
                  </span>
                  <span className="font-mono text-amber-400">{augRotation}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={augRotation}
                  onChange={(e) => setAugRotation(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sun className="w-3 h-3 text-amber-400" />
                    ColorJitter: Brightness
                  </span>
                  <span className="font-mono text-slate-300">{augBrightness}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="140"
                  value={augBrightness}
                  onChange={(e) => setAugBrightness(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>ColorJitter: Contrast</span>
                  <span className="font-mono text-slate-300">{augContrast}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="150"
                  value={augContrast}
                  onChange={(e) => setAugContrast(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Numismatic Specs Card */}
            {activeSpec && (
              <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5 text-xs">
                <div className="font-semibold text-white flex items-center justify-between">
                  <span>{activeSpec.denomination} Planchet</span>
                  <span className="text-amber-400 font-mono">{activeSpec.standardDiameterMm} mm</span>
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed">
                  {activeSpec.composition} — {activeSpec.outerRing} with {activeSpec.innerCore}.
                </div>
                <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
                  {activeSpec.obverseMotif}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
