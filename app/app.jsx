// LeanTrack App (React + JSX via Babel)
// Tabs: Heute / Trends / Ziele / Install
// Persistenz: localStorage
// Onboarding: Name, Alter, Größe, Startgewicht, Zielgewicht + BMI
// Theme-Handover von Landing (liest leantrack_theme_lp + lt_theme)
// Tracking: Gewicht, Kalorien, Wasser, Protein, Schritte, Minuten, KM
// Splash: Beim 2. Start, mit persönlicher Begrüßung

const { useState, useEffect, useMemo } = React;

/* ---------- Storage Helpers ---------- */
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const todayISO = () => new Date().toISOString().split("T")[0];

/* ---------- Keys ---------- */
const STORAGE = {
  profile: 'lt_profile',
  goals: 'lt_goals',
  day: 'lt_day_',
  weightHistory: 'lt_weight_hist',
  seenLanding: 'lt_seen_landing',
};

/* ---------- Helper ---------- */
function calcBMI(weightKg, heightCm){
  const h = Number(heightCm)/100;
  const w = Number(weightKg);
  if (!h || !w) return undefined;
  return Number((w/(h*h)).toFixed(1));
}

/* kcal verbrannt (≈) */
function estimateActivityKcal({ weightKg, distanceKm, minutes, steps }){
  const w = Number(weightKg) || 80;
  if (distanceKm) return Math.round(distanceKm * 55); // Spaziergang grob 55 kcal / km
  if (steps)      return Math.round(steps * 0.04);   // 0.04 kcal pro Schritt (faustregel)
  if (minutes)    return Math.round(minutes * (w * 0.04)); // leichtes Gehen ~0.04 * kg * min
  return 0;
}

/* ---------- UI Components ---------- */

function TabButton({ label, active, onClick }) {
  return (
    <button className={active ? "tab-btn active" : "tab-btn"} onClick={onClick}>
      {label}
    </button>
  );
}

function NumberInput({ label, value, onChange, placeholder }) {
  return (
    <div className="card-input">
      <label>{label}</label>
      <input
        type="number"
        inputMode="decimal"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={(e)=> onChange(e.target.value)}
      />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }){
  return (
    <div className="card-input">
      <label>{label}</label>
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e)=> onChange(e.target.value)}
      />
    </div>
  );
}

function ProgressBar({ value, max, unit }){
  const v = Math.max(0, Number(value)||0);
  const m = Math.max(0, Number(max)||0);
  const pct = m>0 ? Math.min(100, Math.round((v/m)*100)) : 0;
  return (
    <div>
      <div className="muted" style={{marginBottom:6}}>
        {m>0 ? `${v}${unit? ' '+unit: ''} / ${m}${unit? ' '+unit: ''} (${pct}%)` : 'Kein Ziel gesetzt'}
      </div>
      <div style={{height:12, background:'var(--stroke)', borderRadius:999}}>
        <div style={{width:pct+'%', height:'100%', background:'var(--success)', borderRadius:999}}></div>
      </div>
    </div>
  );
}

/* ---------- Onboarding ---------- */
function Onboarding({ initial, onComplete }){
  const [name, setName] = useState(initial?.name || '');
  const [age, setAge] = useState(initial?.age || '');
  const [heightCm, setHeightCm] = useState(initial?.heightCm || '');
  const [startWeightKg, setStartWeightKg] = useState(initial?.startWeightKg || '');
  const [targetWeightKg, setTargetWeightKg] = useState(load(STORAGE.goals, {targetWeightKg:''})?.targetWeightKg || '');

  const bmi = useMemo(()=> calcBMI(startWeightKg, heightCm), [startWeightKg, heightCm]);
  const ready = name.trim() && heightCm && startWeightKg;

  return (
    <div className="screen">
      <h2>Willkommen bei LeanTrack</h2>
      <p className="muted">Bitte einmalig deine Basisdaten eingeben. Du kannst alles später in „Ziele“ ändern.</p>

      <div className="card-group">
        <TextInput label="Name" value={name} onChange={setName} placeholder="Max" />
        <NumberInput label="Alter" value={age} onChange={setAge} placeholder="30" />
        <NumberInput label="Größe (cm)" value={heightCm} onChange={setHeightCm} placeholder="180" />
        <NumberInput label="Startgewicht (kg)" value={startWeightKg} onChange={setStartWeightKg} placeholder="88.9" />
        <NumberInput label="Zielgewicht (kg)" value={targetWeightKg} onChange={setTargetWeightKg} placeholder="80" />
      </div>

      {bmi && (
        <div className="card-group" style={{marginTop:14}}>
          <div className="card-input">
            <label>BMI</label>
            <div style={{fontSize:26, fontWeight:700}}>{bmi}</div>
          </div>
        </div>
      )}

      <button className="btn primary" disabled={!ready} style={{marginTop:20}}
        onClick={()=>{
          save(STORAGE.profile, { name, age, heightCm, startWeightKg });
          save(STORAGE.goals, load(STORAGE.goals, {}));
          localStorage.setItem("lt_welcomed", "0");
          onComplete();
        }}>Fertig</button>
    </div>
  );
}

/* ---------- Today ---------- */
function Today({ state, setState, profile, goals }) {
  const { weight, calories, water, protein, steps, minutes, distanceKm } = state;
  const kcalBurn = estimateActivityKcal({ weightKg: weight, distanceKm, minutes, steps });

  return (
    <div className="screen">
      <h2>Heute</h2>

      <div className="card-group">
        <NumberInput label="Gewicht (kg)" value={weight} onChange={(v)=> setState(s=>({...s, weight:v}))} />
        <NumberInput label="Kalorien" value={calories} onChange={(v)=> setState(s=>({...s, calories:v}))} />
        <NumberInput label="Wasser (ml)" value={water} onChange={(v)=> setState(s=>({...s, water:v}))} />
        <NumberInput label="Protein (g)" value={protein} onChange={(v)=> setState(s=>({...s, protein:v}))} />
        <NumberInput label="Schritte" value={steps} onChange={(v)=> setState(s=>({...s, steps:v}))} />
        <NumberInput label="Minuten (Spazieren)" value={minutes} onChange={(v)=> setState(s=>({...s, minutes:v}))} />
        <NumberInput label="Distanz (km)" value={distanceKm} onChange={(v)=> setState(s=>({...s, distanceKm:v}))} />
      </div>

      <div className="card-input" style={{marginTop:14}}>
        <label>Verbrannte Kalorien (≈)</label>
        <div style={{fontSize:22, fontWeight:700}}>
          {kcalBurn} kcal
        </div>
      </div>
    </div>
  );
}

/* ---------- Trends (aufklappbare Karten) ---------- */
function Trends(){
  const [expanded, setExpanded] = useState(new Set());
  const days = loadAllDays();

  const toggle = (date) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  return (
    <div className="screen">
      <h2>Trends</h2>

      {days.map(d => {
        const open = expanded.has(d.date);
        const kcalBurn = estimateActivityKcal(d);
        return (
          <div key={d.date} className="card-group" style={{marginTop:12}}>
            <div className="card-input card-collapsible">
              <button className="collapsible-header" aria-expanded={open}
                onClick={()=>toggle(d.date)}>
                <div className="collapsible-title">
                  <strong>{d.date}</strong>
                  <span className="muted">Tippen für mehr Infos</span>
                </div>
                <span className={"chevron" + (open ? " rotate" : "")}>▾</span>
              </button>

              <div className={"collapsible-body" + (open ? " open" : "")}>
                <div className="collapsible-grid">
                  <div className="kv"><span className="k">Gewicht</span><span className="v">{d.weight || "—"} kg</span></div>
                  <div className="kv"><span className="k">Kalorien</span><span className="v">{d.calories || "—"} kcal</span></div>
                  <div className="kv"><span className="k">Wasser</span><span className="v">{d.water || "—"} ml</span></div>
                  <div className="kv"><span className="k">Protein</span><span className="v">{d.protein || "—"} g</span></div>
                  <div className="kv"><span className="k">Schritte</span><span className="v">{d.steps || 0}</span></div>
                  <div className="kv"><span className="k">Minuten</span><span className="v">{d.minutes || 0}</span></div>
                  <div className="kv"><span className="k">Distanz</span><span className="v">{d.distanceKm || 0} km</span></div>
                  <div className="kv"><span className="k">Verbrannt</span><span className="v">{kcalBurn} kcal</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Ziele ---------- */
function Goals({ profile, setProfile, goals, setGoals }){
  return (
    <div className="screen">
      <h2>Ziele</h2>
      <div className="card-group">
        <TextInput label="Name" value={profile?.name} onChange={(v)=> setProfile(p=>({...p, name:v}))} />
        <NumberInput label="Tägliche Kalorien (Ziel)" value={goals.dailyCalories} onChange={(v)=> setGoals(g=>({...g, dailyCalories:v}))} />
        <NumberInput label="Wasser (ml, Ziel)" value={goals.dailyWaterMl} onChange={(v)=> setGoals(g=>({...g, dailyWaterMl:v}))} />
        <NumberInput label="Protein (g, Ziel)" value={goals.dailyProteinG} onChange={(v)=> setGoals(g=>({...g, dailyProteinG:v}))} />
      </div>
    </div>
  );
}

/* ---------- App Install Screen ---------- */
function Install(){
  return (
    <div className="screen">
      <h2>App installieren</h2>
      <p className="muted">So fügst du LeanTrack zum Startbildschirm hinzu:</p>

      <div className="card-group" style={{marginTop:12}}>
        <div className="card-input">
          <label>iOS (Safari)</label>
          <ul style={{marginLeft:18}}>
            <li>Teilen-Icon</li>
            <li>„Zum Home-Bildschirm“</li>
          </ul>
        </div>
        <div className="card-input">
          <label>Android (Chrome/Brave)</label>
          <ul style={{marginLeft:18}}>
            <li>⋮ Menü öffnen</li>
            <li>„Zum Startbildschirm hinzufügen“</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ---------- Root ---------- */
function App(){
  const [tab, setTab] = useState("today");

  const [profile, setProfile] = useState(load(STORAGE.profile, null));
  const [goals, setGoals] = useState(load(STORAGE.goals,{
    dailyCalories: "2000", dailyWaterMl:"2000", dailyProteinG:"120"
  }));

  const [state, setState] = useState(load(STORAGE.day + todayISO(), {
    weight: '', calories:'', water:'', protein:'', steps:'', minutes:'', distanceKm:''
  }));

  useEffect(()=> save(STORAGE.profile, profile), [profile]);
  useEffect(()=> save(STORAGE.goals, goals), [goals]);
  useEffect(()=> save(STORAGE.day + todayISO(), state), [state]);

  if (!profile) return <Onboarding onComplete={()=> setProfile(load(STORAGE.profile))} />;

  return (
    <div className="app-wrapper">
      {tab === "today"  && <Today state={state} setState={setState} profile={profile} goals={goals} />}
      {tab === "trends" && <Trends />}
      {tab === "goals"  && <Goals profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} />}
      {tab === "install" && <Install />}

      <div className="bottom-nav">
        <TabButton label="Heute" active={tab==="today"}  onClick={()=>setTab("today")} />
        <TabButton label="Trends" active={tab==="trends"} onClick={()=>setTab("trends")} />
        <TabButton label="Ziele" active={tab==="goals"}  onClick={()=>setTab("goals")} />
        <TabButton label="App"   active={tab==="install"} onClick={()=>setTab("install")} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);

/* Splash bleibt unverändert */
