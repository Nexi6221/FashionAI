export interface GenerateParams {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  thinkingLevel?: 'LOW' | 'HIGH' | 'MINIMAL';
  useSearch?: boolean;
  history?: Array<{ role: 'user' | 'model'; content: string }>;
  imageBase64?: string;
  imageMimeType?: string;
}

export interface GenerateResult {
  success: boolean;
  text?: string;
  sources?: Array<{ title: string; uri: string }>;
  model?: string;
  fallbackUsed?: boolean;
  error?: string;
}

export async function generateContent(params: GenerateParams): Promise<GenerateResult> {
  try {
    const res = await fetch('/api/gemini/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        error: data.error || `HTTP error ${res.status}: Failed to generate content`,
      };
    }

    return data;
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error communicating with the server API',
    };
  }
}

export async function checkServerStatus(): Promise<{ configured: boolean; model: string; status: string }> {
  try {
    const res = await fetch('/api/gemini/status');
    if (!res.ok) throw new Error('Status endpoint unavailable');
    return await res.json();
  } catch {
    return { configured: false, model: 'gemini-3.7-flash', status: 'offline' };
  }
}
