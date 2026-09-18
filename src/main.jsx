import React, { Component } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#071426", color: "#fff", fontFamily: "Inter, system-ui, sans-serif" }}>
          <div style={{ maxWidth: 760, width: "100%", padding: 28, border: "1px solid rgba(240,206,115,.45)", borderRadius: 16, background: "#0d2238" }}>
            <div style={{ color: "#f6d47e", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", fontSize: 12 }}>PatriaSoul Kviz</div>
            <h1 style={{ fontSize: 30, margin: "10px 0" }}>Greška pri pokretanju aplikacije</h1>
            <p style={{ color: "rgba(255,255,255,.72)", lineHeight: 1.6 }}>
              Aplikacija se nije uspjela učitati. Osvježi stranicu; ako se greška ponovi, ova poruka prikazuje stvarni problem koji treba popraviti.
            </p>
            <pre style={{ marginTop: 18, padding: 14, overflowX: "auto", whiteSpace: "pre-wrap", background: "rgba(0,0,0,.28)", borderRadius: 10, color: "#ffd98a" }}>
              {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
            </pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 18, border: "1px solid #f0ce73", borderRadius: 10, padding: "10px 16px", background: "#f6d47e", color: "#101b29", fontWeight: 800 }}>
              Ponovno učitaj
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>
);
