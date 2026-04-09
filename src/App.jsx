import { useState, useEffect } from "react";
import { WineApp }  from "./WineApp.jsx";
import { CigarApp } from "./CigarApp.jsx";
import { SpiceApp } from "./SpiceApp.jsx";

// ─── ROUTER ───────────────────────────────────────────────────────────────────
function getApp() {
  const path = window.location.pathname;
  if (path.startsWith("/wine"))  return "wine";
  if (path.startsWith("/cigar")) return "cigar";
  if (path.startsWith("/spice")) return "spice";
  return "landing";
}

function navigate(app) {
  const path = app === "landing" ? "/" : `/${app}`;
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

// ─── LANDING PAGE ────────────────────────────────────────────────────────────
const APPS = [
  {
    id: "wine",
    name: "WineBriefcase",
    emoji: "🍷",
    sub: "Din personlige vinlogg",
    color: "#5c1a1a",
    accent: "#c8922a",
    bg: "linear-gradient(135deg, #3a0f0f 0%, #5c1a1a 60%, #7a2828 100%)",
  },
  {
    id: "cigar",
    name: "CigarBriefcase",
    emoji: "🚬",
    sub: "Din personlige sigarlogg",
    color: "#2c1810",
    accent: "#c8a04a",
    bg: "linear-gradient(135deg, #1a0c08 0%, #2c1810 60%, #4a2c1c 100%)",
  },
  {
    id: "spice",
    name: "SpiceBriefcase",
    emoji: "🌶️",
    sub: "Din personlige krydderlogg",
    color: "#3b4a1e",
    accent: "#8a9a2a",
    bg: "linear-gradient(135deg, #1e2a0a 0%, #3b4a1e 60%, #4a5e25 100%)",
  },
];

function LandingPage() {
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0d0d1a 0%, #1a1a2e 50%, #0d1a0d 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
      fontFamily: "'Georgia','Times New Roman',serif",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 52 }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>💼</div>
        <h1 style={{ margin: 0, fontSize: 36, fontWeight: 800, color: "#fff", letterSpacing: "0.02em" }}>
          Briefcase
        </h1>
        <p style={{ margin: "10px 0 0", fontSize: 14, color: "rgba(255,255,255,0.45)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Dine personlige loggbøker
        </p>
      </div>

      {/* App cards */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        maxWidth: 420,
      }}>
        {APPS.map(app => (
          <button key={app.id}
            onClick={() => navigate(app.id)}
            onMouseEnter={() => setHovered(app.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: hovered === app.id ? app.bg : "rgba(255,255,255,0.06)",
              border: `1.5px solid ${hovered === app.id ? "transparent" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 18,
              padding: "22px 24px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 18,
              textAlign: "left",
              fontFamily: "inherit",
              transition: "all 0.25s ease",
              transform: hovered === app.id ? "scale(1.02)" : "scale(1)",
              boxShadow: hovered === app.id ? "0 12px 40px rgba(0,0,0,0.4)" : "none",
            }}>
            <span style={{ fontSize: 38, flexShrink: 0 }}>{app.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
                {app.name}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: "0.06em" }}>
                {app.sub}
              </div>
            </div>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>→</span>
          </button>
        ))}
      </div>

      <p style={{ marginTop: 48, fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        Trykk for å åpne en app
      </p>
    </div>
  );
}

// ─── MAIN ROUTER ──────────────────────────────────────────────────────────────
export default function App() {
  const [current, setCurrent] = useState(getApp);

  useEffect(() => {
    const handler = () => setCurrent(getApp());
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  if (current === "wine")  return <WineApp  />;
  if (current === "cigar") return <CigarApp />;
  if (current === "spice") return <SpiceApp />;
  return <LandingPage />;
}
