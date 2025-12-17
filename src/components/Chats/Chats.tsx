import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  chatActions,
  loadModel,
  sendMessage,
} from "../../store/chat.slice";

import "./Chats.css";

export default function Chat() {
  const dispatch = useAppDispatch();
  const { roleText, messages, model, busy } = useAppSelector((s) => s.chat);
  const [input, setInput] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    dispatch(chatActions.appendUser(text));
    dispatch(sendMessage(text));
  }

  return (
    <div className="chat-page">
      <aside className="chat-sidebar">
        <h2>Offline Chat</h2>

        <button
          className="primary-btn"
          onClick={() => dispatch(loadModel())}
          disabled={model.loading}
        >
          {model.loading ? "Loading model…" : model.loaded ? "Model loaded" : "Load model"}
        </button>

        <div className="model-progress">{model.progress}</div>

        <label className="label">Role / System Prompt</label>
        <textarea
          className="role-input"
          rows={6}
          value={roleText}
          onChange={(e) => dispatch(chatActions.setRoleText(e.target.value))}
          placeholder='e.g. "You are a boxing coach. Be strict and concise."'
        />

        <button
          className="secondary-btn"
          onClick={() => dispatch(chatActions.newChat())}
        >
          New chat
        </button>
      </aside>

      {/* Chat */}
      <main className="chat-main">
        <header className="chat-header">
          <span>Chat</span>
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
              if (e.key === "Enter") handleSend();
            }}
          />
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={busy || !input.trim()}
          >
            Send
          </button>
        </footer>
      </main>
    </div>
  );
}
