import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";

const params = new URLSearchParams(window.location.search);
const merchantId = params.get("merchant") || "default";
const apiBase = params.get("api") || "http://localhost:8000";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App merchantId={merchantId} apiBase={apiBase} />
  </React.StrictMode>
);
