import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ChatMsg } from "../interfaces/chatMsg";
import * as llm from "../services/llmService";
import type { RootState, AppDispatch } from "./store";
import type { ChatState } from "./chat.types";
import { createNewChat } from "./chat.types";

const firstChat = createNewChat();

const initialState: ChatState = {
  activeChatId: firstChat.id,
  chats: {
    [firstChat.id]: firstChat,
  },
  model: { loading: false, loaded: false, progress: "" },
  busy: false,
};

export const verifyModelReady = () => (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const state: ChatState = getState().chat;
  if (state.model.loaded && !llm.isReady()) {
    dispatch(chatSlice.actions.setModelLoaded(false));
  }
};

// Selectors
export const selectActiveChat = (state: RootState) =>
  state.chat.chats[state.chat.activeChatId];

export const selectActiveChatFields = (state: RootState) => {
  const c = selectActiveChat(state);
  return {
    roleText: c?.roleText ?? "",
    activeRole: c?.activeRole ?? "",
    roleLocked: c?.roleLocked ?? false,
    messages: c?.messages ?? ([] as ChatMsg[]),
  };
};

export const selectActiveMessages = (state: RootState) =>
  selectActiveChat(state)?.messages ?? ([] as ChatMsg[]);

//Thunk actions

export const loadModel = createAsyncThunk(
  "chat/loadModel",
  async (_, { dispatch }) => {
    if (llm.isReady()) {
      return true;
    }
    //gemma-2-2b-it-q4f16_1-MLC
    await llm.initModel("Llama-3.2-1B-Instruct-q4f16_1-MLC", (t) =>
      dispatch(chatSlice.actions.setProgress(t))
    );
    return true;
  }
);

export const sendMessage = createAsyncThunk<
  string,
  string,
  { state: { chat: ChatState } }
>("chat/sendMessage", async (userText, { getState }) => {
  const state = getState().chat;
  const chat = state.chats[state.activeChatId];
  if (!chat) throw new Error("Active chat not found");

  const { roleText, activeRole, roleLocked, messages } = chat;

  const roleForThisChat = roleLocked ? activeRole : roleText;

  const conversationMessages = messages.filter((m) => m.role !== "system");

  const MAX_TURNS = 12;
  const trimmedMessages = conversationMessages.slice(-MAX_TURNS * 2);

  const full: ChatMsg[] = [
    { role: "system", content: roleForThisChat },
    ...trimmedMessages,
    { role: "user", content: userText },
  ];

  return await llm.complete(full);
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setRoleText(s, a: PayloadAction<string>) {
      const chat = s.chats[s.activeChatId];
      if (!chat) return;
      chat.roleText = a.payload;
    },
    createChat(s) {
      const newChat = createNewChat();
      s.chats[newChat.id] = newChat;
      s.activeChatId = newChat.id;
    },
    setActiveChat(s, a: PayloadAction<string>) {
      if (s.chats[a.payload]) {
        s.activeChatId = a.payload;
      }
    },
    deleteChat(s, a: PayloadAction<string>) {
      const chatId = a.payload;
      if (!s.chats[chatId]) return;

      if (Object.keys(s.chats).length <= 1) return;

      delete s.chats[chatId];

      if (s.activeChatId === chatId) {
        const remainingIds = Object.keys(s.chats);
        s.activeChatId = remainingIds[0];
      }
    },
    setProgress(s, a: PayloadAction<string>) {
      s.model.progress = a.payload;
    },
    setModelLoaded(s, a: PayloadAction<boolean>) {
      s.model.loaded = a.payload;
    },
    appendUser(s, a: PayloadAction<string>) {
      const chat = s.chats[s.activeChatId];
      if (!chat) return;

      chat.messages.push({ role: "user", content: a.payload });

      if (!chat.roleLocked) {
        chat.roleLocked = true;
        chat.activeRole = chat.roleText;
        chat.title = chat.roleText.slice(0, 40);
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(loadModel.pending, (s) => {
      s.model.loading = true;
      s.model.loaded = false;
      s.model.error = undefined;
    });
    b.addCase(loadModel.fulfilled, (s) => {
      s.model.loading = false;
      s.model.loaded = llm.isReady();
    });
    b.addCase(loadModel.rejected, (s, a) => {
      s.model.loading = false;
      s.model.error = String(a.error.message);
    });

    b.addCase(sendMessage.pending, (s) => {
      s.busy = true;
    });
    b.addCase(sendMessage.fulfilled, (s, a) => {
      s.busy = false;
      const chat = s.chats[s.activeChatId];
      if (chat) {
        chat.messages.push({ role: "assistant", content: a.payload });
      }
    });
    b.addCase(sendMessage.rejected, (s, a) => {
      s.busy = false;
      const chat = s.chats[s.activeChatId];
      if (chat) {
        chat.messages.push({
          role: "assistant",
          content: `⚠️ ${String(a.error.message)}`,
        });
      }
    });
  },
});

export const chatActions = chatSlice.actions;
export default chatSlice.reducer;
