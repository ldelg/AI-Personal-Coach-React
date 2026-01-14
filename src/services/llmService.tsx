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
  const existing = getEngine();
  if (existing) return existing;

  try {
    const engine = await webllm.CreateMLCEngine(modelId, {
      initProgressCallback: (r: any) => onProgress?.(r?.text ?? ""),
    });

    setEngine(engine);
    return engine;
  } catch (err) {
    console.error("CreateMLCEngine failed:", err);
    setEngine(null);
    return null;
  }
}

export function isReady() {
  return getEngine() != null;
}

export async function getAvailableModels(): Promise<string[]> {
  return [
    "Qwen2.5-0.5B-Instruct-q4f16_1-MLC",
    "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    "Qwen2.5-1.5B-Instruct-q4f16_1-MLC",
    "gemma-2-2b-it-q4f16_1-MLC",
    "Llama-3.2-3B-Instruct-q4f16_1-MLC",
    "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    "Phi-3-mini-4k-instruct-q4f16_1-MLC",
    "Phi-3-medium-4k-instruct-q4f16_1-MLC",
  ];
}

// Clear the in-memory engine without removing cached files
export function clearEngine() {
  setEngine(null);
}

export async function removeModel(modelId?: string) {
  if (!modelId) {
    throw new Error("Model ID is required");
  }

  setEngine(null);

  if (typeof caches === "undefined") {
    throw new Error("Cache Storage API is not available");
  }

  const cacheNames = await caches.keys();
  const deletedEntries: string[] = [];
  const errors: string[] = [];

  const normalizedModelId = modelId.toLowerCase();

  for (const cacheName of cacheNames) {
    if (cacheName.startsWith("webllm/")) {
      try {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          const url = request.url.toLowerCase();
          if (url.includes(normalizedModelId)) {
            const deleted = await cache.delete(request);
            if (deleted) {
              deletedEntries.push(`${cacheName}: ${request.url}`);
            }
          }
        }
      } catch (err) {
        errors.push(
          `Failed to process cache ${cacheName}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }
  }

  if (deletedEntries.length === 0 && errors.length === 0) {
    throw new Error(
      `No cache entries found for model: ${modelId}. The model may not be cached, or cache entries don't contain the model ID in their URLs.`
    );
  }

  if (errors.length > 0 && deletedEntries.length === 0) {
    throw new Error(`Failed to remove model: ${errors.join(", ")}`);
  }
}
export async function complete(messages: ChatMsg[]) {
  const engine = getEngine();
  if (!engine) {
    console.warn("complete() called without engine");
    return "Model not loaded.";
  }

  try {
    const res = await engine.chat.completions.create({
      messages,
      stream: false,
    });
    return res.choices[0]?.message?.content ?? "";
  } catch (error: any) {
    setEngine(null);
    return "Model error. Please reload.";
  }
}
