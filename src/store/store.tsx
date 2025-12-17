import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./chat.slice";

const STORAGE_KEY = "offline_chats_v1";

const saved = localStorage.getItem(STORAGE_KEY);

export const store = configureStore({
  reducer: {
    chat: chatReducer,
  },
  preloadedState: saved ? { chat: JSON.parse(saved) } : undefined,
});

store.subscribe(() => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store.getState().chat)
  );
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
