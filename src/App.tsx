import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

const Chats = lazy(() => import("./components/Chats/Chats"));
const Settings = lazy(() => import("./components/Settings/Settings"));

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Navbar />
        <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/chats" element={<Chats />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/" element={<Chats />} />
              <Route path="*" element={<Chats />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
