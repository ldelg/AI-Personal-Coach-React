import type { ChatMsg } from "../interfaces/chatMsg";

export type ChatSession = {
  id: string;
  title: string;
  roleText: string;
  activeRole: string;
  roleLocked: boolean;
  messages: ChatMsg[];
};

export type ChatState = {
  activeChatId: string;
  chats: Record<string, ChatSession>;
  model: {
    loading: boolean;
    loaded: boolean;
    progress: string;
    error?: string;
  };
  busy: boolean;
};

export function createNewChat(roleSeed = "You are a helpful assistant."): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    roleText: roleSeed,
    activeRole: "",
    roleLocked: false,
    messages: [],
  };
}
