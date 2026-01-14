import { useSettings } from "../../hooks/useSettings";
import "./Settings.css";

function Settings() {
  const {
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
  } = useSettings();

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1>Settings</h1>

        <section className="settings-section">
          <h2>Models</h2>
          <p className="settings-description">
            Select a model to load into the browser (cached for offline use).
          </p>
          <div className="settings-controls">
            <select
              className="settings-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              disabled={isLoading || !!removingModel}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <div className="settings-actions">
              <button
                className="primary-btn"
                onClick={() => handleLoad(selected)}
                disabled={isLoading || !!removingModel || isSelectedModelLoaded}
                title={
                  isSelectedModelLoaded
                    ? "This model is already loaded"
                    : undefined
                }
              >
                {isLoading ? "Loading…" : "Load"}
              </button>
              <button
                className="secondary-btn"
                onClick={() => handleRemove(selected)}
                disabled={!modelState.loaded || isLoading || !!removingModel}
                title={!modelState.loaded ? "No model loaded" : undefined}
              >
                {removingModel === selected ? "Removing…" : "Remove model"}
              </button>
            </div>
          </div>
          {errorMsg && <div className="model-error">{errorMsg}</div>}
          {modelState.error && (
            <div className="model-error">{modelState.error}</div>
          )}
          {modelState.progress && (
            <div className="model-progress">{modelState.progress}</div>
          )}
        </section>
      </div>
    </div>
  );
}

export default Settings;
