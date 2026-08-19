import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Paperclip,
  X,
  Globe,
  SlidersHorizontal,
  Trash2,
  Copy,
  Check,
  ArrowUpRight,
  RefreshCw,
  FileDown,
  BrainCircuit,
  Bot,
  User,
  Image as ImageIcon,
  Palette,
  Scissors,
  Layers,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, WorkspaceSettings, ScratchpadDoc } from '../types';
import { generateContent } from '../services/api';

interface ChatViewProps {
  settings: WorkspaceSettings;
  setSettings: React.Dispatch<React.SetStateAction<WorkspaceSettings>>;
  onExportToScratchpad: (title: string, content: string) => void;
  prefilledPrompt?: string;
  onClearPrefill?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  settings,
  setSettings,
  onExportToScratchpad,
  prefilledPrompt,
  onClearPrefill,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Bienvenue à la **Maison Atelier**. I am your fashion-coded intelligence collaborator powered by **Gemini 3.7**.\n\nI can assist you with:\n- **Haute Couture & Runway Direction**: Architect seasonal themes, silhouette studies, and Pantone color stories.\n- **Garment Tech Packs & Specifications**: Formulate Bill of Materials (BOM), stitch codes, tolerances, and factory specs.\n- **Sustainable Material Audits**: Evaluate bio-textiles, circularity metrics, and low-impact dye chemistry.\n- **Multimodal Visual Inspection**: Attach garment sketches, lookbook photos, or fabric swatches for instant drape, silhouette, and proportion analysis.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; preview: string } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);
  const [lastUserPrompt, setLastUserPrompt] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefilledPrompt) {
      setInput(prefilledPrompt);
      if (onClearPrefill) onClearPrefill();
      textareaRef.current?.focus();
    }
  }, [prefilledPrompt, onClearPrefill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPEG, WebP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage({
        base64: result,
        mimeType: file.type,
        preview: result,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (retryPrompt?: string) => {
    const promptToSend = retryPrompt || input.trim();
    if ((!promptToSend && !selectedImage) || isLoading) return;

    const userMessageId = `user-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      role: 'user',
      content: promptToSend || '(Lookbook Image / Garment Sketch Attached)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imagePreview: selectedImage?.preview,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    if (!retryPrompt) {
      setLastUserPrompt(promptToSend);
      setInput('');
    }
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    // Build multi-turn context
    const historyTurns = newMessages
      .filter((m) => m.id !== 'welcome' && !m.isError && m.id !== userMessageId)
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const response = await generateContent({
        prompt: promptToSend || 'Analyze this garment sketch / lookbook image for silhouette, drape, fabrication, and styling aesthetics.',
        systemInstruction: settings.systemInstruction,
        model: settings.model,
        thinkingLevel: settings.thinkingLevel,
        useSearch: settings.useSearch,
        history: historyTurns.length > 0 ? historyTurns : undefined,
        imageBase64: imageToSend?.base64,
        imageMimeType: imageToSend?.mimeType,
      });

      if (response.success && response.text) {
        const assistantMessage: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          content: response.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: response.sources,
          fallbackUsed: response.fallbackUsed,
          modelUsed: response.model,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'model',
          content: `⚠️ **Generation Notice**: ${response.error || 'The model was unable to complete the request.'}\n\nClick the Retry button below or switch models in the top bar.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'model',
          content: `⚠️ **Connection Notice**: ${err?.message || 'Server request interrupted.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const copyCodeBlock = (code: string, blockId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(blockId);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content:
          'Atelier canvas reset. Ready for your next collection brief, tech pack formulation, or styling dialogue.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Robust Markdown and Table rendering
  const renderMessageContent = (content: string, messageId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const language = lines[0]?.trim() || 'text';
        const code = (lines.length > 1 ? lines.slice(1) : lines).join('\n');
        const codeBlockId = `${messageId}-code-${index}`;

        return (
          <div key={index} className="my-3.5 rounded-xl overflow-hidden border border-[#2B2B30] bg-[#141416] text-[#F3EFEA] text-xs font-mono shadow-xs">
            <div className="flex items-center justify-between px-4 py-2 bg-[#0C0C0E] border-b border-[#232328] text-[#A69E92] text-[11px]">
              <span className="font-semibold uppercase tracking-wider text-[#D8C2A7]">{language}</span>
              <button
                onClick={() => copyCodeBlock(code, codeBlockId)}
                className="flex items-center space-x-1.5 hover:text-white transition-colors px-2.5 py-1 rounded bg-[#202024] hover:bg-[#2E2E34] border border-[#2E2E36]"
              >
                {copiedCodeIndex === codeBlockId ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto leading-relaxed whitespace-pre font-mono">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format paragraphs, tables, headers, lists
      return (
        <div key={index} className="space-y-3 whitespace-pre-wrap leading-relaxed text-[#2C2720]">
          {part.split('\n\n').map((para, pIdx) => {
            if (!para.trim()) return null;

            // Check if paragraph is a markdown table
            if (para.includes('|') && para.split('\n').every(l => l.trim().startsWith('|') || l.trim().endsWith('|'))) {
              const tableLines = para.trim().split('\n');
              const headerRow = tableLines[0].split('|').map(c => c.trim()).filter(Boolean);
              const dataRows = tableLines.slice(2).map(r => r.split('|').map(c => c.trim()).filter(Boolean));

              return (
                <div key={pIdx} className="overflow-x-auto my-3 rounded-xl border border-[#E5DFD7] bg-[#FAF8F5]">
                  <table className="min-w-full text-xs text-left">
                    <thead className="bg-[#ECE7DC] border-b border-[#E0D8CB] font-display font-semibold text-[#18181A] uppercase tracking-wider text-[10px]">
                      <tr>
                        {headerRow.map((h, hIdx) => (
                          <th key={hIdx} className="px-3.5 py-2.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDE6DC]">
                      {dataRows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-[#F3EFE8] transition-colors">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="px-3.5 py-2 text-[#3D372F] font-mono text-[11px]">{formatInlineMarkdown(cell)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            // Headers
            if (para.startsWith('### ')) {
              return (
                <h4 key={pIdx} className="font-display font-bold text-[#18181A] text-sm uppercase tracking-wider mt-4 mb-1 text-[#8C7355]">
                  {para.replace('### ', '')}
                </h4>
              );
            }
            if (para.startsWith('## ')) {
              return (
                <h3 key={pIdx} className="font-editorial font-bold text-[#18181A] text-xl mt-4 mb-2 tracking-tight border-b border-[#EDE6DC] pb-1">
                  {para.replace('## ', '')}
                </h3>
              );
            }

            // Lists
            if (para.startsWith('- ') || para.startsWith('* ')) {
              const items = para.split('\n');
              return (
                <ul key={pIdx} className="space-y-1.5 my-2 pl-2">
                  {items.map((it, iIdx) => (
                    <li key={iIdx} className="flex items-start space-x-2 text-[#3A342C] text-sm">
                      <span className="text-[#8C7355] text-base leading-none select-none">•</span>
                      <span className="flex-1">{formatInlineMarkdown(it.replace(/^[-*]\s+/, ''))}</span>
                    </li>
                  ))}
                </ul>
              );
            }

            return <p key={pIdx} className="text-sm leading-relaxed">{formatInlineMarkdown(para)}</p>;
          })}
        </div>
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    const boldFormatted = text.split(/(\*\*.*?\*\*)/g).map((chunk, i) => {
      if (chunk.startsWith('**') && chunk.endsWith('**')) {
        return <strong key={i} className="font-semibold text-[#18181A]">{chunk.slice(2, -2)}</strong>;
      }
      if (chunk.startsWith('`') && chunk.endsWith('`')) {
        return <code key={i} className="px-1.5 py-0.5 rounded bg-[#ECE7DC] border border-[#DDD5C7] font-mono text-xs text-[#7A5A35]">{chunk.slice(1, -1)}</code>;
      }
      return chunk;
    });
    return boldFormatted;
  };

  const fashionStarters = [
    {
      title: 'Runway Creative Brief: Sculptural Tailoring',
      prompt: 'Draft an avant-garde runway creative brief for Autumn/Winter 2026 exploring Brutalist Tailoring, sheer organza under-layers, and a 5-tone mineral color story with Hex codes.',
    },
    {
      title: 'Garment Tech Pack: Trench Coat BOM & Specs',
      prompt: 'Generate an industry-standard factory tech pack for an oversized wool-cashmere trench coat, including Bill of Materials (BOM) table, stitch types, and Point of Measurement (POM) tolerances.',
    },
    {
      title: 'Vogue Runway Editorial Show Notes',
      prompt: 'Write poetic, intellectually sharp fashion editorial show notes for front-row critics analyzing a minimalist capsule collection crafted from regenerative raw silk.',
    },
    {
      title: 'Sustainable Bio-Textiles & Dye Chemistry',
      prompt: 'Evaluate circularity trade-offs between mycelium leather, organic linen, and seaweed-derived yarns, detailing low-impact closed-loop dye protocols.',
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4.5rem)] max-w-6xl mx-auto w-full px-4 sm:px-6 py-4">
      {/* Haute Controls Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-[#E5DFD7] text-xs text-[#6B6459] gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display font-semibold uppercase tracking-wider text-[11px] text-[#18181A]">Model:</span>
          <select
            value={settings.model}
            onChange={(e) => setSettings((s) => ({ ...s, model: e.target.value }))}
            className="bg-[#FAF8F5] border border-[#D8CFBF] rounded-lg px-2.5 py-1 text-[#18181A] text-xs font-mono focus:ring-1 focus:ring-[#8C7355] focus:outline-hidden"
          >
            <option value="gemini-3.7-flash">gemini-3.7-flash (Default Haute)</option>
            <option value="gemini-flash-latest">gemini-flash-latest (Resilient)</option>
            <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fastest)</option>
          </select>

          <span className="text-[#DDD5C7] hidden sm:inline">|</span>

          <button
            onClick={() => setSettings((s) => ({ ...s, useSearch: !s.useSearch }))}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-colors border ${
              settings.useSearch
                ? 'bg-[#18181A] text-[#F8F6F0] border-[#18181A] font-medium'
                : 'bg-[#FAF8F5] text-[#5C554B] border-[#D8CFBF] hover:bg-[#F0EBE0]'
            }`}
            title="Toggle Google Search Grounding for live fashion week and textile trend data"
          >
            <Globe className="w-3.5 h-3.5 text-[#D8C2A7]" />
            <span>Search Grounding: {settings.useSearch ? 'ON' : 'OFF'}</span>
          </button>

          <span className="text-[#DDD5C7] hidden sm:inline">|</span>

          <span className="flex items-center space-x-1.5 text-[#5C554B]">
            <BrainCircuit className="w-3.5 h-3.5 text-[#8C7355]" />
            <span>Reasoning:</span>
            <select
              value={settings.thinkingLevel}
              onChange={(e) => setSettings((s) => ({ ...s, thinkingLevel: e.target.value as any }))}
              className="bg-[#FAF8F5] border border-[#D8CFBF] rounded-lg px-2 py-1 text-[#18181A] text-xs focus:ring-1 focus:ring-[#8C7355] focus:outline-hidden"
            >
              <option value="MINIMAL">Minimal</option>
              <option value="LOW">Low (Fast)</option>
              <option value="HIGH">High (Couture Reasoning)</option>
            </select>
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#F0EBE0] text-[#4A4339] border border-[#D8CFBF] transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8C7355]" />
            <span>Persona Spec</span>
          </button>

          <button
            onClick={clearChat}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] hover:bg-[#FBEBEB] text-[#6B6459] hover:text-red-700 border border-[#D8CFBF] hover:border-red-200 transition-colors"
            title="Reset Canvas"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Atelier System Prompt Drawer */}
      {showConfigDrawer && (
        <div className="mb-4 p-4 bg-[#F2EDE4] border border-[#D8CFBF] rounded-2xl text-xs space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold text-[#18181A] flex items-center space-x-1.5 uppercase tracking-wider text-[11px]">
              <Sparkles className="w-4 h-4 text-[#8C7355]" />
              <span>Atelier Persona & Creative Directives</span>
            </span>
            <button
              onClick={() => setShowConfigDrawer(false)}
              className="text-[#8C8477] hover:text-[#18181A]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={settings.systemInstruction}
            onChange={(e) => setSettings((s) => ({ ...s, systemInstruction: e.target.value }))}
            placeholder="e.g. You are a Senior Creative Director and Technical Spec Architect for a Paris Haute Couture Maison..."
            rows={2}
            className="w-full p-2.5 bg-[#FAF8F5] rounded-xl border border-[#D8CFBF] focus:outline-hidden focus:ring-1 focus:ring-[#8C7355] text-[#18181A] text-xs font-mono"
          />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs shadow-2xs ${
                  isUser
                    ? 'bg-[#18181A] text-[#FAF8F5]'
                    : msg.isError
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-[#ECE7DC] text-[#4A3B2C] border border-[#D8CFBF]'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`max-w-3xl space-y-1.5 ${isUser ? 'text-right' : ''}`}>
                <div
                  className={`inline-block text-left p-4.5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs'
                      : msg.isError
                      ? 'bg-[#FDF2F2] border border-red-200 text-[#2C2720]'
                      : 'bg-[#FAF8F5] border border-[#E5DFD7] shadow-xs text-[#2C2720]'
                  }`}
                >
                  {/* Lookbook / Sketch Image Preview */}
                  {msg.imagePreview && (
                    <div className="mb-3.5 rounded-xl overflow-hidden border border-[#D8CFBF] bg-[#18181A]/5 p-1">
                      <img
                        src={msg.imagePreview}
                        alt="Lookbook attachment"
                        className="max-h-72 w-auto rounded-lg object-contain mx-auto"
                      />
                    </div>
                  )}

                  {renderMessageContent(msg.content, msg.id)}

                  {/* Sources Grounding Display */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3.5 pt-3 border-t border-[#E5DFD7]">
                      <p className="text-[11px] font-display uppercase tracking-wider font-semibold text-[#8C7355] mb-2 flex items-center space-x-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Curated References & Citations:</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <a
                            key={sIdx}
                            href={src.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1 bg-[#F2EDE4] hover:bg-[#EAE4D8] text-[#3D372F] rounded-lg border border-[#D8CFBF] text-[11px] transition-colors"
                          >
                            <span className="truncate max-w-[220px]">{src.title}</span>
                            <ArrowUpRight className="w-3 h-3 text-[#8C8477]" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Retry Button if Error */}
                  {msg.isError && lastUserPrompt && (
                    <div className="mt-3 pt-2">
                      <button
                        onClick={() => handleSend(lastUserPrompt)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] rounded-lg text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#D8C2A7]" />
                        <span>Retry Request</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Meta & Actions Bar */}
                <div
                  className={`flex items-center space-x-2 text-[11px] text-[#8C8477] px-1.5 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <span className="font-mono">{msg.timestamp}</span>
                  {msg.fallbackUsed && msg.modelUsed && (
                    <>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#F2EDE4] text-[#8C7355] border border-[#D8CFBF] font-mono text-[10px]" title="Auto-failover engaged due to temporary peak model demand">
                        via {msg.modelUsed}
                      </span>
                    </>
                  )}
                  {!isUser && !msg.isError && (
                    <>
                      <span>•</span>
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="hover:text-[#18181A] flex items-center space-x-1 transition-colors"
                        title="Copy message text"
                      >
                        {copiedMessageId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-medium">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => onExportToScratchpad('Atelier Output', msg.content)}
                        className="hover:text-[#8C7355] flex items-center space-x-1 text-[#5C554B] transition-colors"
                        title="Send directly to Tech Spec Canvas"
                      >
                        <FileDown className="w-3 h-3 text-[#8C7355]" />
                        <span>To Tech Canvas</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3.5">
            <div className="w-8 h-8 rounded-xl bg-[#ECE7DC] border border-[#D8CFBF] text-[#8C7355] flex items-center justify-center shrink-0 animate-pulse">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-2xl p-4 shadow-xs flex items-center space-x-3 text-xs text-[#5C554B]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#8C7355]" />
              <span className="font-editorial italic text-sm text-[#18181A]">
                Atelier synthesizing couture intelligence {settings.thinkingLevel === 'HIGH' ? '(Deep Silhouette & Tech Reasoning)...' : '...'}
              </span>
            </div>
          </div>
        )}

        {/* Suggested Starters when conversation is clean */}
        {messages.length <= 1 && (
          <div className="my-6 pt-5 border-t border-[#E5DFD7]">
            <p className="text-[11px] font-display uppercase tracking-widest font-bold text-[#8C7355] mb-3">
              Maison Runway & Technical Blueprints
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fashionStarters.map((starter, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setInput(starter.prompt)}
                  className="text-left p-3.5 rounded-2xl bg-[#FAF8F5] hover:bg-[#F2EDE4] border border-[#E5DFD7] hover:border-[#8C7355]/50 transition-all text-xs space-y-1.5 shadow-2xs group"
                >
                  <p className="font-display font-semibold text-[#18181A] group-hover:text-[#8C7355] tracking-tight">
                    {starter.title}
                  </p>
                  <p className="text-[#6B6459] line-clamp-2 leading-relaxed text-[11px]">
                    {starter.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer */}
      <div className="mt-3 pt-3 border-t border-[#E5DFD7]">
        {/* Selected Image Tag */}
        {selectedImage && (
          <div className="mb-2 inline-flex items-center space-x-2 bg-[#FAF8F5] border border-[#D8CFBF] px-3 py-1.5 rounded-xl text-xs shadow-2xs">
            <ImageIcon className="w-3.5 h-3.5 text-[#8C7355]" />
            <span className="font-medium text-[#18181A]">Garment Sketch / Photo Attached</span>
            <button
              onClick={() => setSelectedImage(null)}
              className="text-[#8C8477] hover:text-[#18181A] ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="relative bg-[#FAF8F5] rounded-2xl border border-[#D8CFBF] focus-within:border-[#18181A] focus-within:ring-1 focus-within:ring-[#18181A] transition-all shadow-xs p-2.5">
          <textarea
            ref={textareaRef}
            id="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Draft a runway brief, formulate a tech pack BOM, analyze textile drape, or describe a silhouette... (Cmd+Enter to send)"
            rows={3}
            className="w-full resize-none bg-transparent border-0 focus:outline-hidden focus:ring-0 text-[#18181A] placeholder:text-[#9E9689] text-sm leading-relaxed p-1"
          />

          <div className="flex items-center justify-between pt-1.5 border-t border-[#EDE6DC]">
            <div className="flex items-center space-x-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-[#4A4339] hover:text-[#18181A] hover:bg-[#EDE6DC] rounded-xl transition-colors"
                title="Attach garment sketch, runway look, or fabric swatch"
              >
                <Paperclip className="w-3.5 h-3.5 text-[#8C7355]" />
                <span>Attach Sketch / Look</span>
              </button>
            </div>

            <div className="flex items-center space-x-2.5">
              <span className="text-[11px] text-[#9E9689] font-mono hidden sm:inline">⌘ + Enter to send</span>
              <button
                id="send-chat-btn"
                type="button"
                onClick={() => handleSend()}
                disabled={isLoading || (!input.trim() && !selectedImage)}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isLoading || (!input.trim() && !selectedImage)
                    ? 'bg-[#E5DFD7] text-[#9E9689] cursor-not-allowed'
                    : 'bg-[#18181A] hover:bg-[#2C2C30] text-[#FAF8F5] shadow-xs'
                }`}
              >
                <span>Dispatch</span>
                <Send className="w-3.5 h-3.5 text-[#D8C2A7]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
