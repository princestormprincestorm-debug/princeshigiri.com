import React, { useState } from 'react';
import {
  Upload,
  Camera,
  RotateCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
  Coins,
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CoinSvg, generateCoinDataUrl } from '../utils/coinVisuals.tsx';
import { OFFICIAL_CEMAC_SPECS, convertXAF } from '../utils/coinModelLogic.ts';
import { WebcamScanner } from './WebcamScanner.tsx';

interface PredictionResult {
  denomination: string;
  denominationKey?: string;
  confidence: number;
  side: string;
  bimetallicComposition: {
    outerRing: string;
    innerCore: string;
    hasBimetallicStructure: boolean;
  };
  detectedFeatures: string[];
  estimatedYear?: string;
  wearCondition: string;
  officialNominalSpecs: {
    diameterMm: number;
    weightG: number;
    edge: string;
  };
  calculatedParity: {
    xaf: number;
    eur: number;
    usd: number;
  };
  numismaticNotes: string;
  cnnClassificationAnalysis: string;
}

export const ClassifierTab: React.FC<{
  onSelectCodeTab?: () => void;
}> = ({ onSelectCodeTab }) => {
  const [selectedPreset, setSelectedPreset] = useState<'100_fcfa' | '250_fcfa' | '500_fcfa'>('500_fcfa');
  const [selectedSide, setSelectedSide] = useState<'obverse' | 'reverse'>('obverse');
  const [rotationAngle, setRotationAngle] = useState<number>(35);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAttentionOverlay, setShowAttentionOverlay] = useState<boolean>(false);
  const [isWebcamOpen, setIsWebcamOpen] = useState<boolean>(false);

  // Preset sample options
  const samplePresets = [
    { key: '500_fcfa' as const, label: '500 FCFA', desc: 'Silver Ring / Gold Core', defaultAngle: 45 },
    { key: '250_fcfa' as const, label: '250 FCFA', desc: 'Gold Ring / Silver Core', defaultAngle: 120 },
    { key: '100_fcfa' as const, label: '100 FCFA', desc: 'Brass Ring / Steel Core', defaultAngle: 210 },
  ];

  const handlePresetSelect = (preset: typeof samplePresets[0]) => {
    setSelectedPreset(preset.key);
    setRotationAngle(preset.defaultAngle);
    setCustomImage(null);
    setPrediction(null);
    setErrorMessage(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCustomImage(dataUrl);
      setPrediction(null);
      setErrorMessage(null);
      runClassification(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runClassification = async (overrideImage?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let imageBase64 = overrideImage || customImage;
      if (!imageBase64) {
        imageBase64 = await generateCoinDataUrl(selectedPreset, selectedSide, rotationAngle);
      }

      const response = await fetch('/api/classify-coin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          sampleLabel: overrideImage ? undefined : selectedPreset,
          angleHint: overrideImage ? undefined : rotationAngle,
        }),
      });

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Classification failed');
      }

      setPrediction(data.prediction);
    } catch (err: any) {
      console.warn('Vision classification notice:', err?.message || err);
      setErrorMessage(err.message || 'Error communicating with vision model');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Context */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Transfer Learning & Vision Model Benchmark
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Central African CFA Franc Coin Recognition
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Distinguish between the 3 bimetallic BEAC denominations (100, 250, and 500 FCFA). Test real-time visual feature detection, rotation invariance, and annular composition contrast.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWebcamOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-semibold text-sm border border-slate-700 shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>Scan with Webcam</span>
            </button>

            <button
              onClick={() => runClassification()}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  Analyzing Features...
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4" />
                  Classify Coin
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Input & Inspection Stage */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                Coin Input & Orientation
              </h3>
              {customImage && (
                <button
                  onClick={() => setCustomImage(null)}
                  className="text-xs text-amber-400 hover:text-amber-300 underline cursor-pointer"
                >
                  Reset to Presets
                </button>
              )}
            </div>

            {/* Quick Presets */}
            {!customImage && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Sample Dataset Coin</label>
                <div className="grid grid-cols-3 gap-2">
                  {samplePresets.map((preset) => {
                    const active = selectedPreset === preset.key;
                    return (
                      <button
                        key={preset.key}
                        onClick={() => handlePresetSelect(preset)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-sm'
                            : 'bg-slate-800/40 border-slate-750 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <div className="text-xs font-bold">{preset.label}</div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">{preset.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stage Canvas / Image Display */}
            <div className="relative bg-slate-950 border border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

              {/* Angle Indicator Overlay */}
              <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-800 px-2.5 py-1 rounded-md text-[11px] font-mono text-slate-300 flex items-center gap-1.5 z-10">
                <RotateCw className="w-3 h-3 text-amber-400" />
                Rotation: {rotationAngle}°
              </div>

              {/* Coin Rendering */}
              {customImage ? (
                <div className="relative" style={{ transform: `rotate(${rotationAngle}deg)` }}>
                  <img
                    src={customImage}
                    alt="Uploaded coin"
                    className="max-h-56 max-w-56 object-contain rounded-full shadow-2xl transition-transform"
                  />
                </div>
              ) : (
                <div className="relative">
                  <CoinSvg
                    denominationKey={selectedPreset}
                    side={selectedSide}
                    angleDeg={rotationAngle}
                    size={200}
                    className="shadow-2xl"
                  />
                  {/* Attention Map / Convolutional Kernel Overlay */}
                  {showAttentionOverlay && (
                    <div
                      className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-400 pointer-events-none animate-pulse flex items-center justify-center"
                      style={{ transform: `rotate(${rotationAngle}deg)` }}
                    >
                      <div className="w-32 h-32 rounded-full border border-amber-400/80 bg-cyan-500/10" />
                      <span className="absolute -top-5 text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded">
                        Annular Feature Zone
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Side toggle when using presets */}
              {!customImage && (
                <div className="mt-5 flex items-center gap-2 z-10">
                  <button
                    onClick={() => setSelectedSide('obverse')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      selectedSide === 'obverse'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Obverse (Face)
                  </button>
                  <button
                    onClick={() => setSelectedSide('reverse')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      selectedSide === 'reverse'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Reverse (Insignia)
                  </button>
                </div>
              )}
            </div>

            {/* Rotation Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Simulate Coin Rotation</span>
                <span className="font-mono text-amber-400">{rotationAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={rotationAngle}
                onChange={(e) => setRotationAngle(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
                aria-label="Coin rotation slider"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0° Standard</span>
                <span>90° Quarter</span>
                <span>180° Inverted</span>
                <span>270°</span>
                <span>360°</span>
              </div>
            </div>

            {/* Custom Photo Upload, Webcam & Attention Toggle */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsWebcamOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-semibold cursor-pointer border border-amber-500/30 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  Webcam
                </button>

                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl text-xs font-medium cursor-pointer border border-slate-700 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowAttentionOverlay(!showAttentionOverlay)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 cursor-pointer transition-all ${
                  showAttentionOverlay
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                    : 'bg-slate-800/40 border-slate-700 text-slate-400 hover:text-slate-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Feature Heatmap
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: AI Analysis & Numismatic Results */}
        <div className="lg:col-span-7 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Classification Error</p>
                <p className="text-xs text-red-400/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-4 shadow-lg">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                <Coins className="w-8 h-8 text-amber-400 absolute inset-0 m-auto" />
              </div>
              <h3 className="text-lg font-bold text-white">Running Vision CNN & Numismatic Inference...</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Analyzing annular ring composition, face iconography, typography, and edge milling characteristics.
              </p>
            </div>
          ) : prediction ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Prediction Hero Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800 gap-4">
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Predicted Denomination</div>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl font-extrabold text-white tracking-tight">
                      {prediction.denomination}
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {prediction.confidence.toFixed(1)}% Confidence
                    </span>
                  </div>
                </div>

                {/* Currency Values */}
                <div className="bg-slate-950 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[10px]">FIXED PARITY</span>
                    <span className="text-amber-400 font-bold">€{prediction.calculatedParity.eur.toFixed(2)}</span>
                  </div>
                  <div className="w-px h-6 bg-slate-800" />
                  <div>
                    <span className="text-slate-500 block text-[10px]">EST. USD</span>
                    <span className="text-slate-300 font-bold">${prediction.calculatedParity.usd.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Bimetallic Composition Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    Planchet Composition
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Outer Ring:</span>
                      <span className="text-white font-medium text-right">
                        {prediction.bimetallicComposition.outerRing}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inner Core:</span>
                      <span className="text-white font-medium text-right">
                        {prediction.bimetallicComposition.innerCore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Orientation / Side:</span>
                      <span className="text-amber-400 font-semibold capitalize">
                        {prediction.side}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Official BEAC Specifications
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Standard Diameter:</span>
                      <span className="text-white font-mono">{prediction.officialNominalSpecs.diameterMm} mm</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Standard Mass:</span>
                      <span className="text-white font-mono">{prediction.officialNominalSpecs.weightG} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Edge Milling:</span>
                      <span className="text-slate-300 truncate max-w-[150px]">{prediction.officialNominalSpecs.edge}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detected Visual Features */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Detected Convolutional Motifs
                </div>
                <div className="flex flex-wrap gap-2">
                  {prediction.detectedFeatures.map((feat, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium border border-slate-700/60 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      {feat}
                    </span>
                  ))}
                  {prediction.estimatedYear && (
                    <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg text-xs font-mono border border-amber-500/30">
                      Mint Era: {prediction.estimatedYear}
                    </span>
                  )}
                  <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/30">
                    Grade: {prediction.wearCondition}
                  </span>
                </div>
              </div>

              {/* Deep CNN Explanation */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 text-xs">
                <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  Neural Network Feature Extraction Insight
                </div>
                <p className="text-slate-300 leading-relaxed">
                  {prediction.cnnClassificationAnalysis}
                </p>
                <p className="text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
                  <span className="text-amber-400 font-semibold">Numismatic Context: </span>
                  {prediction.numismaticNotes}
                </p>
              </div>
            </div>
          ) : (
            /* Empty State Guide */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                <Coins className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Ready for Coin Inference</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Select one of the 60 sample dataset coins or upload your own photo, rotate to any angle, then click <strong>Classify Coin</strong> to test model accuracy and bimetallic feature detection.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => runClassification()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
                >
                  Run Benchmark Test Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Webcam Scanner Modal */}
      <WebcamScanner
        isOpen={isWebcamOpen}
        onClose={() => setIsWebcamOpen(false)}
        onCapture={(capturedImage) => {
          setCustomImage(capturedImage);
          runClassification(capturedImage);
        }}
        title="Live Webcam Coin Identifier"
        subtitle="Align the 100, 250, or 500 FCFA coin inside the targeting ring"
      />
    </div>
  );
};
