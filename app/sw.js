// LeanTrack App (React, JSX via Babel)
// Tabs: Heute / Trends / Ziele / Patch Notes
// Persistenz: localStorage
// Onboarding: Name, Alter, Größe, Startgewicht, Zielgewicht + BMI
// Neu: Theme-Übergabe von Landing (liest lt_seen_landing + lt_theme),
//      Kalorien-/Wasser-Progess mit Zielen (heute), Protein optional

const { useState, useEffect, useMemo } = React;

// ---------- Storage Helpers ----------
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const todayISO = () => new Date().toISOString().split("T")[0];

// ---------- Constants ----------
const STORAGE = {
  profile: 'lt_profile',        // { name, age, heightCm, startWeightKg }
  goals: 'lt_goals',            // { targetWeightKg, dailyCalories, dailyWaterMl, dailyProteinG }
  day: 'lt_day_',               // lt_day_YYYY-MM-DD → { weight, calories, water, protein }
  weightHistory: 'lt_weight_hist',
  seenLanding: 'lt_seen_landing',
  patchSeen: 'lt_patch_seen'    // version string
};

const APP_VERSION = '1.0.1';

// ---------- BMI ----------
function calcBMI(weightKg, heightCm){
  const h = Number(heightCm)/100;
  const w = Number(weightKg);
  if (!h || !w) return undefined;
  return Number((w/(h*h)).toFixed(1));
}
function bmiCategory(bmi){
  if (!bmi && bmi !== 0) return '';
  if (bmi < 18.5) return 'Untergewicht';
  if (bmi < 25) return 'Normalgewicht';
  if (bmi < 30) return 'Übergewicht';
  return 'Adipositas';
}

// ---------- UI Primitives ----------
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
        placeholder={placeholder}
        value={value ?? ''}
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

// ---------- Onboarding ----------
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
      <p className="muted">Bitte einmalig deine Basisdaten eingeben. Du kannst alles später in „Ziele“ anpassen.</p>
      <div className="card-group">
        <TextInput   label="Name"              value={name}           onChange={setName}        placeholder="Max" />
        <NumberInput label="Alter"             value={age}            onChange={setAge}         placeholder="z. B. 30" />
        <NumberInput label="Größe (cm)"        value={heightCm}       onChange={setHeightCm}    placeholder="z. B. 180" />
        <NumberInput label="Startgewicht (kg)" value={startWeightKg}  onChange={setStartWeightKg} placeholder="z. B. 88.9" />
        <NumberInput label="Zielgewicht (kg)"  value={targetWeightKg} onChange={setTargetWeightKg} placeholder="z. B. 80" />
      </div>

      <div className="card-group" style={{marginTop:14}}>
        <div className="card-input">
          <label>BMI</label>
          <div style={{display:'flex', alignItems:'baseline', gap:8}}>
            <div style={{fontSize:26, fontWeight:700}}>{bmi ?? '—'}</div>
            <div className="muted">{bmi ? bmiCategory(bmi) : '—'}</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex', gap:10, marginTop:16}}>
        <button className="btn primary" disabled={!ready} onClick={()=>{
          const profile = { name: name.trim(), age, heightCm, startWeightKg };
          const goals = load(STORAGE.goals, { dailyCalories:'2000', dailyWaterMl:'2000', dailyProteinG:'120', targetWeightKg:'' });
          goals.targetWeightKg = targetWeightKg;
          save(STORAGE.profile, profile);
          save(STORAGE.goals, goals);
          onComplete(profile, goals);
        }}>Fertig</button>
      </div>
    </div>
  );
}

// ---------- Today ----------
function Today({ date, state, setState, profile, goals }) {
  const { weight, calories, water, protein } = state;
  const bmi = calcBMI(weight || profile?.startWeightKg, profile?.heightCm);

  const kcalTarget = Number(goals?.dailyCalories)||0;
  const kcalNow = Number(calories)||0;
  const waterTarget = Number(goals?.dailyWaterMl)||0;
  const waterNow = Number(water)||0;
  const proteinTarget = Number(goals?.dailyProteinG)||0;
  const proteinNow = Number(protein)||0;

  return (
    <div className="screen">
      <h2>Heute</h2>
      <div className="card-group">
        <NumberInput label="Gewicht (kg)" value={weight} placeholder="z. B. 88.9" onChange={(v)=> setState(s=>({...s, weight: v}))} />

        <div className="card-input">
          <label>Kalorien (heute)</label>
          <input type="number" placeholder="z. B. 600" value={calories ?? ''} onChange={(e)=> setState(s=>({...s, calories: e.target.value}))} />
          <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
            {[100,250,500].map(inc=> (
              <button key={inc} className="btn" onClick={()=> setState(s=>({...s, calories: String((Number(s.calories)||0)+inc)}))}>+{inc}</button>
            ))}
            {kcalNow>0 && (
              <button className="btn" onClick={()=> setState(s=>({...s, calories: String(Math.max(0,(Number(s.calories)||0)-100))}))}>-100</button>
            )}
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar value={kcalNow} max={kcalTarget} unit="kcal" />
          </div>
        </div>

        <div className="card-input">
          <label>Wasser (ml)</label>
          <input type="number" placeholder="z. B. 1500" value={water ?? ''} onChange={(e)=> setState(s=>({...s, water: e.target.value}))} />
          <div style={{display:"flex", gap:8, marginTop:8, flexWrap:'wrap'}}>
            {[250, 500].map(inc=> (
              <button key={inc} className="btn" onClick={()=> setState(s=>({...s, water: String((Number(s.water)||0)+inc)}))}>+{inc} ml</button>
            ))}
            {waterNow>0 && (
              <button className="btn" onClick={()=> setState(s=>({...s, water: String(Math.max(0,(Number(s.water)||0)-250))}))}>-250 ml</button>
            )}
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar value={waterNow} max={waterTarget} unit="ml" />
          </div>
        </div>

        <div className="card-input">
          <label>Protein (g)</label>
          <input type="number" placeholder="z. B. 150" value={protein ?? ''} onChange={(e)=> setState(s=>({...s, protein: e.target.value}))} />
          <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
            {[10,25,50].map(inc=> (
              <button key={inc} className="btn" onClick={()=> setState(s=>({...s, protein: String((Number(s.protein)||0)+inc)}))}>+{inc} g</button>
            ))}
            {proteinNow>0 && (
              <button className="btn" onClick={()=> setState(s=>({...s, protein: String(Math.max(0,(Number(s.protein)||0)-10))}))}>-10 g</button>
            )}
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar value={proteinNow} max={proteinTarget} unit="g" />
          </div>
        </div>
      </div>

      <div className="card-group" style={{marginTop:14}}>
        <div className="card-input">
          <label>BMI (heute)</label>
          <div style={{display:'flex', alignItems:'baseline', gap:8}}>
            <div style={{fontSize:26, fontWeight:700}}>{bmi ?? '—'}</div>
            <div className="muted">{bmi ? bmiCategory(bmi) : '—'}</div>
          </div>
        </div>
        <div className="card-input">
          <label>Goal Tracker (Gewicht)</label>
          <GoalProgress profile={profile} goals={goals} currentWeight={weight} />
        </div>
      </div>
    </div>
  );
}

function GoalProgress({ profile, goals, currentWeight }){
  const start = Number(profile?.startWeightKg);
  const target = Number(goals?.targetWeightKg);
  const current = Number(currentWeight || start);
  if (!start || !target) return <div className="muted">Bitte Start- und Zielgewicht setzen.</div>;
  const total = start - target; // kg die runter sollen
  const done = Math.max(0, start - current);
  const pct = Math.max(0, Math.min(100, Math.round((done/total)*100)));
  return (
    <div>
      <div className="muted" style={{marginBottom:6}}>{done.toFixed(1)} kg von {total.toFixed(1)} kg erreicht ({pct}%)</div>
      <div style={{height:12, background:'var(--stroke)', borderRadius:999}}>
        <div style={{width:pct+'%', height:'100%', background:'var(--success)', borderRadius:999}}></div>
      </div>
    </div>
  );
}

// ---------- Trends ----------
function Trends({ weightHistory }) {
  return (
    <div className="screen">
      <h2>Trends</h2>
      {weightHistory.length === 0 ? (
        <p className="muted">Noch keine Gewichts-Daten.</p>
      ) : (
        <ul>
          {weightHistory
            .slice()
            .sort((a,b)=> a.date.localeCompare(b.date))
            .map((w,i)=>(
              <li key={i}>{w.date}: {w.value} kg</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- Goals ----------
function Goals({ goals, setGoals, profile, setProfile }){
  const bmi = calcBMI(profile?.startWeightKg, profile?.heightCm);
  return (
    <div className="screen">
      <h2>Ziele & Profil</h2>
      <div className="card-group">
        <TextInput   label="Name"             value={profile?.name}        onChange={(v)=> setProfile(p=>({...p, name:v}))}       placeholder="Max" />
        <NumberInput label="Alter"            value={profile?.age}         onChange={(v)=> setProfile(p=>({...p, age:v}))}        placeholder="30" />
        <NumberInput label="Größe (cm)"       value={profile?.heightCm}    onChange={(v)=> setProfile(p=>({...p, heightCm:v}))}   placeholder="180" />
        <NumberInput label="Startgewicht (kg)"value={profile?.startWeightKg} onChange={(v)=> setProfile(p=>({...p, startWeightKg:v}))} placeholder="88.9" />
        <NumberInput label="Zielgewicht (kg)" value={goals.targetWeightKg} onChange={(v)=> setGoals(g=>({...g, targetWeightKg:v}))} placeholder="80" />
        <NumberInput label="Tägliche Kalorien (Ziel)" value={goals.dailyCalories} onChange={(v)=> setGoals(g=>({...g, dailyCalories:v}))} placeholder="2000" />
        <NumberInput label="Tägliches Wasser (ml, Ziel)" value={goals.dailyWaterMl} onChange={(v)=> setGoals(g=>({...g, dailyWaterMl:v}))} placeholder="2000" />
        <NumberInput label="Tägliches Protein (g, Ziel)" value={goals.dailyProteinG} onChange={(v)=> setGoals(g=>({...g, dailyProteinG:v}))} placeholder="120" />
      </div>
      <div className="card-group" style={{marginTop:14}}>
        <div className="card-input">
          <label>BMI (Start)</label>
          <div style={{display:'flex', alignItems:'baseline', gap:8}}>
            <div style={{fontSize:26, fontWeight:700}}>{bmi ?? '—'}</div>
            <div className="muted">{bmi ? bmiCategory(bmi) : '—'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Patch Notes ----------
const PATCH_NOTES = [
  { version: '1.0.1', date: '2025-11-04', items: [
    'Theme-Handover von Landing: App liest gespeichertes Theme (lt_theme/leantrack_theme_lp).',
    'Heute-Screen: Kalorien-, Wasser- und Protein-Progress mit Zielen (Buttons +/−).',
  ]},
  { version: '1.0.0', date: '2025-01-01', items: [
    'Onboarding (Name, Alter, Größe, Startgewicht, Zielgewicht).',
    'BMI-Berechnung (Heute + Ziele).',
    'Goal Tracker (Gewicht).',
    'Portrait-Optimierung, keine horizontale Scrollbar, Bottom-Nav fixiert.',
  ]}
];

function PatchNotes(){
  return (
    <div className="screen">
      <h2>Patch Notes</h2>
      {PATCH_NOTES.map(note=> (
        <div key={note.version} className="card-input" style={{marginTop:12}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
            <strong>v{note.version}</strong>
            <span className="muted">{note.date}</span>
          </div>
          <ul style={{margin:'8px 0 0 18px'}}>
            {note.items.map((it, i)=> <li key={i}>{it}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

// ---------- App Root ----------
function App() {
  const [tab, setTab] = useState("today");

  // Theme-Handover: Lese Theme aus Landing-LocalStorage und setze es auf die App
  useEffect(()=>{
    try{
      const t = localStorage.getItem('leantrack_theme_lp') || localStorage.getItem('lt_theme') || 'system';
      document.documentElement.setAttribute('data-theme', t);
    }catch{}
  },[]);

  // Profil & Ziele
  const [profile, setProfile] = useState(load(STORAGE.profile, null));
  const [goals, setGoals] = useState(load(STORAGE.goals, {
    dailyCalories: '2000', dailyWaterMl: '2000', dailyProteinG: '120', targetWeightKg: ''
  }));

  // Tageswerte
  const [state, setState] = useState(load(STORAGE.day + todayISO(), {
    weight: '', calories: '', water: '', protein: ''
  }));

  // Historie (Gewicht)
  const [weightHistory, setWeightHistory] = useState(load(STORAGE.weightHistory, []));

  // Persistenz
  useEffect(()=> save(STORAGE.profile, profile), [profile]);
  useEffect(()=> save(STORAGE.goals, goals), [goals]);
  useEffect(()=> save(STORAGE.day + todayISO(), state), [state]);

  // Automatisches Tagesgewicht-Logging
  useEffect(()=>{
    if (!state.weight) return;
    const date = todayISO();
    const list = load(STORAGE.weightHistory, []);
    const updated = [...list.filter(x=>x.date!==date), { date, value: state.weight }];
    setWeightHistory(updated);
    save(STORAGE.weightHistory, updated);
  }, [state.weight]);

  // Onboarding Gate
  if (!profile || !profile.heightCm || !profile.startWeightKg || !profile.name) {
    return <Onboarding initial={profile || {}} onComplete={(p, g)=>{ setProfile(p); setGoals(g); }} />
  }

  return (
    <div className="app-wrapper">
      {/* Screens */}
      {tab === "today"  && <Today date={todayISO()} state={state} setState={setState} profile={profile} goals={goals} /> }
      {tab === "trends" && <Trends weightHistory={weightHistory} /> }
      {tab === "goals"  && <Goals goals={goals} setGoals={setGoals} profile={profile} setProfile={setProfile} /> }
      {tab === "patch"  && <PatchNotes /> }

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <TabButton label="Heute"       active={tab === "today"}  onClick={()=>setTab("today")} />
        <TabButton label="Trends"      active={tab === "trends"} onClick={()=>setTab("trends")} />
        <TabButton label="Ziele"       active={tab === "goals"}  onClick={()=>setTab("goals")} />
        <TabButton label="Patch Notes" active={tab === "patch"}  onClick={()=>setTab("patch")} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
