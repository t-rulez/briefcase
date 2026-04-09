import { useState, useMemo, useEffect, useCallback } from "react";

// ─── CIGAR DATA (loaded from DB) ─────────────────────────────────────────────
// cigarDB and {} are now stored in Postgres.
// Data is fetched via /api/cigars on app load.

// ─── API HELPERS ─────────────────────────────────────────────────────────────
const API = {
  async auth(action, username, password) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, username, password, app: "cigar" }),
    });
    return res.json();
  },
  async getCigars() {
    const res = await fetch("/api/cigar-cigars");
    return res.json();
  },
  async getData(username) {
    const res = await fetch(`/api/data?username=${encodeURIComponent(username)}&app=cigar`);
    return res.json();
  },
  async saveData(username, experiences, stock) {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, experiences, stock, app: "cigar" }),
    });
  },
};

// Session stored in localStorage (device only — just keeps you logged in on this browser)
function getSession() { try { return localStorage.getItem("cb_session") || null; } catch { return null; } }
function setSession(u) { try { localStorage.setItem("cb_session", u); } catch {} }
function clearSession() { try { localStorage.removeItem("cb_session"); } catch {} }

// ─── ICONS ───────────────────────────────────────────────────────────────────
const IcoCigar = ({ size = 22 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12h16M18 12c0 0 2-1 3-1s1 1 1 1-0 1-1 1-3-1-3-1z" strokeLinecap="round"/><path d="M2 10c0 0 1-2 2-2h12c1 0 2 2 2 2v4c0 2-1 2-2 2H4c-1 0-2 0-2-2z"/></svg>);
const IcoBriefcase = ({ size = 22 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="13" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>);
const IcoNotes = ({ size = 22 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IcoStar = (filled, size = 16) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IcoSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IcoClose = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcoTrash = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const IcoEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IcoFilter = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
const IcoUser = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IcoLogout = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const strengthColors = {
  "Mild":        { bg: "#e8f5e9", text: "#2e7d32", dot: "#66bb6a" },
  "Mild-Medium": { bg: "#f9fbe7", text: "#558b2f", dot: "#aed581" },
  "Medium":      { bg: "#fff8e1", text: "#ef6c00", dot: "#ffb74d" },
  "Medium-Full": { bg: "#fff3e0", text: "#bf360c", dot: "#ff8a65" },
  "Full":        { bg: "#fbe9e7", text: "#b71c1c", dot: "#ef5350" },
};
const StrengthBadge = ({ strength }) => {
  const c = strengthColors[strength] || strengthColors["Medium"];
  return <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />{strength}</span>;
};

const labelStyle = { fontSize: 11, color: "#8b7355", display: "block", marginBottom: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle = { width: "100%", padding: "12px 14px", border: "1.5px solid #e8dcc8", borderRadius: 10, fontSize: 15, color: "#2c1810", background: "#faf6f0", boxSizing: "border-box", outline: "none" };

function StarRating({ value, onChange, max = 10 }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      {Array.from({ length: max }, (_, i) => (
        <button key={i} onClick={() => onChange && onChange(i + 1)}
          onMouseEnter={() => onChange && setHovered(i + 1)} onMouseLeave={() => onChange && setHovered(null)}
          style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", color: i < display ? "#c8a04a" : "#d4c5a9", padding: "2px", lineHeight: 1, minWidth: 22, minHeight: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {IcoStar(i < display)}
        </button>
      ))}
      {value > 0 && <span style={{ marginLeft: 4, fontSize: 13, color: "#8b7355", fontWeight: 700 }}>{value}/10</span>}
    </div>
  );
}


// ─── APP SWITCHER ─────────────────────────────────────────────────────────────
const BRIEFCASE_APPS = [
  { id: "wine",  name: "WineBriefcase",  emoji: "🍷" },
  { id: "cigar", name: "CigarBriefcase", emoji: "🚬" },
  { id: "spice", name: "SpiceBriefcase", emoji: "🌶️" },
];

function AppSwitcher({ current, primaryColor, accentColor }) {
  const [open, setOpen] = useState(false);
  const app = BRIEFCASE_APPS.find(a => a.id === current);
  const navigate = (id) => {
    setOpen(false);
    window.history.pushState({}, "", id === "landing" ? "/" : "/" + id);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 8, padding: "6px 10px", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit", whiteSpace: "nowrap" }}>
        {app.emoji} {app.name}
        <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>▼</span>
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 98 }} />
          <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.25)", zIndex: 99, minWidth: 210, overflow: "hidden", border: "1px solid #e0d0c0" }}>
            <div style={{ padding: "8px 14px 6px", fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>Briefcase Apps</div>
            {BRIEFCASE_APPS.map(a => (
              <button key={a.id} onClick={() => navigate(a.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: a.id === current ? "#f5f0eb" : "#fff", borderTop: "1px solid #f0e8e0", width: "100%", border: "none", borderTop: "1px solid #f0e8e0", cursor: "pointer", fontFamily: "inherit" }}>
                <span style={{ fontSize: 20 }}>{a.emoji}</span>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: a.id === current ? primaryColor : "#222" }}>{a.name}</div>
                  {a.id === current && <div style={{ fontSize: 10, color: accentColor, fontWeight: 600 }}>● Aktiv</div>}
                </div>
              </button>
            ))}
            <button onClick={() => navigate("landing")}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", borderTop: "1px solid #f0e8e0", width: "100%", border: "none", borderTop: "1px solid #f0e8e0", cursor: "pointer", fontFamily: "inherit" }}>
              <span style={{ fontSize: 20 }}>💼</span>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#444", textAlign: "left" }}>Alle apper</div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── LOGIN / REGISTER SCREEN ─────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!username.trim() || !password.trim()) { setError("Fyll inn brukernavn og passord."); return; }
    setLoading(true); setError("");
    const result = await API.auth(mode, username.trim(), password);
    if (result.error) { setError(result.error); setLoading(false); return; }
    onLogin(result.username);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#2c1810", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Georgia','Times New Roman',serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🚬</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2c1810" }}>CigarBriefcase <span style={{ color: "#c8a04a" }}>v2.0</span></div>
          <div style={{ fontSize: 12, color: "#a0886a", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>Din personlige sigarlogg</div>
        </div>

        <div style={{ display: "flex", background: "#f4ede0", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[["login", "Logg inn"], ["register", "Registrer"]].map(([m, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "9px", border: "none", borderRadius: 9, background: mode === m ? "#2c1810" : "transparent", color: mode === m ? "#f4ede0" : "#8b7355", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {lbl}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={labelStyle}>Brukernavn</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="ditt_brukernavn" style={inputStyle} onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          <div>
            <label style={labelStyle}>Passord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === "Enter" && handle()} />
          </div>
          {error && <div style={{ background: "#fbe9e7", color: "#b71c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <button onClick={handle} disabled={loading}
            style={{ background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", marginTop: 4, opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
            {loading ? "Vennligst vent..." : mode === "login" ? "Logg inn" : "Opprett konto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── BOTTOM SHEET (MOBILE) ────────────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,5,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "92vh", overflow: "auto", paddingBottom: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: 36, height: 4, background: "#e0d4c0", borderRadius: 4 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── MODAL (DESKTOP) ──────────────────────────────────────────────────────────
function Modal({ onClose, children, width = 520 }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,5,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: width, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── ADAPTIVE OVERLAY ────────────────────────────────────────────────────────
function Overlay({ isMobile, onClose, children, width }) {
  if (isMobile) return <BottomSheet onClose={onClose}><div style={{ padding: "0 18px" }}>{children}</div></BottomSheet>;
  return <Modal onClose={onClose} width={width}>{children}</Modal>;
}

// ─── CIGAR CARD ───────────────────────────────────────────────────────────────
function CigarCard({ cigar, onSelect, onAddExperience, onAddToStock, isDesktop }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8dcc8", overflow: "hidden", boxShadow: "0 1px 4px rgba(44,24,16,0.06)", transition: "box-shadow 0.2s" }}
      onMouseEnter={e => isDesktop && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(44,24,16,0.14)")}
      onMouseLeave={e => isDesktop && (e.currentTarget.style.boxShadow = "0 1px 4px rgba(44,24,16,0.06)")}>
      <div onClick={() => onSelect(cigar)} style={{ padding: isDesktop ? "16px 18px 12px" : "15px 15px 11px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{cigar.brand}</div>
            <div style={{ fontSize: isDesktop ? 17 : 16, fontWeight: 700, color: "#2c1810", lineHeight: 1.2, marginTop: 1 }}>{cigar.name}</div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "#a0886a", textTransform: "uppercase" }}>Score</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#c8a04a", lineHeight: 1 }}>{cigar.rating}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <StrengthBadge strength={cigar.strength} />
          <span style={{ background: "#f4ede0", color: "#6b4c2a", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{cigar.country}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 9 }}>
          <span style={{ fontSize: 12, color: "#a0886a" }}>{cigar.size} · {cigar.length} · {cigar.ring}</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#2c1810" }}>${cigar.price}</span>
        </div>
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
          {cigar.flavors.map(f => <span key={f} style={{ fontSize: 10, background: "#f9f4ec", color: "#8b7355", border: "1px solid #e8dcc8", padding: "2px 7px", borderRadius: 10, textTransform: "capitalize" }}>{f}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", borderTop: "1px solid #f0e8d8" }}>
        <button onClick={() => onAddExperience(cigar)} style={{ flex: 1, background: "#2c1810", color: "#f4ede0", border: "none", padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <IcoNotes size={14} /> Erfaring
        </button>
        <button onClick={() => onAddToStock(cigar)} style={{ flex: 1, background: "#c8a04a", color: "#2c1810", border: "none", borderLeft: "1px solid rgba(44,24,16,0.15)", padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          📦 Humidor
        </button>
      </div>
    </div>
  );
}

// ─── CIGAR DETAIL ─────────────────────────────────────────────────────────────
function CigarDetail({ cigar, onClose, onAddExperience, onAddToStock, isMobile, lang }) {
  if (!cigar) return null;
  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{cigar.brand}</div>
          <h2 style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 800, color: "#2c1810", lineHeight: 1.15 }}>{cigar.name}</h2>
        </div>
        <button onClick={onClose} style={{ background: "#f4ede0", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2c1810", flexShrink: 0, marginLeft: 10 }}><IcoClose /></button>
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
        <StrengthBadge strength={cigar.strength} />
        <span style={{ background: "#f4ede0", color: "#6b4c2a", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{cigar.country}</span>
      </div>
      <p style={{ color: "#6b5a45", lineHeight: 1.65, fontSize: 14, margin: "0 0 14px" }}>{(lang || window.__lang || "no") === "no" ? (cigar.description_no || cigar.description) : (cigar.description_en || cigar.description)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[["Størrelse", cigar.size], ["Lengde", cigar.length], ["Ring Gauge", cigar.ring], ["Wrapper", cigar.wrapper], ["Pris", `$${cigar.price}`], ["Score", `${cigar.rating}/100`]].map(([label, val]) => (
          <div key={label} style={{ background: "#faf6f0", borderRadius: 8, padding: "9px 12px" }}>
            <div style={{ fontSize: 10, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontWeight: 700, color: "#2c1810", fontSize: 14, marginTop: 1 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Smaker</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cigar.flavors.map(f => <span key={f} style={{ background: "#f9f4ec", color: "#6b4c2a", border: "1px solid #e8dcc8", padding: "5px 12px", borderRadius: 20, fontSize: 12, textTransform: "capitalize", fontWeight: 500 }}>{f}</span>)}
        </div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { onAddToStock(cigar); onClose(); }} style={{ flex: 1, background: "#c8a04a", color: "#2c1810", border: "none", borderRadius: 12, padding: "14px 8px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>📦 Legg i humidor</button>
        <button onClick={() => { onAddExperience(cigar); onClose(); }} style={{ flex: 1, background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "14px 8px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><IcoNotes size={16} /> Erfaring</button>
      </div>
    </>
  );
  return <Overlay isMobile={isMobile} onClose={onClose}>{content}</Overlay>;
}

// ─── ADD EXPERIENCE ───────────────────────────────────────────────────────────
function AddExperienceSheet({ cigar, onClose, onSave, isMobile, existing }) {
  const [form, setForm] = useState({
    date: existing?.date || new Date().toISOString().split("T")[0],
    myScore: existing?.myScore || 0,
    notes: existing?.notes || "",
    occasion: existing?.occasion || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const lang = window.__lang || "no";
  const t = {
    title: lang === "en" ? "Log experience" : "Logg erfaring",
    date: lang === "en" ? "Date smoked" : "Dato røyket",
    score: lang === "en" ? "My score (1–10)" : "Min score (1–10)",
    notes: lang === "en" ? "Tasting notes" : "Smaksnotater",
    notesPlaceholder: lang === "en" ? "What did you taste? Texture, finish, construction..." : "Hva smakte du? Tekstur, ettersmak, konstruksjon...",
    occasion: lang === "en" ? "Occasion" : "Anledning",
    occasionPlaceholder: lang === "en" ? "Birthday, Christmas, after dinner..." : "Bursdag, jul, etter middag...",
    cancel: lang === "en" ? "Cancel" : "Avbryt",
    save: lang === "en" ? "Save experience" : "Lagre erfaring",
  };
  const content = (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{t.title}</div>
        <h3 style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 800, color: "#2c1810", lineHeight: 1.2 }}>{cigar.brand} {cigar.name}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={labelStyle}>{t.date}</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t.score}</label><StarRating value={form.myScore} onChange={v => set("myScore", v)} /></div>
        <div><label style={labelStyle}>{t.notes}</label><textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder={t.notesPlaceholder} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} /></div>
        <div><label style={labelStyle}>{t.occasion}</label><input value={form.occasion} onChange={e => set("occasion", e.target.value)} placeholder={t.occasionPlaceholder} style={inputStyle} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ flex: 1, background: "#f4ede0", color: "#2c1810", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t.cancel}</button>
        <button onClick={() => { onSave({ cigar, ...form, id: existing?.id || Date.now() }); onClose(); }} style={{ flex: 2, background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.save}</button>
      </div>
    </>
  );
  return <Overlay isMobile={isMobile} onClose={onClose}>{content}</Overlay>;
}

// ─── EXPERIENCE CARD ──────────────────────────────────────────────────────────
function ExperienceCard({ entry, onDelete, onEdit }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8dcc8", padding: "15px", boxShadow: "0 1px 4px rgba(44,24,16,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "#a0886a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{entry.cigar.brand}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#2c1810", lineHeight: 1.2 }}>{entry.cigar.name}</div>
          <div style={{ fontSize: 11, color: "#a0886a", marginTop: 1 }}>{entry.date}</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          <button onClick={() => onEdit(entry)} style={{ background: "#f4ede0", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b4c2a" }}><IcoEdit /></button>
          <button onClick={() => onDelete(entry.id)} style={{ background: "#fbe9e7", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b71c1c" }}><IcoTrash /></button>
        </div>
      </div>
      <div style={{ marginTop: 10 }}><StarRating value={entry.myScore} max={10} /></div>
      {entry.notes && <div style={{ marginTop: 10, background: "#faf6f0", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#6b5a45", lineHeight: 1.6, borderLeft: "3px solid #c8a04a" }}>{entry.notes}</div>}
      <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
        {entry.occasion && <span style={{ fontSize: 11, background: "#f0f4ff", color: "#3a56a0", padding: "3px 10px", borderRadius: 20 }}>📅 {entry.occasion}</span>}
        {entry.pairing && <span style={{ fontSize: 11, background: "#f0fff4", color: "#276749", padding: "3px 10px", borderRadius: 20 }}>🥃 {entry.pairing}</span>}
        <span style={{ fontSize: 11, background: "#f4ede0", color: "#6b4c2a", padding: "3px 10px", borderRadius: 20 }}>{entry.cigar.country} · {entry.cigar.strength}</span>
      </div>
    </div>
  );
}

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────
// ALL_BRANDS is now derived from cigarDB passed as prop to FilterPanel

function FilterPanel({ isMobile, open, onClose, filterStrength, setFilterStrength, filterCountry, setFilterCountry, filterBrand, setFilterBrand, cigarDB = [] }) {
  const [brandSearch, setBrandSearch] = useState("");
  const ALL_BRANDS = [...new Set(cigarDB.map(c => c.brand))].sort();
  const visibleBrands = ALL_BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));
  const reset = () => { setFilterStrength(""); setFilterCountry(""); setFilterBrand(""); };

  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#2c1810" }}>Filter</span>
        <button onClick={reset} style={{ background: "none", border: "none", color: "#c8a04a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>Nullstill</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Styrke</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["", "Mild", "Mild-Medium", "Medium", "Medium-Full", "Full"].map(s => (
            <button key={s} onClick={() => setFilterStrength(s)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${filterStrength === s ? "#2c1810" : "#e8dcc8"}`, background: filterStrength === s ? "#2c1810" : "#fff", color: filterStrength === s ? "#f4ede0" : "#6b5a45", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{s || "Alle"}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Land</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["", "Cuba", "Dominican Republic", "Nicaragua", "Honduras"].map(c => (
            <button key={c} onClick={() => setFilterCountry(c)} style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${filterCountry === c ? "#2c1810" : "#e8dcc8"}`, background: filterCountry === c ? "#2c1810" : "#fff", color: filterCountry === c ? "#f4ede0" : "#6b5a45", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{c || "Alle"}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={labelStyle}>Merke</div>
          {filterBrand && <button onClick={() => setFilterBrand("")} style={{ background: "none", border: "none", color: "#c8a04a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{filterBrand} ×</button>}
        </div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#a0886a", pointerEvents: "none" }}><IcoSearch /></span>
          <input value={brandSearch} onChange={e => setBrandSearch(e.target.value)} placeholder="Søk etter merke..." style={{ ...inputStyle, padding: "9px 12px 9px 32px", fontSize: 13 }} />
        </div>
        <div style={{ maxHeight: 180, overflowY: "auto", border: "1.5px solid #e8dcc8", borderRadius: 10, background: "#fff" }}>
          {["", ...visibleBrands].map((b, i) => (
            <button key={b || "__all__"} onClick={() => setFilterBrand(b)} style={{ width: "100%", padding: "9px 14px", background: filterBrand === b ? "#2c1810" : "transparent", color: filterBrand === b ? "#f4ede0" : "#6b5a45", border: "none", textAlign: "left", fontSize: 13, fontWeight: filterBrand === b ? 700 : 500, cursor: "pointer", borderBottom: i < visibleBrands.length ? "1px solid #f0e8d8" : "none", fontFamily: "inherit" }}>{b || "Alle merker"}</button>
          ))}
        </div>
      </div>
      <button onClick={onClose} style={{ width: "100%", background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Vis resultater</button>
    </>
  );

  if (!isMobile) {
    // Desktop: inline sidebar panel
    return (
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8dcc8", padding: "20px", position: "sticky", top: 80, maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
        {content}
      </div>
    );
  }
  if (!open) return null;
  return <BottomSheet onClose={onClose}><div style={{ padding: "0 18px" }}>{content}</div></BottomSheet>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export function CigarApp() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [cigarDB, setCigarDB] = useState([]);
  const [cigarsLoading, setCigarsLoading] = useState(true);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = windowWidth >= 768;
  const [lang, setLang] = useState(() => localStorage.getItem("cb_lang") || "no");
  const toggleLang = () => { const nl = lang === "no" ? "en" : "no"; setLang(nl); localStorage.setItem("cb_lang", nl); window.__lang = nl; };
  window.__lang = lang;

  const T = {
    appSub: lang === "en" ? "Your personal cigar log" : "Din personlige sigarlogg",
    logout: lang === "en" ? "Out" : "Ut",
    database: lang === "en" ? "Database" : "Database",
    experiences: lang === "en" ? "Experiences" : "Erfaringer",
    humidor: lang === "en" ? "Humidor" : "Humidor",
    search: lang === "en" ? "Search brand, name, flavour..." : "Søk merke, navn, smak...",
    showing: lang === "en" ? "Showing" : "Viser",
    of: lang === "en" ? "of" : "av",
    reset: lang === "en" ? "Reset ×" : "Nullstill ×",
    noResults: lang === "en" ? "No cigars found" : "Ingen sigarer funnet",
    smoked: lang === "en" ? "Smoked" : "Røykt",
    avg: lang === "en" ? "Avg" : "Snitt",
    brands: lang === "en" ? "Brands" : "Merker",
    topCountry: lang === "en" ? "Top country" : "Toppland",
    noExp: lang === "en" ? "No experiences yet" : "Ingen erfaringer ennå",
    noExpSub: lang === "en" ? "Tap 'Experience' on a cigar in the database" : "Trykk «Erfaring» på en sigar i databasen",
    goToDb: lang === "en" ? "Go to database →" : "Gå til database →",
    myHumidor: lang === "en" ? "My Humidor" : "Min Humidor",
    humidorSub: lang === "en" ? "Cigars you have right now" : "Sigarer du har liggende nå",
    total: lang === "en" ? "total" : "totalt",
    humidorEmpty: lang === "en" ? "Humidor is empty" : "Humidoren er tom",
    humidorEmptySub: lang === "en" ? "Tap '📦 Humidor' on a cigar in the database" : "Trykk «📦 Humidor» på en sigar i databasen",
    brand: lang === "en" ? "Brand & Name" : "Merke & Navn",
    size: lang === "en" ? "Size" : "Størrelse",
    strength: lang === "en" ? "Strength" : "Styrke",
    country: lang === "en" ? "Country" : "Land",
    count: lang === "en" ? "Count" : "Antall",
    flavours: lang === "en" ? "Flavours" : "Smaker",
    price: lang === "en" ? "Price" : "Pris",
    score: lang === "en" ? "Score" : "Score",
    size2: lang === "en" ? "Size" : "Størrelse",
    length: lang === "en" ? "Length" : "Lengde",
    ring: lang === "en" ? "Ring Gauge" : "Ring Gauge",
    wrapper: lang === "en" ? "Wrapper" : "Wrapper",
    addHumidor: lang === "en" ? "📦 Add to humidor" : "📦 Legg i humidor",
    addExp: lang === "en" ? "Experience" : "Erfaring",
    filterTitle: lang === "en" ? "Filter" : "Filter",
    filterReset: lang === "en" ? "Reset" : "Nullstill",
    allStrengths: lang === "en" ? "All" : "Alle",
    allCountries: lang === "en" ? "All" : "Alle",
    allBrands: lang === "en" ? "All brands" : "Alle merker",
    searchBrand: lang === "en" ? "Search brand..." : "Søk etter merke...",
    showResults: lang === "en" ? "Show results" : "Vis resultater",
    strengthLabel: lang === "en" ? "Strength" : "Styrke",
    countryLabel: lang === "en" ? "Country" : "Land",
    brandLabel: lang === "en" ? "Brand" : "Merke",
  };

  // Load cigar database from API
  useEffect(() => {
    API.getCigars().then(data => {
      setCigarDB(Array.isArray(data) ? data : []);
      setCigarsLoading(false);
    }).catch(() => setCigarsLoading(false));
  }, []);

  // Restore session from localStorage
  useEffect(() => {
    const saved = getSession();
    if (saved) { setUser(saved); }
    setLoadingUser(false);
  }, []);

  const handleLogin = (username) => {
    setSession(username);
    setUser(username);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setExperiences([]);
    setStock({});
  };

  // ── PER-USER DATA ──
  const [tab, setTab] = useState("database");
  const [search, setSearch] = useState("");
  const [filterStrength, setFilterStrength] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCigar, setSelectedCigar] = useState(null);
  const [addingExp, setAddingExp] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [stock, setStock] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load user data from server when logged in
  useEffect(() => {
    if (!user) return;
    setDataLoaded(false);
    API.getData(user).then(data => {
      setExperiences(data.experiences || []);
      setStock(data.stock || {});
      setDataLoaded(true);
    });
  }, [user]);

  // Auto-save to server whenever experiences or stock changes
  useEffect(() => {
    if (!user || !dataLoaded) return;
    API.saveData(user, experiences, stock).catch(() => {});
  }, [experiences, stock, user, dataLoaded]);

  const filtered = useMemo(() => {
    let list = cigarDB;
    if (search) { const q = search.toLowerCase(); list = list.filter(c => c.brand.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.flavors.some(f => f.includes(q))); }
    if (filterStrength) list = list.filter(c => c.strength === filterStrength);
    if (filterCountry) list = list.filter(c => c.country === filterCountry);
    if (filterBrand) list = list.filter(c => c.brand === filterBrand);
    return list;
  }, [search, filterStrength, filterCountry, filterBrand, cigarDB]);

  const addToStock = (cigar) => setStock(s => ({ ...s, [cigar.id]: (s[cigar.id] || 0) + 1 }));
  const adjustStock = (id, delta) => setStock(s => { const n = Math.max(0, (s[id] || 0) + delta); if (n === 0) { const copy = { ...s }; delete copy[id]; return copy; } return { ...s, [id]: n }; });
  const stockItems = cigarDB.filter(c => stock[c.id] > 0);
  const totalStock = Object.values(stock).reduce((a, b) => a + b, 0);

  const saveExp = (entry) => {
    let updated;
    if (editingEntry) {
      updated = experiences.map(e => e.id === editingEntry.id ? { ...entry, id: editingEntry.id } : e);
      setEditingEntry(null);
    } else {
      updated = [entry, ...experiences];
    }
    setExperiences(updated);
    API.saveData(user, updated, stock);
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    // Always reload fresh data from DB when switching to data tabs
    if (newTab === "experiences" || newTab === "stock") {
      API.getData(user).then(data => {
        setExperiences(data.experiences || []);
        setStock(data.stock || {});
      }).catch(() => {});
    }
  };

  const avgScore = experiences.length ? (experiences.reduce((s, e) => s + (e.myScore || 0), 0) / experiences.length).toFixed(1) : "–";
  const hasFilter = filterStrength || filterCountry || filterBrand;

  const TABS = [
    { id: "database",    Icon: IcoCigar,     label: T.database,    badge: null },
    { id: "experiences", Icon: IcoNotes,     label: T.experiences, badge: experiences.length || null },
    { id: "stock",       Icon: IcoBriefcase, label: T.humidor,     badge: totalStock || null },
  ];

  if (loadingUser || cigarsLoading) return (
    <div style={{ minHeight: "100vh", background: "#2c1810", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", color: "#c8a04a", fontSize: 18 }}>
      🚬 Laster...
    </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  // ── DESKTOP LAYOUT ──
  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4ede0", fontFamily: "'Georgia','Times New Roman',serif" }}>
        {/* Top nav bar */}
        <div style={{ background: "#2c1810", color: "#f4ede0", padding: "0 32px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", gap: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", marginRight: 32 }}>
              <AppSwitcher current="cigar" primaryColor="#2c1810" accentColor="#c8a04a" />
            </div>
            <div style={{ display: "flex", flex: 1 }}>
              {TABS.map(({ id, Icon, label, badge }) => {
                const active = tab === id;
                return (
                  <button key={id} onClick={() => handleTabSwitch(id)} style={{ background: "none", border: "none", color: active ? "#c8a04a" : "#7a6050", cursor: "pointer", padding: "16px 20px", fontSize: 14, fontWeight: active ? 700 : 500, borderBottom: active ? "2px solid #c8a04a" : "2px solid transparent", display: "flex", alignItems: "center", gap: 7, transition: "color 0.2s", fontFamily: "inherit", position: "relative" }}>
                    <Icon size={18} />{label}
                    {badge !== null && <span style={{ background: "#c8a04a", color: "#2c1810", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{badge}</span>}
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
              <span style={{ fontSize: 13, color: "#a0886a", display: "flex", alignItems: "center", gap: 6 }}><IcoUser /> {user}</span>
              <button onClick={toggleLang} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#f4ede0", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                {lang === "no" ? "🇬🇧 EN" : "🇳🇴 NO"}
              </button>
              <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#f4ede0", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}><IcoLogout /> {T.logout}</button>
            </div>
          </div>
        {tab === "database" && (
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", gap: 8, padding: "10px 32px 12px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(244,237,224,0.5)", pointerEvents: "none" }}><IcoSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Søk merke, navn, smak..." style={{ width: "100%", padding: "10px 12px 10px 34px", border: "none", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.1)", color: "#f4ede0", boxSizing: "border-box", outline: "none" }} />
            </div>
            {hasFilter && <button onClick={() => { setFilterStrength(""); setFilterCountry(""); setFilterBrand(""); }} style={{ background: "#c8a04a", border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", color: "#2c1810", fontSize: 12, fontWeight: 700, fontFamily: "inherit" }}>Nullstill ×</button>}
          </div>
        )}
        </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>

          {/* DATABASE TAB — sidebar layout */}
          {tab === "database" && (
            <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
              <div>
                <FilterPanel isMobile={false} open filterStrength={filterStrength} setFilterStrength={setFilterStrength} filterCountry={filterCountry} setFilterCountry={setFilterCountry} filterBrand={filterBrand} setFilterBrand={setFilterBrand} cigarDB={cigarDB} onClose={() => {}} />
              </div>
            </div>
          )}

          {/* EXPERIENCES TAB */}
          {tab === "experiences" && (
            <div style={{ maxWidth: 900 }}>
              {experiences.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                  {[["Røykt", experiences.length, "🚬"], ["Snittkarakter", avgScore, "⭐"], ["Unike merker", new Set(experiences.map(e => e.cigar.brand)).size, "🏷️"], ["Toppland", (() => { const m = {}; experiences.forEach(e => m[e.cigar.country] = (m[e.cigar.country]||0)+1); return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]?.split(" ")[0] || "–"; })(), "🌍"]].map(([label, val, emoji]) => (
                    <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8dcc8", padding: "16px 18px", textAlign: "center" }}>
                      <div style={{ fontSize: 24 }}>{emoji}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: "#2c1810", lineHeight: 1.1 }}>{val}</div>
                      <div style={{ fontSize: 11, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              )}
              {experiences.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                  <div style={{ fontSize: 50, marginBottom: 14 }}>📝</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#2c1810", marginBottom: 8 }}>Ingen erfaringer ennå</div>
                  <div style={{ fontSize: 14, color: "#a0886a", marginBottom: 24 }}>Trykk «Erfaring» på en sigar i databasen</div>
                  <button onClick={() => handleTabSwitch("database")} style={{ background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gå til database →</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
                  {experiences.map(entry => <ExperienceCard key={entry.id} entry={entry} onDelete={(id) => setExperiences(h => h.filter(e => e.id !== id))} onEdit={(e) => { setEditingEntry(e); setAddingExp(e.cigar); }} />)}
                </div>
              )}
            </div>
          )}

          {/* STOCK TAB */}
          {tab === "stock" && (
            <div style={{ maxWidth: 900 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2c1810" }}>Min Humidor</h2>
                  <div style={{ fontSize: 13, color: "#a0886a", marginTop: 2 }}>Sigarer du har liggende nå</div>
                </div>
                {totalStock > 0 && <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8dcc8", padding: "10px 20px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#c8a04a", lineHeight: 1 }}>{totalStock}</div><div style={{ fontSize: 10, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.06em" }}>totalt</div></div>}
              </div>
              {stockItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 20px" }}>
                  <div style={{ fontSize: 50, marginBottom: 14 }}>📦</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#2c1810", marginBottom: 8 }}>Humidoren er tom</div>
                  <div style={{ fontSize: 14, color: "#a0886a", marginBottom: 24 }}>Trykk «📦 Humidor» på en sigar i databasen</div>
                  <button onClick={() => handleTabSwitch("database")} style={{ background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gå til database →</button>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8dcc8", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#2c1810", color: "#f4ede0" }}>
                        {["Merke & Navn", "Størrelse", "Styrke", "Land", "Antall", ""].map(h => <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {stockItems.map((cigar, i) => (
                        <tr key={cigar.id} style={{ borderBottom: "1px solid #f0e8d8", background: i % 2 === 0 ? "#fff" : "#faf6f0" }}>
                          <td style={{ padding: "14px 16px" }}><div style={{ fontSize: 10, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>{cigar.brand}</div><div style={{ fontSize: 15, fontWeight: 700, color: "#2c1810" }}>{cigar.name}</div></td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b5a45" }}><div>{cigar.size}</div><div style={{ fontSize: 11, color: "#a0886a" }}>{cigar.length} · {cigar.ring}</div></td>
                          <td style={{ padding: "14px 16px" }}><StrengthBadge strength={cigar.strength} /></td>
                          <td style={{ padding: "14px 16px", fontSize: 13, color: "#6b5a45" }}>{cigar.country}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                              <button onClick={() => adjustStock(cigar.id, -1)} style={{ width: 34, height: 34, background: "#f4ede0", border: "1.5px solid #e8dcc8", borderRadius: "8px 0 0 8px", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#2c1810", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                              <span style={{ minWidth: 36, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#2c1810", background: "#faf6f0", border: "1.5px solid #e8dcc8", borderLeft: "none", borderRight: "none" }}>{stock[cigar.id]}</span>
                              <button onClick={() => adjustStock(cigar.id, 1)} style={{ width: 34, height: 34, background: "#2c1810", border: "none", borderRadius: "0 8px 8px 0", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#f4ede0", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <button onClick={() => adjustStock(cigar.id, -stock[cigar.id])} style={{ background: "#fbe9e7", border: "none", borderRadius: 7, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b71c1c" }}><IcoTrash /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop modals */}
        {selectedCigar && !addingExp && <CigarDetail cigar={selectedCigar} onClose={() => setSelectedCigar(null)} onAddExperience={(c) => { setSelectedCigar(null); setAddingExp(c); }} onAddToStock={(c) => { addToStock(c); setSelectedCigar(null); }} isMobile={false} lang={lang} />}
        {addingExp && <AddExperienceSheet cigar={addingExp} onClose={() => { setAddingExp(null); setEditingEntry(null); }} onSave={saveExp} isMobile={false} existing={editingEntry} />}
      </div>
    );
  }

  // ── MOBILE LAYOUT ──
  return (
    <div style={{ minHeight: "100vh", background: "#f4ede0", fontFamily: "'Georgia','Times New Roman',serif", paddingBottom: 70 }}>
      <div style={{ background: "#2c1810", color: "#f4ede0", padding: `${window.navigator.standalone ? "60px" : "8px"} 14px 22px`, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AppSwitcher current="cigar" primaryColor="#2c1810" accentColor="#c8a04a" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#a0886a" }}>{user}</span>
            <button onClick={toggleLang} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#f4ede0", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
              {lang === "no" ? "🇬🇧" : "🇳🇴"}
            </button>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, padding: "6px 10px", color: "#f4ede0", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}><IcoLogout /> {T.logout}</button>
          </div>
        </div>
        {tab === "database" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(244,237,224,0.5)", pointerEvents: "none" }}><IcoSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={T.search} style={{ width: "100%", padding: "10px 12px 10px 34px", border: "none", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.1)", color: "#f4ede0", boxSizing: "border-box", outline: "none" }} />
            </div>
            <button onClick={() => setFilterOpen(true)} style={{ background: hasFilter ? "#c8a04a" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, minWidth: 42, cursor: "pointer", color: hasFilter ? "#2c1810" : "#f4ede0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <IcoFilter />
              {hasFilter && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "#2c1810", borderRadius: "50%", border: "1.5px solid #c8a04a" }} />}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 12px" }}>
        {tab === "database" && (
          <>
            <div style={{ fontSize: 12, color: "#8b7355", marginBottom: 11, display: "flex", justifyContent: "space-between" }}>
              <span>Viser <strong>{filtered.length}</strong> av {cigarDB.length}</span>
              {hasFilter && <button onClick={() => { setFilterStrength(""); setFilterCountry(""); setFilterBrand(""); }} style={{ background: "none", border: "none", color: "#c8a04a", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Nullstill ×</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {filtered.map(c => <CigarCard key={c.id} cigar={c} onSelect={setSelectedCigar} onAddExperience={setAddingExp} onAddToStock={addToStock} isDesktop={false} />)}
            </div>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: "#a0886a" }}><div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div><div style={{ fontSize: 16, fontWeight: 600 }}>Ingen sigarer funnet</div></div>}
          </>
        )}

        {tab === "experiences" && (
          <>
            {experiences.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["Røykt", experiences.length, "🚬"], ["Snitt", avgScore, "⭐"], ["Merker", new Set(experiences.map(e => e.cigar.brand)).size, "🏷️"], ["Toppland", (() => { const m = {}; experiences.forEach(e => m[e.cigar.country] = (m[e.cigar.country]||0)+1); return Object.entries(m).sort((a,b)=>b[1]-a[1])[0]?.[0]?.split(" ")[0] || "–"; })(), "🌍"]].map(([label, val, emoji]) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8dcc8", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 20 }}>{emoji}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#2c1810", lineHeight: 1.1 }}>{val}</div>
                    <div style={{ fontSize: 10, color: "#a0886a", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
            {experiences.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 20px" }}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#2c1810", marginBottom: 6 }}>Ingen erfaringer ennå</div>
                <div style={{ fontSize: 13, color: "#a0886a", marginBottom: 20 }}>Trykk «Erfaring» på en sigar i databasen</div>
                <button onClick={() => handleTabSwitch("database")} style={{ background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gå til database →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {experiences.map(entry => <ExperienceCard key={entry.id} entry={entry} onDelete={(id) => setExperiences(h => h.filter(e => e.id !== id))} onEdit={(e) => { setEditingEntry(e); setAddingExp(e.cigar); }} />)}
              </div>
            )}
          </>
        )}

        {tab === "stock" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div><div style={{ fontSize: 17, fontWeight: 800, color: "#2c1810" }}>Min Humidor</div><div style={{ fontSize: 12, color: "#a0886a" }}>Sigarer du har liggende nå</div></div>
              {totalStock > 0 && <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8dcc8", padding: "6px 14px", textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: "#c8a04a", lineHeight: 1 }}>{totalStock}</div><div style={{ fontSize: 9, color: "#a0886a", textTransform: "uppercase" }}>totalt</div></div>}
            </div>
            {stockItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 20px" }}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>📦</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#2c1810", marginBottom: 6 }}>Humidoren er tom</div>
                <div style={{ fontSize: 13, color: "#a0886a", marginBottom: 20 }}>Trykk «📦 Humidor» på en sigar i databasen</div>
                <button onClick={() => handleTabSwitch("database")} style={{ background: "#2c1810", color: "#f4ede0", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>Gå til database →</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {stockItems.map(cigar => (
                  <div key={cigar.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8dcc8", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 1px 4px rgba(44,24,16,0.05)" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "#a0886a", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{cigar.brand}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#2c1810", lineHeight: 1.2 }}>{cigar.name}</div>
                      <div style={{ fontSize: 11, color: "#a0886a", marginTop: 1 }}>{cigar.size} · {cigar.length} · {cigar.ring}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <button onClick={() => adjustStock(cigar.id, -1)} style={{ width: 38, height: 38, background: "#f4ede0", border: "1.5px solid #e8dcc8", borderRadius: "9px 0 0 9px", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#2c1810", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ minWidth: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#2c1810", background: "#faf6f0", border: "1.5px solid #e8dcc8", borderLeft: "none", borderRight: "none" }}>{stock[cigar.id]}</span>
                      <button onClick={() => adjustStock(cigar.id, 1)} style={{ width: 38, height: 38, background: "#2c1810", border: "none", borderRadius: "0 9px 9px 0", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#f4ede0", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <button onClick={() => adjustStock(cigar.id, -stock[cigar.id])} style={{ background: "#fbe9e7", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b71c1c", flexShrink: 0 }}><IcoTrash /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#2c1810", display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        {TABS.map(({ id, Icon, label, badge }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => handleTabSwitch(id)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 4px 9px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "#c8a04a" : "#6a5040", position: "relative", WebkitTapHighlightColor: "transparent" }}>
              {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2.5, background: "#c8a04a", borderRadius: "0 0 3px 3px" }} />}
              <div style={{ position: "relative" }}><Icon size={22} />{badge !== null && <span style={{ position: "absolute", top: -5, right: -7, background: "#c8a04a", color: "#2c1810", borderRadius: 10, padding: "1px 5px", fontSize: 9, fontWeight: 800, lineHeight: 1.5 }}>{badge}</span>}</div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile modals */}
      {selectedCigar && !addingExp && <CigarDetail cigar={selectedCigar} onClose={() => setSelectedCigar(null)} onAddExperience={(c) => { setSelectedCigar(null); setAddingExp(c); }} onAddToStock={(c) => { addToStock(c); setSelectedCigar(null); }} isMobile lang={lang} />}
      {addingExp && <AddExperienceSheet cigar={addingExp} onClose={() => { setAddingExp(null); setEditingEntry(null); }} onSave={saveExp} isMobile existing={editingEntry} />}
      <FilterPanel isMobile open={filterOpen} onClose={() => setFilterOpen(false)} filterStrength={filterStrength} setFilterStrength={setFilterStrength} filterCountry={filterCountry} setFilterCountry={setFilterCountry} filterBrand={filterBrand} setFilterBrand={setFilterBrand} cigarDB={cigarDB} />
    </div>
  );
}
