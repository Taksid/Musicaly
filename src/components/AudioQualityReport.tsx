import React from 'react';
import { QualityReport } from '../types';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles, Activity, Volume2, ShieldCheck, RefreshCw } from 'lucide-react';

interface AudioQualityReportProps {
  report: QualityReport;
  versionNumber: number;
  onRegenerateToFix?: () => void;
  compact?: boolean;
}

export const AudioQualityReport: React.FC<AudioQualityReportProps> = ({
  report,
  versionNumber,
  onRegenerateToFix,
  compact = false,
}) => {
  const isFailed = report.status === 'quality_needs_improvement';

  if (compact) {
    return (
      <div
        id={`quality-compact-v${versionNumber}`}
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${
          isFailed
            ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        }`}
      >
        {isFailed ? (
          <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        )}
        <span>
          {isFailed ? 'Quality needs improvement' : 'Studio Quality'}: {report.overallScore}/100
        </span>
      </div>
    );
  }

  return (
    <div
      id={`quality-card-v${versionNumber}`}
      className={`rounded-xl p-5 border transition-all ${
        isFailed
          ? 'bg-pink-950/20 border-pink-500/40 text-pink-100 shadow-lg shadow-pink-950/20'
          : 'bg-zinc-900/80 border-zinc-800 text-zinc-100'
      }`}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              isFailed ? 'bg-pink-500/20 text-pink-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {isFailed ? <AlertTriangle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold tracking-wide">
                AUDIO MASTERING & QUALITY PIPELINE
              </h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
                  isFailed
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {isFailed ? 'Quality needs improvement' : 'Master Passed'}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Rigorous 8-stage automated acoustic analysis & distortion scanning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-zinc-400 block">Quality Score</span>
            <span
              className={`text-xl font-black ${
                isFailed ? 'text-pink-400' : 'text-emerald-400'
              }`}
            >
              {report.overallScore}
              <span className="text-xs text-zinc-500 font-normal">/100</span>
            </span>
          </div>
          {isFailed && onRegenerateToFix && (
            <button
              id="quality-fix-regenerate-btn"
              onClick={onRegenerateToFix}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600 text-white hover:opacity-95 transition-colors shadow-md shadow-pink-500/20 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              REGENERATE
            </button>
          )}
        </div>
      </div>

      {/* Warning Box for defects */}
      {isFailed && (
        <div className="mb-4 p-3 rounded-lg bg-pink-500/10 border border-pink-500/30">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-pink-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-pink-300 mb-1">
                Acoustic defects detected in this generation:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-pink-200/80">
                {report.detectedIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
              <p className="mt-2 text-zinc-400">
                The studio has flagged this result. Click <strong className="text-pink-300">REGENERATE</strong> to apply automatic loudness normalization, artifact filtering, and vocal re-synthesis.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 8-Stage Pipeline Grid */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block mb-1">
          Mastering Pipeline Sequence:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {report.steps.map((step, idx) => {
            const isStepFailed = step.status === 'failed';
            const isStepWarn = step.status === 'warning';
            return (
              <div
                key={step.name}
                id={`step-${idx}-${step.name.toLowerCase().replace(/\s+/g, '-')}`}
                className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between ${
                  isStepFailed
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : isStepWarn
                    ? 'bg-pink-950/20 border-pink-500/30 text-pink-200'
                    : 'bg-zinc-800/50 border-zinc-750 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-medium text-zinc-200 truncate flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-mono">0{idx + 1}</span>
                    {step.name}
                  </span>
                  {isStepFailed ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : isStepWarn ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 leading-tight mb-1">{step.details}</p>
                {step.metric && (
                  <span className="text-[10px] font-mono text-zinc-500 self-end bg-zinc-900/60 px-1.5 py-0.5 rounded">
                    {step.metric}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Audio Metrics Row */}
      <div className="mt-4 pt-3 border-t border-zinc-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
        <div className="bg-zinc-800/40 p-2 rounded">
          <span className="text-zinc-500 block text-[10px]">Peak Level</span>
          <span className={`font-mono font-medium ${report.peakDbfs > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {report.peakDbfs > 0 ? `+${report.peakDbfs}` : report.peakDbfs} dBFS
          </span>
        </div>
        <div className="bg-zinc-800/40 p-2 rounded">
          <span className="text-zinc-500 block text-[10px]">Target LUFS</span>
          <span className="font-mono font-medium text-zinc-200">{report.lufsTarget} LUFS</span>
        </div>
        <div className="bg-zinc-800/40 p-2 rounded">
          <span className="text-zinc-500 block text-[10px]">Noise Floor</span>
          <span className={`font-mono font-medium ${report.noiseFloorDbfs > -50 ? 'text-pink-400' : 'text-zinc-300'}`}>
            {report.noiseFloorDbfs} dBFS
          </span>
        </div>
        <div className="bg-zinc-800/40 p-2 rounded">
          <span className="text-zinc-500 block text-[10px]">THD Distort</span>
          <span className={`font-mono font-medium ${report.thdPercent > 1 ? 'text-rose-400' : 'text-zinc-300'}`}>
            {report.thdPercent}%
          </span>
        </div>
        <div className="bg-zinc-800/40 p-2 rounded col-span-2 sm:col-span-1">
          <span className="text-zinc-500 block text-[10px]">Status</span>
          <span className={`font-medium ${isFailed ? 'text-pink-400' : 'text-emerald-400'}`}>
            {isFailed ? 'Needs Fix' : 'Passed'}
          </span>
        </div>
      </div>
    </div>
  );
};
