import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";  

const Chats = lazy(() => import("./components/Chats/Chats"));
const Settings = lazy(() => import("./components/Settings/Settings"));

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/chats" element={<Chats />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/" element={<Chats />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;   