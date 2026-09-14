import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./AuthContext";
import "./index.css";

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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
