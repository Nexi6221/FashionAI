import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  ShieldCheck,
  Zap,
  Server,
  Globe,
  Compass,
  Layers,
  Sparkles
} from 'lucide-react';
import { checkServerStatus, generateContent } from '../services/api';

export const DiagnosticsView: React.FC = () => {
  const [status, setStatus] = useState<{ configured: boolean; model: string; status: string } | null>(null);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs?: number; message?: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const fetchStatus = async () => {
    const s = await checkServerStatus();
    setStatus(s);
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const runConnectivityTest = async () => {
    setIsTesting(true);
    setPingResult(null);
    const start = performance.now();

    try {
      const res = await generateContent({
        prompt: 'Atelier ping test: Respond with the single word "READY".',
        model: 'gemini-3.7-flash',
        thinkingLevel: 'MINIMAL',
      });
      const end = performance.now();
      const latency = Math.round(end - start);

      if (res.success && res.text) {
        setPingResult({
          success: true,
          latencyMs: latency,
          message: `Atelier Engine responded successfully in ${latency}ms: "${res.text.trim()}"`,
        });
      } else {
        setPingResult({
          success: false,
          latencyMs: latency,
          message: res.error || 'Server returned an error response.',
        });
      }
    } catch (err: any) {
      setPingResult({
        success: false,
        message: err?.message || 'Network connectivity error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
      <div className="border-b border-[#E5DFD7] pb-4">
        <div className="flex items-center space-x-2 text-[#8C7355] text-xs uppercase font-display font-semibold tracking-widest mb-1">
          <Activity className="w-4 h-4" />
          <span>Atelier Telemetry</span>
        </div>
        <h2 className="font-editorial text-3xl font-bold text-[#18181A] tracking-tight">
          System Diagnostics & Neural Engine Specs
        </h2>
        <p className="text-xs text-[#6B6459] mt-1 max-w-2xl leading-relaxed">
          Real-time server-side API health probe, model capabilities matrix, and automated failover telemetry.
        </p>
      </div>

      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Model */}
        <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8C8477] text-xs">
            <span className="font-display font-semibold uppercase tracking-wider text-[10px]">Active Architecture</span>
            <Cpu className="w-4 h-4 text-[#8C7355]" />
          </div>
          <p className="text-base font-bold text-[#18181A] font-mono">gemini-3.7-flash</p>
          <p className="text-xs text-[#5C554B] leading-relaxed">
            High-speed multimodal reasoning model with hybrid search grounding and adaptive thinking depth.
          </p>
        </div>

        {/* Server Architecture */}
        <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8C8477] text-xs">
            <span className="font-display font-semibold uppercase tracking-wider text-[10px]">API Security</span>
            <Server className="w-4 h-4 text-[#8C7355]" />
          </div>
          <p className="text-base font-bold text-[#18181A] font-mono">Server-Side Proxy</p>
          <p className="text-xs text-[#5C554B] leading-relaxed">
            Credentials never touch client browsers. Integrated exponential backoff & failover mesh.
          </p>
        </div>

        {/* Security / SDK */}
        <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[#8C8477] text-xs">
            <span className="font-display font-semibold uppercase tracking-wider text-[10px]">SDK Engine</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-base font-bold text-[#18181A] font-mono">@google/genai 2.4+</p>
          <p className="text-xs text-[#5C554B] leading-relaxed">
            Modern TypeScript SDK implementing thinking level, JSON schema, and multimodal garment inspection.
          </p>
        </div>
      </div>

      {/* Live Probe Runner */}
      <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-sm text-[#18181A] uppercase tracking-wider">
              Server-to-Gemini Latency Probe
            </h3>
            <p className="text-xs text-[#6B6459] mt-0.5">
              Execute a round-trip diagnostic ping: Client → Atelier Express Server → Gemini 3.7 Flash.
            </p>
          </div>

          <button
            onClick={runConnectivityTest}
            disabled={isTesting}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-semibold uppercase tracking-wider transition-all ${
              isTesting
                ? 'bg-[#E5DFD7] text-[#8C8477] cursor-not-allowed'
                : 'bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] shadow-xs'
            }`}
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D8C2A7]" />
                <span>Probing Atelier...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-[#D8C2A7]" />
                <span>Execute Health Probe</span>
              </>
            )}
          </button>
        </div>

        {pingResult && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-start space-x-3 border ${
              pingResult.success
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-red-50/80 border-red-200 text-red-950'
            }`}
          >
            {pingResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold text-sm">
                {pingResult.success ? `Probe Succeeded (${pingResult.latencyMs}ms latency)` : 'Probe Encountered Notice'}
              </p>
              <p className="mt-1 font-mono text-[11px]">{pingResult.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Capabilities Reference Table */}
      <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="font-display font-bold text-sm text-[#18181A] uppercase tracking-wider">
          Maison Atelier Capabilities Matrix
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD7] space-y-1.5 shadow-2xs">
            <span className="font-display font-semibold text-[#18181A] flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Multi-turn Editorial Conversation</span>
            </span>
            <p className="text-[#6B6459] text-[11px] leading-relaxed">
              Full context memory with specialized runway and technical patternmaker system instructions.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD7] space-y-1.5 shadow-2xs">
            <span className="font-display font-semibold text-[#18181A] flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Live Google Search Grounding</span>
            </span>
            <p className="text-[#6B6459] text-[11px] leading-relaxed">
              Access real-time fashion week reviews, textile market pricing, and trend reports with live citations.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD7] space-y-1.5 shadow-2xs">
            <span className="font-display font-semibold text-[#18181A] flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Configurable Thinking & Reasoning</span>
            </span>
            <p className="text-[#6B6459] text-[11px] leading-relaxed">
              MINIMAL, LOW (Fast), and HIGH (Deep Couture Reasoning) for complex garment construction analysis.
            </p>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD7] space-y-1.5 shadow-2xs">
            <span className="font-display font-semibold text-[#18181A] flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Multimodal Silhouette & Sketch Inspection</span>
            </span>
            <p className="text-[#6B6459] text-[11px] leading-relaxed">
              Accepts uploaded lookbook photos and flat sketches for instant drape, silhouette, and fabric analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
