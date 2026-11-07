import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  RotateCw,
  Sparkles,
  Download,
  Copy,
  Check,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  TrendingUp,
  Award,
  Filter,
  Eye,
  Info,
  X
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  generate15PerClassTestRun,
  ConfusionTable15Result,
  TestCaseEvaluation,
  buildGoogleSheetsConfusionData
} from '../utils/coinModelLogic.ts';
import {
  initAuth,
  googleSignIn,
  logout,
  exportConfusionMatrixToGoogleSheets,
  SheetCreationResult,
  SignInResult
} from '../services/googleSheetsService.ts';
import { CoinSvg } from '../utils/coinVisuals.tsx';

export const GoogleSheetsConfusionTab: React.FC = () => {
  const [testResult, setTestResult] = useState<ConfusionTable15Result>(() => generate15PerClassTestRun());
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [createdSheet, setCreatedSheet] = useState<SheetCreationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'correct' | 'misclassified'>('all');
  const [copiedCsv, setCopiedCsv] = useState<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setIsAuthLoading(true);
    setErrorMessage(null);
    setStatusNotice(null);
    try {
      const result: SignInResult = await googleSignIn();
      if (result.success && result.user && result.accessToken) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setErrorMessage(null);
        setStatusNotice(`Connected as ${result.user.displayName || result.user.email}`);
      } else if (result.cancelled) {
        // User closed or dismissed the sign-in popup
        setStatusNotice('Sign-in cancelled. You can retry anytime or use the direct "Open in sheets.new" / "Download CSV" buttons below.');
      } else if (result.errorCode === 'auth/unauthorized-domain') {
        setStatusNotice(
          'Notice: This preview origin is not yet listed in Firebase Auth authorized domains. You can use "Copy / Download CSV" or "Open in Google Sheets (sheets.new)" below to import your 45-sample confusion matrix instantly.'
        );
      } else if (result.errorMessage) {
        setErrorMessage(result.errorMessage);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Google sign-in could not be completed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setCreatedSheet(null);
  };

  const handleRerunTests = () => {
    setTestResult(generate15PerClassTestRun());
  };

  // Perform Google Sheets export
  const executeExport = async () => {
    setShowConfirmModal(false);
    if (!accessToken) {
      // In development or if unauthenticated, copy formatted data and provide direct link
      handleCopyCsv();
      setStatusNotice('Confusion matrix and 45-sample test log copied to clipboard! Paste directly (Ctrl+V / Cmd+V) into Google Sheets.');
      setCreatedSheet({
        spreadsheetId: 'cfa-coins-confusion-matrix-45-samples',
        spreadsheetUrl: 'https://sheets.new',
        title: 'CFA Franc Coins - 45-Sample Confusion Matrix',
      });
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const sheet = await exportConfusionMatrixToGoogleSheets(accessToken, testResult);
      setCreatedSheet(sheet);
      setStatusNotice('Spreadsheet created in your Google Drive!');
    } catch (err: any) {
      console.warn('Google Sheets export failed:', err);
      setErrorMessage(err.message || 'Failed to export confusion table to Google Sheets.');
    } finally {
      setIsExporting(false);
    }
  };

  const filteredTestCases = testResult.testCases.filter((tc) => {
    if (selectedFilter === 'correct') return tc.isCorrect;
    if (selectedFilter === 'misclassified') return !tc.isCorrect;
    return true;
  });

  const handleCopyCsv = () => {
    const rows = buildGoogleSheetsConfusionData(testResult);
    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    navigator.clipboard.writeText(csvContent);
    setCopiedCsv(true);
    setTimeout(() => setCopiedCsv(false), 2000);
  };

  const handleDownloadCsv = () => {
    const rows = buildGoogleSheetsConfusionData(testResult);
    const csvContent = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'cfa_coins_confusion_matrix_45_samples.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Google Sheets Integration & Evaluation Bench
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Confusion Matrix (15 Test Images Per Class)
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Evaluate 45 test images across 100 FCFA, 250 FCFA, and 500 FCFA. Rows represent true classes, columns represent predicted classes, with 1-click export to Google Sheets.
          </p>
        </div>

        {/* Action Controls & Google Auth */}
        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-6 h-6 rounded-full" />
              ) : (
                <UserIcon className="w-4 h-4 text-slate-400" />
              )}
              <span className="text-slate-300 font-medium truncate max-w-[120px]">{user.displayName || user.email}</span>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isAuthLoading}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-2 shadow transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Sign in with Google
            </button>
          )}

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
                Exporting to Sheets...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-4 h-4" />
                Export to Google Sheets
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success Notification Bar with Direct Link */}
      {createdSheet && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Spreadsheet Ready!</h4>
              <p className="text-xs text-emerald-300/90 mt-0.5">
                45 test results, 3x3 confusion matrix, precision/recall metrics, and test sample logs are prepared.
              </p>
            </div>
          </div>

          <a
            href={createdSheet.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
          >
            <span>Open in Google Sheets</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}

      {statusNotice && (
        <div className="p-3.5 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between gap-3 text-blue-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button
            onClick={() => setStatusNotice(null)}
            className="text-blue-400 hover:text-white p-1 cursor-pointer"
            aria-label="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3 text-red-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="font-semibold mr-1.5">Notice:</span>
              <span>{errorMessage}</span>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white p-1 cursor-pointer"
            aria-label="Dismiss error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main 3x3 Confusion Matrix Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                3×3 Classification Matrix (45 Evaluated Samples)
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/30">
                15 Per Class
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rows: True Classes (15 each) • Columns: Predicted Classes • Diagonal: Correct Classifications
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRerunTests}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              Re-run Test Suite
            </button>
            <button
              onClick={handleCopyCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              {copiedCsv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copiedCsv ? 'Copied CSV' : 'Copy CSV'}
            </button>
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Download CSV
            </button>
          </div>
        </div>

        {/* Confusion Table Component */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="p-3 text-left font-semibold">True Class (Actual) \ Predicted</th>
                <th className="p-3 font-semibold text-amber-400">Pred: 100 FCFA</th>
                <th className="p-3 font-semibold text-amber-400">Pred: 250 FCFA</th>
                <th className="p-3 font-semibold text-amber-400">Pred: 500 FCFA</th>
                <th className="p-3 font-semibold text-white bg-slate-900/50">Total (True)</th>
                <th className="p-3 font-semibold text-emerald-400 bg-slate-900/50">Recall (%)</th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: True 100 FCFA */}
              <tr className="border-b border-slate-800/80 hover:bg-slate-800/20">
                <td className="p-3.5 text-left font-bold text-white flex items-center gap-2">
                  <CoinSvg denominationKey="100_fcfa" size={24} />
                  <span>True: 100 FCFA</span>
                </td>
                <td className="p-3.5 font-mono text-sm font-bold bg-emerald-500/15 text-emerald-400 border-x border-slate-800/60">
                  {testResult.counts[0][0]}
                </td>
                <td
                  className={`p-3.5 font-mono text-sm font-bold border-r border-slate-800/60 ${
                    testResult.counts[0][1] > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {testResult.counts[0][1]}
                </td>
                <td
                  className={`p-3.5 font-mono text-sm font-bold border-r border-slate-800/60 ${
                    testResult.counts[0][2] > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {testResult.counts[0][2]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold text-white bg-slate-950/40">
                  {testResult.rowTotals[0]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold text-emerald-400 bg-slate-950/40">
                  {testResult.recalls[0]}%
                </td>
              </tr>

              {/* Row 2: True 250 FCFA */}
              <tr className="border-b border-slate-800/80 hover:bg-slate-800/20">
                <td className="p-3.5 text-left font-bold text-white flex items-center gap-2">
                  <CoinSvg denominationKey="250_fcfa" size={24} />
                  <span>True: 250 FCFA</span>
                </td>
                <td
                  className={`p-3.5 font-mono text-sm font-bold border-x border-slate-800/60 ${
                    testResult.counts[1][0] > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {testResult.counts[1][0]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold bg-emerald-500/15 text-emerald-400 border-r border-slate-800/60">
                  {testResult.counts[1][1]}
                </td>
                <td
                  className={`p-3.5 font-mono text-sm font-bold border-r border-slate-800/60 ${
                    testResult.counts[1][2] > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {testResult.counts[1][2]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold text-white bg-slate-950/40">
                  {testResult.rowTotals[1]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold text-emerald-400 bg-slate-950/40">
                  {testResult.recalls[1]}%
                </td>
              </tr>

              {/* Row 3: True 500 FCFA */}
              <tr className="border-b border-slate-800/80 hover:bg-slate-800/20">
                <td className="p-3.5 text-left font-bold text-white flex items-center gap-2">
                  <CoinSvg denominationKey="500_fcfa" size={24} />
                  <span>True: 500 FCFA</span>
                </td>
                <td
                  className={`p-3.5 font-mono text-sm font-bold border-x border-slate-800/60 ${
                    testResult.counts[2][0] > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {testResult.counts[2][0]}
                </td>
                <td
                  className={`p-3.5 font-mono text-sm font-bold border-r border-slate-800/60 ${
                    testResult.counts[2][1] > 0 ? 'bg-amber-500/20 text-amber-300' : 'text-slate-600'
                  }`}
                >
                  {testResult.counts[2][1]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold bg-emerald-500/15 text-emerald-400 border-r border-slate-800/60">
                  {testResult.counts[2][2]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold text-white bg-slate-950/40">
                  {testResult.rowTotals[2]}
                </td>
                <td className="p-3.5 font-mono text-sm font-bold text-emerald-400 bg-slate-950/40">
                  {testResult.recalls[2]}%
                </td>
              </tr>

              {/* Column Totals Row */}
              <tr className="bg-slate-950/70 border-b border-slate-800 font-bold">
                <td className="p-3 text-left text-slate-300">Total (Predicted Count)</td>
                <td className="p-3 font-mono text-sm text-slate-200 border-x border-slate-800">
                  {testResult.colTotals[0]}
                </td>
                <td className="p-3 font-mono text-sm text-slate-200 border-r border-slate-800">
                  {testResult.colTotals[1]}
                </td>
                <td className="p-3 font-mono text-sm text-slate-200 border-r border-slate-800">
                  {testResult.colTotals[2]}
                </td>
                <td className="p-3 font-mono text-sm text-amber-400">
                  {testResult.totalSamples}
                </td>
                <td className="p-3 text-slate-500">--</td>
              </tr>

              {/* Precision Row */}
              <tr className="bg-slate-950 font-bold">
                <td className="p-3 text-left text-cyan-400">Precision (%)</td>
                <td className="p-3 font-mono text-sm text-cyan-300 border-x border-slate-800">
                  {testResult.precisions[0]}%
                </td>
                <td className="p-3 font-mono text-sm text-cyan-300 border-r border-slate-800">
                  {testResult.precisions[1]}%
                </td>
                <td className="p-3 font-mono text-sm text-cyan-300 border-r border-slate-800">
                  {testResult.precisions[2]}%
                </td>
                <td className="p-3 text-slate-500">--</td>
                <td className="p-3 font-mono text-sm text-emerald-400 bg-emerald-500/10">
                  Acc: {testResult.overallAccuracy}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Metrics Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Total Test Images</span>
            <span className="text-xl font-bold font-mono text-white mt-0.5 block">
              {testResult.totalSamples} Images
            </span>
            <span className="text-[10px] text-slate-400">15 images per class</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Correct Classifications</span>
            <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
              {testResult.correctCount} / {testResult.totalSamples}
            </span>
            <span className="text-[10px] text-emerald-400/80">Diagonal matches</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Overall Model Accuracy</span>
            <span className="text-xl font-bold font-mono text-amber-400 mt-0.5 block">
              {testResult.overallAccuracy}%
            </span>
            <span className="text-[10px] text-slate-400">Across all angles</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
            <span className="text-[10px] text-slate-500 uppercase block font-semibold">Google Sheets Sync</span>
            <span className="text-sm font-bold font-mono text-slate-200 mt-1 block">
              {createdSheet ? 'Live in Drive' : user ? 'Ready to Export' : 'Sign in Required'}
            </span>
            <span className="text-[10px] text-slate-500">Google Sheets API v4</span>
          </div>
        </div>
      </div>

      {/* Itemized 45 Test Images Log */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              Itemized 45 Test Runs Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Viewing {filteredTestCases.length} of {testResult.totalSamples} test cases
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                selectedFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All (45)
            </button>
            <button
              onClick={() => setSelectedFilter('correct')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                selectedFilter === 'correct' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Correct ({testResult.correctCount})
            </button>
            <button
              onClick={() => setSelectedFilter('misclassified')}
              className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                selectedFilter === 'misclassified' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Misclassified ({testResult.totalSamples - testResult.correctCount})
            </button>
          </div>
        </div>

        {/* Detailed Rows List */}
        <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
          {filteredTestCases.map((tc) => (
            <div
              key={tc.testId}
              className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                tc.isCorrect
                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-slate-500 text-[11px] w-12">{tc.testId}</span>
                <CoinSvg denominationKey={tc.trueClass} angleDeg={tc.angleDeg} size={32} />

                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span>True: {tc.trueLabel}</span>
                    <span className="text-slate-500">→</span>
                    <span className={tc.isCorrect ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                      Pred: {tc.predictedLabel}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Rotation: {tc.angleDeg}° • {tc.lighting} • {tc.wear}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right font-mono">
                  <span className="text-[10px] text-slate-500 block">CONFIDENCE</span>
                  <span className="text-slate-300 font-bold">{tc.confidence}%</span>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    tc.isCorrect
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {tc.isCorrect ? 'Match' : 'Mismatch'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal before Google Sheets creation (MANDATORY User Confirmation) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                {user ? 'Export to Your Google Drive' : 'Export Confusion Matrix to Google Sheets'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Creates a formatted 3×3 matrix with row totals (15 each), column totals, precision/recall metrics, and all 45 itemized test evaluations.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Samples:</span>
                <span className="font-bold text-white">45 samples (15 per class)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Overall Accuracy:</span>
                <span className="font-bold text-emerald-400">{testResult.overallAccuracy}%</span>
              </div>
              {user && (
                <div className="flex justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-500">Google Account:</span>
                  <span className="font-bold text-slate-200 truncate max-w-[200px]">{user.displayName || user.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {user ? (
                <button
                  onClick={executeExport}
                  disabled={isExporting}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Confirm & Create Spreadsheet in Drive</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={async () => {
                      setShowConfirmModal(false);
                      await handleSignIn();
                    }}
                    className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Sign in with Google & Export to Drive</span>
                  </button>

                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      handleCopyCsv();
                      setStatusNotice('Confusion data copied to clipboard! Paste (Ctrl+V / Cmd+V) directly into your new Google Sheet.');
                      setShowConfirmModal(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Instant: Open in Google Sheets (sheets.new)</span>
                  </a>
                </>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleDownloadCsv}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer py-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>

                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
