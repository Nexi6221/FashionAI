import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Scissors,
  Layers,
  Palette,
  Table,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { ScratchpadDoc } from '../types';
import { generateContent } from '../services/api';

const DEFAULT_DOCS: ScratchpadDoc[] = [
  {
    id: 'doc-1',
    title: 'AW26 Runway Spec & Tech Pack',
    lastModified: Date.now(),
    content: `# MAISON ATELIER • AUTUMN/WINTER 2026
## Collection: Brutalist Tailoring & Organic Drapes

### 1. Concept & Architectural Proportions
Exploration of raw structural geometry countered with ethereal, flowing layers. Contrasting heavy felted melton wool against featherweight mulberry silk chiffon.

### 2. Color Story
- **Obsidian Black**: \`#0F0F10\` — Structural core silhouette
- **Ecru Alabaster**: \`#FAF8F5\` — Sheer organza under-layers
- **Antique Cognac**: \`#8C6B47\` — Full-grain calfskin leather trims
- **Oxidized Mineral**: \`#4D5D53\` — Garment-dyed linen separates

### 3. Hero Garment: Oversized Asymmetric Trench Coat
| Component | Material / Spec | Colorway | Supplier Code |
| :--- | :--- | :--- | :--- |
| Shell | 100% Organic Wool Melton (480 GSM) | Obsidian Black | IT-MEL-904 |
| Lining | 100% Cupro Bemberg (85 GSM) | Antique Cognac | JP-CUP-112 |
| Hardware | Matte Gunmetal Buckles & Rivets | Oxidized Slate | FR-MET-004 |
| Buttons | Genuine Horn 4-Hole (28mm) | Dark Espresso | IT-HRN-330 |

### 4. Construction Callouts
- Seams: Closed welt seam with 1/4" topstitch using Tex 60 bonded thread.
- Lapel: Asymmetric draped shawl lapel with horsehair canvas fusing.
- Pocket: Deep dual-entry storm welt pockets with reinforced bar-tacks.
`,
  },
];

export const ScratchpadView: React.FC = () => {
  const [docs, setDocs] = useState<ScratchpadDoc[]>(() => {
    const saved = localStorage.getItem('studio_scratchpad_docs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return DEFAULT_DOCS;
  });

  const [activeDocId, setActiveDocId] = useState<string>(() => docs[0]?.id || 'doc-1');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [isTransforming, setIsTransforming] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeDoc = docs.find((d) => d.id === activeDocId) || docs[0];

  useEffect(() => {
    localStorage.setItem('studio_scratchpad_docs', JSON.stringify(docs));
  }, [docs]);

  const handleUpdateContent = (newContent: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeDocId ? { ...d, content: newContent, lastModified: Date.now() } : d
      )
    );
  };

  const handleUpdateTitle = (newTitle: string) => {
    setDocs((prev) =>
      prev.map((d) =>
        d.id === activeDocId ? { ...d, title: newTitle, lastModified: Date.now() } : d
      )
    );
  };

  const handleCreateDoc = () => {
    const newDoc: ScratchpadDoc = {
      id: `doc-${Date.now()}`,
      title: `Untitled Tech Spec (${docs.length + 1})`,
      content: `# New Atelier Document\n\nDraft your collection notes, tech pack BOM, or fabric spec here...`,
      lastModified: Date.now(),
    };
    setDocs((prev) => [newDoc, ...prev]);
    setActiveDocId(newDoc.id);
  };

  const handleDeleteDoc = (id: string) => {
    if (docs.length <= 1) {
      alert('You must have at least one active document.');
      return;
    }
    const filtered = docs.filter((d) => d.id !== id);
    setDocs(filtered);
    if (activeDocId === id) {
      setActiveDocId(filtered[0].id);
    }
  };

  const handleAITransform = async (
    action:
      | 'techpack'
      | 'polish'
      | 'colorstory'
      | 'sustainability'
      | 'shownotes'
  ) => {
    if (!activeDoc || !activeDoc.content.trim() || isTransforming) return;
    setIsTransforming(true);

    const prompts = {
      techpack:
        'Transform this fashion notes/content into a formal factory-ready Garment Technical Specification Sheet (Tech Pack). Format with structured Markdown tables for the Bill of Materials (BOM), Point of Measurement (POM) tolerances, and construction callouts.',
      polish:
        'Polish and elevate this fashion copy into an evocative, intellectually sharp editorial feature worthy of Vogue Runway or Purple Magazine.',
      colorstory:
        'Extract and expand the color palette and textile harmony from this document. Provide 5 curated palette shades with evocative haute couture names, Hex codes, fabric pairing recommendations, and texture contrast rules.',
      sustainability:
        'Conduct a Sustainable Lifecycle and Circular Economy Audit on the fabrics and garments described in this document. Suggest low-impact alternatives and circularity protocols.',
      shownotes:
        'Format this document into poetic, front-row Runway Show Notes and Press Kit release for Paris Fashion Week.',
    };

    try {
      const res = await generateContent({
        prompt: `${prompts[action]}\n\nSource Document Content:\n"""\n${activeDoc.content}\n"""`,
        model: 'gemini-3.7-flash',
        thinkingLevel: 'LOW',
        systemInstruction:
          'You are an elite High-Fashion Atelier Director and Technical Designer. Return beautifully structured markdown with clear headings, tables, and bullet points.',
      });

      if (res.success && res.text) {
        handleUpdateContent(res.text.trim());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsTransforming(false);
    }
  };

  const copyMarkdown = () => {
    if (!activeDoc) return;
    navigator.clipboard.writeText(activeDoc.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportAsFile = () => {
    if (!activeDoc) return;
    const blob = new Blob([activeDoc.content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeDoc.title.toLowerCase().replace(/\s+/g, '-')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Preview Renderer for Markdown
  const renderFormattedPreview = (content: string) => {
    const lines = content.split('\n');
    let insideTable = false;
    let tableLines: string[] = [];
    const elements: React.ReactNode[] = [];

    const flushTable = () => {
      if (tableLines.length > 0) {
        const headerRow = tableLines[0].split('|').map((c) => c.trim()).filter(Boolean);
        const dataRows = tableLines.slice(2).map((r) => r.split('|').map((c) => c.trim()).filter(Boolean));

        elements.push(
          <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-2xl border border-[#E5DFD7] bg-[#FAF8F5]">
            <table className="min-w-full text-xs text-left">
              <thead className="bg-[#ECE7DC] border-b border-[#E0D8CB] font-display font-semibold text-[#18181A] uppercase tracking-wider text-[11px]">
                <tr>
                  {headerRow.map((h, i) => (
                    <th key={i} className="px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE6DC]">
                {dataRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#F3EFE8] transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2.5 text-[#3D372F] font-mono text-[11px]">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableLines = [];
        insideTable = false;
      }
    };

    lines.forEach((line, idx) => {
      if (line.trim().startsWith('|')) {
        insideTable = true;
        tableLines.push(line);
        return;
      } else if (insideTable) {
        flushTable();
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={idx} className="font-editorial font-bold text-3xl text-[#18181A] mt-6 mb-3 tracking-tight border-b border-[#E5DFD7] pb-2">
            {line.replace('# ', '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={idx} className="font-editorial font-bold text-2xl text-[#18181A] mt-5 mb-2 tracking-tight">
            {line.replace('## ', '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={idx} className="font-display font-bold text-xs uppercase tracking-widest text-[#8C7355] mt-4 mb-2">
            {line.replace('### ', '')}
          </h3>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={idx} className="flex items-start space-x-2 text-sm text-[#3A342C] my-1 pl-1">
            <span className="text-[#8C7355] text-base leading-none select-none">•</span>
            <span>{line.replace(/^[-*]\s+/, '')}</span>
          </div>
        );
      } else if (line.trim() === '') {
        elements.push(<div key={idx} className="h-2" />);
      } else {
        elements.push(
          <p key={idx} className="text-sm leading-relaxed text-[#3D372F]">
            {line}
          </p>
        );
      }
    });

    if (insideTable) {
      flushTable();
    }

    return elements;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.5rem)] max-w-7xl mx-auto w-full px-4 sm:px-6 py-4">
      {/* Top Document Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E5DFD7]">
        {/* Document Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1">
          {docs.map((d) => (
            <div
              key={d.id}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs transition-all border shrink-0 ${
                d.id === activeDocId
                  ? 'bg-[#18181A] text-[#FAF8F5] border-[#18181A] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#5C554B] border-[#D8CFBF] hover:bg-[#F2EDE4]'
              }`}
            >
              <button onClick={() => setActiveDocId(d.id)} className="font-medium truncate max-w-[140px]">
                {d.title}
              </button>
              {docs.length > 1 && (
                <button
                  onClick={() => handleDeleteDoc(d.id)}
                  className={`text-[10px] hover:text-red-400 ${d.id === activeDocId ? 'text-stone-400' : 'text-stone-400'}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          <button
            onClick={handleCreateDoc}
            className="flex items-center space-x-1 px-3 py-1.5 bg-[#ECE7DC] hover:bg-[#E2DBCF] text-[#4A4339] rounded-xl text-xs font-semibold border border-[#D8CFBF] transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Spec</span>
          </button>
        </div>

        {/* View mode toggle & File Actions */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1 bg-[#ECE7DC] p-1 rounded-xl border border-[#DFD8CC] text-xs">
            <button
              onClick={() => setViewMode('edit')}
              className={`px-2.5 py-1 rounded-lg ${viewMode === 'edit' ? 'bg-[#18181A] text-[#FAF8F5] font-semibold' : 'text-[#5C554B]'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg ${viewMode === 'split' ? 'bg-[#18181A] text-[#FAF8F5] font-semibold' : 'text-[#5C554B]'}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg ${viewMode === 'preview' ? 'bg-[#18181A] text-[#FAF8F5] font-semibold' : 'text-[#5C554B]'}`}
            >
              Lookbook
            </button>
          </div>

          <button
            onClick={copyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#4A4339] rounded-xl text-xs border border-[#D8CFBF] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={exportAsFile}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] rounded-xl text-xs font-semibold transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#D8C2A7]" />
            <span className="hidden sm:inline">Export MD</span>
          </button>
        </div>
      </div>

      {/* AI Transformation Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 pb-3 mb-3 border-b border-[#E5DFD7]">
        <span className="text-[11px] font-display font-semibold uppercase tracking-wider text-[#8C7355] flex items-center space-x-1 mr-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Atelier AI Actions:</span>
        </span>

        <button
          onClick={() => handleAITransform('techpack')}
          disabled={isTransforming}
          className="flex items-center space-x-1 px-3 py-1 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#3D372F] rounded-lg text-xs font-medium border border-[#D8CFBF] transition-colors shadow-2xs"
        >
          <Table className="w-3 h-3 text-[#8C7355]" />
          <span>Build Tech Pack BOM</span>
        </button>

        <button
          onClick={() => handleAITransform('colorstory')}
          disabled={isTransforming}
          className="flex items-center space-x-1 px-3 py-1 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#3D372F] rounded-lg text-xs font-medium border border-[#D8CFBF] transition-colors shadow-2xs"
        >
          <Palette className="w-3 h-3 text-[#8C7355]" />
          <span>Extract Color Story</span>
        </button>

        <button
          onClick={() => handleAITransform('polish')}
          disabled={isTransforming}
          className="flex items-center space-x-1 px-3 py-1 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#3D372F] rounded-lg text-xs font-medium border border-[#D8CFBF] transition-colors shadow-2xs"
        >
          <Sparkles className="w-3 h-3 text-[#8C7355]" />
          <span>Editorial Polish</span>
        </button>

        <button
          onClick={() => handleAITransform('sustainability')}
          disabled={isTransforming}
          className="flex items-center space-x-1 px-3 py-1 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#3D372F] rounded-lg text-xs font-medium border border-[#D8CFBF] transition-colors shadow-2xs"
        >
          <Layers className="w-3 h-3 text-[#8C7355]" />
          <span>Sustainability Audit</span>
        </button>

        <button
          onClick={() => handleAITransform('shownotes')}
          disabled={isTransforming}
          className="flex items-center space-x-1 px-3 py-1 bg-[#FAF8F5] hover:bg-[#F2EDE4] text-[#3D372F] rounded-lg text-xs font-medium border border-[#D8CFBF] transition-colors shadow-2xs"
        >
          <Scissors className="w-3 h-3 text-[#8C7355]" />
          <span>Runway Show Notes</span>
        </button>

        {isTransforming && (
          <span className="flex items-center space-x-1.5 text-xs text-[#8C7355] font-editorial italic ml-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Transforming canvas...</span>
          </span>
        )}
      </div>

      {/* Editor / Preview Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        {/* Editor Area */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className="flex flex-col bg-[#FAF8F5] rounded-3xl border border-[#D8CFBF] p-4 shadow-xs overflow-hidden">
            <div className="mb-2 pb-2 border-b border-[#EDE6DC] flex items-center justify-between">
              <input
                type="text"
                value={activeDoc?.title || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateTitle(e.target.value)}
                className="bg-transparent font-display font-semibold text-sm text-[#18181A] focus:outline-hidden w-full"
                placeholder="Document Title"
              />
            </div>
            <textarea
              value={activeDoc?.content || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleUpdateContent(e.target.value)}
              placeholder="Write or paste your fashion concept, textile specs, or runway notes here..."
              className="flex-1 w-full resize-none bg-transparent border-0 focus:outline-hidden focus:ring-0 text-xs font-mono text-[#18181A] leading-relaxed p-1"
            />
          </div>
        )}

        {/* Lookbook Rendered Preview Area */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="bg-[#FAF8F5] rounded-3xl border border-[#D8CFBF] p-6 shadow-xs overflow-y-auto">
            <div className="mb-4 pb-2 border-b border-[#EDE6DC] flex items-center justify-between text-xs text-[#8C8477]">
              <span className="font-display font-semibold text-[11px] uppercase tracking-widest text-[#8C7355]">
                Lookbook & Spec Render
              </span>
              <span className="font-mono text-[10px]">Formatted Preview</span>
            </div>
            <div className="space-y-3">
              {renderFormattedPreview(activeDoc?.content || '')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
