import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingDown,
  TrendingUp,
  Cpu,
  Sliders,
  Check,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';
import {
  SimulationParams,
  TrainingEpochMetrics,
  simulateEpochMetrics,
  computeConfusionMatrix,
  ConfusionMatrixData,
  buildDatasetManifest,
  CoinDatasetItem
} from '../utils/coinModelLogic.ts';
import { CoinSvg } from '../utils/coinVisuals.tsx';

export const TrainerTab: React.FC<{
  onSelectCodeTab?: () => void;
}> = ({ onSelectCodeTab }) => {
  const [params, setParams] = useState<SimulationParams>({
    backbone: 'resnet18',
    epochs: 20,
    learningRate: 0.001,
    batchSize: 8,
    optimizer: 'adam',
    useRotationAug: true,
    useColorJitter: true,
    useFlips: true,
  });

  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [metricsHistory, setMetricsHistory] = useState<TrainingEpochMetrics[]>([]);
  const [confusionData, setConfusionData] = useState<ConfusionMatrixData | null>(null);
  const [selectedValTest, setSelectedValTest] = useState<CoinDatasetItem | null>(null);
  const [testPrediction, setTestPrediction] = useState<{
    predictedClass: string;
    probabilities: { [key: string]: number };
    isCorrect: boolean;
  } | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const manifest = buildDatasetManifest();
  const valCoins = manifest.filter((m) => m.split === 'val');

  // Handle training simulation loop
  const startTraining = () => {
    setIsTraining(true);
    setCurrentEpoch(0);
    setMetricsHistory([]);
    setConfusionData(null);
    setTestPrediction(null);

    let epoch = 1;
    const history: TrainingEpochMetrics[] = [];

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const metric = simulateEpochMetrics(params, epoch);
      history.push(metric);
      setMetricsHistory([...history]);
      setCurrentEpoch(epoch);

      if (epoch >= params.epochs) {
        clearInterval(timerRef.current!);
        setIsTraining(false);

        // Generate final validation confusion matrix
        const valPredictions = valCoins.map((coin) => {
          // If rotation augmentation is off, coins rotated by >60 deg have a chance of misclassification
          const angleRisk = !params.useRotationAug && coin.angleDeg > 45;
          let pred = coin.denominationKey;
          if (angleRisk && Math.random() < 0.45) {
            pred = coin.denominationKey === '100_fcfa' ? '250_fcfa' : '100_fcfa';
          }
          return {
            trueClass: coin.denominationKey,
            predClass: pred,
          };
        });

        setConfusionData(computeConfusionMatrix(valPredictions));
      } else {
        epoch++;
      }
    }, 180);
  };

  const stopTraining = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTraining(false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Run test inference on a validation coin
  const handleValCoinTest = (coin: CoinDatasetItem) => {
    setSelectedValTest(coin);
    const finalValAcc = metricsHistory.length > 0
      ? metricsHistory[metricsHistory.length - 1].valAcc / 100
      : 0.90;

    const anglePenalty = !params.useRotationAug && coin.angleDeg > 45 ? 0.35 : 0;
    const isCorrect = Math.random() < Math.max(0.4, finalValAcc - anglePenalty);

    let predictedClass = coin.denominationKey;
    if (!isCorrect) {
      predictedClass = coin.denominationKey === '500_fcfa' ? '250_fcfa' : '100_fcfa';
    }

    const confPrimary = (0.75 + Math.random() * 0.23) * 100;
    const rem = 100 - confPrimary;
    const p1 = rem * 0.7;
    const p2 = rem * 0.3;

    const probs: { [key: string]: number } = {};
    probs[predictedClass] = Number(confPrimary.toFixed(1));
    const otherKeys = ['100_fcfa', '250_fcfa', '500_fcfa'].filter((k) => k !== predictedClass);
    probs[otherKeys[0]] = Number(p1.toFixed(1));
    probs[otherKeys[1]] = Number(p2.toFixed(1));

    setTestPrediction({
      predictedClass,
      probabilities: probs,
      isCorrect,
    });
  };

  const latestMetric = metricsHistory[metricsHistory.length - 1];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            PyTorch Transfer Learning Simulator
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Train ResNet-18 on the 60 CFA Coin Dataset
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Simulate feature extractor layer freezing, data augmentation effects, and cross-entropy loss convergence on Central African CFA Franc coins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isTraining ? (
            <button
              onClick={stopTraining}
              className="px-5 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 font-bold text-sm transition-all cursor-pointer flex items-center gap-2"
            >
              Stop Training
            </button>
          ) : (
            <button
              onClick={startTraining}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              {metricsHistory.length > 0 ? 'Retrain Model' : 'Start Transfer Learning'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hyperparameters & Augmentation */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Architecture & Hyperparameters
            </h3>

            {/* Backbone Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400">Pretrained Backbone</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'resnet18', label: 'ResNet-18', badge: 'Standard' },
                  { id: 'mobilenet_v3', label: 'MobileNet', badge: 'Edge/Mobile' },
                  { id: 'efficientnet_b0', label: 'EfficientNet', badge: 'High Acc' },
                ].map((b) => (
                  <button
                    key={b.id}
                    disabled={isTraining}
                    onClick={() => setParams({ ...params, backbone: b.id as any })}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      params.backbone === b.id
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs">{b.label}</div>
                    <div className="text-[9px] text-slate-500">{b.badge}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Epochs & Batch Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Epochs</label>
                <select
                  disabled={isTraining}
                  value={params.epochs}
                  onChange={(e) => setParams({ ...params, epochs: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value={10}>10 Epochs</option>
                  <option value={20}>20 Epochs (Recommended)</option>
                  <option value={30}>30 Epochs</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Batch Size</label>
                <select
                  disabled={isTraining}
                  value={params.batchSize}
                  onChange={(e) => setParams({ ...params, batchSize: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value={4}>4 (Micro-batch)</option>
                  <option value={8}>8 (Optimal for 60 imgs)</option>
                  <option value={16}>16</option>
                </select>
              </div>
            </div>

            {/* Optimizer & Learning Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Optimizer</label>
                <select
                  disabled={isTraining}
                  value={params.optimizer}
                  onChange={(e) => setParams({ ...params, optimizer: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value="adam">Adam (1e-3)</option>
                  <option value="adamw">AdamW (Weight Decay)</option>
                  <option value="sgd">SGD + Momentum</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Learning Rate</label>
                <select
                  disabled={isTraining}
                  value={params.learningRate}
                  onChange={(e) => setParams({ ...params, learningRate: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                >
                  <option value={0.005}>0.005 (Fast)</option>
                  <option value={0.001}>0.001 (Recommended)</option>
                  <option value={0.0001}>0.0001 (Fine-tune)</option>
                </select>
              </div>
            </div>

            {/* Crucial Data Augmentation Toggles */}
            <div className="pt-3 border-t border-slate-800 space-y-2.5">
              <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Data Augmentation</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Critical for 60 images
                </span>
              </div>

              {/* Rotation Augmentation */}
              <label className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={isTraining}
                  checked={params.useRotationAug}
                  onChange={(e) => setParams({ ...params, useRotationAug: e.target.checked })}
                  className="mt-0.5 accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">RandomRotation(180°)</div>
                  <div className="text-slate-400 text-[11px] leading-tight">
                    Invariance to arbitrary coin angles in photos. Without this, the model overfits on camera orientations.
                  </div>
                </div>
              </label>

              {/* Color Jitter */}
              <label className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={isTraining}
                  checked={params.useColorJitter}
                  onChange={(e) => setParams({ ...params, useColorJitter: e.target.checked })}
                  className="mt-0.5 accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">ColorJitter (Brightness/Contrast)</div>
                  <div className="text-slate-400 text-[11px] leading-tight">
                    Normalizes tarnished patina vs shiny mint coin lighting.
                  </div>
                </div>
              </label>

              {/* Horizontal & Vertical Flips */}
              <label className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700">
                <input
                  type="checkbox"
                  disabled={isTraining}
                  checked={params.useFlips}
                  onChange={(e) => setParams({ ...params, useFlips: e.target.checked })}
                  className="mt-0.5 accent-indigo-500 w-4 h-4 rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-semibold text-white">Random Horizontal & Vertical Flips</div>
                  <div className="text-slate-400 text-[11px] leading-tight">
                    Multiplies training variations by 4x.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Training Live Graphs & Confusion Matrix */}
        <div className="lg:col-span-8 space-y-6">
          {/* Real-time Status Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Current Epoch</div>
              <div className="text-xl font-mono font-bold text-white mt-1">
                {currentEpoch} / {params.epochs}
              </div>
              <div className="text-[10px] text-indigo-400 mt-0.5">
                {isTraining ? 'Training in progress...' : metricsHistory.length > 0 ? 'Completed' : 'Idle'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Train Loss</div>
              <div className="text-xl font-mono font-bold text-amber-400 mt-1">
                {latestMetric ? latestMetric.trainLoss.toFixed(4) : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Cross-Entropy</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Validation Loss</div>
              <div className="text-xl font-mono font-bold text-cyan-400 mt-1">
                {latestMetric ? latestMetric.valLoss.toFixed(4) : '--'}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {!params.useRotationAug && currentEpoch > 10 ? 'Overfitting risk' : 'Converging'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
              <div className="text-[11px] text-slate-400">Validation Accuracy</div>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
                {latestMetric ? `${latestMetric.valAcc.toFixed(1)}%` : '--'}
              </div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5">
                Target: 95%+
              </div>
            </div>
          </div>

          {/* SVG Training Curves */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Loss & Accuracy Learning Curves
              </div>
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                  <span className="text-slate-300">Train Loss</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
                  <span className="text-slate-300">Val Loss</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                  <span className="text-slate-300">Val Acc (%)</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Surface */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 h-56 relative flex items-center justify-center">
              {metricsHistory.length === 0 ? (
                <div className="text-center text-slate-500 text-xs">
                  Press <strong>Start Transfer Learning</strong> to watch loss decay and validation accuracy climb.
                </div>
              ) : (
                <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="45" x2="600" y2="45" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="0" y1="90" x2="600" y2="90" stroke="#1e293b" strokeDasharray="4 4" />
                  <line x1="0" y1="135" x2="600" y2="135" stroke="#1e293b" strokeDasharray="4 4" />

                  {/* Train Loss Path (Amber) */}
                  <path
                    d={metricsHistory
                      .map((m, idx) => {
                        const x = (idx / (params.epochs - 1 || 1)) * 580 + 10;
                        const y = Math.min(170, Math.max(10, (m.trainLoss / 1.5) * 160));
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#FBBF24"
                    strokeWidth="2.5"
                  />

                  {/* Val Loss Path (Cyan) */}
                  <path
                    d={metricsHistory
                      .map((m, idx) => {
                        const x = (idx / (params.epochs - 1 || 1)) * 580 + 10;
                        const y = Math.min(170, Math.max(10, (m.valLoss / 1.5) * 160));
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="2.5"
                  />

                  {/* Val Acc Path (Emerald, inverted for 0-100%) */}
                  <path
                    d={metricsHistory
                      .map((m, idx) => {
                        const x = (idx / (params.epochs - 1 || 1)) * 580 + 10;
                        const y = 170 - (m.valAcc / 100) * 150;
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      })
                      .join(' ')}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="3 2"
                  />
                </svg>
              )}
            </div>

            {/* Overfitting alert notice if rotation aug is turned off */}
            {!params.useRotationAug && currentEpoch >= 8 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <strong>Overfitting Detected: </strong>
                  Without RandomRotation(180), validation loss is beginning to diverge because coins appear at random angles.
                </div>
              </div>
            )}
          </div>

          {/* Validation Confusion Matrix & Test Bench */}
          {confusionData && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-400" />
                    Validation Confusion Matrix (12 Images: 4 per Denomination)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Overall Accuracy on held-out test split:{' '}
                    <strong className="text-emerald-400">{confusionData.overallAccuracy}%</strong>
                  </p>
                </div>
              </div>

              {/* 3x3 Confusion Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="p-2 text-left">True \ Predicted</th>
                      <th className="p-2">Pred: 100 FCFA</th>
                      <th className="p-2">Pred: 250 FCFA</th>
                      <th className="p-2">Pred: 500 FCFA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['100_fcfa', '250_fcfa', '500_fcfa'].map((rowClass, rIdx) => (
                      <tr key={rowClass} className="border-b border-slate-800/60">
                        <td className="p-2.5 text-left font-bold text-slate-300 capitalize">
                          True: {rowClass.replace('_', ' ').toUpperCase()}
                        </td>
                        {[0, 1, 2].map((cIdx) => {
                          const count = confusionData.matrix[rIdx][cIdx];
                          const isDiag = rIdx === cIdx;
                          return (
                            <td
                              key={cIdx}
                              className={`p-2.5 font-mono font-bold ${
                                isDiag && count > 0
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : count > 0
                                  ? 'bg-red-500/20 text-red-300'
                                  : 'text-slate-600'
                              }`}
                            >
                              {count}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Validation Image Test Bench */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-300">
                  Interactive Test Bench: Click a held-out Validation Coin to run inference
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {valCoins.map((coin) => (
                    <button
                      key={coin.id}
                      onClick={() => handleValCoinTest(coin)}
                      className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                        selectedValTest?.id === coin.id
                          ? 'bg-indigo-500/20 border-indigo-400 scale-105'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      }`}
                      title={`${coin.label} (${coin.angleDeg}°)`}
                    >
                      <CoinSvg
                        denominationKey={coin.denominationKey}
                        side={coin.side}
                        angleDeg={coin.angleDeg}
                        size={36}
                      />
                      <span className="text-[9px] text-slate-400 font-mono mt-1">#{coin.index}</span>
                    </button>
                  ))}
                </div>

                {/* Test Result Display */}
                {testPrediction && selectedValTest && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <CoinSvg
                        denominationKey={selectedValTest.denominationKey}
                        side={selectedValTest.side}
                        angleDeg={selectedValTest.angleDeg}
                        size={48}
                      />
                      <div>
                        <div className="text-slate-400 text-[11px]">
                          Sample #{selectedValTest.index} ({selectedValTest.label}, {selectedValTest.angleDeg}°)
                        </div>
                        <div className="font-bold text-white text-sm flex items-center gap-2 mt-0.5">
                          Predicted: {testPrediction.predictedClass.replace('_', ' ').toUpperCase()}
                          {testPrediction.isCorrect ? (
                            <span className="text-emerald-400 text-xs flex items-center gap-1 font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="text-red-400 text-xs flex items-center gap-1 font-semibold">
                              <AlertTriangle className="w-3.5 h-3.5" /> Misclassified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px]">100 FCFA</span>
                        <span className="text-slate-300 font-bold">{testPrediction.probabilities['100_fcfa'] || 0}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">250 FCFA</span>
                        <span className="text-slate-300 font-bold">{testPrediction.probabilities['250_fcfa'] || 0}%</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">500 FCFA</span>
                        <span className="text-slate-300 font-bold">{testPrediction.probabilities['500_fcfa'] || 0}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
