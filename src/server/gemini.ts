import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface GenerateRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  thinkingLevel?: "LOW" | "HIGH" | "MINIMAL";
  useSearch?: boolean;
  history?: Array<{ role: "user" | "model"; content: string }>;
  imageBase64?: string;
  imageMimeType?: string;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(err: any): boolean {
  const errMsg = (err?.message || "").toLowerCase();
  const status = err?.status || err?.code || "";
  return (
    errMsg.includes("503") ||
    errMsg.includes("unavailable") ||
    errMsg.includes("high demand") ||
    errMsg.includes("rate limit") ||
    errMsg.includes("429") ||
    errMsg.includes("resource exhausted") ||
    errMsg.includes("overloaded") ||
    status === 503 ||
    status === 429 ||
    status === "UNAVAILABLE" ||
    status === "RESOURCE_EXHAUSTED"
  );
}

export async function handleGenerate(reqData: GenerateRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Gemini API key is not configured. Please set GEMINI_API_KEY in your environment or Secrets panel.",
    };
  }

  const ai = getAiClient();
  const primaryModel = reqData.model || "gemini-3.7-flash";

  // Build content payload
  let contents: any;
  if (reqData.imageBase64 && reqData.imageMimeType) {
    const cleanBase64 = reqData.imageBase64.includes(",")
      ? reqData.imageBase64.split(",")[1]
      : reqData.imageBase64;
    contents = {
      parts: [
        {
          inlineData: {
            mimeType: reqData.imageMimeType,
            data: cleanBase64,
          },
        },
        { text: reqData.prompt || "Analyze this image in detail." },
      ],
    };
  } else if (reqData.history && reqData.history.length > 0) {
    const formattedTurns = reqData.history.map((h) => ({
      role: h.role,
      parts: [{ text: h.content }],
    }));
    formattedTurns.push({
      role: "user",
      parts: [{ text: reqData.prompt }],
    });
    contents = formattedTurns;
  } else {
    contents = reqData.prompt;
  }

  // Model fallback chain if requested model is under heavy load
  const modelChain = [
    primaryModel,
    ...(primaryModel !== "gemini-3.1-flash-lite" ? ["gemini-3.1-flash-lite"] : []),
    ...(primaryModel !== "gemini-flash-latest" ? ["gemini-flash-latest"] : []),
  ];

  let lastError: any = null;

  for (const currentModel of modelChain) {
    const config: any = {};

    if (reqData.systemInstruction && reqData.systemInstruction.trim().length > 0) {
      config.systemInstruction = reqData.systemInstruction.trim();
    }

    // Thinking configuration is strictly for Gemini 3 series models
    if (reqData.thinkingLevel && currentModel.startsWith("gemini-3")) {
      if (reqData.thinkingLevel === "LOW") {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      } else if (reqData.thinkingLevel === "HIGH") {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      } else if (reqData.thinkingLevel === "MINIMAL") {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
      }
    }

    if (reqData.useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    // Attempt up to 3 tries with progressive backoff per candidate model
    const maxAttempts = currentModel === primaryModel ? 3 : 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config: Object.keys(config).length > 0 ? config : undefined,
        });

        const text = response.text || "";

        // Extract search grounding metadata if available
        const groundingChunks =
          response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const webSources = groundingChunks
          .map((c: any) => c.web)
          .filter((w: any) => Boolean(w && w.uri))
          .map((w: any) => ({
            title: w.title || w.uri,
            uri: w.uri,
          }));

        return {
          success: true,
          text,
          sources: webSources,
          model: currentModel,
          fallbackUsed: currentModel !== primaryModel,
        };
      } catch (err: any) {
        lastError = err;

        if (isRetryableError(err)) {
          if (attempt < maxAttempts) {
            // Exponential backoff with small random jitter
            const backoffMs = Math.round(500 * Math.pow(1.8, attempt - 1) + Math.random() * 200);
            await delay(backoffMs);
            continue;
          }
        } else {
          // If non-retryable (e.g., bad arguments or invalid prompt format), exit early
          break;
        }
      }
    }
  }

  // If all candidate models in the chain were exhausted
  let friendlyMessage = lastError?.message || "Failed to generate response from Gemini API.";
  if (isRetryableError(lastError)) {
    friendlyMessage =
      "Gemini is currently experiencing peak demand across model endpoints. We executed automatic retries with backoff. Please wait a few moments and try your request again.";
  }

  return {
    success: false,
    error: friendlyMessage,
  };
}
