// LeanTrack App (React + JSX via Babel)
// Tabs: Heute / Trends / Ziele / Install
// Persistenz: localStorage
// Onboarding: Name, Alter, Größe, Startgewicht, Zielgewicht + BMI
// Theme-Handover (leantrack_theme_lp + lt_theme)
// Tracking: Gewicht, Kalorien, Wasser, Protein, Schritte, Minuten, KM
// Splash: Beim 2. Start, mit persönlicher Begrüßung
// NEU: Tagesdatum lokal (nicht UTC) + automatischer Mitternachts-Rollover

const { useState, useEffect, useMemo } = React;

/* ---------- Storage Helpers ---------- */
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

/* ---------- Lokales ISO-Datum (YYYY-MM-DD, nicht UTC) ---------- */
const pad2 = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
};

/* ---------- Keys ---------- */
const STORAGE = {
  profile: 'lt_profile',
  goals: 'lt_goals',
  day: 'lt_day_',            // lt_day_YYYY-MM-DD → { weight, calories, water, protein, steps, minutes, distanceKm }
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

/** kcal verbrannt (≈) – Priorität: Distanz > Minuten (MET 3.3) > Schritte */
function estimateActivityKcal({ weightKg, distanceKm, minutes, steps }){
  const w = Number(weightKg) || 0;
  const d = Number(distanceKm) || 0;
  const m = Number(minutes) || 0;
  const s = Number(steps) || 0;

  if (w <= 0) {
    if (d) return Math.round(d * 55);
    if (s) return Math.round(s * 0.04);
    if (m) return Math.round(m * 2.5);
    return 0;
  }

  if (d > 0) return Math.max(0, Math.round(w * 0.8 * d));
  if (m > 0) return Math.max(0, Math.round((3.3 * 3.5 * w / 200) * m));
  if (s > 0) {
    const estKm = s * 0.00075;
    return Math.max(0, Math.round(w * 0.8 * estKm));
  }
  return 0;
}

/** Alle lt_day_*-Einträge laden und NEUSTE zuerst sortieren */
function loadAllDaysSortedDesc(){
  const days = [];
  for (let i=0; i<localStorage.length; i++){
    const k = localStorage.key(i);
    if (k && k.startsWith(STORAGE.day)){
      const date = k.replace(STORAGE.day, "");
      try {
        const obj = JSON.parse(localStorage.getItem(k)) || {};
        days.push({ date, ...obj });
      } catch {}
    }
  }
  return days.sort((a,b)=> b.date.localeCompare(a.date));
}

/** Datum „YYYY-MM-DD“ → „DD. Mon YYYY“ (de) */
function formatDateDE(iso){
  if (!iso || typeof iso !== 'string' || iso.length < 10) return iso || '';
  const [y,m,d] = iso.split('-');
  const months = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  const mm = Math.max(1, Math.min(12, parseInt(m,10)));
  return `${d}. ${months[mm-1]} ${y}`;
}

/** Theme (Landing ↔ App konsistent) */
function getStoredTheme(){
  try { return localStorage.getItem("leantrack_theme_lp") || localStorage.getItem("lt_theme") || "system"; }
  catch { return "system"; }
}
function applyTheme(t){
  try {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("leantrack_theme_lp", t);
    localStorage.setItem("lt_theme", t);
  } catch {}
}

/** Greeting */
function greet(){
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  if (h < 22) return "Guten Abend";
  return "Gute Nacht";
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
          const g = load(STORAGE.goals, { dailyCalories:"2000", dailyWaterMl:"2000", dailyProteinG:"120", targetWeightKg });
          g.targetWeightKg = targetWeightKg;
          save(STORAGE.goals, g);
          localStorage.setItem("lt_welcomed", "0");
          onComplete();
        }}>Fertig</button>
    </div>
  );
}

/* ---------- Today ---------- */
function GoalProgress({ profile, goals, currentWeight }){
  const start = Number(profile?.startWeightKg);
  const target = Number(goals?.targetWeightKg);
  const current = Number(currentWeight || start);
  if (!start || !target) return <div className="muted">Bitte Start- und Zielgewicht setzen.</div>;
  const total = start - target;
  const done  = Math.max(0, start - current);
  const pct   = Math.max(0, Math.min(100, Math.round((done/total)*100)));
  return (
    <div>
      <div className="muted" style={{marginBottom:6}}>
        {done.toFixed(1)} kg von {total.toFixed(1)} kg erreicht ({pct}%)
      </div>
      <div style={{height:12, background:"var(--stroke)", borderRadius:999}}>
        <div style={{width:pct+"%", height:"100%", background:"var(--success)", borderRadius:999}}></div>
      </div>
    </div>
  );
}

function Today({ state, setState, profile, goals }){
  const { weight, calories, water, protein, steps, minutes, distanceKm } = state;

  const bmi = calcBMI(weight || profile?.startWeightKg, profile?.heightCm);
  const kcalBurn = estimateActivityKcal({ weightKg: weight || profile?.startWeightKg, distanceKm, minutes, steps });

  return (
    <div className="screen">
      <h2>Heute</h2>

      <div className="card-group">
        <NumberInput label="Gewicht (kg)" value={weight} placeholder="z. B. 88.9"
          onChange={(v)=> setState(s=>({...s, weight:v}))} />

        {/* Kalorien */}
        <div className="card-input">
          <label>Kalorien (heute)</label>
          <input type="number" placeholder="z. B. 600" value={calories ?? ""} onChange={(e)=> setState(s=>({...s, calories:e.target.value}))} />
          <div style={{display:"flex", gap:8, marginTop:8, flexWrap:"wrap"}}>
            {[100,250,500].map(inc=>(
              <button key={inc} className="btn" onClick={()=> setState(s=>({...s, calories:String((Number(s.calories)||0)+inc)}))}>+{inc}</button>
            ))}
            {Number(calories)>0 && (
              <button className="btn" onClick={()=> setState(s=>({...s, calories:String(Math.max(0,(Number(s.calories)||0)-100))}))}>-100</button>
            )}
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar value={Number(calories)||0} max={Number(goals?.dailyCalories)||0} unit="kcal" />
          </div>
        </div>

        {/* Wasser */}
        <div className="card-input">
          <label>Wasser (ml)</label>
          <input type="number" placeholder="z. B. 1500" value={water ?? ""} onChange={(e)=> setState(s=>({...s, water:e.target.value}))} />
          <div style={{display:"flex", gap:8, marginTop:8, flexWrap:"wrap"}}>
            {[250,500].map(inc=>(
              <button key={inc} className="btn" onClick={()=> setState(s=>({...s, water:String((Number(s.water)||0)+inc)}))}>+{inc} ml</button>
            ))}
            {Number(water)>0 && (
              <button className="btn" onClick={()=> setState(s=>({...s, water:String(Math.max(0,(Number(s.water)||0)-250))}))}>-250 ml</button>
            )}
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar value={Number(water)||0} max={Number(goals?.dailyWaterMl)||0} unit="ml" />
          </div>
        </div>

        {/* Protein */}
        <div className="card-input">
          <label>Protein (g)</label>
          <input type="number" placeholder="z. B. 150" value={protein ?? ""} onChange={(e)=> setState(s=>({...s, protein:e.target.value}))} />
          <div style={{display:"flex", gap:8, marginTop:8, flexWrap:"wrap"}}>
            {[10,25,50].map(inc=>(
              <button key={inc} className="btn" onClick={()=> setState(s=>({...s, protein:String((Number(s.protein)||0)+inc)}))}>+{inc} g</button>
            ))}
            {Number(protein)>0 && (
              <button className="btn" onClick={()=> setState(s=>({...s, protein:String(Math.max(0,(Number(s.protein)||0)-10))}))}>-10 g</button>
            )}
          </div>
          <div style={{marginTop:10}}>
            <ProgressBar value={Number(protein)||0} max={Number(goals?.dailyProteinG)||0} unit="g" />
          </div>
        </div>

        {/* Aktivität */}
        <div className="card-input">
          <label>Aktivität (Gehen/Spazieren)</label>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
            <input type="number" placeholder="Schritte" value={steps ?? ""} onChange={(e)=> setState(s=>({...s, steps:e.target.value}))} />
            <input type="number" placeholder="Minuten" value={minutes ?? ""} onChange={(e)=> setState(s=>({...s, minutes:e.target.value}))} />
            <input type="number" placeholder="km" value={distanceKm ?? ""} onChange={(e)=> setState(s=>({...s, distanceKm:e.target.value}))} />
            <div style={{display:"flex", alignItems:"center"}} className="muted">Schätzung, basierend auf Gewicht & Eingaben.</div>
          </div>
          <div style={{marginTop:10}} className="muted">Verbrannt (≈): <strong>{kcalBurn}</strong> kcal</div>
        </div>
      </div>

      <div className="card-group" style={{marginTop:14}}>
        <div className="card-input">
          <label>BMI (heute)</label>
          <div style={{display:"flex", alignItems:"baseline", gap:8}}>
            <div style={{fontSize:26, fontWeight:700}}>{bmi ?? "—"}</div>
            <div className="muted">{bmi ? (bmi < 18.5 ? 'Untergewicht' : bmi < 25 ? 'Normalgewicht' : bmi < 30 ? 'Übergewicht' : 'Adipositas') : "—"}</div>
          </div>
        </div>

        <div className="card-input">
          <label>Gewichts-Fortschritt</label>
          <GoalProgress profile={profile} goals={goals} currentWeight={weight} />
        </div>
      </div>
    </div>
  );
}

/* ---------- Trends (aufklappbare, sortierte Tageskarten mit formatiertem Datum) ---------- */
function Trends(){
  const [expanded, setExpanded] = useState(new Set());
  const days = useMemo(()=> loadAllDaysSortedDesc(), []);

  const toggle = (date) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(date) ? next.delete(date) : next.add(date);
      return next;
    });
  };

  if (days.length === 0) {
    return (
      <div className="screen">
        <h2>Trends</h2>
        <p className="muted">Noch keine Tagesdaten.</p>
      </div>
    );
  }

  return (
    <div className="screen">
      <h2>Trends</h2>

      {days.map(d => {
        const open = expanded.has(d.date);
        const kcalBurn = estimateActivityKcal({
          weightKg: d.weight, distanceKm: d.distanceKm, minutes: d.minutes, steps: d.steps
        });

        return (
          <div key={d.date} className="card-group" style={{marginTop:12}}>
            <div className="card-input card-collapsible">
              <button
                className="collapsible-header"
                aria-expanded={open}
                aria-controls={`day-${d.date}`}
                onClick={()=>toggle(d.date)}
              >
                <div className="collapsible-title trend-title">
                  <div className="trend-date">{formatDateDE(d.date)}</div>
                  <div className="trend-hint">Tippen für mehr Infos</div>
                </div>
                <span className={"chevron" + (open ? " rotate" : "")}>▾</span>
              </button>

              <div
                id={`day-${d.date}`}
                className={"collapsible-body" + (open ? " open" : "")}
                role="region"
                aria-hidden={!open}
              >
                <div className="collapsible-grid">
                  <div className="kv"><span className="k">Gewicht</span><span className="v">{d.weight ? `${d.weight} kg` : "—"}</span></div>
                  <div className="kv"><span className="k">Kalorien</span><span className="v">{d.calories ? `${d.calories} kcal` : "—"}</span></div>
                  <div className="kv"><span className="k">Wasser</span><span className="v">{d.water ? `${d.water} ml` : "—"}</span></div>
                  <div className="kv"><span className="k">Protein</span><span className="v">{d.protein ? `${d.protein} g` : "—"}</span></div>
                  <div className="kv"><span className="k">Schritte</span><span className="v">{d.steps || 0}</span></div>
                  <div className="kv"><span className="k">Minuten</span><span className="v">{d.minutes || 0}</span></div>
                  <div className="kv"><span className="k">Distanz</span><span className="v">{d.distanceKm ? `${d.distanceKm} km` : "0 km"}</span></div>
                  <div className="kv"><span className="k">Verbrannt (≈)</span><span className="v">{kcalBurn} kcal</span></div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Ziele & Profil (überarbeitet) ---------- */
function Goals({ profile, setProfile, goals, setGoals }){
  // Hilfsfunktionen bleiben unverändert vorhanden: calcBMI(...)
  const startBMI = calcBMI(profile?.startWeightKg, profile?.heightCm);

  return (
    <div className="screen">
      <h2>Ziele & Profil</h2>

      {/* Profil-Bereich */}
      <div className="card-group">
        <TextInput
          label="Name"
          value={profile?.name ?? ""}
          onChange={(v)=> setProfile(p=>({...p, name:v}))}
          placeholder="Max"
        />
        <NumberInput
          label="Alter"
          value={profile?.age ?? ""}
          onChange={(v)=> setProfile(p=>({...p, age:v}))}
          placeholder="30"
        />
        <NumberInput
          label="Größe (cm)"
          value={profile?.heightCm ?? ""}
          onChange={(v)=> setProfile(p=>({...p, heightCm:v}))}
          placeholder="180"
        />
        <NumberInput
          label="Startgewicht (kg)"
          value={profile?.startWeightKg ?? ""}
          onChange={(v)=> setProfile(p=>({...p, startWeightKg:v}))}
          placeholder="88.9"
        />
      </div>

      {/* Info-Karte: BMI auf Basis Startdaten */}
      <div className="card-group" style={{marginTop:14}}>
        <div className="card-input">
          <label>BMI (Start)</label>
          <div style={{display:'flex', alignItems:'baseline', gap:8}}>
            <div style={{fontSize:26, fontWeight:700}}>{startBMI ?? '—'}</div>
            <div className="muted">
              {startBMI
                ? (startBMI < 18.5 ? 'Untergewicht' : startBMI < 25 ? 'Normalgewicht' : startBMI < 30 ? 'Übergewicht' : 'Adipositas')
                : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Ziele-Bereich */}
      <div className="card-group" style={{marginTop:14}}>
        <NumberInput
          label="Zielgewicht (kg)"
          value={goals?.targetWeightKg ?? ""}
          onChange={(v)=> setGoals(g=>({...g, targetWeightKg:v}))}
          placeholder="80"
        />
        <NumberInput
          label="Tägliche Kalorien (Ziel)"
          value={goals?.dailyCalories ?? ""}
          onChange={(v)=> setGoals(g=>({...g, dailyCalories:v}))}
          placeholder="2000"
        />
        <NumberInput
          label="Tägliches Wasser (ml, Ziel)"
          value={goals?.dailyWaterMl ?? ""}
          onChange={(v)=> setGoals(g=>({...g, dailyWaterMl:v}))}
          placeholder="2000"
        />
        <NumberInput
          label="Tägliches Protein (g, Ziel)"
          value={goals?.dailyProteinG ?? ""}
          onChange={(v)=> setGoals(g=>({...g, dailyProteinG:v}))}
          placeholder="120"
        />
      </div>
    </div>
  );
}

/* ---------- App Install Screen ---------- */
function Install(){
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isiOS = /iPad|iPhone|iPod/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isiOS && !isAndroid;

  return (
    <div className="screen">
      <h2>Als App installieren</h2>
      <div className="card-group">
        {isiOS && (
          <div className="card-input">
            <label>iOS (Safari)</label>
            <ol style={{margin:"6px 0 0 18px"}}>
              <li>Safari öffnen</li>
              <li>Teilen-Icon (⬆️) tippen</li>
              <li>„Zum Home-Bildschirm“ wählen</li>
            </ol>
          </div>
        )}
        {isAndroid && (
          <div className="card-input">
            <label>Android (Chrome/Brave)</label>
            <ol style={{margin:"6px 0 0 18px"}}>
              <li>Menü (⋮) tippen</li>
              <li>„Zum Startbildschirm hinzufügen“</li>
            </ol>
          </div>
        )}
        {isDesktop && (
          <div className="card-input">
            <label>Desktop (Chrome/Edge)</label>
            <ol style={{margin:"6px 0 0 18px"}}>
              <li>Installations-Icon in der Adresszeile klicken</li>
            </ol>
          </div>
        )}
        <div className="card-input">
          <label>Hinweis</label>
          <p className="muted">Die App funktioniert vollständig offline. Daten bleiben lokal auf deinem Gerät.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Splash ---------- */
function SplashScreen({ name }){
  return (
    <div className="splash-fullscreen">
      <h1>{greet()}, {name || "du"} 🎉</h1>
    </div>
  );
}

/* ---------- Theme Toggle (🌓) ---------- */
function ThemeToggle(){
  const [mode, setMode] = useState(getStoredTheme()==="dark" ? "dark" : "light");
  useEffect(()=> applyTheme(mode), [mode]);
  return (
    <button className="theme-toggle" aria-label="Theme wechseln" onClick={()=> setMode(mode==="dark" ? "light" : "dark")}>🌓</button>
  );
}

/* ---------- Root ---------- */
const EMPTY_DAY = { weight:"", calories:"", water:"", protein:"", steps:"", minutes:"", distanceKm:"" };

function App(){
  const [tab, setTab] = useState("today");

  // Theme beim Start setzen
  useEffect(()=> { applyTheme(getStoredTheme()); }, []);

  // Aktuelles Datum im State halten (für Mitternachts-Rollover)
  const [currentDate, setCurrentDate] = useState(todayISO());

  // Daten
  const [profile, setProfile] = useState(load(STORAGE.profile, null));
  const [goals, setGoals]     = useState(load(STORAGE.goals, {
    dailyCalories:"2000", dailyWaterMl:"2000", dailyProteinG:"120", targetWeightKg:""
  }));
  const [state, setState]     = useState(load(STORAGE.day + currentDate, { ...EMPTY_DAY }));

  // Persistenz
  useEffect(()=> save(STORAGE.profile, profile), [profile]);
  useEffect(()=> save(STORAGE.goals, goals),     [goals]);
  useEffect(()=> save(STORAGE.day + currentDate, state), [state, currentDate]);

  // Mitternachts-Rollover: alle 60s prüfen, ob Datum gewechselt hat → neuen Tagesstate laden
  useEffect(()=>{
    const id = setInterval(()=>{
      const t = todayISO();
      if (t !== currentDate) {
        setCurrentDate(t);
        setState(load(STORAGE.day + t, { ...EMPTY_DAY }));
      }
    }, 60_000);
    return ()=> clearInterval(id);
  }, [currentDate]);

  // Onboarding
  if (!profile || !profile.name || !profile.heightCm || !profile.startWeightKg) {
    return <Onboarding initial={profile || {}} onComplete={()=> {
      const p = load(STORAGE.profile, null);
      setProfile(p);
    }} />;
  }

  // Splash ab 2. Start
  const [showSplash, setShowSplash] = useState(false);
  useEffect(()=>{
    const f = localStorage.getItem("lt_welcomed") || "0";
    if (f === "0") localStorage.setItem("lt_welcomed","1");
    else if (f === "1"){
      setShowSplash(true);
      localStorage.setItem("lt_welcomed","2");
      setTimeout(()=> setShowSplash(false), 1400);
    }
  }, []);

  return (
    <div className="app-wrapper">
      {showSplash ? (
        <SplashScreen name={profile?.name} />
      ) : (
        <>
          {tab==="today"   && <Today  state={state} setState={setState} profile={profile} goals={goals} /> }
          {tab==="trends"  && <Trends /> }
          {tab==="goals"   && <Goals  profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} /> }
          {tab==="install" && <Install /> }

          <div className="bottom-nav">
            <TabButton label="Heute"        active={tab==="today"}   onClick={()=>setTab("today")} />
            <TabButton label="Trends"       active={tab==="trends"}  onClick={()=>setTab("trends")} />
            <TabButton label="Ziele"        active={tab==="goals"}   onClick={()=>setTab("goals")} />
            <TabButton label="Installieren" active={tab==="install"} onClick={()=>setTab("install")} />
          </div>
        </>
      )}
      <ThemeToggle />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
