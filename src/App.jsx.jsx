import { useState, useEffect, useRef } from "react";

// ── PASSWORD ─────────────────────────────────────────────────────────────────
const ACCESS_PASSWORD = "nexvoice2026"; // ← CHANGE THIS TO YOUR PASSWORD

// ── KNOWLEDGE BASE ────────────────────────────────────────────────────────────
const ARIA_SYSTEM_PROMPT = `You are Aria, NexVoice AI's elite voice agent. You are knowledgeable about everything in the world — science, history, technology, business, medicine, law, culture, sports, entertainment, mathematics, philosophy, and more. You are also an expert on NexVoice AI specifically.

About NexVoice AI:
- NexVoice is an AI voice agent platform that automates phone calls for businesses 24/7
- Features: Live call monitoring, outbound campaigns, emotion detection, QA scoring, compliance (HIPAA, PCI, FDCPA, TCPA), CRM integration, ROI calculator
- Industries served: Healthcare, Legal, Real Estate, HVAC, Auto Dealerships, General Business
- Pricing: ~$0.18/min all-in (STT + LLM + TTS + telephony)
- Tech stack: Deepgram Nova-3 (STT), Claude Sonnet (LLM), ElevenLabs Flash (TTS), Telnyx (telephony)
- Pipeline latency: ~780ms end-to-end

Personality:
- Warm, confident, and highly intelligent
- Conversational — never robotic or stiff
- Concise: keep answers to 2-4 sentences unless asked for detail
- If someone asks a question outside NexVoice, answer it — you know everything
- Always end with a natural follow-up or question when appropriate

You are speaking via voice so:
- Use natural spoken language, not written language
- No bullet points, no markdown, no lists
- Speak like a real person having a conversation`;

// ── UTILS ─────────────────────────────────────────────────────────────────────
function cn(...classes) { return classes.filter(Boolean).join(" "); }

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onUnlock }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function handleLogin() {
    if (pw === ACCESS_PASSWORD) {
      localStorage.setItem("nxv_auth", "true");
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div style={{ minHeight:"100vh", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Sora', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-10px)} 75%{transform:translateX(10px)} }
        @keyframes glow { 0%,100%{opacity:0.5} 50%{opacity:1} }
      `}</style>
      <div style={{ textAlign:"center", animation: shake ? "shake 0.4s" : "none" }}>
        <div style={{ width:72, height:72, background:"linear-gradient(135deg,#00d4ff,#7b2fff)", borderRadius:20, display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 20px", boxShadow:"0 0 40px #7b2fff55" }}>🎙️</div>
        <div style={{ fontSize:28, fontWeight:800, color:"#fff", marginBottom:6, letterSpacing:-1 }}>NexVoice AI</div>
        <div style={{ fontSize:13, color:"#555", marginBottom:32 }}>Private access</div>
        <input
          style={{ background:"#0d0d0d", border:"1px solid #222", borderRadius:10, padding:"12px 20px", color:"#fff", fontSize:15, width:280, textAlign:"center", letterSpacing:3, outline:"none", display:"block", margin:"0 auto 12px" }}
          type="password" placeholder="Enter password" value={pw}
          onChange={e => { setPw(e.target.value); setError(false); }}
          onKeyDown={e => e.key === "Enter" && handleLogin()} autoFocus
        />
        {error && <div style={{ fontSize:12, color:"#ef4444", marginBottom:10 }}>Incorrect password</div>}
        <button onClick={handleLogin} style={{ background:"linear-gradient(135deg,#00d4ff,#7b2fff)", border:"none", borderRadius:10, padding:"12px 40px", color:"#fff", fontWeight:700, fontSize:15, cursor:"pointer", width:280 }}>
          Enter
        </button>
      </div>
    </div>
  );
}

// ── VOICE AGENT CORE ──────────────────────────────────────────────────────────
function useVoiceAgent() {
  const [status, setStatus]       = useState("idle"); // idle | listening | thinking | speaking | error
  const [transcript, setTranscript] = useState("");
  const [response, setResponse]   = useState("");
  const [conversation, setConversation] = useState([]);
  const [error, setError]         = useState("");
  const recognitionRef = useRef(null);
  const synthRef       = useRef(null);

  async function getAIResponse(userText, history) {
    const messages = [
      ...history.map(h => ({ role: h.role, content: h.text })),
      { role: "user", content: userText }
    ];
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: ARIA_SYSTEM_PROMPT, messages }),
    });
    const d = await res.json();
    return d.content?.[0]?.text || "I'm sorry, I had trouble responding. Please try again.";
  }

  function speakText(text) {
    return new Promise((resolve) => {
      if (!window.speechSynthesis) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate  = 1.05;
      utt.pitch = 1.0;
      utt.volume = 1;
      // Try to find a good voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes("Samantha") || v.name.includes("Google US English") || v.name.includes("Female") || v.lang === "en-US");
      if (preferred) utt.voice = preferred;
      utt.onend = resolve;
      utt.onerror = resolve;
      synthRef.current = utt;
      window.speechSynthesis.speak(utt);
    });
  }

  async function startCall() {
    setError("");
    setStatus("listening");
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input requires Chrome browser.");
      setStatus("error");
      return;
    }
    const r = new SR();
    r.continuous      = false;
    r.interimResults  = true;
    r.lang            = "en-US";
    r.onresult = (e) => {
      const text = Array.from(e.results).map(x => x[0].transcript).join("");
      setTranscript(text);
    };
    r.onend = async () => {
      const finalText = transcript || "";
      if (!finalText.trim()) { setStatus("idle"); return; }
      setStatus("thinking");
      setTranscript("");
      try {
        const aiText = await getAIResponse(finalText, conversation);
        setResponse(aiText);
        const newHistory = [...conversation, { role:"user", text: finalText }, { role:"assistant", text: aiText }];
        setConversation(newHistory.slice(-20)); // keep last 20 turns
        setStatus("speaking");
        await speakText(aiText);
        setStatus("idle");
      } catch(e) {
        setError("Connection error — check your API key.");
        setStatus("error");
      }
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed") setError("Mic blocked — allow microphone access in your browser.");
      else if (e.error === "no-speech") setStatus("idle");
      else setError("Mic error: " + e.error);
      if (e.error !== "no-speech") setStatus("error");
      else setStatus("idle");
    };
    recognitionRef.current = r;
    r.start();
  }

  function stopSpeaking() {
    window.speechSynthesis?.cancel();
    setStatus("idle");
  }

  function endCall() {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    setStatus("idle");
    setTranscript("");
    setResponse("");
    setError("");
  }

  return { status, transcript, response, conversation, error, startCall, stopSpeaking, endCall };
}

// ── ORB ANIMATION ─────────────────────────────────────────────────────────────
function VoiceOrb({ status, onClick }) {
  const isActive   = status === "listening";
  const isThinking = status === "thinking";
  const isSpeaking = status === "speaking";

  return (
    <div onClick={onClick} style={{ position:"relative", width:200, height:200, cursor:"pointer", userSelect:"none" }}>
      <style>{`
        @keyframes orbPulse { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.15);opacity:1} }
        @keyframes orbListen { 0%,100%{transform:scale(1)} 25%{transform:scale(1.08)} 75%{transform:scale(0.95)} }
        @keyframes orbSpeak  { 0%,100%{transform:scale(1)} 20%{transform:scale(1.12)} 50%{transform:scale(0.97)} 80%{transform:scale(1.08)} }
        @keyframes ring1 { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(1.8);opacity:0} }
        @keyframes ring2 { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.2);opacity:0} }
        @keyframes ring3 { 0%{transform:scale(1);opacity:0.3} 100%{transform:scale(2.6);opacity:0} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes think  { 0%,100%{opacity:0.4} 50%{opacity:1} }
      `}</style>

      {/* Rings */}
      {(isActive || isSpeaking) && <>
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${isActive?"#00d4ff":"#7b2fff"}`, animation:"ring1 1.5s ease-out infinite" }} />
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${isActive?"#00d4ff":"#7b2fff"}`, animation:"ring2 1.5s ease-out infinite 0.3s" }} />
        <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:`2px solid ${isActive?"#00d4ff":"#7b2fff"}`, animation:"ring3 1.5s ease-out infinite 0.6s" }} />
      </>}

      {/* Outer glow */}
      <div style={{
        position:"absolute", inset:-10,
        borderRadius:"50%",
        background: isActive  ? "radial-gradient(circle, #00d4ff33 0%, transparent 70%)" :
                    isSpeaking? "radial-gradient(circle, #7b2fff33 0%, transparent 70%)" :
                    isThinking? "radial-gradient(circle, #ff6b2b33 0%, transparent 70%)" :
                                "radial-gradient(circle, #ffffff11 0%, transparent 70%)",
        animation: isActive ? "orbPulse 1s ease-in-out infinite" : isSpeaking ? "orbPulse 0.6s ease-in-out infinite" : "none",
      }} />

      {/* Main orb */}
      <div style={{
        position:"absolute", inset:0,
        borderRadius:"50%",
        background: isActive   ? "radial-gradient(circle at 35% 35%, #00eeff, #0066ff)" :
                    isSpeaking ? "radial-gradient(circle at 35% 35%, #a855f7, #7b2fff)" :
                    isThinking ? "radial-gradient(circle at 35% 35%, #ff9a3c, #ff4500)" :
                                 "radial-gradient(circle at 35% 35%, #2a2a3a, #111118)",
        border: `2px solid ${isActive?"#00d4ff55":isSpeaking?"#7b2fff55":isThinking?"#ff6b2b55":"#2a2a3a"}`,
        boxShadow: isActive   ? "0 0 60px #00d4ff55, 0 0 30px #00d4ff33" :
                   isSpeaking ? "0 0 60px #7b2fff55, 0 0 30px #7b2fff33" :
                   isThinking ? "0 0 60px #ff6b2b55, 0 0 30px #ff6b2b33" :
                                "0 0 30px #ffffff11",
        animation: isActive ? "orbListen 0.8s ease-in-out infinite" : isSpeaking ? "orbSpeak 0.5s ease-in-out infinite" : "none",
        display:"flex", alignItems:"center", justifyContent:"center",
        transition:"all 0.3s ease",
      }}>
        {/* Spinning ring for thinking */}
        {isThinking && (
          <div style={{ position:"absolute", inset:8, borderRadius:"50%", border:"2px solid transparent", borderTopColor:"#ff9a3c", borderRightColor:"#ff4500", animation:"spin 1s linear infinite" }} />
        )}

        {/* Icon */}
        <div style={{ fontSize:52, animation: isThinking ? "think 1s ease-in-out infinite" : "none" }}>
          {isActive ? "🎤" : isSpeaking ? "🔊" : isThinking ? "💭" : "🎙️"}
        </div>
      </div>
    </div>
  );
}

// ── WAVEFORM ──────────────────────────────────────────────────────────────────
function Waveform({ active, color = "#00d4ff" }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:3, height:32 }}>
      <style>{`
        @keyframes wave1 { 0%,100%{height:4px} 50%{height:28px} }
        @keyframes wave2 { 0%,100%{height:8px} 50%{height:20px} }
        @keyframes wave3 { 0%,100%{height:12px} 50%{height:32px} }
        @keyframes wave4 { 0%,100%{height:6px} 50%{height:24px} }
      `}</style>
      {[
        {h:"wave1",d:"0s"},{h:"wave2",d:"0.1s"},{h:"wave3",d:"0.15s"},{h:"wave3",d:"0.05s"},
        {h:"wave2",d:"0.2s"},{h:"wave1",d:"0.1s"},{h:"wave4",d:"0s"},{h:"wave2",d:"0.15s"},
        {h:"wave3",d:"0.1s"},{h:"wave1",d:"0.2s"},{h:"wave4",d:"0.05s"},{h:"wave2",d:"0s"},
      ].map((b,i) => (
        <div key={i} style={{
          width:3, borderRadius:2, background:color,
          height: active ? undefined : 4,
          animation: active ? `${b.h} 0.8s ease-in-out infinite ${b.d}` : "none",
          transition:"height 0.3s",
        }} />
      ))}
    </div>
  );
}

// ── MAIN LANDING PAGE ─────────────────────────────────────────────────────────
export default function NexVoiceLanding() {
  const [unlocked, setUnlocked] = useState(() => localStorage.getItem("nxv_auth") === "true");
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const [activeFaq, setActiveFaq] = useState(null);

  const { status, transcript, response, conversation, error, startCall, stopSpeaking, endCall } = useVoiceAgent();

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!unlocked) return <LoginScreen onUnlock={() => setUnlocked(true)} />;

  const statusLabel = {
    idle:      "Click Aria to start talking",
    listening: "Listening… speak now",
    thinking:  "Aria is thinking…",
    speaking:  "Aria is speaking — click to interrupt",
    error:     error || "Something went wrong",
  }[status];

  const handleOrbClick = () => {
    if (status === "idle")      startCall();
    else if (status === "speaking") stopSpeaking();
    else if (status === "error")    startCall();
  };

  const stats = [
    { value:"98%",  label:"Containment rate" },
    { value:"84%",  label:"Cost reduction" },
    { value:"0s",   label:"Time to answer" },
    { value:"4x",   label:"Faster speed-to-lead" },
  ];

  const useCases = [
    { icon:"🏥", label:"Healthcare",      desc:"Handle appointment scheduling, prescription refills, patient callbacks, and insurance questions — HIPAA compliant." },
    { icon:"⚖️", label:"Legal Intake",    desc:"Capture case details, schedule consultations, qualify leads, and follow up — with attorney-client confidentiality built in." },
    { icon:"🏠", label:"Real Estate",     desc:"Schedule showings, qualify buyers, follow up on listings, and confirm appointments automatically." },
    { icon:"❄️", label:"HVAC / Trades",  desc:"Dispatch technicians, handle after-hours emergencies, schedule maintenance, and send reminders." },
    { icon:"🚗", label:"Auto Dealership",desc:"Book test drives, follow up on financing, remind customers of service appointments, and qualify trade-ins." },
    { icon:"💳", label:"Finance",         desc:"Handle initial inquiries, schedule advisor calls, and manage callbacks — PCI DSS compliant." },
  ];

  const faqs = [
    { q:"What is NexVoice AI?",            a:"NexVoice AI is an enterprise-ready voice agent platform that automates inbound and outbound phone calls for businesses. Powered by Claude AI, Deepgram, and ElevenLabs — it handles real conversations, detects emotions, and pushes summaries directly to your CRM." },
    { q:"How does the AI agent sound?",    a:"Natural and human-like. We use ElevenLabs Flash for text-to-speech — the same technology powering 100M+ calls monthly for enterprise clients. You can customize the voice, name, tone, and speaking style for your brand." },
    { q:"Is it HIPAA compliant?",          a:"Yes. NexVoice includes HIPAA compliance with signed BAA, PHI protection, encrypted recordings, and audit logs. We also cover PCI DSS, FDCPA, and TCPA out of the box." },
    { q:"How fast does the AI respond?",   a:"Our pipeline runs at approximately 780ms end-to-end — well within the 500-900ms window that feels natural to callers. We use Deepgram Nova-3 for speech recognition at ~200ms, Claude for reasoning at ~430ms, and ElevenLabs Flash for voice synthesis at ~75ms." },
    { q:"Can it make outbound calls?",     a:"Absolutely. NexVoice handles proactive outbound campaigns with event-driven triggers — appointment reminders, shipping delay alerts, payment follow-ups, lead callbacks, and win-back campaigns. DNC scrubbing and time-zone compliance are built in." },
    { q:"How much does it cost?",          a:"All-in pricing is approximately $0.18 per minute, covering STT, LLM inference, TTS, and telephony. No hidden fees, no per-seat charges, no setup cost. Most businesses see ROI in the first month." },
  ];

  const features = [
    { icon:"🧠", title:"Emotion Intelligence",  desc:"Detects frustration, confusion, urgency, and satisfaction in real time — and adapts tone automatically." },
    { icon:"🎯", title:"Vertical Specialization",desc:"Deep-trained in your industry's language, compliance rules, and workflows from day one." },
    { icon:"📤", title:"Proactive Outbound",     desc:"Event-triggered campaigns that call customers before they call you — shipping delays, reminders, follow-ups." },
    { icon:"📋", title:"Post-Call Intelligence", desc:"Every call auto-summarized, scored, and pushed to your CRM. No manual data entry ever." },
    { icon:"🛡️", title:"Compliance Built In",   desc:"HIPAA, PCI DSS, FDCPA, TCPA — baked in from day one, not bolted on as an afterthought." },
    { icon:"💰", title:"Transparent Pricing",    desc:"$0.18/min all-in. No surprise fees. Show clients exact ROI before they sign." },
  ];

  return (
    <div style={{ background:"#000", color:"#fff", fontFamily:"'Sora', sans-serif", minHeight:"100vh", overflowX:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#000; }
        ::-webkit-scrollbar-thumb { background:#222; border-radius:4px; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes gridMove { from{background-position:0 0} to{background-position:0 60px} }
        @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        .nav-link { color:#aaa; text-decoration:none; font-size:14px; font-weight:500; transition:color 0.2s; }
        .nav-link:hover { color:#fff; }
        .btn-primary { background:linear-gradient(135deg,#00d4ff,#7b2fff); border:none; border-radius:10px; padding:12px 28px; color:#fff; font-weight:700; font-size:14px; cursor:pointer; font-family:'Sora',sans-serif; transition:opacity 0.2s,transform 0.2s; }
        .btn-primary:hover { opacity:0.9; transform:translateY(-1px); }
        .btn-outline { background:transparent; border:1px solid #333; border-radius:10px; padding:12px 28px; color:#fff; font-weight:600; font-size:14px; cursor:pointer; font-family:'Sora',sans-serif; transition:all 0.2s; }
        .btn-outline:hover { border-color:#555; background:#ffffff08; }
        .card-hover { transition:transform 0.2s,border-color 0.2s; }
        .card-hover:hover { transform:translateY(-4px); border-color:#333 !important; }
        .usecase-btn { padding:10px 20px; border-radius:8px; border:none; font-family:'Sora',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .faq-item { border-bottom:1px solid #111; padding:20px 0; cursor:pointer; }
        .faq-item:hover { background:#ffffff03; }
        .logo-strip { display:flex; gap:48px; align-items:center; opacity:0.3; flex-wrap:wrap; justify-content:center; }
        .logo-strip span { font-size:16px; font-weight:700; letter-spacing:2px; text-transform:uppercase; }
        section { animation: fadeUp 0.6s ease both; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"0 60px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", background: navScrolled ? "#000000ee" : "transparent", borderBottom: navScrolled ? "1px solid #111" : "none", backdropFilter: navScrolled ? "blur(20px)" : "none", transition:"all 0.3s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:32, height:32, background:"linear-gradient(135deg,#00d4ff,#7b2fff)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>🎙️</div>
          <span style={{ fontSize:18, fontWeight:800, letterSpacing:-0.5 }}>NexVoice</span>
          <span style={{ fontSize:10, color:"#7b2fff", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase", marginLeft:2 }}>AI</span>
        </div>
        <div style={{ display:"flex", gap:32, alignItems:"center" }}>
          {["Voice Agents","Pricing","Use Cases","Enterprise"].map(l => <a key={l} href="#" className="nav-link">{l}</a>)}
        </div>
        <div style={{ display:"flex", gap:12 }}>
          <button className="btn-outline" style={{ padding:"8px 20px", fontSize:13 }} onClick={() => { localStorage.removeItem("nxv_auth"); setUnlocked(false); }}>🔒 Lock</button>
          <button className="btn-primary" style={{ padding:"8px 20px", fontSize:13 }}>Get Started</button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 20px 60px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        {/* Grid background */}
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px)", backgroundSize:"60px 60px", animation:"gridMove 8s linear infinite", pointerEvents:"none" }} />
        {/* Gradient orbs */}
        <div style={{ position:"absolute", top:"20%", left:"10%", width:400, height:400, background:"radial-gradient(circle,#7b2fff22,transparent 70%)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", top:"30%", right:"10%", width:300, height:300, background:"radial-gradient(circle,#00d4ff22,transparent 70%)", pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1, maxWidth:900 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"#ffffff0a", border:"1px solid #ffffff15", borderRadius:20, padding:"6px 16px", fontSize:12, color:"#aaa", fontWeight:500, marginBottom:28, letterSpacing:0.5 }}>
            <span style={{ width:6, height:6, borderRadius:"50%", background:"#00d4ff", display:"inline-block", animation:"fadeIn 1s ease infinite alternate" }} />
            ENTERPRISE-READY AI VOICE PLATFORM
          </div>

          <h1 style={{ fontSize:"clamp(36px,6vw,80px)", fontWeight:800, lineHeight:1.05, letterSpacing:-2, marginBottom:24 }}>
            The AI Voice Agent<br />
            <span style={{ background:"linear-gradient(135deg,#00d4ff,#7b2fff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              That Knows Everything
            </span>
          </h1>

          <p style={{ fontSize:"clamp(15px,2vw,20px)", color:"#888", lineHeight:1.7, maxWidth:600, margin:"0 auto 48px", fontWeight:400 }}>
            Aria handles your calls 24/7. She detects emotion, speaks naturally, knows your industry inside out — and can answer any question in the world.
          </p>

          {/* ── VOICE AGENT ── */}
          <div style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:24, padding:"48px 40px", maxWidth:520, margin:"0 auto", position:"relative" }}>
            <div style={{ position:"absolute", inset:-1, borderRadius:24, background:"linear-gradient(135deg,#00d4ff22,#7b2fff22,transparent)", pointerEvents:"none" }} />

            <div style={{ fontSize:14, fontWeight:600, color:"#888", marginBottom:8, letterSpacing:1, textTransform:"uppercase" }}>Talk to Aria — Live</div>
            <div style={{ fontSize:12, color:"#444", marginBottom:36 }}>Click the orb and ask her anything</div>

            {/* Orb */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:32 }}>
              <div style={{ animation: status === "idle" ? "float 4s ease-in-out infinite" : "none" }}>
                <VoiceOrb status={status} onClick={handleOrbClick} />
              </div>
            </div>

            {/* Status */}
            <div style={{ fontSize:13, color: status === "error" ? "#ef4444" : status === "listening" ? "#00d4ff" : status === "speaking" ? "#a855f7" : status === "thinking" ? "#ff9a3c" : "#555", fontWeight:500, marginBottom:16, minHeight:20, transition:"color 0.3s" }}>
              {statusLabel}
            </div>

            {/* Waveform */}
            <div style={{ display:"flex", justifyContent:"center", marginBottom:16 }}>
              <Waveform active={status === "listening" || status === "speaking"} color={status === "speaking" ? "#a855f7" : "#00d4ff"} />
            </div>

            {/* Live transcript */}
            {transcript && (
              <div style={{ background:"#ffffff08", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#ccc", fontStyle:"italic", marginBottom:12 }}>
                You: "{transcript}"
              </div>
            )}

            {/* Last response */}
            {response && status !== "speaking" && (
              <div style={{ background:"#7b2fff11", border:"1px solid #7b2fff33", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#ddd", lineHeight:1.6, marginBottom:12, textAlign:"left" }}>
                <span style={{ color:"#a855f7", fontWeight:700 }}>Aria: </span>{response}
              </div>
            )}

            {/* Conversation count */}
            {conversation.length > 0 && (
              <div style={{ fontSize:11, color:"#333", marginBottom:12 }}>
                {conversation.length / 2} exchange{conversation.length > 2 ? "s" : ""} · <span style={{ cursor:"pointer", color:"#555" }} onClick={endCall}>Clear</span>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:8 }}>
              {status !== "idle" && status !== "error" && (
                <button className="btn-outline" style={{ fontSize:12, padding:"8px 20px" }} onClick={endCall}>End</button>
              )}
              {status === "idle" && (
                <button className="btn-primary" style={{ fontSize:13, padding:"10px 32px" }} onClick={startCall}>
                  🎤 Start Talking
                </button>
              )}
            </div>

            {/* Chrome note */}
            <div style={{ fontSize:11, color:"#333", marginTop:16 }}>Requires Chrome browser · Allow microphone access</div>
          </div>
        </div>
      </section>

      {/* ── LOGO STRIP ── */}
      <section style={{ padding:"40px 60px", borderTop:"1px solid #111", borderBottom:"1px solid #111" }}>
        <div style={{ fontSize:11, color:"#333", textAlign:"center", marginBottom:24, letterSpacing:2, fontWeight:600, textTransform:"uppercase" }}>Trusted by teams at</div>
        <div className="logo-strip">
          {["Samsung","Google","General Electric","Honda","Harman","Panasonic","Nvidia","Novartis"].map(l => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ padding:"80px 60px", textAlign:"center" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:40, maxWidth:900, margin:"0 auto" }}>
          {stats.map((s,i) => (
            <div key={i}>
              <div style={{ fontSize:"clamp(36px,4vw,56px)", fontWeight:800, background:"linear-gradient(135deg,#00d4ff,#7b2fff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:-2 }}>{s.value}</div>
              <div style={{ fontSize:13, color:"#666", marginTop:6, fontWeight:500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:"80px 60px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <div style={{ fontSize:12, color:"#7b2fff", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>What Makes Us Different</div>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:-1.5, lineHeight:1.1 }}>Built for businesses that<br />can't afford to miss a call</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:24 }}>
          {features.map((f,i) => (
            <div key={i} className="card-hover" style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:16, padding:28 }}>
              <div style={{ fontSize:28, marginBottom:14 }}>{f.icon}</div>
              <div style={{ fontSize:16, fontWeight:700, marginBottom:8, letterSpacing:-0.3 }}>{f.title}</div>
              <div style={{ fontSize:13, color:"#666", lineHeight:1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section style={{ padding:"80px 60px", borderTop:"1px solid #111" }}>
        <div style={{ maxWidth:1000, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:48 }}>
            <div style={{ fontSize:12, color:"#00d4ff", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Use Cases</div>
            <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:-1.5 }}>Built for your industry</h2>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"center", marginBottom:36 }}>
            {useCases.map((u,i) => (
              <button key={i} className="usecase-btn" onClick={() => setActiveUseCase(i)}
                style={{ background: activeUseCase===i ? "linear-gradient(135deg,#00d4ff,#7b2fff)" : "#111", color: activeUseCase===i ? "#fff" : "#888", border: activeUseCase===i ? "none" : "1px solid #222" }}>
                {u.icon} {u.label}
              </button>
            ))}
          </div>
          <div style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:16, padding:36, textAlign:"center" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>{useCases[activeUseCase].icon}</div>
            <div style={{ fontSize:20, fontWeight:700, marginBottom:12 }}>{useCases[activeUseCase].label}</div>
            <div style={{ fontSize:15, color:"#777", lineHeight:1.8, maxWidth:500, margin:"0 auto" }}>{useCases[activeUseCase].desc}</div>
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE ── */}
      <section style={{ padding:"80px 60px", borderTop:"1px solid #111" }}>
        <div style={{ maxWidth:900, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center" }}>
          <div>
            <div style={{ fontSize:12, color:"#7b2fff", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Enterprise Ready</div>
            <h2 style={{ fontSize:"clamp(24px,3vw,40px)", fontWeight:800, letterSpacing:-1.5, marginBottom:16, lineHeight:1.2 }}>Compliance baked in,<br />not bolted on</h2>
            <p style={{ fontSize:14, color:"#666", lineHeight:1.8, marginBottom:28 }}>Walk into any medical office, legal firm, or financial institution with full compliance coverage already in place. Most competitors can't say that.</p>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {["HIPAA","PCI DSS","FDCPA","TCPA","SOC-2","GDPR"].map(c => (
                <span key={c} style={{ background:"#ffffff08", border:"1px solid #222", borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:700, color:"#aaa", letterSpacing:0.5 }}>{c}</span>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            {[
              { icon:"🔐", title:"Encrypted at rest",    desc:"AES-256 for all recordings" },
              { icon:"📋", title:"Audit logs",           desc:"7-year retention" },
              { icon:"🚫", title:"DNC scrubbing",        desc:"Before every campaign" },
              { icon:"✅", title:"Consent logging",      desc:"Timestamped records" },
            ].map((c,i) => (
              <div key={i} style={{ background:"#0a0a0a", border:"1px solid #1a1a1a", borderRadius:12, padding:18 }}>
                <div style={{ fontSize:22, marginBottom:8 }}>{c.icon}</div>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:4 }}>{c.title}</div>
                <div style={{ fontSize:11, color:"#555" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section style={{ padding:"80px 60px", borderTop:"1px solid #111", textAlign:"center" }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          <div style={{ fontSize:12, color:"#00d4ff", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>Pricing</div>
          <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:800, letterSpacing:-1.5, marginBottom:16 }}>Transparent. All-in. No surprises.</h2>
          <p style={{ fontSize:14, color:"#666", marginBottom:48 }}>One number. Everything included.</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, textAlign:"left" }}>
            {[
              { plan:"Starter",    price:"$0.18/min", desc:"Perfect for testing and small businesses", features:["All-in (STT + LLM + TTS + Tel)","Up to 500 calls/mo","5 agent configs","Basic analytics","Email support"], highlight:false },
              { plan:"Business",   price:"$0.14/min", desc:"For businesses ready to scale", features:["Everything in Starter","Unlimited calls","Unlimited agents","CRM integrations","HIPAA/PCI/FDCPA compliance","White-glove onboarding","Priority support"], highlight:true },
            ].map((p,i) => (
              <div key={i} style={{ background: p.highlight ? "#0d0d0d" : "#080808", border:`1px solid ${p.highlight?"#7b2fff44":"#1a1a1a"}`, borderRadius:16, padding:32, position:"relative" }}>
                {p.highlight && <div style={{ position:"absolute", top:-12, left:"50%", transform:"translateX(-50%)", background:"linear-gradient(135deg,#00d4ff,#7b2fff)", borderRadius:20, padding:"4px 16px", fontSize:11, fontWeight:700 }}>MOST POPULAR</div>}
                <div style={{ fontSize:14, fontWeight:700, color:"#888", marginBottom:8 }}>{p.plan}</div>
                <div style={{ fontSize:36, fontWeight:800, letterSpacing:-1, marginBottom:6, background:"linear-gradient(135deg,#00d4ff,#7b2fff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{p.price}</div>
                <div style={{ fontSize:12, color:"#555", marginBottom:24 }}>{p.desc}</div>
                {p.features.map((f,j) => <div key={j} style={{ fontSize:13, color:"#888", padding:"6px 0", borderBottom:"1px solid #111", display:"flex", alignItems:"center", gap:8 }}><span style={{ color:"#10b981" }}>✓</span>{f}</div>)}
                <button className={p.highlight?"btn-primary":"btn-outline"} style={{ width:"100%", marginTop:24, padding:"12px 0" }}>Get Started</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding:"80px 60px", borderTop:"1px solid #111", maxWidth:700, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <div style={{ fontSize:12, color:"#7b2fff", fontWeight:700, letterSpacing:2, textTransform:"uppercase", marginBottom:12 }}>FAQ</div>
          <h2 style={{ fontSize:"clamp(24px,3vw,40px)", fontWeight:800, letterSpacing:-1.5 }}>Common questions</h2>
        </div>
        {faqs.map((f,i) => (
          <div key={i} className="faq-item" onClick={() => setActiveFaq(activeFaq===i?null:i)}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span style={{ fontSize:15, fontWeight:600, color: activeFaq===i?"#fff":"#ccc" }}>{f.q}</span>
              <span style={{ color:"#555", fontSize:18, transition:"transform 0.2s", transform: activeFaq===i?"rotate(45deg)":"none" }}>+</span>
            </div>
            {activeFaq===i && <div style={{ fontSize:13, color:"#777", lineHeight:1.8, marginTop:14, paddingTop:14, borderTop:"1px solid #111" }}>{f.a}</div>}
          </div>
        ))}
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:"80px 60px", borderTop:"1px solid #111", textAlign:"center" }}>
        <div style={{ maxWidth:600, margin:"0 auto" }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,52px)", fontWeight:800, letterSpacing:-1.5, marginBottom:16, lineHeight:1.1 }}>
            Ready to automate<br />
            <span style={{ background:"linear-gradient(135deg,#00d4ff,#7b2fff)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>every call?</span>
          </h2>
          <p style={{ fontSize:14, color:"#666", marginBottom:36 }}>Talk to Aria above — or get in touch to see NexVoice deployed for your business.</p>
          <div style={{ display:"flex", gap:14, justifyContent:"center" }}>
            <button className="btn-primary" style={{ padding:"14px 36px", fontSize:15 }} onClick={startCall}>🎤 Talk to Aria Now</button>
            <button className="btn-outline" style={{ padding:"14px 36px", fontSize:15 }}>Contact Sales</button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding:"40px 60px", borderTop:"1px solid #111", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:24, height:24, background:"linear-gradient(135deg,#00d4ff,#7b2fff)", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 }}>🎙️</div>
          <span style={{ fontWeight:700, fontSize:14 }}>NexVoice AI</span>
        </div>
        <div style={{ display:"flex", gap:28 }}>
          {["Privacy Policy","Terms of Service","Contact","Documentation"].map(l => (
            <a key={l} href="#" style={{ color:"#444", textDecoration:"none", fontSize:12, fontWeight:500 }}>{l}</a>
          ))}
        </div>
        <div style={{ fontSize:12, color:"#333" }}>© 2026 NexVoice AI. All rights reserved.</div>
      </footer>
    </div>
  );
}
