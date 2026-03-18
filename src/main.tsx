import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Auto-reload when a new version is detected
registerSW({ onNeedRefresh() { window.location.reload(); } });

createRoot(document.getElementById("root")!).render(<App />);
