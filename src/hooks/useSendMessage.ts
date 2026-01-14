import { useAppDispatch, useAppSelector } from "../store/hooks";
import { chatActions, sendMessage } from "../store/chat.slice";
import { isReady } from "../services/llmService";

export default function useSendMessage(clearInput?: () => void) {
  const dispatch = useAppDispatch();
  const { busy, model } = useAppSelector((s) => s.chat);

  return (text: string) => {
    const trimmed = text.trim();

    if (!trimmed || busy || !model.loaded) return;

    if (!isReady()) {
      dispatch(chatActions.setModelLoaded(false));
      return;
    }

    dispatch(chatActions.appendUser(trimmed));
    dispatch(sendMessage(trimmed));

    clearInput?.();
  };
}
