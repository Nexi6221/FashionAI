import React from 'react';
import {
  Sparkles,
  MessageSquare,
  Wand2,
  FileEdit,
  Activity,
  Layers,
  Compass,
  Palette,
  CheckCircle2
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'chat' | 'prompt-lab' | 'scratchpad' | 'diagnostics';
  setActiveTab: (tab: 'chat' | 'prompt-lab' | 'scratchpad' | 'diagnostics') => void;
  serverStatus: { configured: boolean; model: string; status: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  serverStatus,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F6F0]/90 backdrop-blur-md border-b border-[#E5DFD7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Maison Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#18181A] flex items-center justify-center shadow-xs border border-[#2B2B30] text-[#D8C2A7]">
              <Compass className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-[#18181A] tracking-wider text-base uppercase">
                  Maison <span className="font-editorial italic font-normal text-lg tracking-normal lowercase text-[#8C7355]">Atelier</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#ECE6DC] text-[#6B573D] border border-[#DDD5C7]">
                  Gemini 3.7
                </span>
              </div>
              <p className="text-[11px] font-editorial italic text-[#7C756B] hidden sm:block">
                Fashion-Coded Intelligence, Editorial Direction & Tech Pack Studio
              </p>
            </div>
          </div>

          {/* Couture Navigation Tabs */}
          <nav className="flex items-center space-x-1 bg-[#ECE7DC] p-1 rounded-xl border border-[#DFD8CC] text-xs font-medium">
            <button
              id="tab-chat"
              onClick={() => setActiveTab('chat')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs font-semibold'
                  : 'text-[#5C554B] hover:text-[#18181A] hover:bg-[#E2DBCF]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#D8C2A7]" />
              <span>Atelier Chat</span>
            </button>

            <button
              id="tab-prompt-lab"
              onClick={() => setActiveTab('prompt-lab')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'prompt-lab'
                  ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs font-semibold'
                  : 'text-[#5C554B] hover:text-[#18181A] hover:bg-[#E2DBCF]'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5 text-[#D8C2A7]" />
              <span>Prompt Lab</span>
            </button>

            <button
              id="tab-scratchpad"
              onClick={() => setActiveTab('scratchpad')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
                activeTab === 'scratchpad'
                  ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs font-semibold'
                  : 'text-[#5C554B] hover:text-[#18181A] hover:bg-[#E2DBCF]'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5 text-[#D8C2A7]" />
              <span>Tech Spec & Canvas</span>
            </button>

            <button
              id="tab-diagnostics"
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-[#18181A] text-[#FAF8F5] shadow-xs font-semibold'
                  : 'text-[#5C554B] hover:text-[#18181A] hover:bg-[#E2DBCF]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#8C8477]" />
              <span className="hidden md:inline">Diagnostics</span>
            </button>
          </nav>

          {/* Engine Status indicator */}
          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl text-xs text-[#5C554B] shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B89668] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9E7B4F]"></span>
              </span>
              <span className="font-mono text-[11px] text-[#2C2720] font-medium tracking-tight">Atelier Engine Online</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
