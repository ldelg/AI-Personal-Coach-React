import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { chatActions, loadModel, selectActiveChatFields } from "../../store/chat.slice";
import "./Chats.css";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  isWide: boolean;
  onOpen: () => void;
  onClose: () => void;
}

export default function ChatSidebar({
  sidebarOpen,
  isWide,
  onOpen,
  onClose,
}: ChatSidebarProps) {
  const dispatch = useAppDispatch();
  const { chats, activeChatId, model } = useAppSelector((s) => s.chat);
  const { roleText, activeRole, roleLocked } = useAppSelector(selectActiveChatFields);

  return (
    <>
      {sidebarOpen && !isWide && (
        <div className="sidebar-backdrop" onClick={onClose} />
      )}

      {!sidebarOpen && isWide && (
        <div className="sidebar-column">
          <button
            className="sidebar-toggle"
            aria-label="Open sidebar"
            onClick={onOpen}
          >
            ☰
          </button>
        </div>
      )}

      {!sidebarOpen && !isWide && (
        <div className="sidebar-handle" onClick={onOpen}>
          <button className="sidebar-toggle" aria-label="Open sidebar">
            ☰
          </button>
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
            onClick={onClose}
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
    </>
  );
}

