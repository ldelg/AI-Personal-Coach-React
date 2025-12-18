import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { chatActions, loadModel, sendMessage, verifyModelReady, selectActiveMessages, selectActiveChatFields } from "../../store/chat.slice";
import { isReady } from "../../services/llmService";
import useIsWide from "../../hooks/useIsWide";
import "./Chats.css";

export default function Chat() {
  const dispatch = useAppDispatch();
  const { chats, activeChatId, model, busy } = useAppSelector((s) => s.chat);
  const { roleText, activeRole, roleLocked } = useAppSelector(selectActiveChatFields); 
  const messages = useAppSelector(selectActiveMessages);

  const isWide = useIsWide(550);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(isWide);
  const [input, setInput] = useState("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, busy]);

  useEffect(() => {
    dispatch(verifyModelReady());
  }, [dispatch]);

  function handleSend() {
    const text = input.trim();
    if (!text || busy) return;

    if (!isReady()) {
      dispatch(chatActions.setModelLoaded(false));
      return;
    }

    setInput("");
    dispatch(chatActions.appendUser(text));
    dispatch(sendMessage(text));
  }

  return (
    <div className={`chat-page ${sidebarOpen && !isWide ? "sidebar-overlay" : ""} ${!sidebarOpen ? "sidebar-collapsed" : ""}`}>
      {sidebarOpen && !isWide && (
        <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {!sidebarOpen && isWide && (
        <div className="sidebar-column">
          <button className="sidebar-toggle" aria-label="Open sidebar" onClick={() => setSidebarOpen(true)}>☰</button>
        </div>
      )}

      {!sidebarOpen && !isWide && (
        <div className="sidebar-handle" onClick={() => setSidebarOpen(true)}>
          <button className="sidebar-toggle" aria-label="Open sidebar">☰</button>
        </div>
      )}

      <aside
        className={`chat-sidebar ${!sidebarOpen ? "hidden" : ""} ${
          sidebarOpen && !isWide ? "overlay" : ""
        }`}
      >
        <div className="sidebar-header">
          <h2>Offline Chat</h2>
          <button
            className="sidebar-toggle"
            aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            onClick={() => setSidebarOpen(false)}
          >
            ☰
          </button>
        </div>

        <button
          className="primary-btn"
          onClick={() => dispatch(loadModel())}
          disabled={model.loading}
        >
          {model.loading
            ? "Loading model…"
            : model.loaded
            ? "Model loaded"
            : "Load model"}
        </button>

        <div className="model-progress">{model.progress}</div>

        <label className="label">Role / System Prompt</label>
        <textarea
          className="role-input"
          rows={6}
          value={roleLocked ? activeRole : roleText}
          disabled={roleLocked}
          onChange={(e) => dispatch(chatActions.setRoleText(e.target.value))}
          placeholder='e.g. "You are a boxing coach. Be strict and concise."'
        />

        {roleLocked && (
          <div className="hint">
            Role is locked for this chat. Click "New chat" to change it.
          </div>
        )}

        <button
          className="secondary-btn"
          onClick={() => dispatch(chatActions.createChat())}
        >
          New chat
        </button>

        <div className="chat-tabs">
          {Object.values(chats).map((chat) => (
            <div
              key={chat.id}
              className={`chat-tab ${chat.id === activeChatId ? "active" : ""}`}
              onClick={() => dispatch(chatActions.setActiveChat(chat.id))}
            >
              <span className="chat-tab-title">{chat.title}</span>
              <button
                className="chat-tab-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch(chatActions.deleteChat(chat.id));
                }}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </aside>

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
