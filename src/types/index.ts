export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  sources?: Array<{ title: string; uri: string }>;
  imagePreview?: string;
  isError?: boolean;
  fallbackUsed?: boolean;
  modelUsed?: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Editorial & Runway' | 'Fashion Tech & Production' | 'Material Innovation' | 'Styling & Wardrobe' | 'Brand & Strategy';
  description: string;
  prompt: string;
  systemInstruction?: string;
  tags: string[];
}

export interface ScratchpadDoc {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  category?: string;
}

export interface WorkspaceSettings {
  systemInstruction: string;
  thinkingLevel: 'LOW' | 'HIGH' | 'MINIMAL';
  useSearch: boolean;
  model: string;
}
