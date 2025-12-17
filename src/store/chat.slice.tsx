import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ChatMsg } from "../interfaces/chatMsg";
import * as llm from "../services/llmService";

type State = {
  roleText: string;
  messages: ChatMsg[];
  model: { loading: boolean; loaded: boolean; progress: string; error?: string };
  busy: boolean;
};

const initialState: State = {
  roleText: "You are a helpful assistant.",
  messages: [],
  model: { loading: false, loaded: false, progress: "" },
  busy: false,
};

export const loadModel = createAsyncThunk(
  "chat/loadModel",
  async (_, { dispatch }) => {
    await llm.initModel("gemma-2-2b-it-q4f16_1-MLC", (t) =>
      dispatch(chatSlice.actions.setProgress(t))
    );
    return true;
  }
);

export const sendMessage = createAsyncThunk<
  string,
  string,
  { state: { chat: State } }
>("chat/sendMessage", async (userText, { getState }) => {
  const { roleText, messages } = getState().chat;

  const full: ChatMsg[] = [
    { role: "system", content: roleText },
    ...messages.filter((m) => m.role !== "system"),
    { role: "user", content: userText },
  ];

  return await llm.complete(full);
});

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setRoleText(s, a: PayloadAction<string>) {
      s.roleText = a.payload;
    },
    newChat(s) {
      s.messages = [];
    },
    setProgress(s, a: PayloadAction<string>) {
      s.model.progress = a.payload;
    },
    appendUser(s, a: PayloadAction<string>) {
      s.messages.push({ role: "user", content: a.payload });
    },
  },
  extraReducers: (b) => {
    b.addCase(loadModel.pending, (s) => {
      s.model.loading = true;
      s.model.error = undefined;
    });
    b.addCase(loadModel.fulfilled, (s) => {
      s.model.loading = false;
      s.model.loaded = true;
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
      s.messages.push({ role: "assistant", content: a.payload });
    });
    b.addCase(sendMessage.rejected, (s, a) => {
      s.busy = false;
      s.messages.push({
        role: "assistant",
        content: `⚠️ ${String(a.error.message)}`,
      });
    });
  },
});

export const chatActions = chatSlice.actions;
export default chatSlice.reducer;
