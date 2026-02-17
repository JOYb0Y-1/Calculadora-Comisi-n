import { useState, useMemo } from "react";

const TIERS = [
  { min: 5000, max: 8999, flujo: 0.06, saldo: 0.03, label: "Rango I" },
  { min: 9000, max: 12000, flujo: 0.07, saldo: 0.035, label: "Rango II" },
  { min: 12001, max: Infinity, flujo: 0.08, saldo: 0.04, label: "Rango III" },
];
const BONUS_THRESHOLD = 70000;
const BONUS_AMOUNT = 1000;
const META_ASESOR = 130000;

function Icon({ name, size = 20, color = "currentColor", style = {} }) {
  return <span className="material-icons-outlined" style={{ fontSize: size, color, verticalAlign: "middle", lineHeight: 1, ...style }}>{name}</span>;
}

function fmt(n) {
  return n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateForTarget(target, lockedTier, type) {
  const tiersToCalc = lockedTier !== null ? [lockedTier] : [0, 1, 2];
  return tiersToCalc.map((ti) => {
    const tier = TIERS[ti];
    const rate = type === "flujo" ? tier.flujo : tier.saldo;
    const range = tier.max === Infinity ? 8000 : tier.max - tier.min;
    const base = tier.min;
    let remaining = target, total = 0, bonus = false;
    const clients = [];
    let i = 0;
    while (remaining > 0 && i < 300) {
      const noise = Math.sin(i * 3.7 + ti * 2.1) * 0.35 + 0.5;
      const tv = Math.max(tier.min, Math.round((base + range * noise) / 100) * 100);
      const c = tv * rate;
      total += tv;
      clients.push({ transfer: tv, commission: c });
      remaining -= c;
      if (!bonus && type === "flujo" && total >= BONUS_THRESHOLD) { remaining -= BONUS_AMOUNT; bonus = true; }
      i++;
    }
    const totalComm = clients.reduce((s, c) => s + c.commission, 0) + (bonus ? BONUS_AMOUNT : 0);
    return { tierIndex: ti, tier, rate, clients, totalTransfer: total, totalCommission: totalComm, bonusApplied: bonus, metaPercent: (total / META_ASESOR) * 100, type };
  });
}

const TIER_COLORS = [
  { bg: "#FFF8F0", text: "#B45309", border: "#F59E0B50", accent: "#D97706", accentBg: "#FFFBEB" },
  { bg: "#F0FDF4", text: "#166534", border: "#22C55E50", accent: "#16A34A", accentBg: "#F0FDF4" },
  { bg: "#EFF6FF", text: "#1E40AF", border: "#3B82F650", accent: "#2563EB", accentBg: "#EFF6FF" },
];

function TierBadge({ tier, compact }) {
  const c = TIER_COLORS[tier];
  return <span style={{ display: "inline-flex", alignItems: "center", padding: compact ? "3px 10px" : "5px 14px", borderRadius: 6, fontSize: compact ? 12 : 13, fontWeight: 700, color: c.text, background: c.bg, border: `1.5px solid ${c.border}`, letterSpacing: "0.04em" }}>{TIERS[tier].label}</span>;
}

function ResultCard({ data }) {
  const [open, setOpen] = useState(false);
  const c = TIER_COLORS[data.tierIndex];

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", justifyContent: "space-between", background: c.accentBg, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TierBadge tier={data.tierIndex} />
          <span style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>
            S/ {fmt(data.tier.min)} – {data.tier.max === Infinity ? "a más" : `S/ ${fmt(data.tier.max)}`}
          </span>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: c.accent, background: `${c.accent}14`, padding: "5px 14px", borderRadius: 8 }}>
          {data.type === "flujo" ? `${(data.rate * 100).toFixed(0)}%` : `${(data.rate * 100).toFixed(1)}%`} {data.type === "flujo" ? "Flujo" : "Saldo"}
        </div>
      </div>

      <div style={{ padding: "24px 28px" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20, background: "#F8FAFC", borderRadius: 12, padding: "20px 16px" }}>
          {[
            { icon: "group", label: "Clientes", value: String(data.clients.length), isAccent: true },
            { icon: "payments", label: "Comisión Total", value: `S/ ${fmt(data.totalCommission)}`, isAccent: true, mono: true },
            { icon: "account_balance_wallet", label: "Traspaso Total", value: `S/ ${fmt(data.totalTransfer)}`, mono: true },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center", padding: "8px 4px" }}>
              <Icon name={s.icon} size={22} color="#94A3B8" />
              <div style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: s.isAccent ? c.accent : "#0F172A", fontFamily: s.mono ? "'JetBrains Mono', monospace" : "inherit", letterSpacing: "-0.02em", lineHeight: 1.2, wordBreak: "break-word" }}>
                {s.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Meta progress */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B", display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="flag" size={16} color="#94A3B8" /> Meta S/ {fmt(META_ASESOR)}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: data.metaPercent >= 100 ? "#16A34A" : "#D97706" }}>
              {data.metaPercent.toFixed(1)}%
            </span>
          </div>
          <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min(data.metaPercent, 100)}%`, background: data.metaPercent >= 100 ? "linear-gradient(90deg, #16A34A, #4ADE80)" : `linear-gradient(90deg, ${c.accent}, ${c.accent}BB)`, borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
        </div>

        {/* Bonus */}
        {data.bonusApplied && (
          <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
            <Icon name="emoji_events" size={24} color="#D97706" />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>
              Bono de S/ {fmt(BONUS_AMOUNT)} aplicado — traspaso flujo superó S/ {fmt(BONUS_THRESHOLD)}
            </span>
          </div>
        )}

        {/* Toggle */}
        <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: 12, background: open ? "#F8FAFC" : "#fff", border: "1px solid #E2E8F0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#64748B", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s", fontFamily: "inherit" }}>
          <Icon name={open ? "expand_less" : "expand_more"} size={20} color="#94A3B8" />
          {open ? "Ocultar detalle" : "Ver detalle por cliente"} ({data.clients.length})
        </button>

        {open && (
          <div style={{ marginTop: 14, maxHeight: 400, overflowY: "auto", borderRadius: 10, border: "1px solid #F1F5F9" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#F8FAFC", position: "sticky", top: 0 }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "#94A3B8", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>N°</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#94A3B8", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Traspaso RIA</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "#94A3B8", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>Comisión</th>
                </tr>
              </thead>
              <tbody>
                {data.clients.map((cl, i) => (
                  <tr key={i} style={{ borderTop: "1px solid #F1F5F9" }}>
                    <td style={{ padding: "10px 16px", color: "#CBD5E1", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>{String(i + 1).padStart(2, "0")}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600, color: "#334155", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>S/ {fmt(cl.transfer)}</td>
                    <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 700, color: c.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>S/ {fmt(cl.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonTable({ target, lockedTier }) {
  const flujo = calculateForTarget(target, lockedTier, "flujo");
  const saldo = calculateForTarget(target, lockedTier, "saldo");

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <Icon name="compare_arrows" size={26} color="#0F172A" />
        <h3 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>Comparación Flujo vs Saldo</h3>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ padding: "14px 18px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", background: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>Rango</th>
              <th colSpan={3} style={{ padding: "14px 18px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#D97706", textTransform: "uppercase", letterSpacing: "0.08em", background: "#FFFBEB", borderBottom: "2px solid #FDE68A" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="trending_up" size={16} color="#D97706" /> Comisión Flujo</span>
              </th>
              <th colSpan={3} style={{ padding: "14px 18px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#2563EB", textTransform: "uppercase", letterSpacing: "0.08em", background: "#EFF6FF", borderBottom: "2px solid #BFDBFE" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Icon name="savings" size={16} color="#2563EB" /> Comisión Saldo</span>
              </th>
            </tr>
            <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
              <th style={{ padding: "10px 18px" }} />
              {["Tasa", "Clientes", "Total"].map(h => <th key={`f-${h}`} style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{h}</th>)}
              {["Tasa", "Clientes", "Total"].map(h => <th key={`s-${h}`} style={{ padding: "10px 14px", textAlign: "center", fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {flujo.map((fr, i) => {
              const sr = saldo[i];
              return (
                <tr key={i} style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <td style={{ padding: "14px 18px" }}><TierBadge tier={fr.tierIndex} compact /></td>
                  <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 700, color: "#D97706", fontSize: 15 }}>{(fr.rate * 100).toFixed(0)}%</td>
                  <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 800, fontSize: 22, color: "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}>{fr.clients.length}</td>
                  <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 600, color: "#334155", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>S/ {fmt(fr.totalCommission)}</td>
                  <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 700, color: "#2563EB", fontSize: 15 }}>{(sr.rate * 100).toFixed(1)}%</td>
                  <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 800, fontSize: 22, color: "#0F172A", fontFamily: "'JetBrains Mono', monospace" }}>{sr.clients.length}</td>
                  <td style={{ padding: "14px 14px", textAlign: "center", fontWeight: 600, color: "#334155", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>S/ {fmt(sr.totalCommission)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AFPCalculator() {
  const [target, setTarget] = useState(10000);
  const [lockedTier, setLockedTier] = useState(null);
  const [commType, setCommType] = useState("flujo");
  const results = useMemo(() => calculateForTarget(target, lockedTier, commType), [target, lockedTier, commType]);

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap');
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Outlined');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #F8FAFC; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 3px; }
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .fade-up { animation: fadeUp 0.5s cubic-bezier(0.4,0,0.2,1) both; }
    button { font-family: inherit; }
    button:hover { opacity: 0.88; }
  `;

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{css}</style>

      {/* Header */}
      <header style={{ background: "#0F172A", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: "40%", height: "100%", background: "linear-gradient(135deg, transparent 50%, rgba(59,130,246,0.06) 50%)" }} />
        <div style={{ position: "relative", maxWidth: 1200, margin: "0 auto", padding: "28px 32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, background: "linear-gradient(135deg, #3B82F6, #1D4ED8)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="analytics" size={26} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.18em", color: "#64748B", textTransform: "uppercase" }}>AFP Integra</div>
                <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.2 }}>Calculadora de Comisiones</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", background: "rgba(255,255,255,0.06)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <Icon name="verified_user" size={18} color="#3B82F6" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8" }}>Uso exclusivo gerencia</span>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 56px" }}>
        {/* Input Panel */}
        <div className="fade-up" style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: 32, boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
          <div style={{ padding: "20px 32px", borderBottom: "1px solid #F1F5F9", display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="tune" size={24} color="#0F172A" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>Parámetros de Simulación</h2>
          </div>

          <div style={{ padding: "28px 32px" }}>
            {/* Target */}
            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Icon name="track_changes" size={16} color="#94A3B8" /> Meta de comisión del asesor
              </label>
              <div style={{ position: "relative", marginBottom: 12 }}>
                <span style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", fontSize: 18, fontWeight: 700, color: "#94A3B8", fontFamily: "'JetBrains Mono', monospace" }}>S/</span>
                <input type="number" value={target} onChange={(e) => setTarget(Math.max(0, Number(e.target.value)))}
                  style={{ width: "100%", padding: "20px 20px 20px 60px", fontSize: 36, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", border: "2px solid #E2E8F0", borderRadius: 12, outline: "none", color: "#0F172A", background: "#F8FAFC", transition: "border-color 0.2s, box-shadow 0.2s" }}
                  onFocus={(e) => { e.target.style.borderColor = "#3B82F6"; e.target.style.boxShadow = "0 0 0 4px rgba(59,130,246,0.1)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "#E2E8F0"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[3000, 5000, 8000, 10000, 15000, 20000].map(a => (
                  <button key={a} onClick={() => setTarget(a)} style={{ padding: "10px 20px", fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", border: target === a ? "2px solid #3B82F6" : "1.5px solid #E2E8F0", borderRadius: 10, background: target === a ? "#EFF6FF" : "#fff", color: target === a ? "#1D4ED8" : "#64748B", cursor: "pointer", transition: "all 0.15s" }}>
                    {a.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Icon name="swap_horiz" size={16} color="#94A3B8" /> Tipo de comisión
                </label>
                <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 12, padding: 4, border: "1px solid #E2E8F0" }}>
                  {[{ key: "flujo", label: "Flujo", icon: "trending_up" }, { key: "saldo", label: "Saldo", icon: "savings" }].map(t => (
                    <button key={t.key} onClick={() => setCommType(t.key)} style={{ flex: 1, padding: "14px 16px", fontSize: 15, fontWeight: 700, border: "none", borderRadius: 10, background: commType === t.key ? "#0F172A" : "transparent", color: commType === t.key ? "#fff" : "#64748B", cursor: "pointer", transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <Icon name={t.icon} size={18} color={commType === t.key ? "#fff" : "#94A3B8"} /> {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <Icon name="filter_list" size={16} color="#94A3B8" /> Rango específico
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[{ val: null, label: "Todos" }, { val: 0, label: "I" }, { val: 1, label: "II" }, { val: 2, label: "III" }].map(opt => (
                    <button key={String(opt.val)} onClick={() => setLockedTier(opt.val)} style={{ flex: 1, padding: "14px 8px", fontSize: 14, fontWeight: 700, border: lockedTier === opt.val ? "2px solid #0F172A" : "1.5px solid #E2E8F0", borderRadius: 10, background: lockedTier === opt.val ? "#0F172A" : "#fff", color: lockedTier === opt.val ? "#fff" : "#64748B", cursor: "pointer", transition: "all 0.15s" }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reference */}
          <div style={{ padding: "20px 32px 24px", background: "#F8FAFC", borderTop: "1px solid #F1F5F9" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="info" size={16} color="#94A3B8" /> Referencia de tasas por rango
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
              {TIERS.map((t, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 10, padding: "16px 18px", border: "1px solid #E2E8F0", textAlign: "center" }}>
                  <TierBadge tier={i} compact />
                  <div style={{ marginTop: 8, fontSize: 13, color: "#94A3B8", fontWeight: 500 }}>S/ {fmt(t.min)} – {t.max === Infinity ? "a más" : `S/ ${fmt(t.max)}`}</div>
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "center", gap: 16, alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#D97706" }}>{(t.flujo * 100).toFixed(0)}%</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Flujo</div>
                    </div>
                    <div style={{ width: 1, height: 28, background: "#E2E8F0" }} />
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#2563EB" }}>{(t.saldo * 100).toFixed(1)}%</div>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>Saldo</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="fade-up" style={{ animationDelay: "0.1s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Icon name="assessment" size={26} color="#0F172A" />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>
              Resultados — Comisión {commType === "flujo" ? "Flujo" : "Saldo"}
            </h2>
          </div>
          <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 20, fontWeight: 500, paddingLeft: 36 }}>
            Montos de traspaso simulados con variación realista dentro de cada rango
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: results.length === 1 ? "1fr" : results.length === 2 ? "1fr 1fr" : "1fr 1fr",
            gap: 20,
            marginBottom: 32
          }}>
            {results.map((r, idx) => (
              <div key={`${r.tierIndex}-${commType}-${target}`} style={results.length === 3 && idx === 2 ? { gridColumn: "1 / -1", maxWidth: "50%", justifySelf: "center", width: "100%" } : {}}>
                <ResultCard data={r} />
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="fade-up" style={{ animationDelay: "0.2s", background: "#fff", borderRadius: 16, padding: 32, border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.05)", marginBottom: 32 }}>
          <ComparisonTable target={target} lockedTier={lockedTier} />
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "18px 24px", background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0" }}>
          <Icon name="info" size={20} color="#94A3B8" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
            <strong style={{ color: "#0F172A" }}>Nota:</strong> Los montos por cliente son simulados con variación realista dentro de cada rango.
            El bono de S/ {fmt(BONUS_AMOUNT)} se aplica cuando el traspaso total en flujo alcanza S/ {fmt(BONUS_THRESHOLD)}.
            La meta por asesor es de S/ {fmt(META_ASESOR)}. Herramienta de uso interno — AFP Integra.
          </div>
        </div>
      </main>
    </div>
  );
}
