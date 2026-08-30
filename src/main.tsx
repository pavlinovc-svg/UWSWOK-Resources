import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { WebViewProvider } from "./components/WebViewOverlay";
import "./index.css";
import "leaflet/dist/leaflet.css";

const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <WebViewProvider>
        <App />
      </WebViewProvider>
    </BrowserRouter>
  </React.StrictMode>
);
