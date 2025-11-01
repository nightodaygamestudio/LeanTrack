// LeanTrack App (React, JSX via Babel)
// Tabs: Heute / Trends / Ziele
// Persistenz: localStorage

const { useState, useEffect } = React;

// ---------- Storage Helpers ----------
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));

// ---------- Utils ----------
const todayISO = () => new Date().toISOString().split("T")[0];

// ---------- Components ----------
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
        placeholder={placeholder}
        value={value}
        onChange={(e)=> onChange(e.target.value)}
      />
    </div>
  );
}

function Today({ state, setState }) {
  const { weight, calories, water, protein } = state;

  return (
    <div className="screen">
      <h2>Heute</h2>
      <div className="card-group">
        <NumberInput
          label="Gewicht (kg)"
          value={weight}
          placeholder="z. B. 88.9"
          onChange={(v)=> setState(s=>({...s, weight: v}))}
        />
        <NumberInput
          label="Kalorien"
          value={calories}
          placeholder="z. B. 1800"
          onChange={(v)=> setState(s=>({...s, calories: v}))}
        />
        <div className="card-input">
          <label>Wasser (ml)</label>
          <input
            type="number"
            placeholder="z. B. 1500"
            value={water}
            onChange={(e)=> setState(s=>({...s, water: e.target.value}))}
          />
          <div style={{display:"flex", gap:8, marginTop:8}}>
            {[250, 500].map(inc=> (
              <button
                key={inc}
                className="btn"
                onClick={()=> setState(s=>({...s, water: String((Number(s.water)||0)+inc)}))}
              >
                +{inc} ml
              </button>
            ))}
          </div>
        </div>
        <NumberInput
          label="Protein (g)"
          value={protein}
          placeholder="z. B. 150"
          onChange={(v)=> setState(s=>({...s, protein: v}))}
        />
      </div>
    </div>
  );
}

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

function Goals({ goals, setGoals }) {
  return (
    <div className="screen">
      <h2>Ziele</h2>
      <div className="card-group">
        <NumberInput
          label="Tägliche Kalorien (kcal)"
          value={goals.dailyCalories}
          placeholder="z. B. 2000"
          onChange={(v)=> setGoals(g=>({...g, dailyCalories: v}))}
        />
        <NumberInput
          label="Tägliches Wasser (ml)"
          value={goals.dailyWaterMl}
          placeholder="z. B. 2000"
          onChange={(v)=> setGoals(g=>({...g, dailyWaterMl: v}))}
        />
        <NumberInput
          label="Tägliches Protein (g)"
          value={goals.dailyProteinG}
          placeholder="z. B. 120"
          onChange={(v)=> setGoals(g=>({...g, dailyProteinG: v}))}
        />
        <NumberInput
          label="Zielgewicht (kg)"
          value={goals.targetWeightKg}
          placeholder="z. B. 80"
          onChange={(v)=> setGoals(g=>({...g, targetWeightKg: v}))}
        />
      </div>
    </div>
  );
}

// ---------- App Root ----------
function App() {
  const [tab, setTab] = useState("today");

  // Tageswerte
  const [state, setState] = useState({
    weight: load("weight", ""),
    calories: load("calories", ""),
    water: load("water", ""),
    protein: load("protein", "")
  });

  // Ziele
  const [goals, setGoals] = useState(load("goals", {
    dailyCalories: "2000",
    dailyWaterMl: "2000",
    dailyProteinG: "120",
    targetWeightKg: ""
  }));

  // Historie (Gewicht)
  const [weightHistory, setWeightHistory] = useState(load("weightHistory", []));

  // Persistenz
  useEffect(()=> save("weight", state.weight), [state.weight]);
  useEffect(()=> save("calories", state.calories), [state.calories]);
  useEffect(()=> save("water", state.water), [state.water]);
  useEffect(()=> save("protein", state.protein), [state.protein]);
  useEffect(()=> save("goals", goals), [goals]);

  // Automatisches Tagesgewicht-Logging
  useEffect(()=>{
    if (!state.weight) return;
    const date = todayISO();
    const list = load("weightHistory", []);
    const updated = [...list.filter(x=>x.date!==date), { date, value: state.weight }];
    setWeightHistory(updated);
    save("weightHistory", updated);
  }, [state.weight]);

  return (
    <div className="app-wrapper">
      {tab === "today"  && <Today state={state} setState={setState} /> }
      {tab === "trends" && <Trends weightHistory={weightHistory} /> }
      {tab === "goals"  && <Goals goals={goals} setGoals={setGoals} /> }

      <div className="bottom-nav">
        <TabButton label="Heute"  active={tab==="today"}  onClick={()=>setTab("today")} />
        <TabButton label="Trends" active={tab==="trends"} onClick={()=>setTab("trends")} />
        <TabButton label="Ziele"  active={tab==="goals"}  onClick={()=>setTab("goals")} />
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
