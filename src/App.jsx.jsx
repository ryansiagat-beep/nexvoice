import { useState, useEffect, useRef, useCallback } from "react";

// ─── THEME & CONSTANTS ──────────────────────────────────────────────────────
const ACCESS_PASSWORD = "nexvoice2026";
const VERTICALS = [
  { id: "healthcare", label: "Healthcare", icon: "🏥", terms: ["appointment", "prescription", "patient", "HIPAA", "insurance", "copay", "referral", "symptoms"] },
  { id: "legal", label: "Legal Intake", icon: "⚖️", terms: ["case", "attorney", "retainer", "consultation", "litigation", "settlement", "statute", "damages"] },
  { id: "realestate", label: "Real Estate", icon: "🏠", terms: ["listing", "showing", "offer", "escrow", "MLS", "comps", "financing", "inspection"] },
  { id: "hvac", label: "HVAC Dispatch", icon: "❄️", terms: ["repair", "maintenance", "technician", "unit", "thermostat", "duct", "filter", "warranty"] },
  { id: "auto", label: "Auto Dealership", icon: "🚗", terms: ["test drive", "financing", "trade-in", "VIN", "APR", "inventory", "service", "warranty"] },
  { id: "generic", label: "General Business", icon: "🏢", terms: ["support", "billing", "account", "order", "refund", "schedule", "information", "help"] },
];

const EMOTION_MAP = {
  frustrated: { color: "#ef4444", bg: "#fef2f2", icon: "😤", advice: "De-escalate: use empathy phrases, slow down, offer immediate solution" },
  confused: { color: "#f59e0b", bg: "#fffbeb", icon: "😕", advice: "Clarify: use simple language, summarize key points, confirm understanding" },
  urgent: { color: "#8b5cf6", bg: "#f5f3ff", icon: "⚡", advice: "Act fast: acknowledge urgency first, give ETA, prioritize resolution" },
  satisfied: { color: "#10b981", bg: "#f0fdf4", icon: "😊", advice: "Reinforce: upsell opportunity, request review, offer referral" },
  hesitant: { color: "#6b7280", bg: "#f9fafb", icon: "🤔", advice: "Build trust: provide social proof, reduce friction, offer guarantee" },
  neutral: { color: "#3b82f6", bg: "#eff6ff", icon: "😐", advice: "Engage: ask open questions, personalize, create value" },
};

const DEMO_CALLS = [
  { id: 1, caller: "Maria S.", number: "+1 (202) 555-0134", duration: "2:34", emotion: "frustrated", vertical: "healthcare", status: "live", sentiment: 32 },
  { id: 2, caller: "James T.", number: "+1 (301) 555-0198", duration: "1:12", emotion: "confused", vertical: "legal", status: "live", sentiment: 58 },
  { id: 3, caller: "Priya K.", number: "+1 (415) 555-0267", duration: "0:47", emotion: "urgent", vertical: "realestate", status: "live", sentiment: 45 },
];

// ─── STYLES ─────────────────────────────────────────────────────────────────
const S = {
  app: { minHeight: "100vh", background: "#0a0a0f", color: "#e8e8f0", fontFamily: "'SF Pro Display', -apple-system, sans-serif", display: "flex" },
  sidebar: { width: 220, background: "#0d0d14", borderRight: "1px solid #1e1e2e", display: "flex", flexDirection: "column", padding: "24px 0" },
  logo: { padding: "0 20px 24px", borderBottom: "1px solid #1e1e2e" },
  logoMark: { display: "flex", alignItems: "center", gap: 10 },
  logoIcon: { width: 36, height: 36, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 },
  logoText: { fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: -0.5 },
  logoSub: { fontSize: 10, color: "#6366f1", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginTop: 2 },
  navItem: (active) => ({ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", cursor: "pointer", borderRadius: "0 8px 8px 0", marginRight: 12, transition: "all 0.15s", background: active ? "#1a1a2e" : "transparent", color: active ? "#a78bfa" : "#888", fontWeight: active ? 600 : 400, fontSize: 14, borderLeft: active ? "2px solid #8b5cf6" : "2px solid transparent" }),
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  header: { background: "#0d0d14", borderBottom: "1px solid #1e1e2e", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  badge: (color) => ({ background: color + "22", color, padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }),
  content: { flex: 1, overflow: "auto", padding: 28 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 20 },
  card: { background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 14, padding: 20, marginBottom: 0 },
  cardTitle: { fontSize: 13, color: "#666", marginBottom: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: 0.8 },
  statNum: { fontSize: 28, fontWeight: 700, color: "#fff", letterSpacing: -1 },
  statSub: { fontSize: 12, color: "#666", marginTop: 4 },
  btn: (variant = "primary") => ({
    padding: variant === "sm" ? "6px 14px" : "10px 20px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: variant === "sm" ? 12 : 14,
    background: variant === "primary" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : variant === "danger" ? "#ef4444" : variant === "ghost" ? "transparent" : "#1e1e2e",
    color: variant === "ghost" ? "#888" : "#fff",
    border: variant === "ghost" ? "1px solid #2e2e3e" : "none",
    transition: "opacity 0.15s",
  }),
  input: { background: "#111118", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none" },
  select: { background: "#111118", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" },
  liveCallCard: (emotion) => ({ background: "#0d0d14", border: `1px solid ${EMOTION_MAP[emotion]?.color + "44" || "#1e1e2e"}`, borderRadius: 12, padding: 16, marginBottom: 12, position: "relative" }),
  progressBar: (pct, color) => ({ height: 4, background: "#1e1e2e", borderRadius: 4, overflow: "hidden" }),
  progressFill: (pct, color) => ({ height: "100%", width: pct + "%", background: color, borderRadius: 4, transition: "width 0.5s" }),
  tag: (color) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: color + "22", color, marginRight: 4 }),
  pulseWrap: { display: "flex", alignItems: "center", gap: 6 },
  pulse: { width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 1.5s infinite" },
  chatBubble: (role) => ({
    maxWidth: "75%",
    alignSelf: role === "user" ? "flex-end" : "flex-start",
    background: role === "user" ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "#1a1a2e",
    color: "#e8e8f0",
    padding: "10px 14px",
    borderRadius: role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
    fontSize: 14,
    lineHeight: 1.5,
    marginBottom: 8,
  }),
};

// ─── EMOTION DETECTOR (heuristic) ───────────────────────────────────────────
function detectEmotion(text) {
  const t = text.toLowerCase();
  if (/urgent|emergency|asap|right now|immediately|can't wait/.test(t)) return "urgent";
  if (/frustrated|angry|ridiculous|unacceptable|worst|hate|terrible/.test(t)) return "frustrated";
  if (/confused|don't understand|what do you mean|unclear|lost|huh/.test(t)) return "confused";
  if (/thank|great|perfect|love|excellent|amazing|happy/.test(t)) return "satisfied";
  if (/not sure|maybe|perhaps|hesitant|worried|nervous/.test(t)) return "hesitant";
  return "neutral";
}

function detectVertical(text, vertical) {
  const v = VERTICALS.find(v => v.id === vertical);
  if (!v) return [];
  return v.terms.filter(t => text.toLowerCase().includes(t.toLowerCase()));
}

// ─── LIVE CALL PANEL ─────────────────────────────────────────────────────────
function LiveCallCard({ call, onEscalate }) {
  const emotion = EMOTION_MAP[call.emotion];
  return (
    <div style={S.liveCallCard(call.emotion)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={S.pulseWrap}><div style={S.pulse} /><span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>LIVE</span></div>
            <span style={{ fontSize: 13, color: "#888" }}>{call.duration}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{call.caller}</div>
          <div style={{ fontSize: 12, color: "#555" }}>{call.number}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, marginBottom: 4 }}>{emotion?.icon}</div>
          <div style={S.badge(emotion?.color || "#6366f1")}>{call.emotion}</div>
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: "#555", marginBottom: 4 }}>Sentiment</div>
        <div style={S.progressBar()}><div style={S.progressFill(call.sentiment, call.sentiment > 60 ? "#10b981" : call.sentiment > 40 ? "#f59e0b" : "#ef4444")} /></div>
        <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{call.sentiment}/100</div>
      </div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 10, background: "#111118", padding: "6px 10px", borderRadius: 6, lineHeight: 1.5 }}>
        💡 {emotion?.advice}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <span style={S.tag("#6366f1")}>{VERTICALS.find(v => v.id === call.vertical)?.label}</span>
        <button style={{ ...S.btn("danger"), padding: "4px 12px", fontSize: 11 }} onClick={() => onEscalate(call)}>Escalate</button>
      </div>
    </div>
  );
}

// ─── AGENT CHAT (Real Claude API) ────────────────────────────────────────────
function AgentChat({ vertical, agentName, systemPrompt }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [emotion, setEmotion] = useState("neutral");
  const [detectedTerms, setDetectedTerms] = useState([]);
  const [callSummary, setCallSummary] = useState(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const verticalData = VERTICALS.find(v => v.id === vertical) || VERTICALS[5];

  const buildSystemPrompt = () => {
    const base = systemPrompt || `You are ${agentName || "NexVoice Agent"}, an AI voice agent specialized for ${verticalData.label}.`;
    return `${base}

VERTICAL CONTEXT: You are deeply trained in ${verticalData.label} terminology, workflows, and compliance requirements. Industry terms you understand: ${verticalData.terms.join(", ")}.

EMOTION ADAPTATION: Always detect the caller's emotional state and adapt your tone:
- Frustrated callers: Lead with empathy, be direct, offer immediate solutions
- Confused callers: Use simple language, avoid jargon, summarize key points
- Urgent callers: Acknowledge urgency first, give clear ETAs
- Satisfied callers: Reinforce positivity, explore additional needs

RESPONSE FORMAT: Keep responses conversational (2-3 sentences max). Be warm, professional, and brand-aligned. Always end with a clear next step or question.

ESCALATION: If you cannot resolve in 3 turns, offer human escalation gracefully.

COMPLIANCE: Never request sensitive data (SSN, full CC numbers). Always confirm consent for recordings. Follow ${vertical === "healthcare" ? "HIPAA" : vertical === "legal" ? "attorney-client privilege" : "data privacy"} guidelines.`;
  };

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");

    const detectedEmotion = detectEmotion(userMsg);
    const terms = detectVertical(userMsg, vertical);
    setEmotion(detectedEmotion);
    setDetectedTerms(terms);

    const newMessages = [...messages, { role: "user", content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: newMessages,
        }),
      });
      const data = await response.json();
      const assistantText = data.content?.[0]?.text || "I apologize, I'm having trouble connecting. Let me transfer you to a specialist.";
      setMessages([...newMessages, { role: "assistant", content: assistantText }]);
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "I'm experiencing a connection issue. Please hold while I reconnect." }]);
    }
    setLoading(false);
  }

  async function generateSummary() {
    if (messages.length < 2) return;
    setLoading(true);
    try {
      const transcript = messages.map(m => `${m.role === "user" ? "Caller" : "Agent"}: ${m.content}`).join("\n");
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Generate a structured post-call summary for this ${verticalData.label} call transcript. Return JSON only with keys: outcome, sentiment_score (0-100), action_items (array), follow_up_required (bool), escalation_needed (bool), key_topics (array), coaching_notes.\n\nTranscript:\n${transcript}`,
          }],
        }),
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        setCallSummary(JSON.parse(clean));
      } catch { setCallSummary({ outcome: text, action_items: [], key_topics: [] }); }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const emotionData = EMOTION_MAP[emotion];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Emotion indicator */}
      <div style={{ background: emotionData.bg, border: `1px solid ${emotionData.color}44`, borderRadius: 8, padding: "8px 12px", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>{emotionData.icon}</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: emotionData.color, textTransform: "uppercase" }}>{emotion} caller</div>
            <div style={{ fontSize: 11, color: "#666" }}>{emotionData.advice}</div>
          </div>
        </div>
        {detectedTerms.length > 0 && (
          <div style={{ fontSize: 11, color: "#888" }}>
            🎯 {detectedTerms.slice(0, 3).join(", ")}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, overflow: "auto", marginBottom: 12, minHeight: 220, maxHeight: 320 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "#555", fontSize: 13, paddingTop: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>{verticalData.icon}</div>
            <div>{agentName || "NexVoice Agent"} ready — {verticalData.label} mode</div>
            <div style={{ fontSize: 11, marginTop: 4, color: "#444" }}>Type a message to begin the call simulation</div>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 8 }}>
              <div style={S.chatBubble(m.role)}>{m.content}</div>
            </div>
          ))}
          {loading && (
            <div style={{ alignSelf: "flex-start" }}>
              <div style={{ ...S.chatBubble("assistant"), color: "#555" }}>
                <span style={{ animation: "pulse 1s infinite" }}>Agent is responding…</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <input
          style={{ ...S.input, flex: 1 }}
          placeholder="Speak or type caller message…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          disabled={loading}
        />
        <button style={S.btn("primary")} onClick={sendMessage} disabled={loading}>Send</button>
      </div>

      {messages.length >= 2 && (
        <button style={{ ...S.btn("ghost"), width: "100%", fontSize: 12 }} onClick={generateSummary} disabled={loading}>
          📋 Generate Post-Call Summary + CRM Push
        </button>
      )}

      {/* Summary card */}
      {callSummary && (
        <div style={{ background: "#111118", border: "1px solid #2e2e3e", borderRadius: 8, padding: 14, marginTop: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#a78bfa", marginBottom: 8 }}>📊 POST-CALL INTELLIGENCE</div>
          {callSummary.outcome && <div style={{ fontSize: 12, color: "#ccc", marginBottom: 6 }}><span style={{ color: "#888" }}>Outcome:</span> {callSummary.outcome}</div>}
          {callSummary.sentiment_score !== undefined && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Sentiment: {callSummary.sentiment_score}/100</div>
              <div style={S.progressBar()}><div style={S.progressFill(callSummary.sentiment_score, callSummary.sentiment_score > 60 ? "#10b981" : "#f59e0b")} /></div>
            </div>
          )}
          {callSummary.action_items?.length > 0 && (
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: "#888" }}>Action Items:</div>
              {callSummary.action_items.map((item, i) => <div key={i} style={{ fontSize: 12, color: "#ccc", paddingLeft: 8 }}>• {item}</div>)}
            </div>
          )}
          {callSummary.coaching_notes && <div style={{ fontSize: 11, color: "#888", fontStyle: "italic", marginTop: 6 }}>💬 {callSummary.coaching_notes}</div>}
          {(callSummary.follow_up_required || callSummary.escalation_needed) && (
            <div style={{ marginTop: 6 }}>
              {callSummary.follow_up_required && <span style={S.badge("#f59e0b")}>Follow-up Required</span>}
              {callSummary.escalation_needed && <span style={{ ...S.badge("#ef4444"), marginLeft: 8 }}>Escalation Needed</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AGENT BUILDER ───────────────────────────────────────────────────────────
function AgentBuilder() {
  const [vertical, setVertical] = useState("healthcare");
  const [agentName, setAgentName] = useState("Aria");
  const [voice, setVoice] = useState("professional-female");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [tone, setTone] = useState("warm");
  const [tab, setTab] = useState("config");

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20, letterSpacing: -0.5 }}>Agent Builder</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["config", "test", "deploy"].map(t => (
          <button key={t} style={{ ...S.btn(tab === t ? "primary" : "ghost"), textTransform: "capitalize" }} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "config" && (
        <div style={S.grid2}>
          <div>
            <div style={S.card}>
              <div style={S.cardTitle}>Agent Identity</div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Agent Name</label>
                <input style={S.input} value={agentName} onChange={e => setAgentName(e.target.value)} placeholder="e.g. Aria, Max, Jordan" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Industry Vertical</label>
                <select style={S.select} value={vertical} onChange={e => setVertical(e.target.value)}>
                  {VERTICALS.map(v => <option key={v.id} value={v.id}>{v.icon} {v.label}</option>)}
                </select>
                <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
                  Domain terms loaded: {VERTICALS.find(v => v.id === vertical)?.terms.join(", ")}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Voice Persona</label>
                <select style={S.select} value={voice} onChange={e => setVoice(e.target.value)}>
                  <option value="professional-female">Professional Female (ElevenLabs: Rachel)</option>
                  <option value="professional-male">Professional Male (ElevenLabs: Josh)</option>
                  <option value="warm-female">Warm & Approachable (ElevenLabs: Bella)</option>
                  <option value="authoritative-male">Authoritative (ElevenLabs: Adam)</option>
                  <option value="cartesia-sonic">Cartesia Sonic (Low-Latency)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Communication Tone</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["warm", "professional", "concise", "empathetic"].map(t => (
                    <button key={t} style={{ ...S.btn(tone === t ? "primary" : "ghost"), padding: "5px 12px", fontSize: 12, textTransform: "capitalize" }} onClick={() => setTone(t)}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={S.card}>
              <div style={S.cardTitle}>System Prompt</div>
              <textarea
                style={{ ...S.input, height: 160, resize: "vertical", fontFamily: "monospace", fontSize: 12 }}
                placeholder={`You are ${agentName}, a helpful ${VERTICALS.find(v => v.id === vertical)?.label} specialist…`}
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
              />
              <div style={{ fontSize: 11, color: "#555", marginTop: 6 }}>
                Leave blank to use NexVoice's auto-optimized prompt for {VERTICALS.find(v => v.id === vertical)?.label}
              </div>
              <div style={{ marginTop: 14, padding: "10px 12px", background: "#111118", borderRadius: 8, border: "1px solid #2e2e3e" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#a78bfa", marginBottom: 6 }}>✓ Auto-loaded capabilities</div>
                {[
                  "Emotion-adaptive response engine",
                  `${VERTICALS.find(v => v.id === vertical)?.label} terminology + compliance`,
                  "Graceful human escalation logic",
                  "Post-call summary generation",
                  vertical === "healthcare" ? "HIPAA consent flow" : vertical === "legal" ? "Attorney-client disclosure" : "DNC + consent logging"
                ].map((cap, i) => <div key={i} style={{ fontSize: 11, color: "#666", paddingLeft: 8 }}>• {cap}</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "test" && (
        <div style={S.card}>
          <div style={S.cardTitle}>Live Test — {agentName} ({VERTICALS.find(v => v.id === vertical)?.label})</div>
          <AgentChat vertical={vertical} agentName={agentName} systemPrompt={systemPrompt} />
        </div>
      )}

      {tab === "deploy" && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>Deployment Options</div>
            {[
              { icon: "📞", label: "Twilio Phone Number", desc: "Assign a PSTN number, calls route to this agent", status: "available" },
              { icon: "🌐", label: "Web Widget Embed", desc: "JavaScript snippet for your website", status: "available" },
              { icon: "📱", label: "SIP Trunk", desc: "Connect your existing phone system", status: "available" },
              { icon: "⚡", label: "Retell AI (Bundled)", desc: "Ultra-low latency managed pipeline", status: "enterprise" },
              { icon: "🔗", label: "Webhooks", desc: "POST events to your CRM on call events", status: "available" },
            ].map((opt, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1e1e2e" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 18 }}>{opt.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{opt.desc}</div>
                  </div>
                </div>
                <span style={S.badge(opt.status === "enterprise" ? "#f59e0b" : "#10b981")}>{opt.status}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Stack Configuration</div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>Latency estimate: ~780ms end-to-end</div>
            {[
              { layer: "STT", value: "Deepgram Nova-3", latency: "~200ms", status: "#10b981" },
              { layer: "LLM", value: "Claude Sonnet", latency: "~430ms", status: "#10b981" },
              { layer: "TTS", value: "ElevenLabs Flash", latency: "~75ms", status: "#10b981" },
              { layer: "Telephony", value: "Telnyx (SIP)", latency: "~75ms", status: "#10b981" },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1a1a2e" }}>
                <div>
                  <span style={S.badge("#6366f1")}>{row.layer}</span>
                  <span style={{ fontSize: 13, color: "#ccc", marginLeft: 8 }}>{row.value}</span>
                </div>
                <span style={{ fontSize: 12, color: row.status, fontWeight: 600 }}>{row.latency}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: "10px 12px", background: "#0a1a12", border: "1px solid #10b98133", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>✓ Sub-800ms pipeline configured</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>Within natural conversation cadence</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS DASHBOARD ──────────────────────────────────────────────────────
function AnalyticsDashboard() {
  const [period, setPeriod] = useState("week");

  const mockData = {
    totalCalls: 1847,
    avgLatency: 782,
    resolutionRate: 84,
    escalationRate: 11,
    sentimentAvg: 67,
    costPerCall: 0.18,
    emotionBreakdown: [
      { emotion: "satisfied", count: 612, pct: 33 },
      { emotion: "neutral", count: 480, pct: 26 },
      { emotion: "confused", count: 370, pct: 20 },
      { emotion: "hesitant", count: 185, pct: 10 },
      { emotion: "frustrated", count: 130, pct: 7 },
      { emotion: "urgent", count: 70, pct: 4 },
    ],
    verticalBreakdown: [
      { v: "Healthcare", calls: 540, resolution: 88 },
      { v: "Legal", calls: 320, resolution: 79 },
      { v: "Real Estate", calls: 410, resolution: 85 },
      { v: "HVAC", calls: 290, resolution: 91 },
      { v: "Auto", calls: 287, resolution: 82 },
    ],
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.5, margin: 0 }}>Analytics</h2>
        <div style={{ display: "flex", gap: 8 }}>
          {["day", "week", "month"].map(p => (
            <button key={p} style={{ ...S.btn(period === p ? "primary" : "ghost"), textTransform: "capitalize" }} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div style={S.grid4}>
        {[
          { label: "Total Calls", value: mockData.totalCalls.toLocaleString(), sub: "+12% vs last period", color: "#6366f1" },
          { label: "Resolution Rate", value: mockData.resolutionRate + "%", sub: "No human needed", color: "#10b981" },
          { label: "Avg Latency", value: mockData.avgLatency + "ms", sub: "End-to-end pipeline", color: "#f59e0b" },
          { label: "Cost / Call", value: "$" + mockData.costPerCall, sub: "All-in (STT+LLM+TTS)", color: "#a78bfa" },
        ].map((stat, i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{stat.label}</div>
            <div style={{ ...S.statNum, color: stat.color }}>{stat.value}</div>
            <div style={S.statSub}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Emotion Distribution</div>
          {mockData.emotionBreakdown.map((row, i) => {
            const em = EMOTION_MAP[row.emotion];
            return (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, color: "#ccc" }}>{em.icon} {row.emotion}</span>
                  <span style={{ fontSize: 12, color: "#888" }}>{row.count} ({row.pct}%)</span>
                </div>
                <div style={S.progressBar()}><div style={S.progressFill(row.pct, em.color)} /></div>
              </div>
            );
          })}
        </div>
        <div style={S.card}>
          <div style={S.cardTitle}>Resolution by Vertical</div>
          {mockData.verticalBreakdown.map((row, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontSize: 12, color: "#ccc" }}>{row.v}</span>
                <span style={{ fontSize: 12, color: row.resolution > 85 ? "#10b981" : "#f59e0b" }}>{row.resolution}%</span>
              </div>
              <div style={S.progressBar()}><div style={S.progressFill(row.resolution, row.resolution > 85 ? "#10b981" : "#f59e0b")} /></div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 1 }}>{row.calls} calls</div>
            </div>
          ))}
        </div>
      </div>

      <div style={S.card}>
        <div style={S.cardTitle}>Latency Breakdown (P50 / P90 / P95)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {[
            { layer: "STT (Deepgram)", p50: 185, p90: 230, p95: 280 },
            { layer: "LLM (Claude)", p50: 420, p90: 580, p95: 720 },
            { layer: "TTS (ElevenLabs)", p50: 72, p90: 95, p95: 130 },
            { layer: "Network + Overhead", p50: 65, p90: 90, p95: 120 },
          ].map((row, i) => (
            <div key={i} style={{ background: "#111118", borderRadius: 8, padding: 12, border: "1px solid #1e1e2e" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>{row.layer}</div>
              <div style={{ fontSize: 13, color: "#6366f1", fontWeight: 600 }}>P50: {row.p50}ms</div>
              <div style={{ fontSize: 12, color: "#f59e0b" }}>P90: {row.p90}ms</div>
              <div style={{ fontSize: 12, color: "#ef4444" }}>P95: {row.p95}ms</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── COMPLIANCE CENTER ────────────────────────────────────────────────────────
function ComplianceCenter() {
  const [activeFramework, setActiveFramework] = useState("hipaa");

  const frameworks = {
    hipaa: {
      label: "HIPAA", icon: "🏥", status: "active",
      items: ["BAA signed and on file", "PHI never stored in LLM context", "Call recordings encrypted at rest (AES-256)", "Consent collected before recording", "Audit logs retained 7 years", "Minimum necessary data principle enforced"],
      pending: ["Annual security risk assessment", "Staff training completion"]
    },
    pci: {
      label: "PCI DSS", icon: "💳", status: "partial",
      items: ["No full PAN ever transmitted to voice agent", "DTMF masking active for card entry", "TLS 1.3 in transit"],
      pending: ["PCI QSA review", "Tokenization for recurring billing", "Cardholder data environment scoping"]
    },
    fdcpa: {
      label: "FDCPA", icon: "⚖️", status: "active",
      items: ["DNC list scrubbed before every outbound campaign", "Time-zone aware calling (8am–9pm local)", "Mini-Miranda disclosure automated", "Call frequency caps enforced", "Consent logs with timestamps"],
      pending: []
    },
    tcpa: {
      label: "TCPA", icon: "📱", status: "active",
      items: ["Written consent documented for AI calls", "Opt-out honored within 10 days", "Do Not Call registry checked", "Call abandonment rate < 3%"],
      pending: ["State-level TCPA addendums"]
    }
  };

  const f = frameworks[activeFramework];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20, letterSpacing: -0.5 }}>Compliance Center</h2>
      <div style={{ background: "#0a1a12", border: "1px solid #10b98133", borderRadius: 10, padding: 14, marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 24 }}>🛡️</span>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#10b981" }}>Compliance is baked in, not bolted on</div>
          <div style={{ fontSize: 12, color: "#555" }}>All frameworks enforced at the pipeline level — not added as an afterthought.</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(frameworks).map(([key, fw]) => (
          <button key={key} style={{ ...S.btn(activeFramework === key ? "primary" : "ghost"), display: "flex", alignItems: "center", gap: 6 }} onClick={() => setActiveFramework(key)}>
            {fw.icon} {fw.label}
            <span style={{ ...S.badge(fw.status === "active" ? "#10b981" : "#f59e0b"), fontSize: 10, padding: "1px 6px" }}>{fw.status}</span>
          </button>
        ))}
      </div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>✅ Controls Active</div>
          {f.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid #1a1a2a" }}>
              <span style={{ color: "#10b981", marginTop: 1 }}>✓</span>
              <span style={{ fontSize: 13, color: "#ccc" }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={S.card}>
          {f.pending.length > 0 ? (
            <>
              <div style={S.cardTitle}>⏳ Pending / Recommended</div>
              {f.pending.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "6px 0", borderBottom: "1px solid #1a1a2a" }}>
                  <span style={{ color: "#f59e0b", marginTop: 1 }}>○</span>
                  <span style={{ fontSize: 13, color: "#888" }}>{item}</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ textAlign: "center", paddingTop: 40 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
              <div style={{ fontSize: 13, color: "#10b981" }}>All {f.label} requirements satisfied</div>
            </div>
          )}
          <div style={{ marginTop: 16, padding: "10px 12px", background: "#111118", borderRadius: 8, border: "1px solid #2e2e3e" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#6366f1", marginBottom: 4 }}>Evidence Package</div>
            {["BAA Template", "DPA (Data Processing Agreement)", "Privacy Policy", "Audit Log Export", "Incident Response Plan"].map((doc, i) => (
              <div key={i} style={{ fontSize: 12, color: "#888", padding: "3px 0", cursor: "pointer" }}>📄 {doc}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ROI CALCULATOR ───────────────────────────────────────────────────────────
function ROICalculator() {
  const [callVolume, setCallVolume] = useState(500);
  const [avgHandle, setAvgHandle] = useState(6);
  const [agentCost, setAgentCost] = useState(22);
  const [resolution, setResolution] = useState(80);

  const currentCostMonthly = callVolume * (avgHandle / 60) * agentCost;
  const aiCostMonthly = callVolume * 0.18;
  const humanOverflow = callVolume * ((100 - resolution) / 100) * (avgHandle / 60) * agentCost;
  const totalAICost = aiCostMonthly + humanOverflow;
  const savings = currentCostMonthly - totalAICost;
  const roi = savings > 0 ? Math.round((savings / totalAICost) * 100) : 0;

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4, letterSpacing: -0.5 }}>ROI Calculator</h2>
      <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Transparent all-in pricing — no hidden fees</div>

      <div style={S.grid2}>
        <div style={S.card}>
          <div style={S.cardTitle}>Your Current Setup</div>
          {[
            { label: "Monthly call volume", value: callVolume, min: 50, max: 5000, step: 50, set: setCallVolume, fmt: v => v.toLocaleString() + " calls" },
            { label: "Avg handle time (min)", value: avgHandle, min: 1, max: 30, step: 1, set: setAvgHandle, fmt: v => v + " min" },
            { label: "Agent hourly cost ($)", value: agentCost, min: 12, max: 65, step: 1, set: setAgentCost, fmt: v => "$" + v + "/hr" },
            { label: "Target AI resolution rate", value: resolution, min: 50, max: 98, step: 1, set: setResolution, fmt: v => v + "%" },
          ].map((s, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: "#888" }}>{s.label}</label>
                <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>{s.fmt(s.value)}</span>
              </div>
              <input type="range" min={s.min} max={s.max} step={s.step} value={s.value} onChange={e => s.set(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          ))}
        </div>

        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Monthly Cost Comparison</div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Current (human agents)</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#ef4444" }}>${Math.round(currentCostMonthly).toLocaleString()}</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>With NexVoice (AI + overflow)</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#10b981" }}>${Math.round(totalAICost).toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#555" }}>AI calls: ${Math.round(aiCostMonthly).toLocaleString()} + Human overflow: ${Math.round(humanOverflow).toLocaleString()}</div>
            </div>
            <div style={{ background: "#0a1a12", border: "1px solid #10b98133", borderRadius: 8, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: "#ccc" }}>Monthly Savings</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>${Math.round(savings).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#888" }}>ROI</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: "#a78bfa" }}>{roi}%</span>
              </div>
            </div>
          </div>
          <div style={{ ...S.card, marginTop: 16 }}>
            <div style={S.cardTitle}>All-In Cost Breakdown</div>
            {[
              { label: "AI per-minute (STT+LLM+TTS)", value: "$0.12/min" },
              { label: "Platform fee", value: "$0.04/min" },
              { label: "Telephony (Telnyx)", value: "$0.02/min" },
              { label: "Effective all-in", value: "$0.18/min", bold: true },
            ].map((row, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid #1a1a2a" }}>
                <span style={{ fontSize: 12, color: row.bold ? "#ccc" : "#888" }}>{row.label}</span>
                <span style={{ fontSize: 12, color: row.bold ? "#a78bfa" : "#888", fontWeight: row.bold ? 700 : 400 }}>{row.value}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: "#555", marginTop: 8 }}>No hidden fees. No per-seat charges. No setup cost.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── LIVE OPS DASHBOARD ───────────────────────────────────────────────────────
function LiveOps() {
  const [calls, setCalls] = useState(DEMO_CALLS);
  const [escalated, setEscalated] = useState([]);
  const [ticker, setTicker] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTicker(t => t + 1);
      setCalls(prev => prev.map(c => ({
        ...c,
        sentiment: Math.max(10, Math.min(95, c.sentiment + (Math.random() > 0.5 ? 2 : -2))),
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function handleEscalate(call) {
    setCalls(prev => prev.filter(c => c.id !== call.id));
    setEscalated(prev => [{ ...call, escalatedAt: new Date().toLocaleTimeString() }, ...prev]);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.5, margin: 0 }}>Live Operations</h2>
        <div style={S.pulseWrap}>
          <div style={S.pulse} />
          <span style={{ fontSize: 12, color: "#10b981" }}>{calls.length} active calls · updates every 3s</span>
        </div>
      </div>

      <div style={S.grid4}>
        {[
          { label: "Active Calls", value: calls.length, color: "#6366f1" },
          { label: "Avg Sentiment", value: Math.round(calls.reduce((a, c) => a + c.sentiment, 0) / (calls.length || 1)), color: "#10b981" },
          { label: "Escalations Today", value: escalated.length, color: "#f59e0b" },
          { label: "Queue Wait", value: "0s", color: "#a78bfa" },
        ].map((stat, i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{stat.label}</div>
            <div style={{ ...S.statNum, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        <div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600 }}>ACTIVE CALLS</div>
          {calls.map(call => <LiveCallCard key={call.id} call={call} onEscalate={handleEscalate} />)}
          {calls.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", color: "#555", paddingTop: 30 }}>No active calls</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600 }}>ESCALATION QUEUE</div>
          {escalated.length === 0 && (
            <div style={{ ...S.card, textAlign: "center", color: "#555", padding: 30 }}>No escalations — AI handling all calls ✓</div>
          )}
          {escalated.map((call, i) => (
            <div key={i} style={{ ...S.card, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{call.caller}</div>
                <span style={S.badge("#ef4444")}>Needs Human</span>
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>Escalated at {call.escalatedAt}</div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>
                Emotion: {EMOTION_MAP[call.emotion]?.icon} {call.emotion} | Vertical: {call.vertical}
              </div>
              <button style={{ ...S.btn("primary"), marginTop: 10, fontSize: 12, padding: "5px 12px" }}>Assign Agent</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── OUTBOUND CAMPAIGN MANAGER ───────────────────────────────────────────────
const SAMPLE_CONTACTS = [
  { id: 1, name: "Sarah Johnson", phone: "+1 (301) 555-0112", status: "pending", vertical: "healthcare", tag: "Appt Reminder" },
  { id: 2, name: "Michael Chen",  phone: "+1 (240) 555-0178", status: "called",   vertical: "auto",       tag: "Service Follow-up" },
  { id: 3, name: "Linda Torres",  phone: "+1 (202) 555-0199", status: "pending",  vertical: "realestate", tag: "Showing Follow-up" },
  { id: 4, name: "David Kim",     phone: "+1 (410) 555-0234", status: "dnc",      vertical: "legal",      tag: "Intake Outreach" },
  { id: 5, name: "Aisha Patel",   phone: "+1 (703) 555-0156", status: "pending",  vertical: "hvac",       tag: "Maintenance Due" },
  { id: 6, name: "Robert Hayes",  phone: "+1 (301) 555-0267", status: "voicemail",vertical: "generic",    tag: "Re-engagement" },
];

const STATUS_COLORS = { pending: "#6366f1", called: "#10b981", dnc: "#ef4444", voicemail: "#f59e0b", calling: "#a78bfa" };

function OutboundCampaign() {
  const [contacts, setContacts] = useState(SAMPLE_CONTACTS);
  const [campaignName, setCampaignName] = useState("Q3 Reactivation Campaign");
  const [script, setScript] = useState("");
  const [trigger, setTrigger] = useState("manual");
  const [callingId, setCallingId] = useState(null);
  const [callLog, setCallLog] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [tab, setTab] = useState("contacts");

  async function generateScript() {
    setGenerating(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Write a concise, natural-sounding outbound AI voice agent script for a campaign called "${campaignName}". 
The contacts span verticals: healthcare, auto dealership, real estate, HVAC, and legal.
Write a universal opener (5-7 seconds), a value proposition (10-15 seconds), and a call-to-action close.
Include [CALLER_NAME] and [COMPANY_NAME] placeholders. Keep the total under 45 seconds when spoken.
Format as: OPENER / VALUE PROP / CTA — no extra commentary.`
          }],
        }),
      });
      const d = await res.json();
      setScript(d.content?.[0]?.text || "Script generation failed.");
    } catch { setScript("Could not connect to AI — check API key."); }
    setGenerating(false);
  }

  function simulateCall(contact) {
    if (contact.status === "dnc") return;
    setCallingId(contact.id);
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: "calling" } : c));
    setTimeout(() => {
      const outcomes = ["called", "voicemail", "called"];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: outcome } : c));
      setCallLog(prev => [{ contact: contact.name, outcome, time: new Date().toLocaleTimeString(), duration: Math.floor(Math.random() * 180 + 30) + "s" }, ...prev]);
      setCallingId(null);
    }, 2500);
  }

  const stats = {
    total: contacts.length,
    called: contacts.filter(c => c.status === "called").length,
    pending: contacts.filter(c => c.status === "pending").length,
    dnc: contacts.filter(c => c.status === "dnc").length,
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.5, margin: 0 }}>Outbound Campaigns</h2>
        <span style={{ fontSize: 12, color: "#888", background: "#111118", border: "1px solid #2e2e3e", padding: "4px 12px", borderRadius: 20 }}>
          Proactive AI — event-triggered & manual
        </span>
      </div>

      <div style={S.grid4}>
        {[
          { label: "Total Contacts", value: stats.total, color: "#6366f1" },
          { label: "Called", value: stats.called, color: "#10b981" },
          { label: "Pending", value: stats.pending, color: "#f59e0b" },
          { label: "DNC Scrubbed", value: stats.dnc, color: "#ef4444" },
        ].map((s, i) => (
          <div key={i} style={S.card}>
            <div style={S.cardTitle}>{s.label}</div>
            <div style={{ ...S.statNum, color: s.color, fontSize: 24 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {["contacts", "script", "triggers", "log"].map(t => (
          <button key={t} style={{ ...S.btn(tab === t ? "primary" : "ghost"), textTransform: "capitalize", fontSize: 13 }} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "contacts" && (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={S.cardTitle}>Contact List</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...S.btn("ghost"), fontSize: 12 }}>+ Import CSV</button>
              <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={() => contacts.filter(c => c.status === "pending").forEach(c => simulateCall(c))}>
                ▶ Run Campaign
              </button>
            </div>
          </div>
          {contacts.map(c => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2a" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>
                  {c.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{c.phone} · {c.tag}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={S.badge(STATUS_COLORS[c.status] || "#888")}>{callingId === c.id ? "⏳ calling…" : c.status}</span>
                {c.status === "pending" && (
                  <button style={{ ...S.btn("primary"), padding: "4px 12px", fontSize: 11 }} onClick={() => simulateCall(c)} disabled={callingId !== null}>Call</button>
                )}
                {c.status === "dnc" && <span style={{ fontSize: 11, color: "#ef4444" }}>🚫 DNC</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "script" && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>Campaign Details</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Campaign Name</label>
              <input style={S.input} value={campaignName} onChange={e => setCampaignName(e.target.value)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Trigger Type</label>
              <select style={S.select} value={trigger} onChange={e => setTrigger(e.target.value)}>
                <option value="manual">Manual Launch</option>
                <option value="shipping">Shipping Delay Alert</option>
                <option value="appointment">Appointment Reminder (24hr)</option>
                <option value="payment">Payment Due Reminder</option>
                <option value="outage">Service Outage Proactive Notice</option>
                <option value="winback">Win-Back (90 days inactive)</option>
                <option value="crm">CRM Status Change Webhook</option>
              </select>
            </div>
            <div style={{ padding: "10px 12px", background: "#111118", borderRadius: 8, border: "1px solid #2e2e3e", marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>✓ Auto-compliance checks</div>
              {["DNC registry scrubbed before every dial", "Time-zone aware — calls only 8am–9pm local", "Consent verified in contact record", "Call frequency cap: max 3x per contact/week"].map((item, i) => (
                <div key={i} style={{ fontSize: 11, color: "#555", paddingLeft: 8 }}>• {item}</div>
              ))}
            </div>
            <button style={{ ...S.btn("primary"), width: "100%" }} onClick={generateScript} disabled={generating}>
              {generating ? "Generating script…" : "✨ AI-Generate Campaign Script"}
            </button>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>Campaign Script</div>
            <textarea
              style={{ ...S.input, height: 280, resize: "vertical", fontFamily: "monospace", fontSize: 12, lineHeight: 1.7 }}
              placeholder='Click "AI-Generate Campaign Script" or write your own…'
              value={script}
              onChange={e => setScript(e.target.value)}
            />
            {script && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#555" }}>
                ~{Math.round(script.split(" ").length / 2.5)}s spoken · {script.split(" ").length} words
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "triggers" && (
        <div style={S.card}>
          <div style={S.cardTitle}>Event-Driven Trigger Workflows</div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>AI proactively calls customers when business events fire — no human needed to initiate.</div>
          {[
            { event: "Order Delayed > 2 Days", action: "Call customer, offer discount code, update CRM status", webhook: "POST /webhook/shipping", active: true },
            { event: "Appointment T-24hrs", action: "Reminder call, confirm or reschedule, update calendar", webhook: "POST /webhook/calendar", active: true },
            { event: "Invoice Overdue 7 Days", action: "Courtesy call, payment link via SMS, log outcome", webhook: "POST /webhook/billing", active: false },
            { event: "Lead Score > 80 (CRM)", action: "Warm outreach call within 5 minutes of score change", webhook: "POST /webhook/crm/lead", active: true },
            { event: "Service Outage Detected", action: "Proactive notice to affected customers, ETA update", webhook: "POST /webhook/ops/outage", active: false },
          ].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a2a" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500, marginBottom: 3 }}>⚡ {t.event}</div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 3 }}>→ {t.action}</div>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "#555", background: "#111118", padding: "2px 6px", borderRadius: 4, display: "inline-block" }}>{t.webhook}</div>
              </div>
              <div style={{ marginLeft: 16 }}>
                <span style={S.badge(t.active ? "#10b981" : "#555")}>{t.active ? "active" : "off"}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "log" && (
        <div style={S.card}>
          <div style={S.cardTitle}>Call Log</div>
          {callLog.length === 0 && (
            <div style={{ textAlign: "center", color: "#555", padding: "30px 0", fontSize: 13 }}>No calls placed yet — run campaign or call individual contacts</div>
          )}
          {callLog.map((entry, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #1a1a2a" }}>
              <div>
                <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{entry.contact}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{entry.time} · {entry.duration}</div>
              </div>
              <span style={S.badge(STATUS_COLORS[entry.outcome] || "#888")}>{entry.outcome}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CALL TRANSCRIPTS & QA ───────────────────────────────────────────────────
const SAMPLE_TRANSCRIPTS = [
  {
    id: 1, caller: "Maria S.", date: "Today 2:34pm", duration: "4:12", vertical: "healthcare",
    emotion: "frustrated", sentimentStart: 28, sentimentEnd: 71, escalated: false,
    lines: [
      { role: "agent", text: "Thank you for calling HealthFirst Scheduling, this is Aria. How can I help you today?" },
      { role: "caller", text: "I've been waiting THREE weeks for my referral and nobody seems to care!" },
      { role: "agent", text: "I completely understand your frustration, and I'm truly sorry for the wait. Let me pull up your account right now and find out exactly where things stand." },
      { role: "caller", text: "My name is Maria Santos, date of birth April 3rd 1982." },
      { role: "agent", text: "Got it, Maria. I can see your referral was submitted on the 4th. It looks like it's pending insurance pre-authorization — that's the delay. I'm flagging this as urgent and will have your care coordinator call you within two hours with a status update." },
      { role: "caller", text: "Finally. Thank you, that actually helps." },
      { role: "agent", text: "Absolutely. Is there anything else I can help you with before I let you go?" },
    ],
    summary: { outcome: "Resolved — insurance escalation flagged", actions: ["Flag referral as urgent", "Care coordinator callback within 2hrs", "Send SMS confirmation"], coaching: "Excellent empathy in turn 3. Consider offering callback sooner in similar cases.", score: 88 }
  },
  {
    id: 2, caller: "James T.", date: "Today 1:10pm", duration: "2:47", vertical: "legal",
    emotion: "confused", sentimentStart: 52, sentimentEnd: 74, escalated: false,
    lines: [
      { role: "agent", text: "Thank you for calling Sterling Legal Group intake line. I'm Max, how can I assist?" },
      { role: "caller", text: "Yeah I got served some papers and I don't really understand what I'm supposed to do." },
      { role: "agent", text: "I understand how stressful that can be. Can you tell me what type of papers — was it a civil lawsuit, an eviction notice, or something else?" },
      { role: "caller", text: "It says civil summons, something about a debt collection." },
      { role: "agent", text: "Okay, that's a civil debt collection case. You typically have 30 days from the date served to file a response. I'd like to schedule you a free 15-minute consultation with one of our attorneys — they can walk you through your options. Are mornings or afternoons better for you?" },
      { role: "caller", text: "Oh, I didn't know I could do that for free. Afternoons work." },
    ],
    summary: { outcome: "Consultation booked — Thursday 2pm", actions: ["Book Thursday 2pm consult slot", "Send intake form via email", "Add to attorney's calendar"], coaching: "Good simplification of legal language. Missed opportunity to collect phone backup.", score: 79 }
  },
];

function TranscriptsQA() {
  const [selected, setSelected] = useState(null);
  const [qaRunning, setQaRunning] = useState(false);
  const [qaResult, setQaResult] = useState(null);
  const [filterEmotion, setFilterEmotion] = useState("all");

  async function runAIQA(transcript) {
    setQaRunning(true);
    setQaResult(null);
    const lines = transcript.lines.map(l => `${l.role === "agent" ? "AGENT" : "CALLER"}: ${l.text}`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are a voice agent QA evaluator. Score this ${transcript.vertical} call transcript on these dimensions (1-10 each):
- empathy: emotional acknowledgment
- resolution: problem actually solved
- compliance: proper disclosures and data handling
- efficiency: time to resolution
- upsell_missed: opportunities missed (inverse — 10 = no misses)

Also provide: top_strength (one sentence), top_improvement (one sentence), hallucination_detected (bool), escalation_appropriate (bool).

Return ONLY valid JSON, no commentary.

Transcript:
${lines}`
          }],
        }),
      });
      const d = await res.json();
      const text = d.content?.[0]?.text || "{}";
      try { setQaResult(JSON.parse(text.replace(/```json|```/g, "").trim())); }
      catch { setQaResult({ error: text }); }
    } catch { setQaResult({ error: "Connection failed" }); }
    setQaRunning(false);
  }

  const filtered = SAMPLE_TRANSCRIPTS.filter(t => filterEmotion === "all" || t.emotion === filterEmotion);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.5, margin: 0 }}>Transcripts & QA</h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#888" }}>Filter:</span>
          <select style={{ ...S.select, width: "auto", padding: "5px 10px", fontSize: 12 }} value={filterEmotion} onChange={e => setFilterEmotion(e.target.value)}>
            <option value="all">All emotions</option>
            {Object.keys(EMOTION_MAP).map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div style={S.grid2}>
        {/* Call list */}
        <div>
          {filtered.map(t => (
            <div key={t.id} style={{ ...S.card, marginBottom: 12, cursor: "pointer", border: selected?.id === t.id ? "1px solid #6366f1" : "1px solid #1e1e2e" }} onClick={() => { setSelected(t); setQaResult(null); }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{t.caller}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{t.date} · {t.duration}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 20 }}>{EMOTION_MAP[t.emotion]?.icon}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>QA: {t.summary.score}/100</div>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginBottom: 3 }}>
                  <span>Sentiment start → end</span>
                  <span>{t.sentimentStart} → {t.sentimentEnd}</span>
                </div>
                <div style={{ height: 3, background: "#1e1e2e", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: t.sentimentEnd + "%", background: t.sentimentEnd > 60 ? "#10b981" : "#f59e0b", borderRadius: 4 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={S.tag("#6366f1")}>{VERTICALS.find(v => v.id === t.vertical)?.label}</span>
                <span style={S.tag(EMOTION_MAP[t.emotion]?.color)}>{t.emotion}</span>
                {t.escalated && <span style={S.tag("#ef4444")}>escalated</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Transcript detail */}
        <div>
          {!selected && (
            <div style={{ ...S.card, textAlign: "center", color: "#555", padding: "60px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: 13 }}>Select a call to view transcript</div>
            </div>
          )}
          {selected && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={S.cardTitle}>{selected.caller} · {selected.date}</div>
                <button style={{ ...S.btn("primary"), fontSize: 12, padding: "5px 14px" }} onClick={() => runAIQA(selected)} disabled={qaRunning}>
                  {qaRunning ? "Scoring…" : "🤖 AI QA Score"}
                </button>
              </div>

              {/* Transcript lines */}
              <div style={{ maxHeight: 240, overflow: "auto", marginBottom: 14 }}>
                {selected.lines.map((line, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: line.role === "agent" ? "#6366f1" : "#888", minWidth: 42, paddingTop: 2 }}>{line.role === "agent" ? "AGENT" : "CALLER"}</span>
                    <span style={{ fontSize: 12, color: "#ccc", lineHeight: 1.5 }}>{line.text}</span>
                  </div>
                ))}
              </div>

              {/* Pre-computed summary */}
              <div style={{ background: "#111118", border: "1px solid #2e2e3e", borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", marginBottom: 6 }}>Auto-Generated Summary</div>
                <div style={{ fontSize: 12, color: "#ccc", marginBottom: 6 }}>{selected.summary.outcome}</div>
                {selected.summary.actions.map((a, i) => <div key={i} style={{ fontSize: 11, color: "#888" }}>• {a}</div>)}
                <div style={{ fontSize: 11, color: "#6366f1", fontStyle: "italic", marginTop: 6 }}>💬 Coaching: {selected.summary.coaching}</div>
              </div>

              {/* Live AI QA result */}
              {qaResult && !qaResult.error && (
                <div style={{ background: "#0a1020", border: "1px solid #6366f133", borderRadius: 8, padding: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#6366f1", marginBottom: 8 }}>🤖 AI QA Scorecard</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                    {["empathy", "resolution", "compliance", "efficiency", "upsell_missed"].map(key => qaResult[key] !== undefined && (
                      <div key={key}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 2 }}>
                          <span style={{ textTransform: "capitalize" }}>{key.replace("_", " ")}</span>
                          <span style={{ color: qaResult[key] >= 7 ? "#10b981" : qaResult[key] >= 5 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{qaResult[key]}/10</span>
                        </div>
                        <div style={{ height: 3, background: "#1e1e2e", borderRadius: 4 }}>
                          <div style={{ height: "100%", width: (qaResult[key] * 10) + "%", background: qaResult[key] >= 7 ? "#10b981" : qaResult[key] >= 5 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {qaResult.top_strength && <div style={{ fontSize: 11, color: "#10b981", marginBottom: 3 }}>✓ {qaResult.top_strength}</div>}
                  {qaResult.top_improvement && <div style={{ fontSize: 11, color: "#f59e0b" }}>↑ {qaResult.top_improvement}</div>}
                  {qaResult.hallucination_detected && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>⚠️ Potential hallucination detected — review manually</div>}
                </div>
              )}
              {qaResult?.error && <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8 }}>{qaResult.error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── VOICE PERSONA STUDIO ────────────────────────────────────────────────────
function VoicePersonaStudio() {
  const [name, setName] = useState("Aria");
  const [gender, setGender] = useState("female");
  const [speed, setSpeed] = useState(1.0);
  const [warmth, setWarmth] = useState(7);
  const [energy, setEnergy] = useState(6);
  const [formality, setFormality] = useState(6);
  const [tagline, setTagline] = useState("");
  const [previewText, setPreviewText] = useState("Hi, this is Aria from HealthFirst. I'm calling to confirm your appointment on Thursday the 12th. Does 2pm still work for you?");
  const [generating, setGenerating] = useState(false);
  const [generatedPersona, setGeneratedPersona] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState("elevenlabs");

  async function generatePersona() {
    setGenerating(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Design a voice persona profile for an AI voice agent named "${name}" with these traits:
- Gender presentation: ${gender}
- Speed: ${speed}x (1.0 = normal)
- Warmth: ${warmth}/10
- Energy level: ${energy}/10  
- Formality: ${formality}/10

Return JSON only with keys:
- personality_summary (2 sentences describing this voice persona)
- speaking_style (bullet array of 4 traits like "Uses short, empathetic affirmations")
- avoid_list (bullet array of 3 things this persona should never say/do)
- sample_greeting (one natural greeting sentence)
- recommended_tts_settings (object with stability, similarity_boost, style values for ElevenLabs 0.0-1.0)
- brand_voice_match (array of 3 industry types this persona fits best)`
          }],
        }),
      });
      const d = await res.json();
      const text = d.content?.[0]?.text || "{}";
      try { setGeneratedPersona(JSON.parse(text.replace(/```json|```/g, "").trim())); }
      catch { setGeneratedPersona({ personality_summary: text }); }
    } catch { setGeneratedPersona({ personality_summary: "Connection failed — check API key." }); }
    setGenerating(false);
  }

  const providers = [
    { id: "elevenlabs", label: "ElevenLabs Flash", latency: "75ms", quality: "★★★★★", cost: "$0.30/1k chars" },
    { id: "cartesia", label: "Cartesia Sonic", latency: "90ms", quality: "★★★★☆", cost: "$0.12/1k chars" },
    { id: "rime", label: "Rime (100M+ calls/mo)", latency: "110ms", quality: "★★★★★", cost: "$0.18/1k chars" },
    { id: "openai", label: "OpenAI TTS", latency: "200ms", quality: "★★★★☆", cost: "$0.015/1k chars" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", letterSpacing: -0.5, margin: 0 }}>Voice Persona Studio</h2>
        <span style={{ fontSize: 12, color: "#888", background: "#111118", border: "1px solid #2e2e3e", padding: "4px 12px", borderRadius: 20 }}>
          Voice quality = business outcome
        </span>
      </div>

      <div style={S.grid2}>
        {/* Persona controls */}
        <div>
          <div style={S.card}>
            <div style={S.cardTitle}>Persona Identity</div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Agent Name</label>
              <input style={S.input} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aria, Max, Jordan, Riley" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}>Gender Presentation</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["female", "male", "neutral"].map(g => (
                  <button key={g} style={{ ...S.btn(gender === g ? "primary" : "ghost"), flex: 1, textTransform: "capitalize", padding: "7px 0" }} onClick={() => setGender(g)}>{g}</button>
                ))}
              </div>
            </div>
            {[
              { label: "Warmth", value: warmth, set: setWarmth, min: 1, max: 10, lo: "Clinical", hi: "Very warm" },
              { label: "Energy", value: energy, set: setEnergy, min: 1, max: 10, lo: "Calm/slow", hi: "Energetic" },
              { label: "Formality", value: formality, set: setFormality, min: 1, max: 10, lo: "Casual", hi: "Formal" },
              { label: "Speech Speed", value: speed, set: setSpeed, min: 0.7, max: 1.4, step: 0.05, lo: "Slow", hi: "Fast" },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, color: "#888" }}>{s.label}</label>
                  <span style={{ fontSize: 12, color: "#a78bfa", fontWeight: 600 }}>{typeof s.value === "number" && s.min === 0.7 ? s.value.toFixed(2) + "x" : s.value + "/10"}</span>
                </div>
                <input type="range" min={s.min} max={s.max} step={s.step || 1} value={s.value} onChange={e => s.set(Number(e.target.value))} style={{ width: "100%" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#444" }}>
                  <span>{s.lo}</span><span>{s.hi}</span>
                </div>
              </div>
            ))}
            <button style={{ ...S.btn("primary"), width: "100%", marginTop: 4 }} onClick={generatePersona} disabled={generating}>
              {generating ? "Crafting persona…" : "✨ Generate Full Persona Profile"}
            </button>
          </div>
        </div>

        {/* Preview + results */}
        <div>
          <div style={{ ...S.card, marginBottom: 16 }}>
            <div style={S.cardTitle}>TTS Provider</div>
            {providers.map(p => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1a1a2a", cursor: "pointer" }} onClick={() => setSelectedProvider(p.id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${selectedProvider === p.id ? "#6366f1" : "#2e2e3e"}`, background: selectedProvider === p.id ? "#6366f1" : "transparent" }} />
                  <div>
                    <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: "#555" }}>Latency: {p.latency} · {p.cost}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#f59e0b" }}>{p.quality}</div>
              </div>
            ))}
          </div>

          {generatedPersona && !generatedPersona.personality_summary?.includes("fail") && (
            <div style={S.card}>
              <div style={S.cardTitle}>✨ {name}'s Persona Profile</div>
              {generatedPersona.personality_summary && (
                <div style={{ fontSize: 13, color: "#ccc", marginBottom: 12, lineHeight: 1.6 }}>{generatedPersona.personality_summary}</div>
              )}
              {generatedPersona.speaking_style && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Speaking style</div>
                  {(Array.isArray(generatedPersona.speaking_style) ? generatedPersona.speaking_style : [generatedPersona.speaking_style]).map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#a78bfa", paddingLeft: 8 }}>• {s}</div>
                  ))}
                </div>
              )}
              {generatedPersona.avoid_list && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Never do</div>
                  {(Array.isArray(generatedPersona.avoid_list) ? generatedPersona.avoid_list : [generatedPersona.avoid_list]).map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#ef4444", paddingLeft: 8 }}>✗ {s}</div>
                  ))}
                </div>
              )}
              {generatedPersona.sample_greeting && (
                <div style={{ background: "#111118", border: "1px solid #2e2e3e", borderRadius: 8, padding: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, color: "#555", marginBottom: 4 }}>SAMPLE GREETING</div>
                  <div style={{ fontSize: 13, color: "#e8e8f0", fontStyle: "italic" }}>"{generatedPersona.sample_greeting}"</div>
                </div>
              )}
              {generatedPersona.brand_voice_match && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {(Array.isArray(generatedPersona.brand_voice_match) ? generatedPersona.brand_voice_match : []).map((b, i) => (
                    <span key={i} style={S.tag("#10b981")}>{b}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          {!generatedPersona && (
            <div style={{ ...S.card, textAlign: "center", color: "#555", padding: "40px 20px" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 13 }}>Configure persona settings and generate your AI voice profile</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── INTEGRATIONS & SETTINGS ─────────────────────────────────────────────────
function IntegrationsSettings() {
  const [apiKey, setApiKey] = useState("");
  const [twilioSid, setTwilioSid] = useState("");
  const [crmType, setCrmType] = useState("hubspot");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("integrations");

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const integrations = [
    { name: "HubSpot CRM", icon: "🟠", status: "connected", desc: "Contacts, deals, activity log sync" },
    { name: "Salesforce", icon: "☁️", status: "available", desc: "Full CRM bidirectional sync" },
    { name: "Zendesk", icon: "🌿", status: "available", desc: "Ticket creation and updates" },
    { name: "Google Calendar", icon: "📅", status: "connected", desc: "Appointment booking and reminders" },
    { name: "Twilio", icon: "📞", status: "connected", desc: "PSTN telephony and SMS" },
    { name: "Deepgram", icon: "🎤", status: "connected", desc: "Real-time STT transcription" },
    { name: "ElevenLabs", icon: "🔊", status: "connected", desc: "Text-to-speech synthesis" },
    { name: "Slack", icon: "💬", status: "available", desc: "Escalation alerts and daily digest" },
    { name: "Stripe", icon: "💳", status: "available", desc: "Payment link generation on calls" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 20, letterSpacing: -0.5 }}>Integrations & Settings</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["integrations", "api", "notifications", "team"].map(t => (
          <button key={t} style={{ ...S.btn(activeTab === t ? "primary" : "ghost"), textTransform: "capitalize" }} onClick={() => setActiveTab(t)}>{t}</button>
        ))}
      </div>

      {activeTab === "integrations" && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>Connected Services</div>
            {integrations.map((intg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 20 }}>{intg.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{intg.name}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{intg.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={S.badge(intg.status === "connected" ? "#10b981" : "#555")}>{intg.status}</span>
                  {intg.status === "available" && (
                    <button style={{ ...S.btn("ghost"), padding: "3px 10px", fontSize: 11 }}>Connect</button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div>
            <div style={S.card}>
              <div style={S.cardTitle}>Webhook Config</div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>Post-Call Webhook URL</label>
                <input style={S.input} value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://your-crm.com/webhook/calls" />
                <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>Receives: call_id, caller, duration, sentiment, outcome, transcript, action_items</div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>CRM Type</label>
                <select style={S.select} value={crmType} onChange={e => setCrmType(e.target.value)}>
                  <option value="hubspot">HubSpot</option>
                  <option value="salesforce">Salesforce</option>
                  <option value="zoho">Zoho CRM</option>
                  <option value="pipedrive">Pipedrive</option>
                  <option value="custom">Custom (webhook only)</option>
                </select>
              </div>
              <div style={{ padding: "10px 12px", background: "#111118", borderRadius: 8, border: "1px solid #2e2e3e" }}>
                <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>Auto-pushed to CRM after every call</div>
                {["Call transcript (full)", "Sentiment start/end score", "AI-generated summary", "Action items & follow-up flags", "Emotion classification", "QA score"].map((item, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#555", paddingLeft: 8 }}>• {item}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "api" && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>API Keys</div>
            {[
              { label: "Anthropic API Key (LLM)", value: apiKey, set: setApiKey, placeholder: "sk-ant-..." },
              { label: "Deepgram API Key (STT)", value: "", set: () => {}, placeholder: "••••••••••••••••" },
              { label: "ElevenLabs API Key (TTS)", value: "", set: () => {}, placeholder: "••••••••••••••••" },
              { label: "Twilio Account SID", value: twilioSid, set: setTwilioSid, placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
            ].map((field, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 6 }}>{field.label}</label>
                <input style={S.input} type="password" value={field.value} onChange={e => field.set(e.target.value)} placeholder={field.placeholder} />
              </div>
            ))}
            <button style={{ ...S.btn("primary"), width: "100%" }} onClick={handleSave}>
              {saved ? "✓ Saved" : "Save API Keys"}
            </button>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>NexVoice API Access</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Your API Key</div>
              <div style={{ fontFamily: "monospace", fontSize: 12, background: "#111118", padding: "8px 12px", borderRadius: 6, color: "#a78bfa", letterSpacing: 1 }}>
                nxv_live_xxxxxxxxxxxxxxxxxxxx
              </div>
            </div>
            <div style={{ padding: "10px 12px", background: "#111118", borderRadius: 8, border: "1px solid #2e2e3e" }}>
              <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 6 }}>API Endpoints</div>
              {[
                { method: "POST", path: "/v1/call/inbound" },
                { method: "POST", path: "/v1/call/outbound" },
                { method: "GET",  path: "/v1/calls/:id/transcript" },
                { method: "GET",  path: "/v1/analytics/summary" },
                { method: "POST", path: "/v1/agent/build" },
              ].map((ep, i) => (
                <div key={i} style={{ fontSize: 11, fontFamily: "monospace", color: "#555", marginBottom: 3 }}>
                  <span style={{ color: ep.method === "GET" ? "#10b981" : "#6366f1", marginRight: 6 }}>{ep.method}</span>{ep.path}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div style={S.card}>
          <div style={S.cardTitle}>Alert Configuration</div>
          {[
            { label: "Escalation triggered", desc: "Notify on Slack + email when AI transfers to human", enabled: true },
            { label: "Sentiment drop alert", desc: "Alert when caller sentiment drops below 30 mid-call", enabled: true },
            { label: "Daily analytics digest", desc: "Morning email with call volume, resolution rate, top issues", enabled: true },
            { label: "Compliance flag", desc: "Immediate alert if potential HIPAA/PCI pattern detected", enabled: true },
            { label: "Latency spike", desc: "Alert when P95 latency exceeds 1,200ms", enabled: false },
            { label: "DNC violation attempt", desc: "Immediate alert if campaign attempts to call DNC number", enabled: true },
          ].map((notif, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid #1a1a2a" }}>
              <div>
                <div style={{ fontSize: 13, color: "#ccc", fontWeight: 500 }}>{notif.label}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{notif.desc}</div>
              </div>
              <span style={S.badge(notif.enabled ? "#10b981" : "#555")}>{notif.enabled ? "on" : "off"}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "team" && (
        <div style={S.grid2}>
          <div style={S.card}>
            <div style={S.cardTitle}>Team Members</div>
            {[
              { name: "Ryan", role: "Admin", status: "active" },
              { name: "Alex M.", role: "Agent Supervisor", status: "active" },
              { name: "Jordan P.", role: "QA Reviewer", status: "active" },
            ].map((member, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #1a1a2a" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#a78bfa" }}>
                    {member.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#ccc" }}>{member.name}</div>
                    <div style={{ fontSize: 11, color: "#555" }}>{member.role}</div>
                  </div>
                </div>
                <span style={S.badge("#10b981")}>{member.status}</span>
              </div>
            ))}
            <button style={{ ...S.btn("ghost"), width: "100%", marginTop: 14, fontSize: 13 }}>+ Invite Team Member</button>
          </div>
          <div style={S.card}>
            <div style={S.cardTitle}>White-Glove Onboarding</div>
            {[
              { step: 1, label: "Discovery Call", desc: "30-min session to map your call flows", done: true },
              { step: 2, label: "Voice Persona Build", desc: "Custom agent name, tone, and brand voice", done: true },
              { step: 3, label: "CRM Integration", desc: "Connect your existing tools", done: true },
              { step: 4, label: "Live Testing", desc: "50-call test batch with QA review", done: false },
              { step: 5, label: "Go-Live Support", desc: "Dedicated Slack channel for 30 days", done: false },
              { step: 6, label: "30-Day Tune-Up", desc: "Prompt refinement based on real call data", done: false },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1a1a2a" }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: s.done ? "#10b981" : "#1e1e2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: s.done ? "#fff" : "#555", flexShrink: 0, marginTop: 1 }}>{s.done ? "✓" : s.step}</div>
                <div>
                  <div style={{ fontSize: 13, color: s.done ? "#10b981" : "#888", fontWeight: 500 }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: "#555" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function NexVoiceApp() {
  const [tab, setTab] = useState("liveops");
const [unlocked, setUnlocked] = useState(
  () => localStorage.getItem("nxv_auth") === "true"
);
const [pw, setPw] = useState("");
const [error, setError] = useState(false);
function handleLogin() {
  if (pw === ACCESS_PASSWORD) {
    localStorage.setItem("nxv_auth", "true");
    setUnlocked(true);
  } else {
    setError(true);
  }
}
if (!unlocked) {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0d0d14", border: "1px solid #1e1e2e", borderRadius: 14, padding: 40, width: 320, textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎙️</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>NexVoice AI</div>
        <div style={{ fontSize: 12, color: "#555", marginBottom: 24 }}>Private access only</div>
        <input
          style={{ background: "#111118", border: "1px solid #2e2e3e", borderRadius: 8, padding: "10px 14px", color: "#e8e8f0", fontSize: 14, width: "100%", boxSizing: "border-box", marginBottom: 10 }}
          type="password"
          placeholder="Access password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
        />
        {error && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>Incorrect password</div>}
        <button
          style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" }}
          onClick={handleLogin}
        >
          Enter
        </button>
      </div>
    </div>
  );
}
  const navGroups = [
    {
      label: "Operations",
      items: [
        { id: "liveops",    icon: "📡", label: "Live Ops" },
        { id: "outbound",   icon: "📤", label: "Outbound" },
        { id: "transcripts",icon: "📋", label: "Transcripts & QA" },
      ]
    },
    {
      label: "Build",
      items: [
        { id: "builder",    icon: "🤖", label: "Agent Builder" },
        { id: "personas",   icon: "🎙️", label: "Voice Personas" },
      ]
    },
    {
      label: "Intelligence",
      items: [
        { id: "analytics",  icon: "📊", label: "Analytics" },
        { id: "roi",        icon: "💰", label: "ROI Calculator" },
      ]
    },
    {
      label: "Platform",
      items: [
        { id: "compliance", icon: "🛡️", label: "Compliance" },
        { id: "settings",   icon: "⚙️", label: "Integrations" },
      ]
    },
  ];

  const allNav = navGroups.flatMap(g => g.items);
  const currentLabel = allNav.find(n => n.id === tab)?.label || "Dashboard";

  return (
    <div style={S.app}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2e2e3e; border-radius: 4px; }
        input[type=range] { accent-color: #8b5cf6; }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; outline: none; }
        select option { background: #111118; }
      `}</style>

      {/* Sidebar */}
      <div style={S.sidebar}>
        <div style={S.logo}>
          <div style={S.logoMark}>
            <div style={S.logoIcon}>🎙️</div>
            <div>
              <div style={S.logoText}>NexVoice</div>
              <div style={S.logoSub}>AI Voice Platform</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, flex: 1, overflow: "auto" }}>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <div style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", padding: "10px 20px 4px" }}>
                {group.label}
              </div>
              {group.items.map(n => (
                <div key={n.id} style={S.navItem(tab === n.id)} onClick={() => setTab(n.id)}>
                  <span style={{ fontSize: 15 }}>{n.icon}</span>
                  <span>{n.label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 20px 0" }}>
          <div style={{ background: "#111118", border: "1px solid #1e1e2e", borderRadius: 8, padding: 12 }}>
            <div style={{ fontSize: 10, color: "#a78bfa", fontWeight: 700, marginBottom: 6, letterSpacing: 0.8 }}>STACK STATUS</div>
            {[
              { name: "Deepgram Nova-3", ok: true },
              { name: "Claude Sonnet",   ok: true },
              { name: "ElevenLabs Flash",ok: true },
              { name: "Telnyx SIP",      ok: true },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: s.ok ? "#10b981" : "#ef4444", flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "#555" }}>{s.name}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #1e1e2e", fontSize: 10, color: "#555" }}>
              ~780ms avg pipeline
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={S.main}>
        <div style={S.header}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{currentLabel}</div>
            <div style={{ fontSize: 11, color: "#444" }}>NexVoice AI · Real API calls powered by Claude</div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={S.badge("#10b981")}>● All Systems Operational</span>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#a78bfa" }}>R</div>
          </div>
        </div>

        <div style={S.content}>
          {tab === "liveops"     && <LiveOps />}
          {tab === "outbound"    && <OutboundCampaign />}
          {tab === "transcripts" && <TranscriptsQA />}
          {tab === "builder"     && <AgentBuilder />}
          {tab === "personas"    && <VoicePersonaStudio />}
          {tab === "analytics"   && <AnalyticsDashboard />}
          {tab === "roi"         && <ROICalculator />}
          {tab === "compliance"  && <ComplianceCenter />}
          {tab === "settings"    && <IntegrationsSettings />}
        </div>
      </div>
    </div>
  );
}
