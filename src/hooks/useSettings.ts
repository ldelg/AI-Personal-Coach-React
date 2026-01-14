import { useState, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { loadModel, chatActions } from "../store/chat.slice";
import * as llm from "../services/llmService";

export function useSettings() {
  const dispatch = useAppDispatch();
  const modelState = useAppSelector((s) => s.chat.model);
  
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>(modelState.modelId || "");
  const [removingModel, setRemovingModel] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    llm.getAvailableModels().then((models) => {
      if (models.length > 0) {
        setAvailableModels(models);
        setSelected((current) => {
          if (modelState.modelId && models.includes(modelState.modelId)) {
            return modelState.modelId;
          }
          if (current && models.includes(current)) {
            return current;
          }
          return models[0];
        });
      }
    });
  }, [modelState.modelId]);

  useEffect(() => {
    if (modelState.modelId && availableModels.includes(modelState.modelId)) {
      setSelected(modelState.modelId);
    }
  }, [modelState.modelId, availableModels]);

  const handleLoad = useCallback(async (id: string) => {
    setErrorMsg(null);
    const res = await dispatch(loadModel(id));
    if (loadModel.rejected.match(res)) {
      const error = res.error?.message ?? "Failed to load model";
      setErrorMsg(String(error));
    }
  }, [dispatch]);

  const handleRemove = useCallback(async (id: string) => {
    setRemovingModel(id);
    setErrorMsg(null);
    try {
      await llm.removeModel(id);
      if (modelState.modelId === id) {
        dispatch(chatActions.setModelLoaded(false));
        dispatch(chatActions.setModelId(undefined));
      }
    } catch (err) {
      setErrorMsg(
        String(err instanceof Error ? err.message : "Failed to remove model")
      );
    } finally {
      setRemovingModel(null);
    }
  }, [dispatch, modelState.modelId]);

  const isSelectedModelLoaded =
    modelState.loaded && modelState.modelId === selected;
  const isLoading = modelState.loading;

  return {
    availableModels,
    selected,
    setSelected,
    removingModel,
    errorMsg,
    isLoading,
    isSelectedModelLoaded,
    modelState,
    handleLoad,
    handleRemove,
  };
}
