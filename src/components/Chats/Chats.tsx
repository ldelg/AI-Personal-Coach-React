import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { verifyModelReady, selectActiveMessages } from "../../store/chat.slice";
import useIsWide from "../../hooks/useIsWide";
import useSendMessage from "../../hooks/useSendMessage";
import ChatSidebar from "./ChatSidebar";
import "./Chats.css";

export default function Chat() {
  const dispatch = useAppDispatch();
  const { busy } = useAppSelector((s) => s.chat);
  const { model } = useAppSelector((s) => s.chat);
  const messages = useAppSelector(selectActiveMessages);

  const isWide = useIsWide(550);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(isWide);
  const [input, setInput] = useState("");

  const sendMessage = useSendMessage(() => setInput(""));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  useEffect(() => {
    const hasRun = sessionStorage.getItem("modelVerified");
    if (!hasRun) {
      dispatch(verifyModelReady());
      sessionStorage.setItem("modelVerified", "true");
    }
  }, [dispatch]);

  return (
    <div className={`chat-page ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        isWide={isWide}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="chat-main">
        <header className="chat-header">
          <span>Chat</span>
          <span style={{ marginLeft: 12, fontSize: 12, color: "#665" }}>
            {model.loaded
              ? `Model: ${model.modelId ?? "loaded"}`
              : model.loading
              ? "Model: loading…"
              : "Model: not loaded"}
          </span>
          {busy && <span className="thinking">Thinking…</span>}
        </header>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">
              Load the model, set a role, and start chatting.
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`chat-row ${m.role === "user" ? "user" : "assistant"}`}
            >
              <div className="chat-bubble">{m.content}</div>
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        <footer className="chat-input">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            disabled={busy}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy && model.loaded)
                sendMessage(input);
            }}
          />
          <button
            className="send-btn"
            onClick={() => sendMessage(input)}
            disabled={busy || !model.loaded}
            title={
              !model.loaded
                ? model.loading
                  ? "Model is loading…"
                  : "Model not loaded — please load a model in Settings"
                : undefined
            }
          >
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}
