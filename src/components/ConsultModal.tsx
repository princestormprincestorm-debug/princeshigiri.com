import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RotateCw,
  HelpCircle,
  Lightbulb
} from 'lucide-react';

interface ConsultModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsultModal: React.FC<ConsultModalProps> = ({ isOpen, onClose }) => {
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([
    {
      role: 'assistant',
      text: 'Hello! I am your CFA Franc Computer Vision & Numismatic AI advisor. Ask me anything about transfer learning with ResNet-18/MobileNetV3, data augmentation for bimetallic coins, or deploying to mobile (ONNX/TFLite)!',
    },
  ]);

  if (!isOpen) return null;

  const quickQuestions = [
    'Why is RandomRotation(180) critical for coin classification?',
    'How do the 100 and 500 FCFA bimetallic compositions differ?',
    'How can I convert this PyTorch model to ONNX for mobile?',
  ];

  const handleSend = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || isLoading) return;

    setQuestion('');
    const updated = [...chatHistory, { role: 'user' as const, text: q }];
    setChatHistory(updated);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q }),
      });
      const data = await response.json();
      setChatHistory([
        ...updated,
        {
          role: 'assistant',
          text: data.answer || 'Transfer learning with rotation invariance is recommended.',
        },
      ]);
    } catch (err: any) {
      setChatHistory([
        ...updated,
        {
          role: 'assistant',
          text: 'Error consulting AI advisor: ' + (err.message || 'Network error'),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Numismatic & Model Advisor</h3>
              <p className="text-[11px] text-slate-400">Ask technical questions about training and CEMAC currency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                <RotateCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                Thinking numismatic reasoning...
              </div>
            </div>
          )}
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800/80 flex flex-wrap gap-1.5">
          {quickQuestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="px-2.5 py-1 rounded-lg bg-slate-800/50 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-750 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Lightbulb className="w-3 h-3 text-amber-400" />
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about PyTorch training, cross-validation, or CEMAC coins..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !question.trim()}
            className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold cursor-pointer transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
