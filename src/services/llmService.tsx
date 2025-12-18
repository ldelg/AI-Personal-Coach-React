import * as webllm from "@mlc-ai/web-llm";
import type { ChatMsg } from "../interfaces/chatMsg";

const KEY = "__webllm_engine__";

function getEngine(): webllm.MLCEngineInterface | null {
  return (globalThis as any)[KEY] ?? null;
}

function setEngine(e: webllm.MLCEngineInterface | null) {
  (globalThis as any)[KEY] = e;
}

export async function initModel(
  modelId: string,
  onProgress?: (text: string) => void
) {
  // If already initialized, reuse it
  const existing = getEngine();
  if (existing) return existing;

  const engine = await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (r) => onProgress?.(r.text ?? ""),
  });

  setEngine(engine);
  return engine;
}

export function isReady() {
  return getEngine() != null;
}

export async function complete(messages: ChatMsg[]) {
  const engine = getEngine();
  if (!engine) throw new Error("Model not loaded");
  
  try {
    const res = await engine.chat.completions.create({ messages, stream: false });
    return res.choices[0]?.message?.content ?? "";
  } catch (error: any) {
    // Handle GPU device loss - clear engine so it can be reloaded
    if (error?.message?.includes("Device was lost") || 
        error?.message?.includes("disposed") ||
        error?.message?.includes("external Instance reference")) {
      setEngine(null);
      throw new Error("GPU device lost. Please reload the model.");
    }
    throw error;
  }
}
