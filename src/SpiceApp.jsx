import { useState, useMemo, useEffect } from "react";



// ─── API HELPERS ─────────────────────────────────────────────────────────────
const API = {
  async auth(action, username, password) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, username, password, app: "spice" }),
    });
    return res.json();
  },
  async getSpices() {
    const res = await fetch("/api/spice-spices");
    return res.json();
  },
  async getData(username) {
    const res = await fetch(`/api/data?username=${encodeURIComponent(username)}&app=spice`);
    return res.json();
  },
  async saveData(username, notes, pantry) {
    await fetch("/api/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, notes, pantry, app: "spice" }),
    });
  },
};

function getSession() { try { return localStorage.getItem("sb_session") || null; } catch { return null; } }
function setSession(u) { try { localStorage.setItem("sb_session", u); } catch {} }
function clearSession() { try { localStorage.removeItem("sb_session"); } catch {} }

// ─── ICONS ───────────────────────────────────────────────────────────────────
const IcoSpice = ({ size = 22 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2c-1.5 0-3 .5-3 2v2c0 1 .5 2 1 3l-2 8h8l-2-8c.5-1 1-2 1-3V4c0-1.5-1.5-2-3-2z"/><path d="M9 17h6"/></svg>);
const IcoPantry = ({ size = 22 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M9 4v5"/><path d="M15 4v5"/></svg>);
const IcoNotes = ({ size = 22 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>);
const IcoStar = (filled, size = 16) => (<svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>);
const IcoSearch = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>);
const IcoClose = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);
const IcoTrash = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>);
const IcoEdit = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>);
const IcoFilter = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>);
const IcoUser = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>);
const IcoLogout = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>);
const IcoPlus = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const heatColors = {
  "Ingen":    { bg: "#e8f5e9", text: "#2e7d32", dot: "#66bb6a" },
  "Mild":     { bg: "#f9fbe7", text: "#558b2f", dot: "#aed581" },
  "Medium":   { bg: "#fff8e1", text: "#ef6c00", dot: "#ffb74d" },
  "Sterk":    { bg: "#fff3e0", text: "#bf360c", dot: "#ff8a65" },
  "Veldig sterk": { bg: "#fbe9e7", text: "#b71c1c", dot: "#ef5350" },
};

const HeatBadge = ({ heat }) => {
  const c = heatColors[heat] || heatColors["Mild"];
  return (
    <span style={{ background: c.bg, color: c.text, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />{heat}
    </span>
  );
};

const labelStyle = { fontSize: 11, color: "#4e5a28", display: "block", marginBottom: 7, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" };
const inputStyle = { width: "100%", padding: "12px 14px", border: "1.5px solid #e8d8a0", borderRadius: 10, fontSize: 15, color: "#2d3a12", background: "#f4f7eb", boxSizing: "border-box", outline: "none" };

function StarRating({ value, onChange, max = 10 }) {
  const [hovered, setHovered] = useState(null);
  const display = hovered ?? value;
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
      {Array.from({ length: max }, (_, i) => (
        <button key={i} onClick={() => onChange && onChange(i + 1)}
          onMouseEnter={() => onChange && setHovered(i + 1)}
          onMouseLeave={() => onChange && setHovered(null)}
          style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", color: i < display ? "#8a9a2a" : "#c0d070", padding: "2px", lineHeight: 1, minWidth: 22, minHeight: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {IcoStar(i < display)}
        </button>
      ))}
      {value > 0 && <span style={{ marginLeft: 4, fontSize: 13, color: "#5a6e2a", fontWeight: 700 }}>{value}/10</span>}
    </div>
  );
}

// ─── AUTH SCREEN ──────────────────────────────────────────────────────────────
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #3b4a1e 0%, #526929 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Georgia','Times New Roman',serif" }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🌿</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#2d3a12" }}>SpiceBriefcase</div>
          <div style={{ fontSize: 12, color: "#727d3e", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 4 }}>Din personlige krydderlogg</div>
        </div>
        <div style={{ display: "flex", background: "#f4f7eb", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          {[["login", "Logg inn"], ["register", "Registrer"]].map(([m, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setError(""); }}
              style={{ flex: 1, padding: "9px", border: "none", borderRadius: 9, background: mode === m ? "#3b4a1e" : "transparent", color: mode === m ? "#f4f7eb" : "#727d3e", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              {lbl}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div><label style={labelStyle}>Brukernavn</label>
            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="ditt_brukernavn" style={inputStyle} onKeyDown={e => e.key === "Enter" && handle()} /></div>
          <div><label style={labelStyle}>Passord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={e => e.key === "Enter" && handle()} /></div>
          {error && <div style={{ background: "#fbe9e7", color: "#b71c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>{error}</div>}
          <button onClick={handle} disabled={loading}
            style={{ background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer", marginTop: 4, opacity: loading ? 0.7 : 1, fontFamily: "inherit" }}>
            {loading ? "Vennligst vent..." : mode === "login" ? "Logg inn" : "Opprett konto"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── OVERLAYS ─────────────────────────────────────────────────────────────────
function BottomSheet({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,0,0.65)", zIndex: 1000, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "20px 20px 0 0", width: "100%", maxHeight: "92vh", overflow: "auto", paddingBottom: 32 }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 6px" }}>
          <div style={{ width: 36, height: 4, background: "#c8d870", borderRadius: 4 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

function Modal({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,10,0,0.65)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function Overlay({ isMobile, onClose, children }) {
  if (isMobile) return <BottomSheet onClose={onClose}><div style={{ padding: "0 18px" }}>{children}</div></BottomSheet>;
  return <Modal onClose={onClose}>{children}</Modal>;
}

// ─── SPICE CARD ───────────────────────────────────────────────────────────────
function SpiceCard({ spice, onSelect, onAddNote, onAddToPantry, isDesktop, lang }) {
  const desc = (lang === "no" ? spice.description_no : spice.description_en) || spice.description_en || spice.description_no || "";
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8d8a0", overflow: "hidden", boxShadow: "0 1px 4px rgba(74,48,0,0.07)", transition: "box-shadow 0.2s" }}
      onMouseEnter={e => isDesktop && (e.currentTarget.style.boxShadow = "0 6px 20px rgba(74,48,0,0.15)")}
      onMouseLeave={e => isDesktop && (e.currentTarget.style.boxShadow = "0 1px 4px rgba(74,48,0,0.07)")}>
      <div onClick={() => onSelect(spice)} style={{ padding: isDesktop ? "16px 18px 12px" : "15px 15px 11px", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{spice.category}</div>
            <div style={{ fontSize: isDesktop ? 17 : 16, fontWeight: 700, color: "#2d3a12", lineHeight: 1.2, marginTop: 1 }}>{spice.name}</div>
            {spice.also_known_as && <div style={{ fontSize: 11, color: "#727d3e", marginTop: 1, fontStyle: "italic" }}>{spice.also_known_as}</div>}
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 9, color: "#727d3e", textTransform: "uppercase" }}>{lang === "no" ? "Opprinnelse" : "Origin"}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#8a9a2a", lineHeight: 1.2, maxWidth: 90, textAlign: "right" }}>{spice.origin}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
          <HeatBadge heat={spice.heat} />
          <span style={{ background: "#eef3d0", color: "#526929", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{spice.flavor_profile}</span>
        </div>
        <div style={{ fontSize: 12, color: "#606b3a", marginTop: 8, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {desc}
        </div>
        {spice.uses && (
          <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
            {spice.uses.slice(0, 3).map(u => (
              <span key={u} style={{ fontSize: 10, background: "#f4f7eb", color: "#5a6e2a", border: "1px solid #e8d8a0", padding: "2px 7px", borderRadius: 10 }}>{u}</span>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: "flex", borderTop: "1px solid #f5e8a0" }}>
        <button onClick={() => onAddNote(spice)}
          style={{ flex: 1, background: "#3b4a1e", color: "#f4f7eb", border: "none", padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <IcoNotes size={14} /> {lang === "no" ? "Notat" : "Note"}
        </button>
        <button onClick={() => onAddToPantry(spice)}
          style={{ flex: 1, background: "#8a9a2a", color: "#2d3a12", border: "none", borderLeft: "1px solid rgba(74,48,0,0.15)", padding: "12px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          🫙 {lang === "no" ? "Krydderhylle" : "Pantry"}
        </button>
      </div>
    </div>
  );
}

// ─── SPICE DETAIL ─────────────────────────────────────────────────────────────
function SpiceDetail({ spice, onClose, onAddNote, onAddToPantry, isMobile, lang }) {
  if (!spice) return null;
  const desc = (lang === "no" ? spice.description_no : spice.description_en) || "";
  const t = lang === "no"
    ? { origin: "Opprinnelse", heat: "Styrke", flavor: "Smaksprofil", uses: "Bruksområder", pairings: "Passer til", addPantry: "🫙 Legg i krydderhylle", addNote: "Skriv notat" }
    : { origin: "Origin", heat: "Heat", flavor: "Flavour profile", uses: "Uses", pairings: "Pairs with", addPantry: "🫙 Add to pantry", addNote: "Write note" };
  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{spice.category}</div>
          <h2 style={{ margin: "3px 0 0", fontSize: 22, fontWeight: 800, color: "#2d3a12", lineHeight: 1.15 }}>{spice.name}</h2>
          {spice.also_known_as && <div style={{ fontSize: 12, color: "#727d3e", fontStyle: "italic", marginTop: 2 }}>{spice.also_known_as}</div>}
        </div>
        <button onClick={onClose} style={{ background: "#f4f7eb", border: "none", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#2d3a12", flexShrink: 0, marginLeft: 10 }}><IcoClose /></button>
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 12, flexWrap: "wrap" }}>
        <HeatBadge heat={spice.heat} />
        <span style={{ background: "#eef3d0", color: "#526929", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{spice.flavor_profile}</span>
      </div>
      <p style={{ color: "#434f20", lineHeight: 1.65, fontSize: 14, margin: "0 0 14px" }}>{desc}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        {[[t.origin, spice.origin], [t.heat, spice.heat], [t.flavor, spice.flavor_profile], ["Botanisk", spice.botanical || "—"]].map(([label, val]) => (
          <div key={label} style={{ background: "#f4f7eb", borderRadius: 8, padding: "9px 12px" }}>
            <div style={{ fontSize: 10, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontWeight: 700, color: "#2d3a12", fontSize: 13, marginTop: 1 }}>{val}</div>
          </div>
        ))}
      </div>
      {spice.uses && spice.uses.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t.uses}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {spice.uses.map(u => <span key={u} style={{ background: "#f4f7eb", color: "#526929", border: "1px solid #e8d8a0", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{u}</span>)}
          </div>
        </div>
      )}
      {spice.pairings && spice.pairings.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{t.pairings}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {spice.pairings.map(p => <span key={p} style={{ background: "#eef3d0", color: "#526929", border: "1px solid #e8d090", padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{p}</span>)}
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => { onAddToPantry(spice); onClose(); }}
          style={{ flex: 1, background: "#8a9a2a", color: "#2d3a12", border: "none", borderRadius: 12, padding: "14px 8px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>{t.addPantry}</button>
        <button onClick={() => { onAddNote(spice); onClose(); }}
          style={{ flex: 1, background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "14px 8px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <IcoNotes size={16} /> {t.addNote}
        </button>
      </div>
    </>
  );
  return <Overlay isMobile={isMobile} onClose={onClose}>{content}</Overlay>;
}

// ─── ADD NOTE SHEET ───────────────────────────────────────────────────────────
function AddNoteSheet({ spice, onClose, onSave, isMobile, existing }) {
  const [form, setForm] = useState({
    date: existing?.date || new Date().toISOString().split("T")[0],
    myScore: existing?.myScore || 0,
    notes: existing?.notes || "",
    dish: existing?.dish || "",
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const lang = window.__lang || "no";
  const t = lang === "no"
    ? { title: "Kryddernotat", date: "Dato brukt", score: "Min score (1–10)", notes: "Notater", notesPlaceholder: "Smak, bruk, tips og triks...", dish: "Rett brukt i", dishPlaceholder: "Kyllingsuppe, pizza, lammerett...", cancel: "Avbryt", save: "Lagre notat" }
    : { title: "Spice note", date: "Date used", score: "My score (1–10)", notes: "Notes", notesPlaceholder: "Taste, use, tips and tricks...", dish: "Dish used in", dishPlaceholder: "Chicken soup, pizza, lamb dish...", cancel: "Cancel", save: "Save note" };
  const content = (
    <>
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{t.title}</div>
        <h3 style={{ margin: "3px 0 0", fontSize: 20, fontWeight: 800, color: "#2d3a12", lineHeight: 1.2 }}>{spice.name}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div><label style={labelStyle}>{t.date}</label><input type="date" value={form.date} onChange={e => set("date", e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>{t.score}</label><StarRating value={form.myScore} onChange={v => set("myScore", v)} /></div>
        <div><label style={labelStyle}>{t.notes}</label>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder={t.notesPlaceholder} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
        </div>
        <div><label style={labelStyle}>{t.dish}</label><input value={form.dish} onChange={e => set("dish", e.target.value)} placeholder={t.dishPlaceholder} style={inputStyle} /></div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button onClick={onClose} style={{ flex: 1, background: "#f4f7eb", color: "#2d3a12", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{t.cancel}</button>
        <button onClick={() => { onSave({ spice, ...form, id: existing?.id || Date.now() }); onClose(); }}
          style={{ flex: 2, background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "14px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.save}</button>
      </div>
    </>
  );
  return <Overlay isMobile={isMobile} onClose={onClose}>{content}</Overlay>;
}

// ─── NOTE CARD ────────────────────────────────────────────────────────────────
function NoteCard({ entry, onDelete, onEdit }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8d8a0", padding: "15px", boxShadow: "0 1px 4px rgba(74,48,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: "#727d3e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{entry.spice.category}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#2d3a12", lineHeight: 1.2 }}>{entry.spice.name}</div>
          <div style={{ fontSize: 11, color: "#727d3e", marginTop: 1 }}>{entry.date}</div>
        </div>
        <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
          <button onClick={() => onEdit(entry)} style={{ background: "#f4f7eb", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#526929" }}><IcoEdit /></button>
          <button onClick={() => onDelete(entry.id)} style={{ background: "#fbe9e7", border: "none", borderRadius: 8, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b71c1c" }}><IcoTrash /></button>
        </div>
      </div>
      <div style={{ marginTop: 10 }}><StarRating value={entry.myScore} max={10} /></div>
      {entry.notes && (
        <div style={{ marginTop: 10, background: "#f4f7eb", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#434f20", lineHeight: 1.6, borderLeft: "3px solid #c8920a" }}>
          {entry.notes}
        </div>
      )}
      {entry.dish && (
        <div style={{ marginTop: 8 }}>
          <span style={{ fontSize: 11, background: "#eef3d0", color: "#526929", padding: "3px 10px", borderRadius: 20 }}>🍳 {entry.dish}</span>
        </div>
      )}
    </div>
  );
}

// ─── FILTER PANEL ─────────────────────────────────────────────────────────────
function FilterPanel({ isMobile, open, onClose, filterHeat, setFilterHeat, filterCategory, setFilterCategory, filterOrigin, setFilterOrigin, spiceDB = [], lang }) {
  const [originSearch, setOriginSearch] = useState("");
  const categories = [...new Set(spiceDB.map(s => s.category))].sort();
  const origins = [...new Set(spiceDB.map(s => s.origin))].sort().filter(o => o.toLowerCase().includes(originSearch.toLowerCase()));
  const heats = ["Ingen", "Mild", "Medium", "Sterk", "Veldig sterk"];
  const reset = () => { setFilterHeat(""); setFilterCategory(""); setFilterOrigin(""); };
  const t = lang === "no"
    ? { title: "Filter", reset: "Nullstill", heat: "Styrke", allHeat: "Alle", category: "Kategori", allCat: "Alle", origin: "Opprinnelse", allOrigin: "Alle", searchOrigin: "Søk land...", show: "Vis resultater" }
    : { title: "Filter", reset: "Reset", heat: "Heat", allHeat: "All", category: "Category", allCat: "All", origin: "Origin", allOrigin: "All", searchOrigin: "Search country...", show: "Show results" };
  const content = (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 17, fontWeight: 800, color: "#2d3a12" }}>{t.title}</span>
        <button onClick={reset} style={{ background: "none", border: "none", color: "#8a9a2a", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{t.reset}</button>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>{t.heat}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["", ...heats].map(h => (
            <button key={h || "__all__"} onClick={() => setFilterHeat(h)}
              style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${filterHeat === h ? "#3b4a1e" : "#d4e0a0"}`, background: filterHeat === h ? "#3b4a1e" : "#fff", color: filterHeat === h ? "#f4f7eb" : "#434f20", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {h || t.allHeat}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={labelStyle}>{t.category}</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["", ...categories].map(c => (
            <button key={c || "__all__"} onClick={() => setFilterCategory(c)}
              style={{ padding: "8px 14px", borderRadius: 20, border: `1.5px solid ${filterCategory === c ? "#3b4a1e" : "#d4e0a0"}`, background: filterCategory === c ? "#3b4a1e" : "#fff", color: filterCategory === c ? "#f4f7eb" : "#434f20", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {c || t.allCat}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={labelStyle}>{t.origin}</div>
          {filterOrigin && <button onClick={() => setFilterOrigin("")} style={{ background: "none", border: "none", color: "#8a9a2a", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{filterOrigin} ×</button>}
        </div>
        <div style={{ position: "relative", marginBottom: 8 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#727d3e", pointerEvents: "none" }}><IcoSearch /></span>
          <input value={originSearch} onChange={e => setOriginSearch(e.target.value)} placeholder={t.searchOrigin} style={{ ...inputStyle, padding: "9px 12px 9px 32px", fontSize: 13 }} />
        </div>
        <div style={{ maxHeight: 180, overflowY: "auto", border: "1.5px solid #e8d8a0", borderRadius: 10, background: "#fff" }}>
          {["", ...origins].map((o, i) => (
            <button key={o || "__all__"} onClick={() => setFilterOrigin(o)}
              style={{ width: "100%", padding: "9px 14px", background: filterOrigin === o ? "#3b4a1e" : "transparent", color: filterOrigin === o ? "#f4f7eb" : "#434f20", border: "none", textAlign: "left", fontSize: 13, fontWeight: filterOrigin === o ? 700 : 500, cursor: "pointer", borderBottom: i < origins.length ? "1px solid #f5e8a0" : "none", fontFamily: "inherit" }}>
              {o || t.allOrigin}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onClose} style={{ width: "100%", background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{t.show}</button>
    </>
  );
  if (!isMobile) return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8d8a0", padding: "20px", position: "sticky", top: 80, maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
      {content}
    </div>
  );
  if (!open) return null;
  return <BottomSheet onClose={onClose}><div style={{ padding: "0 18px" }}>{content}</div></BottomSheet>;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

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

export function SpiceApp() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isDesktop = windowWidth >= 768;
  const [lang, setLang] = useState(() => localStorage.getItem("sb_lang") || "no");
  const toggleLang = () => {
    const nl = lang === "no" ? "en" : "no";
    setLang(nl); localStorage.setItem("sb_lang", nl); window.__lang = nl;
  };
  window.__lang = lang;

  const T = {
    appSub: lang === "no" ? "Din personlige krydderlogg" : "Your personal spice log",
    logout: lang === "no" ? "Ut" : "Out",
    database: lang === "no" ? "Database" : "Database",
    notes: lang === "no" ? "Notater" : "Notes",
    pantry: lang === "no" ? "Krydderhylle" : "Pantry",
    search: lang === "no" ? "Søk navn, smak, opprinnelse..." : "Search name, flavour, origin...",
    showing: lang === "no" ? "Viser" : "Showing",
    of: lang === "no" ? "av" : "of",
    reset: lang === "no" ? "Nullstill ×" : "Reset ×",
    noResults: lang === "no" ? "Ingen krydder funnet" : "No spices found",
    noNotes: lang === "no" ? "Ingen notater ennå" : "No notes yet",
    noNotesSub: lang === "no" ? "Trykk «Notat» på et krydder i databasen" : "Tap 'Note' on a spice in the database",
    noPantry: lang === "no" ? "Krydderhyllen er tom" : "Pantry is empty",
    noPantrySub: lang === "no" ? "Trykk «🫙 Krydderhylle» på et krydder i databasen" : "Tap '🫙 Pantry' on a spice in the database",
    goToDb: lang === "no" ? "Gå til database →" : "Go to database →",
    myPantry: lang === "no" ? "Min krydderhylle" : "My Pantry",
    pantrySub: lang === "no" ? "Krydder du har hjemme" : "Spices you have at home",
    total: lang === "no" ? "totalt" : "total",
    spices: lang === "no" ? "krydder" : "spices",
    used: lang === "no" ? "Brukt" : "Used",
    avgScore: lang === "no" ? "Snittkarakter" : "Avg score",
    topOrigin: lang === "no" ? "Toppland" : "Top origin",
  };

  useEffect(() => {
    API.getSpices().then(data => {
      setSpiceDB(Array.isArray(data) ? data : []);
      setSpicesLoading(false);
    }).catch(() => setSpicesLoading(false));
  }, []);

  useEffect(() => {
    const saved = getSession();
    if (saved) setUser(saved);
    setLoadingUser(false);
  }, []);

  const handleLogin = (username) => { setSession(username); setUser(username); };
  const handleLogout = () => { clearSession(); setUser(null); setNotes([]); setPantry({}); };

  const [tab, setTab] = useState("database");
  const [search, setSearch] = useState("");
  const [filterHeat, setFilterHeat] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedSpice, setSelectedSpice] = useState(null);
  const [addingNote, setAddingNote] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [notes, setNotes] = useState([]);
  const [pantry, setPantry] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [spiceDB, setSpiceDB] = useState([]);
  const [spicesLoading, setSpicesLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setDataLoaded(false);
    API.getData(user).then(data => {
      setNotes(data.notes || []);
      setPantry(data.pantry || {});
      setDataLoaded(true);
    });
  }, [user]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    API.saveData(user, notes, pantry).catch(() => {});
  }, [notes, pantry, user, dataLoaded]);

  const filtered = useMemo(() => {
    let list = spiceDB;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.origin?.toLowerCase().includes(q) || s.flavor_profile?.toLowerCase().includes(q) || s.category?.toLowerCase().includes(q) || s.also_known_as?.toLowerCase().includes(q));
    }
    if (filterHeat) list = list.filter(s => s.heat === filterHeat);
    if (filterCategory) list = list.filter(s => s.category === filterCategory);
    if (filterOrigin) list = list.filter(s => s.origin === filterOrigin);
    return list;
  }, [search, filterHeat, filterCategory, filterOrigin, spiceDB]);

  const addToPantry = (spice) => setPantry(p => ({ ...p, [spice.id]: (p[spice.id] || 0) + 1 }));
  const adjustPantry = (id, delta) => setPantry(p => { const n = Math.max(0, (p[id] || 0) + delta); if (n === 0) { const copy = { ...p }; delete copy[id]; return copy; } return { ...p, [id]: n }; });
  const pantryItems = spiceDB.filter(s => pantry[s.id] > 0);
  const totalPantry = Object.values(pantry).reduce((a, b) => a + b, 0);

  const saveNote = (entry) => {
    let updated;
    if (editingEntry) {
      updated = notes.map(n => n.id === editingEntry.id ? { ...entry, id: editingEntry.id } : n);
      setEditingEntry(null);
    } else {
      updated = [entry, ...notes];
    }
    setNotes(updated);
    API.saveData(user, updated, pantry).catch(() => {});
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    if (newTab === "notes" || newTab === "pantry") {
      API.getData(user).then(data => {
        setNotes(data.notes || []);
        setPantry(data.pantry || {});
      }).catch(() => {});
    }
  };

  const hasFilter = filterHeat || filterCategory || filterOrigin;
  const avgScore = notes.length ? (notes.reduce((s, n) => s + (n.myScore || 0), 0) / notes.length).toFixed(1) : "–";

  const TABS = [
    { id: "database", Icon: IcoSpice, label: T.database, badge: null },
    { id: "notes",    Icon: IcoNotes, label: T.notes,    badge: notes.length || null },
    { id: "pantry",   Icon: IcoPantry, label: T.pantry,  badge: totalPantry || null },
  ];

  if (loadingUser || spicesLoading) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #3b4a1e 0%, #526929 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Georgia,serif", color: "#8a9a2a", fontSize: 18 }}>
      🌿 Laster...
    </div>
  );

  if (!user) return <AuthScreen onLogin={handleLogin} />;

  // ── DESKTOP ──
  if (isDesktop) return (
    <div style={{ minHeight: "100vh", background: "#f4f7eb", fontFamily: "'Georgia','Times New Roman',serif" }}>
      <div style={{ background: "linear-gradient(90deg, #3b4a1e 0%, #4a5e25 100%)", color: "#f4f7eb", padding: "0 32px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 0", marginRight: 32 }}>
            <AppSwitcher current="spice" primaryColor="#3b4a1e" accentColor="#8a9a2a" />
          </div>
          <div style={{ display: "flex", flex: 1 }}>
            {TABS.map(({ id, Icon, label, badge }) => {
              const active = tab === id;
              return (
                <button key={id} onClick={() => handleTabSwitch(id)}
                  style={{ background: "none", border: "none", color: active ? "#8a9a2a" : "#6b7a3a", cursor: "pointer", padding: "16px 20px", fontSize: 14, fontWeight: active ? 700 : 500, borderBottom: active ? "2px solid #c8920a" : "2px solid transparent", display: "flex", alignItems: "center", gap: 7, fontFamily: "inherit", position: "relative" }}>
                  <Icon size={18} />{label}
                  {badge !== null && <span style={{ background: "#8a9a2a", color: "#2d3a12", borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 800 }}>{badge}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
            <span style={{ fontSize: 13, color: "#6b7a3a", display: "flex", alignItems: "center", gap: 6 }}><IcoUser /> {user}</span>
            <button onClick={toggleLang} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#f4f7eb", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
              {lang === "no" ? "🇬🇧 EN" : "🇳🇴 NO"}
            </button>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "7px 12px", color: "#f4f7eb", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}><IcoLogout /> {T.logout}</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 32px" }}>
        {tab === "database" && (
          <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 24 }}>
            <FilterPanel isMobile={false} open filterHeat={filterHeat} setFilterHeat={setFilterHeat} filterCategory={filterCategory} setFilterCategory={setFilterCategory} filterOrigin={filterOrigin} setFilterOrigin={setFilterOrigin} spiceDB={spiceDB} lang={lang} onClose={() => {}} />
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#727d3e", pointerEvents: "none" }}><IcoSearch /></span>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder={T.search} style={{ ...inputStyle, padding: "11px 14px 11px 36px", fontSize: 14 }} />
                </div>
                <div style={{ fontSize: 13, color: "#5a6e2a", whiteSpace: "nowrap" }}>
                  <strong>{filtered.length}</strong> {T.of} {spiceDB.length} {T.spices}
                  {hasFilter && <button onClick={() => { setFilterHeat(""); setFilterCategory(""); setFilterOrigin(""); }} style={{ marginLeft: 8, background: "none", border: "none", color: "#8a9a2a", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{T.reset}</button>}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {filtered.map(s => <SpiceCard key={s.id} spice={s} onSelect={setSelectedSpice} onAddNote={setAddingNote} onAddToPantry={addToPantry} isDesktop lang={lang} />)}
              </div>
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: "#727d3e" }}><div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div><div style={{ fontSize: 16, fontWeight: 600 }}>{T.noResults}</div></div>}
            </div>
          </div>
        )}

        {tab === "notes" && (
          <div style={{ maxWidth: 900 }}>
            {notes.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
                {[[T.used, notes.length, "📝"], [T.avgScore, avgScore, "⭐"], ["Krydder", new Set(notes.map(n => n.spice.name)).size, "🌿"], [T.topOrigin, (() => { const m = {}; notes.forEach(n => m[n.spice.origin] = (m[n.spice.origin] || 0) + 1); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0]?.split(" ")[0] || "–"; })(), "🌍"]].map(([label, val, emoji]) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8d8a0", padding: "16px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 24 }}>{emoji}</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#2d3a12", lineHeight: 1.1 }}>{val}</div>
                    <div style={{ fontSize: 11, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
            {notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ fontSize: 50, marginBottom: 14 }}>📝</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#2d3a12", marginBottom: 8 }}>{T.noNotes}</div>
                <div style={{ fontSize: 14, color: "#727d3e", marginBottom: 24 }}>{T.noNotesSub}</div>
                <button onClick={() => handleTabSwitch("database")} style={{ background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{T.goToDb}</button>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 14 }}>
                {notes.map(entry => <NoteCard key={entry.id} entry={entry} onDelete={(id) => setNotes(n => n.filter(e => e.id !== id))} onEdit={(e) => { setEditingEntry(e); setAddingNote(e.spice); }} />)}
              </div>
            )}
          </div>
        )}

        {tab === "pantry" && (
          <div style={{ maxWidth: 900 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#2d3a12" }}>{T.myPantry}</h2>
                <div style={{ fontSize: 13, color: "#727d3e", marginTop: 2 }}>{T.pantrySub}</div>
              </div>
              {totalPantry > 0 && <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8d8a0", padding: "10px 20px", textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#8a9a2a" }}>{totalPantry}</div><div style={{ fontSize: 10, color: "#727d3e", textTransform: "uppercase" }}>{T.total}</div></div>}
            </div>
            {pantryItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 20px" }}>
                <div style={{ fontSize: 50, marginBottom: 14 }}>🫙</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#2d3a12", marginBottom: 8 }}>{T.noPantry}</div>
                <div style={{ fontSize: 14, color: "#727d3e", marginBottom: 24 }}>{T.noPantrySub}</div>
                <button onClick={() => handleTabSwitch("database")} style={{ background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "12px 28px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{T.goToDb}</button>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8d8a0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#3b4a1e", color: "#f4f7eb" }}>
                      {[lang === "no" ? "Krydder" : "Spice", lang === "no" ? "Kategori" : "Category", lang === "no" ? "Styrke" : "Heat", lang === "no" ? "Opprinnelse" : "Origin", lang === "no" ? "Antall" : "Count", ""].map(h => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pantryItems.map((spice, i) => (
                      <tr key={spice.id} style={{ borderBottom: "1px solid #f5e8a0", background: i % 2 === 0 ? "#fff" : "#f4f7eb" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ fontSize: 10, color: "#727d3e", textTransform: "uppercase", fontWeight: 600 }}>{spice.category}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#2d3a12" }}>{spice.name}</div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#434f20" }}>{spice.category}</td>
                        <td style={{ padding: "14px 16px" }}><HeatBadge heat={spice.heat} /></td>
                        <td style={{ padding: "14px 16px", fontSize: 13, color: "#434f20" }}>{spice.origin}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <button onClick={() => adjustPantry(spice.id, -1)} style={{ width: 34, height: 34, background: "#f4f7eb", border: "1.5px solid #e8d8a0", borderRadius: "8px 0 0 8px", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#2d3a12", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                            <span style={{ minWidth: 36, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#2d3a12", background: "#f4f7eb", border: "1.5px solid #e8d8a0", borderLeft: "none", borderRight: "none" }}>{pantry[spice.id]}</span>
                            <button onClick={() => adjustPantry(spice.id, 1)} style={{ width: 34, height: 34, background: "#3b4a1e", border: "none", borderRadius: "0 8px 8px 0", cursor: "pointer", fontSize: 18, fontWeight: 700, color: "#f4f7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <button onClick={() => adjustPantry(spice.id, -pantry[spice.id])} style={{ background: "#fbe9e7", border: "none", borderRadius: 7, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b71c1c" }}><IcoTrash /></button>
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

      {selectedSpice && !addingNote && <SpiceDetail spice={selectedSpice} onClose={() => setSelectedSpice(null)} onAddNote={(s) => { setSelectedSpice(null); setAddingNote(s); }} onAddToPantry={(s) => { addToPantry(s); setSelectedSpice(null); }} isMobile={false} lang={lang} />}
      {addingNote && <AddNoteSheet spice={addingNote} onClose={() => { setAddingNote(null); setEditingEntry(null); }} onSave={saveNote} isMobile={false} existing={editingEntry} />}
    </div>
  );

  // ── MOBILE ──
  return (
    <div style={{ minHeight: "100vh", background: "#f4f7eb", fontFamily: "'Georgia','Times New Roman',serif", paddingBottom: 70 }}>
      <div style={{ background: "linear-gradient(90deg, #3b4a1e 0%, #4a5e25 100%)", color: "#f4f7eb", padding: `${window.navigator.standalone ? "48px" : "22px"} 14px 22px`, position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AppSwitcher current="spice" primaryColor="#3b4a1e" accentColor="#8a9a2a" />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7a3a" }}>{user}</span>
            <button onClick={toggleLang} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, padding: "6px 8px", color: "#f4f7eb", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "inherit" }}>
              {lang === "no" ? "🇬🇧" : "🇳🇴"}
            </button>
            <button onClick={handleLogout} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 7, padding: "6px 10px", color: "#f4f7eb", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}><IcoLogout /> {T.logout}</button>
          </div>
        </div>
        {tab === "database" && (
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "rgba(253,250,240,0.5)", pointerEvents: "none" }}><IcoSearch /></span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={T.search} style={{ width: "100%", padding: "10px 12px 10px 34px", border: "none", borderRadius: 10, fontSize: 14, background: "rgba(255,255,255,0.1)", color: "#f4f7eb", boxSizing: "border-box", outline: "none" }} />
            </div>
            <button onClick={() => setFilterOpen(true)} style={{ background: hasFilter ? "#8a9a2a" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, minWidth: 42, cursor: "pointer", color: hasFilter ? "#2d3a12" : "#f4f7eb", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <IcoFilter />
              {hasFilter && <span style={{ position: "absolute", top: 7, right: 7, width: 7, height: 7, background: "#2d3a12", borderRadius: "50%", border: "1.5px solid #c8920a" }} />}
            </button>
          </div>
        )}
      </div>

      <div style={{ padding: "14px 12px" }}>
        {tab === "database" && (
          <>
            <div style={{ fontSize: 12, color: "#5a6e2a", marginBottom: 11, display: "flex", justifyContent: "space-between" }}>
              <span>{T.showing} <strong>{filtered.length}</strong> {T.of} {spiceDB.length}</span>
              {hasFilter && <button onClick={() => { setFilterHeat(""); setFilterCategory(""); setFilterOrigin(""); }} style={{ background: "none", border: "none", color: "#8a9a2a", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{T.reset}</button>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {filtered.map(s => <SpiceCard key={s.id} spice={s} onSelect={setSelectedSpice} onAddNote={setAddingNote} onAddToPantry={addToPantry} isDesktop={false} lang={lang} />)}
            </div>
            {filtered.length === 0 && <div style={{ textAlign: "center", padding: "60px 20px", color: "#727d3e" }}><div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div><div style={{ fontSize: 16, fontWeight: 600 }}>{T.noResults}</div></div>}
          </>
        )}

        {tab === "notes" && (
          <>
            {notes.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[[T.used, notes.length, "📝"], [T.avgScore, avgScore, "⭐"], ["Krydder", new Set(notes.map(n => n.spice.name)).size, "🌿"], [T.topOrigin, (() => { const m = {}; notes.forEach(n => m[n.spice.origin] = (m[n.spice.origin] || 0) + 1); return Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0]?.split(" ")[0] || "–"; })(), "🌍"]].map(([label, val, emoji]) => (
                  <div key={label} style={{ background: "#fff", borderRadius: 12, border: "1px solid #e8d8a0", padding: "12px", textAlign: "center" }}>
                    <div style={{ fontSize: 20 }}>{emoji}</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#2d3a12", lineHeight: 1.1 }}>{val}</div>
                    <div style={{ fontSize: 10, color: "#727d3e", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}
            {notes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 20px" }}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>📝</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#2d3a12", marginBottom: 6 }}>{T.noNotes}</div>
                <div style={{ fontSize: 13, color: "#727d3e", marginBottom: 20 }}>{T.noNotesSub}</div>
                <button onClick={() => handleTabSwitch("database")} style={{ background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{T.goToDb}</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {notes.map(entry => <NoteCard key={entry.id} entry={entry} onDelete={(id) => setNotes(n => n.filter(e => e.id !== id))} onEdit={(e) => { setEditingEntry(e); setAddingNote(e.spice); }} />)}
              </div>
            )}
          </>
        )}

        {tab === "pantry" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#2d3a12" }}>{T.myPantry}</div>
                <div style={{ fontSize: 12, color: "#727d3e" }}>{T.pantrySub}</div>
              </div>
              {totalPantry > 0 && <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e8d8a0", padding: "6px 14px", textAlign: "center" }}><div style={{ fontSize: 20, fontWeight: 800, color: "#8a9a2a" }}>{totalPantry}</div><div style={{ fontSize: 9, color: "#727d3e", textTransform: "uppercase" }}>{T.total}</div></div>}
            </div>
            {pantryItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "70px 20px" }}>
                <div style={{ fontSize: 46, marginBottom: 12 }}>🫙</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "#2d3a12", marginBottom: 6 }}>{T.noPantry}</div>
                <div style={{ fontSize: 13, color: "#727d3e", marginBottom: 20 }}>{T.noPantrySub}</div>
                <button onClick={() => handleTabSwitch("database")} style={{ background: "#3b4a1e", color: "#f4f7eb", border: "none", borderRadius: 12, padding: "12px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{T.goToDb}</button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pantryItems.map(spice => (
                  <div key={spice.id} style={{ background: "#fff", borderRadius: 14, border: "1px solid #e8d8a0", padding: "13px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: "#727d3e", fontWeight: 700, textTransform: "uppercase" }}>{spice.category}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#2d3a12" }}>{spice.name}</div>
                      <div style={{ fontSize: 11, color: "#727d3e", marginTop: 1 }}>{spice.origin}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                      <button onClick={() => adjustPantry(spice.id, -1)} style={{ width: 38, height: 38, background: "#f4f7eb", border: "1.5px solid #e8d8a0", borderRadius: "9px 0 0 9px", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#2d3a12", display: "flex", alignItems: "center", justifyContent: "center" }}>−</button>
                      <span style={{ minWidth: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 800, color: "#2d3a12", background: "#f4f7eb", border: "1.5px solid #e8d8a0", borderLeft: "none", borderRight: "none" }}>{pantry[spice.id]}</span>
                      <button onClick={() => adjustPantry(spice.id, 1)} style={{ width: 38, height: 38, background: "#3b4a1e", border: "none", borderRadius: "0 9px 9px 0", cursor: "pointer", fontSize: 20, fontWeight: 700, color: "#f4f7eb", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                    <button onClick={() => adjustPantry(spice.id, -pantry[spice.id])} style={{ background: "#fbe9e7", border: "none", borderRadius: 8, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#b71c1c", flexShrink: 0 }}><IcoTrash /></button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#3b4a1e", display: "flex", borderTop: "1px solid rgba(255,255,255,0.07)", zIndex: 50, paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        {TABS.map(({ id, Icon, label, badge }) => {
          const active = tab === id;
          return (
            <button key={id} onClick={() => handleTabSwitch(id)}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "10px 4px 9px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: active ? "#8a9a2a" : "#6b7a3a", position: "relative", WebkitTapHighlightColor: "transparent" }}>
              {active && <span style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 28, height: 2.5, background: "#8a9a2a", borderRadius: "0 0 3px 3px" }} />}
              <div style={{ position: "relative" }}>
                <Icon size={22} />
                {badge !== null && <span style={{ position: "absolute", top: -5, right: -7, background: "#8a9a2a", color: "#2d3a12", borderRadius: 10, padding: "1px 5px", fontSize: 9, fontWeight: 800, lineHeight: 1.5 }}>{badge}</span>}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 700 : 400 }}>{label}</span>
            </button>
          );
        })}
      </div>

      {selectedSpice && !addingNote && <SpiceDetail spice={selectedSpice} onClose={() => setSelectedSpice(null)} onAddNote={(s) => { setSelectedSpice(null); setAddingNote(s); }} onAddToPantry={(s) => { addToPantry(s); setSelectedSpice(null); }} isMobile lang={lang} />}
      {addingNote && <AddNoteSheet spice={addingNote} onClose={() => { setAddingNote(null); setEditingEntry(null); }} onSave={saveNote} isMobile existing={editingEntry} />}
      <FilterPanel isMobile open={filterOpen} onClose={() => setFilterOpen(false)} filterHeat={filterHeat} setFilterHeat={setFilterHeat} filterCategory={filterCategory} setFilterCategory={setFilterCategory} filterOrigin={filterOrigin} setFilterOrigin={setFilterOrigin} spiceDB={spiceDB} lang={lang} />
    </div>
  );
}
