import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import "./index.css";

function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
    const iosStandalone = window.navigator.standalone === true;
    if (standalone || iosStandalone) setInstalled(true);

    const onBeforeInstall = (event) => {
      event.preventDefault();
      setInstallEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
      setShowHelp(false);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (!installEvent) {
      setShowHelp(true);
      return;
    }

    const event = installEvent;
    setInstallEvent(null);
    await event.prompt();
    await event.userChoice;
  }

  return (
    <>
      <button
        type="button"
        className="patria-install-button"
        onClick={install}
        aria-label="Instaliraj PatriaSoul na uređaj"
      >
        <span aria-hidden="true">📱</span>
        <span>Instaliraj PatriaSoul</span>
      </button>

      {showHelp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Kako instalirati PatriaSoul"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(0,0,0,.45)",
          }}
          onClick={() => setShowHelp(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(420px, 100%)",
              borderRadius: 18,
              padding: 24,
              background: "#fff",
              color: "#172033",
              boxShadow: "0 20px 60px rgba(0,0,0,.25)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🇭🇷</div>
            <h2 style={{ margin: "0 0 10px" }}>Instaliraj PatriaSoul</h2>
            <p style={{ margin: "0 0 14px", lineHeight: 1.55 }}>
              Ako se instalacija ne otvori automatski, otvori izbornik preglednika i odaberi <strong>Instaliraj aplikaciju</strong> ili <strong>Dodaj na početni zaslon</strong>.
            </p>
            <p style={{ margin: "0 0 18px", lineHeight: 1.55, fontSize: 14, opacity: 0.75 }}>
              Na Androidu je to najčešće izbornik ⋮ u Chromeu. Na iPhoneu odaberi Dijeli → Dodaj na početni zaslon.
            </p>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              style={{
                width: "100%",
                padding: "11px 16px",
                border: 0,
                borderRadius: 10,
                background: "#193452",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              U redu
            </button>
          </div>
        </div>
      )}
    </>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PatriaSoul runtime error:", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main style={{ minHeight: "100vh", padding: "48px 24px", fontFamily: "Arial, sans-serif", background: "#f7f7f7", color: "#172033" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", background: "white", border: "1px solid #ddd", borderRadius: 16, padding: 32 }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🇭🇷</div>
          <h1 style={{ margin: "0 0 12px", fontSize: 30 }}>PatriaSoul se nije mogao pokrenuti</h1>
          <p style={{ lineHeight: 1.6, marginBottom: 20 }}>
            GitHub Pages je učitao aplikaciju, ali je JavaScript naišao na grešku pri pokretanju.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "#f1f1f1", padding: 16, borderRadius: 10, overflow: "auto" }}>
            {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "10px 18px", border: 0, borderRadius: 8, background: "#b5121b", color: "white", fontWeight: 700, cursor: "pointer" }}>
            Ponovno učitaj
          </button>
        </div>
      </main>
    );
  }
}

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/kviz/sw.js", { scope: "/kviz/" }).catch((error) => {
      console.warn("PatriaSoul PWA service worker nije registriran:", error);
    });
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
        <PWAInstallPrompt />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
