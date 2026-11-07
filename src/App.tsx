import React, { useState } from 'react';
import {
  Coins,
  Cpu,
  Database,
  Calculator,
  Code2,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Github,
  Layers,
  ShieldAlert,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import { ClassifierTab } from './components/ClassifierTab.tsx';
import { TrainerTab } from './components/TrainerTab.tsx';
import { DatasetTab } from './components/DatasetTab.tsx';
import { TallyTab } from './components/TallyTab.tsx';
import { CodeTab } from './components/CodeTab.tsx';
import { GoogleSheetsConfusionTab } from './components/GoogleSheetsConfusionTab.tsx';
import { ConsultModal } from './components/ConsultModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<'classifier' | 'trainer' | 'sheets' | 'dataset' | 'tally' | 'code'>('sheets');
  const [isConsultOpen, setIsConsultOpen] = useState<boolean>(false);

  const navigationTabs = [
    {
      id: 'sheets' as const,
      label: 'Google Sheets Confusion Table',
      icon: FileSpreadsheet,
      badge: '15 Tests/Class',
    },
    {
      id: 'classifier' as const,
      label: 'Vision AI Classifier',
      icon: Coins,
      badge: 'Live Gemini Vision',
    },
    {
      id: 'trainer' as const,
      label: 'Transfer Learning Simulator',
      icon: Cpu,
      badge: 'ResNet-18',
    },
    {
      id: 'dataset' as const,
      label: '60-Coin Dataset & Augmentation',
      icon: Database,
      badge: '60 Images',
    },
    {
      id: 'tally' as const,
      label: 'Multi-Coin Tally & Counter',
      icon: Calculator,
      badge: 'XAF / EUR',
    },
    {
      id: 'code' as const,
      label: 'PyTorch Code & Export',
      icon: Code2,
      badge: 'Python Scripts',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Application Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Coins className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight leading-none">
                  CFA Franc Coin AI Studio
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25">
                  CEMAC / BEAC
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Computer Vision Model & Transfer Learning for 100, 250, and 500 FCFA Coins
              </p>
            </div>
          </div>

          {/* Quick Actions & AI Consult Trigger */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsConsultOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Advisor</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto no-scrollbar gap-1 pt-1 pb-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer border ${
                  active
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20 font-bold'
                    : 'bg-transparent text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-md font-mono ${
                    active ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'sheets' && <GoogleSheetsConfusionTab />}
        {activeTab === 'classifier' && <ClassifierTab onSelectCodeTab={() => setActiveTab('code')} />}
        {activeTab === 'trainer' && <TrainerTab onSelectCodeTab={() => setActiveTab('code')} />}
        {activeTab === 'dataset' && <DatasetTab />}
        {activeTab === 'tally' && <TallyTab />}
        {activeTab === 'code' && <CodeTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">BEAC Numismatic AI Vision</span>
            <span>•</span>
            <span>Central African CFA Franc (XAF) Parity: 1 EUR = 655.957 FCFA</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>PyTorch ResNet-18 Transfer Learning</span>
            <span>•</span>
            <button
              onClick={() => setIsConsultOpen(true)}
              className="text-amber-400 hover:underline cursor-pointer"
            >
              Consult Guidelines
            </button>
          </div>
        </div>
      </footer>

      {/* AI Advisor Modal */}
      <ConsultModal isOpen={isConsultOpen} onClose={() => setIsConsultOpen(false)} />
    </div>
  );
}
