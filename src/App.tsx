/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { PromptStudioView } from './components/PromptStudioView';
import { ScratchpadView } from './components/ScratchpadView';
import { DiagnosticsView } from './components/DiagnosticsView';
import { WorkspaceSettings, ScratchpadDoc } from './types';
import { checkServerStatus } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'prompt-lab' | 'scratchpad' | 'diagnostics'>('chat');
  const [serverStatus, setServerStatus] = useState<{ configured: boolean; model: string; status: string } | null>(null);

  const [settings, setSettings] = useState<WorkspaceSettings>({
    systemInstruction:
      'You are the Chief Creative Director & Senior Technical Spec Architect for Maison Atelier, powered by Gemini 3.7. You provide razor-sharp high-fashion creative direction, factory-ready tech packs (BOM tables, ISO stitches, POM tolerances), runway show notes, and sustainable circular textile audits.',
    thinkingLevel: 'LOW',
    useSearch: false,
    model: 'gemini-3.7-flash',
  });

  const [prefilledChatPrompt, setPrefilledChatPrompt] = useState<string>('');

  useEffect(() => {
    checkServerStatus().then((s) => setServerStatus(s));
  }, []);

  const handleUsePromptInChat = (prompt: string, systemInstruction?: string) => {
    if (systemInstruction) {
      setSettings((prev) => ({ ...prev, systemInstruction }));
    }
    setPrefilledChatPrompt(prompt);
    setActiveTab('chat');
  };

  const handleExportToScratchpad = (title: string, content: string) => {
    const existing = localStorage.getItem('studio_scratchpad_docs');
    let docs: ScratchpadDoc[] = [];
    if (existing) {
      try {
        docs = JSON.parse(existing);
      } catch (e) {}
    }

    const newDoc: ScratchpadDoc = {
      id: `doc-${Date.now()}`,
      title: `${title} (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      content: content,
      lastModified: Date.now(),
    };

    const updated = [newDoc, ...docs];
    localStorage.setItem('studio_scratchpad_docs', JSON.stringify(updated));
    setActiveTab('scratchpad');
  };

  return (
    <div className="min-h-screen bg-[#F8F6F0] text-[#18181A] flex flex-col font-sans selection:bg-[#E2D5C3] selection:text-[#18181A]">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverStatus={serverStatus}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <ChatView
            settings={settings}
            setSettings={setSettings}
            onExportToScratchpad={handleExportToScratchpad}
            prefilledPrompt={prefilledChatPrompt}
            onClearPrefill={() => setPrefilledChatPrompt('')}
          />
        )}

        {activeTab === 'prompt-lab' && (
          <PromptStudioView
            onUsePromptInChat={handleUsePromptInChat}
            settings={settings}
          />
        )}

        {activeTab === 'scratchpad' && (
          <ScratchpadView />
        )}

        {activeTab === 'diagnostics' && (
          <DiagnosticsView />
        )}
      </main>
    </div>
  );
}
