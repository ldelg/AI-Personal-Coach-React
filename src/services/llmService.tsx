import * as webllm from "@mlc-ai/web-llm";
import type { ChatMsg }  from "../interfaces/chatMsg";

let engine: webllm.MLCEngineInterface | null = null;

export async function initModel(
  modelId: string,
  onProgress?: (text: string) => void
) {
  engine = await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (r) => onProgress?.(r.text ?? ""),
  });
}

export function isReady() {
  return engine !== null;
}

export async function complete(messages: ChatMsg[]) {
  if (!engine) throw new Error("Model not loaded");
  const res = await engine.chat.completions.create({ messages, stream: false });
  return res.choices[0]?.message?.content ?? "";
}
