import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Configure bearer token retrieval for Capacitor/Android to bypass WebView cookie restrictions
setAuthTokenGetter(() => {
  return localStorage.getItem("auth_token");
});

// If running as a native Android or iOS app, configure where the API server is located.
if (Capacitor.isNativePlatform()) {
  // For Local Testing: Using Mac's LAN IP so phone/emulator can connect directly over Wi-Fi
  console.log("Setting API Base URL to http://192.168.203.35:8080");
  setBaseUrl("http://192.168.203.35:8080");
}

createRoot(document.getElementById("root")!).render(<App />);
