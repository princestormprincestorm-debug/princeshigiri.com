import React, { useState } from 'react';
import {
  Coins,
  Calculator,
  Scan,
  RotateCw,
  Plus,
  Minus,
  CheckCircle2,
  Euro,
  DollarSign,
  ArrowRight,
  Upload,
  Info,
  Camera
} from 'lucide-react';
import { CoinSvg } from '../utils/coinVisuals.tsx';
import { calculateCoinTallySum, convertXAF } from '../utils/coinModelLogic.ts';
import { WebcamScanner } from './WebcamScanner.tsx';

interface DetectedCoinItem {
  id: number;
  denomination: string;
  confidence: number;
  x: number;
  y: number;
  radius?: number;
}

export const TallyTab: React.FC = () => {
  const [activeScene, setActiveScene] = useState<number>(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);
  const [counts, setCounts] = useState<{ count100: number; count250: number; count500: number }>({
    count100: 3,
    count250: 1,
    count500: 2,
  });
  const [detectedCoins, setDetectedCoins] = useState<DetectedCoinItem[]>([
    { id: 1, denomination: '500 FCFA', confidence: 98.2, x: 30, y: 35, radius: 24 },
    { id: 2, denomination: '500 FCFA', confidence: 97.5, x: 70, y: 38, radius: 24 },
    { id: 3, denomination: '250 FCFA', confidence: 96.0, x: 50, y: 62, radius: 23 },
    { id: 4, denomination: '100 FCFA', confidence: 98.9, x: 22, y: 75, radius: 21 },
    { id: 5, denomination: '100 FCFA', confidence: 95.8, x: 78, y: 72, radius: 21 },
    { id: 6, denomination: '100 FCFA', confidence: 96.4, x: 48, y: 22, radius: 21 },
  ]);

  const presetScenes = [
    {
      name: 'Market Cash Pile',
      desc: 'Typical daily commerce exchange (1,550 FCFA)',
      coins: [
        { id: 1, denomination: '500 FCFA', confidence: 98.2, x: 32, y: 35, radius: 24 },
        { id: 2, denomination: '500 FCFA', confidence: 97.5, x: 68, y: 40, radius: 24 },
        { id: 3, denomination: '250 FCFA', confidence: 96.0, x: 50, y: 65, radius: 23 },
        { id: 4, denomination: '100 FCFA', confidence: 98.9, x: 20, y: 75, radius: 21 },
        { id: 5, denomination: '100 FCFA', confidence: 95.8, x: 80, y: 72, radius: 21 },
        { id: 6, denomination: '100 FCFA', confidence: 96.4, x: 50, y: 24, radius: 21 },
      ],
      counts: { count100: 3, count250: 1, count500: 2 },
    },
    {
      name: 'Taxi & Transport Fare',
      desc: 'Transport change with large 500 & 250 coins (2,000 FCFA)',
      coins: [
        { id: 1, denomination: '500 FCFA', confidence: 99.1, x: 28, y: 45, radius: 24 },
        { id: 2, denomination: '500 FCFA', confidence: 98.6, x: 52, y: 32, radius: 24 },
        { id: 3, denomination: '500 FCFA', confidence: 97.8, x: 76, y: 48, radius: 24 },
        { id: 4, denomination: '250 FCFA', confidence: 95.4, x: 40, y: 72, radius: 23 },
        { id: 5, denomination: '250 FCFA', confidence: 96.2, x: 64, y: 72, radius: 23 },
      ],
      counts: { count100: 0, count250: 2, count500: 3 },
    },
    {
      name: 'Street Vendor Tray',
      desc: 'Small change collection (850 FCFA)',
      coins: [
        { id: 1, denomination: '500 FCFA', confidence: 98.0, x: 50, y: 40, radius: 24 },
        { id: 2, denomination: '250 FCFA', confidence: 95.0, x: 30, y: 68, radius: 23 },
        { id: 3, denomination: '100 FCFA', confidence: 97.2, x: 70, y: 68, radius: 21 },
      ],
      counts: { count100: 1, count250: 1, count500: 1 },
    },
  ];

  const handleSelectScene = (idx: number) => {
    setActiveScene(idx);
    setCustomImage(null);
    setCounts(presetScenes[idx].counts);
    setDetectedCoins(presetScenes[idx].coins);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCustomImage(event.target?.result as string);
      runBatchScan(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const runBatchScan = async (imgData?: string) => {
    setIsScanning(true);
    try {
      const imageBase64 = imgData || customImage;
      if (imageBase64) {
        const response = await fetch('/api/batch-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64 }),
        });
        const data = await response.json();
        if (data.success && data.tally) {
          setDetectedCoins(data.tally.coinsDetected || []);
          setCounts({
            count100: data.tally.count100 || 0,
            count250: data.tally.count250 || 0,
            count500: data.tally.count500 || 0,
          });
        }
      }
    } catch (err: any) {
      console.warn('Batch scanner notice:', err?.message || err);
    } finally {
      setIsScanning(false);
    }
  };

  const tallyResult = calculateCoinTallySum({
    count100: counts.count100,
    count250: counts.count250,
    count500: counts.count500,
    otherCount: 0,
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Calculator className="w-3.5 h-3.5" />
            Computer Vision Object Detection & Multi-Coin Tally
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            CEMAC Multi-Coin Scanner & Currency Counter
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Detect multiple 100, 250, and 500 FCFA coins scattered on a surface. Computes total count, grand sum in FCFA, and instant EUR & USD conversions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsWebcamOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Tray with Webcam</span>
          </button>

          <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 cursor-pointer flex items-center gap-2 transition-all">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            Upload Photo
            <input type="file" accept="image/*" onChange={handleCustomUpload} className="hidden" />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Visual Tray / Multi-Coin Scene Stage */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            {/* Preset scenes */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Test Tray
              </h3>
              <div className="flex gap-2">
                {presetScenes.map((scene, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectScene(idx)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                      activeScene === idx && !customImage
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {scene.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Surface Area */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-4 min-h-[360px] flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-25 pointer-events-none" />

              {customImage ? (
                <div className="relative max-w-full max-h-[340px]">
                  <img src={customImage} alt="Custom coins" className="rounded-lg object-contain" />
                </div>
              ) : (
                <div className="relative w-full h-[340px]">
                  {detectedCoins.map((coin) => {
                    const is100 = coin.denomination.includes('100');
                    const is250 = coin.denomination.includes('250');
                    const denomKey = is100 ? '100_fcfa' : is250 ? '250_fcfa' : '500_fcfa';

                    return (
                      <div
                        key={coin.id}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group transition-transform hover:scale-110"
                        style={{ left: `${coin.x}%`, top: `${coin.y}%` }}
                      >
                        {/* Bounding Box Indicator */}
                        <div className="relative">
                          <CoinSvg
                            denominationKey={denomKey}
                            angleDeg={coin.id * 47}
                            size={is100 ? 56 : is250 ? 62 : 66}
                          />

                          {/* Bounding Box Tag */}
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/90 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 px-1.5 py-0.2 rounded shadow">
                            {coin.denomination} ({coin.confidence.toFixed(0)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Status Overlay */}
              <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-3 py-1 rounded-md text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {detectedCoins.length} Coins Detected
              </div>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Object detection identifies each coin's annular ring diameter and boundary coordinates.
            </p>
          </div>
        </div>

        {/* Right Column: Financial Tally & Breakdown */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-400" />
              Currency Tally Summary
            </h3>

            {/* Grand Total Hero */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="text-xs text-slate-400 font-semibold uppercase">Total Value (XAF)</div>
              <div className="text-4xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                <span>{tallyResult.totalXAF.toLocaleString()}</span>
                <span className="text-sm font-bold text-amber-400 font-mono">FCFA</span>
              </div>

              {/* Fixed Parity Conversions */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">EURO (FIXED 655.957)</span>
                  <span className="text-emerald-400 font-bold text-sm">
                    €{tallyResult.currencyConversion.eur.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">USD (EST. 605)</span>
                  <span className="text-cyan-400 font-bold text-sm">
                    ${tallyResult.currencyConversion.usd.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Denomination Counter Adjusters */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Denomination Breakdown
              </div>

              {/* 500 FCFA Row */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CoinSvg denominationKey="500_fcfa" size={34} />
                  <div>
                    <div className="text-xs font-bold text-white">500 FCFA</div>
                    <div className="text-[10px] text-slate-400">
                      Subtotal: {(counts.count500 * 500).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCounts({ ...counts, count500: Math.max(0, counts.count500 - 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-white text-sm">
                    {counts.count500}
                  </span>
                  <button
                    onClick={() => setCounts({ ...counts, count500: counts.count500 + 1 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 250 FCFA Row */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CoinSvg denominationKey="250_fcfa" size={34} />
                  <div>
                    <div className="text-xs font-bold text-white">250 FCFA</div>
                    <div className="text-[10px] text-slate-400">
                      Subtotal: {(counts.count250 * 250).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCounts({ ...counts, count250: Math.max(0, counts.count250 - 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-white text-sm">
                    {counts.count250}
                  </span>
                  <button
                    onClick={() => setCounts({ ...counts, count250: counts.count250 + 1 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 100 FCFA Row */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CoinSvg denominationKey="100_fcfa" size={34} />
                  <div>
                    <div className="text-xs font-bold text-white">100 FCFA</div>
                    <div className="text-[10px] text-slate-400">
                      Subtotal: {(counts.count100 * 100).toLocaleString()} FCFA
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCounts({ ...counts, count100: Math.max(0, counts.count100 - 1) })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono font-bold text-white text-sm">
                    {counts.count100}
                  </span>
                  <button
                    onClick={() => setCounts({ ...counts, count100: counts.count100 + 1 })}
                    className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Coin Live Webcam Scanner Modal */}
      <WebcamScanner
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(capturedData) => {
          setCustomImage(capturedData);
          runBatchScan(capturedData);
        }}
        isMultiCoin={true}
        title="Live Multi-Coin Webcam Scanner"
        subtitle="Aim camera at coins scattered on table or checkout surface"
      />
    </div>
  );
};
