import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  RefreshCw,
  SlidersHorizontal,
  Bookmark,
  Layers,
  Scissors,
  Eye,
  CheckCircle2,
  Compass,
  Palette
} from 'lucide-react';
import { DEFAULT_PROMPT_TEMPLATES } from '../data/templates';
import { PromptTemplate, WorkspaceSettings } from '../types';
import { generateContent } from '../services/api';

interface PromptStudioViewProps {
  onUsePromptInChat: (prompt: string, systemInstruction?: string) => void;
  settings: WorkspaceSettings;
}

export const PromptStudioView: React.FC<PromptStudioViewProps> = ({
  onUsePromptInChat,
  settings,
}) => {
  const [rawIdea, setRawIdea] = useState('');
  const [targetCategory, setTargetCategory] = useState<'runway' | 'techpack' | 'editorial' | 'sustainability'>('runway');
  const [optimizedPrompt, setOptimizedPrompt] = useState<string | null>(null);
  const [optimizedSystemPrompt, setOptimizedSystemPrompt] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copiedType, setCopiedType] = useState<'prompt' | 'system' | 'template' | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('All');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);

  const categories = ['All', 'Editorial & Runway', 'Fashion Tech & Production', 'Material Innovation', 'Styling & Wardrobe'];

  const filteredTemplates =
    activeCategoryFilter === 'All'
      ? DEFAULT_PROMPT_TEMPLATES
      : DEFAULT_PROMPT_TEMPLATES.filter((t) => t.category === activeCategoryFilter);

  const handleOptimizePrompt = async () => {
    if (!rawIdea.trim() || isOptimizing) return;
    setIsOptimizing(true);
    setOptimizedPrompt(null);
    setOptimizedSystemPrompt(null);

    const categoryDirectives = {
      runway:
        'Fashion Creative Direction & Runway Collection brief. Emphasize silhouette proportions, tactile fabrications, color story with Pantone/Hex codes, set design atmosphere, and theatrical movement.',
      techpack:
        'Factory Garment Technical Spec & Tech Pack (BOM, ISO stitch codes, Point of Measurement POM tolerances, fabric weight GSM, finishing and grading).',
      editorial:
        'High-fashion editorial lookbook commentary, Vogue-worthy manifesto, show notes, and brand press kit.',
      sustainability:
        'Regenerative textile lifecycle, circular economy metrics, non-toxic bio-dye chemistry, and cradle-to-cradle audits.',
    };

    const optimizationMetaPrompt = `You are the Principal AI Prompt Engineer and High-Fashion Atelier Director.
Transform the following raw idea into an elite, structured prompt and an accompanying system instruction tailored for ${categoryDirectives[targetCategory]}.

Raw Idea:
"${rawIdea.trim()}"

Provide output strictly in this exact format:
---SYSTEM INSTRUCTION---
[Provide high-impact expert persona and behavioral rules here]
---OPTIMIZED PROMPT---
[Provide the meticulously structured prompt with clear sections, brackets for user custom variables, and formatting expectations]`;

    try {
      const response = await generateContent({
        prompt: optimizationMetaPrompt,
        model: settings.model,
        thinkingLevel: 'LOW',
      });

      if (response.success && response.text) {
        const text = response.text;
        const systemMatch = text.match(/---SYSTEM INSTRUCTION---([\s\S]*?)---OPTIMIZED PROMPT---/);
        const promptMatch = text.match(/---OPTIMIZED PROMPT---([\s\S]*)/);

        if (systemMatch && promptMatch) {
          setOptimizedSystemPrompt(systemMatch[1].trim());
          setOptimizedPrompt(promptMatch[1].trim());
        } else {
          setOptimizedPrompt(text.trim());
          setOptimizedSystemPrompt(
            'You are an acclaimed High-Fashion Atelier Director and Technical Designer. Deliver rigorous, beautifully formatted editorial and technical outputs.'
          );
        }
      }
    } catch (err) {
      console.error('Failed to optimize prompt', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'prompt' | 'system' | 'template') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-8">
      {/* Studio Header */}
      <div className="border-b border-[#E5DFD7] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#8C7355] text-xs uppercase font-display font-semibold tracking-widest mb-1">
            <Wand2 className="w-4 h-4" />
            <span>Maison Spec Studio</span>
          </div>
          <h2 className="font-editorial text-3xl font-bold text-[#18181A] tracking-tight">
            Couture Prompt Engineer & Template Archive
          </h2>
          <p className="text-xs text-[#6B6459] mt-1 max-w-2xl leading-relaxed">
            Elevate basic prompts into factory-ready tech packs, avant-garde runway briefs, and Vogue-worthy editorial copy.
          </p>
        </div>
      </div>

      {/* Two Column Workspace: Prompt Optimizer & Template Browser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Prompt Architect */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-xs uppercase tracking-wider text-[#18181A] flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[#8C7355]" />
                <span>Prompt Refiner Engine</span>
              </span>
              <span className="text-[11px] font-mono text-[#8C8477]">Gemini 3.7 Synthesis</span>
            </div>

            {/* Target Specialty Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4A4339]">Atelier Specialty:</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {[
                  { id: 'runway', label: 'Runway' },
                  { id: 'techpack', label: 'Tech Pack' },
                  { id: 'editorial', label: 'Editorial' },
                  { id: 'sustainability', label: 'Eco-Textiles' },
                ].map((spec) => (
                  <button
                    key={spec.id}
                    onClick={() => setTargetCategory(spec.id as any)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      targetCategory === spec.id
                        ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs'
                        : 'bg-[#F2EDE4] text-[#5C554B] hover:bg-[#EAE4D8]'
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Raw Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#4A4339]">Your Raw Concept or Prompt:</label>
              <textarea
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="e.g. Design an oversized cocoon coat inspired by brutalist architecture with asymmetric raw-edge seams and a color palette based on concrete and oxidized copper..."
                rows={4}
                className="w-full p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#D8CFBF] focus:outline-hidden focus:ring-1 focus:ring-[#8C7355] text-xs font-mono text-[#18181A] leading-relaxed placeholder:text-[#9E9689]"
              />
            </div>

            <button
              onClick={handleOptimizePrompt}
              disabled={isOptimizing || !rawIdea.trim()}
              className={`w-full py-3 rounded-2xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all ${
                isOptimizing || !rawIdea.trim()
                  ? 'bg-[#E5DFD7] text-[#9E9689] cursor-not-allowed'
                  : 'bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] shadow-xs'
              }`}
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D8C2A7]" />
                  <span>Synthesizing Couture Specification...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-[#D8C2A7]" />
                  <span>Refine to Atelier Blueprint</span>
                </>
              )}
            </button>
          </div>

          {/* Optimized Output Card */}
          {optimizedPrompt && (
            <div className="bg-[#FAF8F5] border border-[#8C7355]/40 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#E5DFD7]">
                <span className="font-display font-semibold text-xs uppercase tracking-wider text-[#8C7355] flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#8C7355]" />
                  <span>Refined Prompt Specification</span>
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(optimizedPrompt, 'prompt')}
                    className="flex items-center space-x-1 px-2.5 py-1 text-xs text-[#5C554B] hover:text-[#18181A] bg-[#F2EDE4] hover:bg-[#EAE4D8] rounded-lg transition-colors border border-[#D8CFBF]"
                  >
                    {copiedType === 'prompt' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onUsePromptInChat(optimizedPrompt, optimizedSystemPrompt || undefined)}
                    className="flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] rounded-lg shadow-xs transition-colors"
                  >
                    <span>Run in Atelier</span>
                    <ArrowRight className="w-3 h-3 text-[#D8C2A7]" />
                  </button>
                </div>
              </div>

              {optimizedSystemPrompt && (
                <div className="p-3 bg-[#F2EDE4] rounded-xl border border-[#D8CFBF] text-xs space-y-1">
                  <p className="font-semibold text-[#18181A] text-[11px] uppercase tracking-wider">System Role Persona:</p>
                  <p className="font-mono text-[#4A4339] text-[11px]">{optimizedSystemPrompt}</p>
                </div>
              )}

              <div className="p-4 bg-white rounded-xl border border-[#E5DFD7] text-xs font-mono text-[#2C2720] whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                {optimizedPrompt}
              </div>
            </div>
          )}
        </div>

        {/* Right: Curated Fashion Templates Library */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#E5DFD7]">
              <div>
                <h3 className="font-display font-bold text-sm text-[#18181A] uppercase tracking-wider">
                  Atelier Template Archive
                </h3>
                <p className="text-[11px] text-[#6B6459]">
                  Battle-tested templates crafted for runway directors, technical patternmakers, and sustainability audits.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    activeCategoryFilter === cat
                      ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs'
                      : 'bg-[#ECE7DC] text-[#5C554B] hover:bg-[#E2DBCF]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Templates List */}
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-2xl bg-white border border-[#E5DFD7] hover:border-[#8C7355]/60 transition-all space-y-2.5 shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[10px] font-mono font-medium rounded-md bg-[#F2EDE4] text-[#8C7355] mb-1">
                        {template.category}
                      </span>
                      <h4 className="font-display font-semibold text-sm text-[#18181A] group-hover:text-[#8C7355] transition-colors">
                        {template.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-[#5C554B] leading-relaxed">
                    {template.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F8F6F0] text-[#7A7266] border border-[#EDE6DC]">
                        #{tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#F2EDE4]">
                    <button
                      onClick={() => copyToClipboard(template.prompt, 'template')}
                      className="px-2.5 py-1 text-[11px] text-[#5C554B] hover:text-[#18181A] bg-[#FAF8F5] hover:bg-[#F2EDE4] rounded-lg transition-colors border border-[#D8CFBF]"
                    >
                      <span>Copy Template</span>
                    </button>

                    <button
                      onClick={() => onUsePromptInChat(template.prompt, template.systemInstruction)}
                      className="flex items-center space-x-1 px-3 py-1 text-[11px] font-semibold bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] rounded-lg transition-colors shadow-2xs"
                    >
                      <span>Load in Atelier Chat</span>
                      <ArrowRight className="w-3 h-3 text-[#D8C2A7]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
