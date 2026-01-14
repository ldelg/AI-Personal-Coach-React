import {
  createAsyncThunk,
  createSlice,
  createSelector,
} from "@reduxjs/toolkit";
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

export const verifyModelReady =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state: ChatState = getState().chat;
    if (state.model.loaded && !llm.isReady()) {
      try {
        await dispatch(loadModel(state.model.modelId));
      } catch (e) {
        console.log("Model re-initialization failed:", e);
        dispatch(chatSlice.actions.setModelLoaded(false));
      }
    }
  };

// Selectors
export const selectActiveChat = (state: RootState) =>
  state.chat.chats[state.chat.activeChatId];

// Memoized selector to prevent unnecessary re-renders
export const selectActiveChatFields = createSelector(
  [selectActiveChat],
  (chat) => {
    if (!chat) {
      return {
        roleText: "",
        activeRole: "",
        roleLocked: false,
        messages: [] as ChatMsg[],
      };
    }
    return {
      roleText: chat.roleText,
      activeRole: chat.activeRole,
      roleLocked: chat.roleLocked,
      messages: chat.messages,
    };
  }
);

// Memoized selector for messages
export const selectActiveMessages = createSelector(
  [selectActiveChat],
  (chat) => chat?.messages ?? ([] as ChatMsg[])
);

//Thunk actions

export const loadModel = createAsyncThunk(
  "chat/loadModel",
  async (modelId: string | undefined, { dispatch, getState }) => {
    const id = modelId ?? "Llama-3.2-1B-Instruct-q4f16_1-MLC";
    const state = getState() as { chat: ChatState };
    const currentModelId = state.chat.model.modelId;

    if (llm.isReady() && currentModelId === id) {
      return id;
    }

    if (llm.isReady() && currentModelId !== id) {
      llm.clearEngine();
    }

    try {
      await llm.initModel(id, (t) =>
        dispatch(chatSlice.actions.setProgress(t))
      );
      return id;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Failed to load model: ${id}`;
      throw new Error(message);
    }
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

  // Reduced to prevent GPU memory issues - 6 turns = 12 messages (6 user + 6 assistant)
  const MAX_TURNS = 6;
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
    setModelId(s, a: PayloadAction<string | undefined>) {
      s.model.modelId = a.payload;
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
    b.addCase(loadModel.fulfilled, (s, a) => {
      s.model.loading = false;
      s.model.loaded = true;
      if (a.payload) {
        s.model.modelId = a.payload as string;
      }
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
      const errorMsg = String(a.error.message);

      // If device was lost, mark model as not loaded so user can reload
      if (
        errorMsg.includes("Device was lost") ||
        errorMsg.includes("disposed") ||
        errorMsg.includes("external Instance reference")
      ) {
        s.model.loaded = false;
      }

      const chat = s.chats[s.activeChatId];
      if (chat) {
        chat.messages.push({
          role: "assistant",
          content: `⚠️ ${errorMsg}`,
        });
      }
    });
  },
});

export const chatActions = chatSlice.actions;
export default chatSlice.reducer;
