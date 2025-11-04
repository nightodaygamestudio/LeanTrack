// LeanTrack – App Core
// Funktionen: Tracking (Kalorien / Wasser / Protein / Gewicht), Ziele, BMI, Trends, Patch Notes
// Extras: Persistenz, Splash-Screen mit persönlicher Begrüßung, Theme-Toggle (🌓)

const { useState, useEffect, useMemo } = React;

// ---------------- Storage Keys ----------------
const STORAGE = {
  profile: "lt_profile",
  goals: "lt_goals",
  day: "lt_day_",
  weightHistory: "lt_weight_hist",
};

// --------------- Helper ----------------
const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
};
const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const todayISO = () => new Date().toISOString().split("T")[0];

// ---------- THEME HANDLING (relevant für Landing + App) ----------
function getStoredTheme() {
  try {
    return (
      localStorage.getItem("leantrack_theme_lp") ||
      localStorage.getItem("lt_theme") ||
      "system"
    );
  } catch {
    return "system";
  }
}

function applyTheme(t) {
  try {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("leantrack_theme_lp", t);
    localStorage.setItem("lt_theme", t);
  } catch {}
}

// --------------- BMI ----------------
function calcBMI(weightKg, heightCm) {
  const h = Number(heightCm) / 100;
  const w = Number(weightKg);
  if (!h || !w) return undefined;
  return Number((w / (h * h)).toFixed(1));
}

function bmiCategory(bmi) {
  if (!bmi && bmi !== 0) return "";
  if (bmi < 18.5) return "Untergewicht";
  if (bmi < 25) return "Normalgewicht";
  if (bmi < 30) return "Übergewicht";
  return "Adipositas";
}

// --------------- Greeting ----------------
function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  if (h < 22) return "Guten Abend";
  return "Gute Nacht";
}

// ************************************************************
//  COMPONENTS
// ************************************************************

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
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="card-input">
      <label>{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ProgressBar({ value, max, unit }) {
  const v = Math.max(0, Number(value) || 0);
  const m = Math.max(0, Number(max) || 0);
  const pct = m > 0 ? Math.min(100, Math.round((v / m) * 100)) : 0;
  return (
    <div>
      <div className="muted" style={{ marginBottom: 6 }}>
        {m > 0
          ? `${v}${unit ? " " + unit : ""} / ${m}${unit ? " " + unit : ""} (${pct}%)`
          : "Kein Ziel gesetzt"}
      </div>
      <div style={{ height: 12, background: "var(--stroke)", borderRadius: 999 }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: "var(--success)",
            borderRadius: 999,
          }}
        ></div>
      </div>
    </div>
  );
}

// ---------------- ONBOARDING ----------------
function Onboarding({ initial, onComplete }) {
  const [name, setName] = useState(initial?.name || "");
  const [age, setAge] = useState(initial?.age || "");
  const [heightCm, setHeightCm] = useState(initial?.heightCm || "");
  const [startWeightKg, setStartWeightKg] = useState(initial?.startWeightKg || "");
  const [targetWeightKg, setTargetWeightKg] = useState(
    load(STORAGE.goals, { targetWeightKg: "" })?.targetWeightKg || ""
  );

  const bmi = useMemo(() => calcBMI(startWeightKg, heightCm), [startWeightKg, heightCm]);
  const ready = name.trim() && heightCm && startWeightKg;

  return (
    <div className="screen">
      <h2>Willkommen bei LeanTrack</h2>
      <p className="muted">Einmal Basisdaten eingeben.</p>

      <div className="card-group">
        <TextInput label="Name" value={name} onChange={setName} placeholder="Max" />
        <NumberInput label="Alter" value={age} onChange={setAge} placeholder="30" />
        <NumberInput label="Größe (cm)" value={heightCm} onChange={setHeightCm} placeholder="180" />
        <NumberInput
          label="Startgewicht (kg)"
          value={startWeightKg}
          onChange={setStartWeightKg}
          placeholder="88.9"
        />
        <NumberInput
          label="Zielgewicht (kg)"
          value={targetWeightKg}
          onChange={setTargetWeightKg}
          placeholder="80"
        />
      </div>

      <div className="card-group" style={{ marginTop: 14 }}>
        <div className="card-input">
          <label>BMI</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{bmi ?? "—"}</div>
            <div className="muted">{bmi ? bmiCategory(bmi) : "—"}</div>
          </div>
        </div>
      </div>

      <button
        className="btn primary"
        disabled={!ready}
        style={{ marginTop: 16 }}
        onClick={() => {
          const profile = {
            name: name.trim(),
            age,
            heightCm,
            startWeightKg,
          };
          const goals = load(STORAGE.goals, {
            dailyCalories: "2000",
            dailyWaterMl: "2000",
            dailyProteinG: "120",
            targetWeightKg,
          });

          save(STORAGE.profile, profile);
          save(STORAGE.goals, goals);

          localStorage.setItem("lt_welcomed", "0"); // Splash erst ab zweitem Start

          onComplete(profile, goals);
        }}
      >
        Fertig
      </button>
    </div>
  );
}

// ---------------- TODAY SCREEN ----------------
function GoalProgress({ profile, goals, currentWeight }) {
  const start = Number(profile?.startWeightKg);
  const target = Number(goals?.targetWeightKg);
  const current = Number(currentWeight || start);
  if (!start || !target) return <div className="muted">Keine Daten</div>;
  const total = start - target;
  const done = Math.max(0, start - current);
  const pct = Math.max(0, Math.min(100, Math.round((done / total) * 100)));
  return (
    <>
      <div className="muted">{done.toFixed(1)} kg von {total.toFixed(1)} kg ({pct}%)</div>
      <div style={{ height: 12, background: "var(--stroke)", borderRadius: 999 }}>
        <div
          style={{
            width: pct + "%",
            height: "100%",
            background: "var(--success)",
            borderRadius: 999,
          }}
        ></div>
      </div>
    </>
  );
}

function Today({ state, setState, profile, goals }) {
  const { weight, calories, water, protein } = state;

  const bmi = calcBMI(weight || profile?.startWeightKg, profile?.heightCm);

  return (
    <div className="screen">
      <h2>Heute</h2>

      <div className="card-group">
        <NumberInput label="Gewicht (kg)" value={weight} onChange={(v) => setState(s => ({ ...s, weight: v }))} />

        {/* Kalorien */}
        <div className="card-input">
          <label>Kalorien</label>
          <input
            type="number"
            value={calories ?? ""}
            onChange={(e) => setState(s => ({ ...s, calories: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {[100, 250, 500].map(inc => (
              <button key={inc} className="btn" onClick={() => setState(s => ({
                ...s,
                calories: String((Number(s.calories) || 0) + inc),
              }))}>+{inc}</button>
            ))}
          </div>
          <ProgressBar value={calories} max={goals.dailyCalories} unit="kcal" />
        </div>

        {/* Wasser */}
        <div className="card-input">
          <label>Wasser (ml)</label>
          <input
            type="number"
            value={water ?? ""}
            onChange={(e) => setState(s => ({ ...s, water: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {[250, 500].map(inc => (
              <button key={inc} className="btn" onClick={() => setState(s => ({
                ...s,
                water: String((Number(s.water) || 0) + inc),
              }))}>+{inc} ml</button>
            ))}
          </div>
          <ProgressBar value={water} max={goals.dailyWaterMl} unit="ml" />
        </div>

        {/* Protein */}
        <div className="card-input">
          <label>Protein (g)</label>
          <input
            type="number"
            value={protein ?? ""}
            onChange={(e) => setState(s => ({ ...s, protein: e.target.value }))}
          />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {[10, 25, 50].map(inc => (
              <button key={inc} className="btn" onClick={() => setState(s => ({
                ...s,
                protein: String((Number(s.protein) || 0) + inc),
              }))}>+{inc} g</button>
            ))}
          </div>
          <ProgressBar value={protein} max={goals.dailyProteinG} unit="g" />
        </div>
      </div>

      <div className="card-group">
        <div className="card-input">
          <label>BMI</label>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{bmi ?? "—"}</div>
          <div className="muted">{bmi ? bmiCategory(bmi) : "—"}</div>
        </div>

        <div className="card-input">
          <label>Gewichts-Fortschritt</label>
          <GoalProgress profile={profile} goals={goals} currentWeight={weight} />
        </div>
      </div>
    </div>
  );
}

// ---------------- TRENDS ----------------
function Trends({ weightHistory }) {
  return (
    <div className="screen">
      <h2>Trends</h2>
      {weightHistory.length === 0 ? (
        <p className="muted">Noch keine Werte.</p>
      ) : (
        <ul>
          {weightHistory.map((w, i) => (
            <li key={i}>{w.date}: {w.value} kg</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------- GOALS ----------------
function Goals({ goals, setGoals, profile, setProfile }) {
  const bmi = calcBMI(profile?.startWeightKg, profile?.heightCm);

  return (
    <div className="screen">
      <h2>Ziele</h2>

      <div className="card-group">
        <TextInput label="Name" value={profile?.name} onChange={(v) => setProfile(p => ({ ...p, name: v }))} />
        <NumberInput label="Alter" value={profile?.age} onChange={(v) => setProfile(p => ({ ...p, age: v }))} />
        <NumberInput label="Größe (cm)" value={profile?.heightCm} onChange={(v) => setProfile(p => ({ ...p, heightCm: v }))} />
        <NumberInput label="Startgewicht (kg)" value={profile?.startWeightKg} onChange={(v) => setProfile(p => ({ ...p, startWeightKg: v }))} />
        <NumberInput label="Zielgewicht (kg)" value={goals.targetWeightKg} onChange={(v) => setGoals(g => ({ ...g, targetWeightKg: v }))} />

        <NumberInput label="Tägliche Kalorien" value={goals.dailyCalories} onChange={(v) => setGoals(g => ({ ...g, dailyCalories: v }))} />
        <NumberInput label="Tägliches Wasser (ml)" value={goals.dailyWaterMl} onChange={(v) => setGoals(g => ({ ...g, dailyWaterMl: v }))} />
        <NumberInput label="Tägliches Protein (g)" value={goals.dailyProteinG} onChange={(v) => setGoals(g => ({ ...g, dailyProteinG: v }))} />
      </div>

      <div className="card-group" style={{ marginTop: 14 }}>
        <div className="card-input">
          <label>BMI (Start)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{bmi ?? "—"}</div>
            <div className="muted">{bmi ? bmiCategory(bmi) : "—"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- PATCH NOTES ----------------
function PatchNotes() {
  return (
    <div className="screen">
      <h2>Patch Notes</h2>
      <ul>
        <li>✅ Splash-Screen (Willkommen zurück, NAME)</li>
        <li>✅ Dark/Light Umschalter (Button oben rechts)</li>
        <li>✅ Progressbars für Kalorien / Wasser / Protein</li>
      </ul>
    </div>
  );
}

// ---------------- SPLASH (FULLSCREEN) ----------------
function SplashScreen({ name }) {
  return (
    <div className="splash-fullscreen">
      <h1>{getGreeting()}, {name} 🎉</h1>
    </div>
  );
}

// ---------------- THEME TOGGLE BUTTON (🌓) ----------------
function ThemeToggle() {
  const [mode, setMode] = useState(getStoredTheme() === "dark" ? "dark" : "light");

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyTheme(next);
  };

  return (
    <button className="theme-toggle" aria-label="Theme wechseln" onClick={toggle}>
      🌓
    </button>
  );
}

// ************************************************************
//  ROOT
// ************************************************************

function App() {
  const [tab, setTab] = useState("today");

  // Theme beim Start setzen
  useEffect(() => {
    applyTheme(getStoredTheme());
  }, []);

  // Daten laden
  const [profile, setProfile] = useState(load(STORAGE.profile, null));
  const [goals, setGoals] = useState(
    load(STORAGE.goals, {
      dailyCalories: "2000",
      dailyWaterMl: "2000",
      dailyProteinG: "120",
      targetWeightKg: "",
    })
  );

  const [state, setState] = useState(
    load(STORAGE.day + todayISO(), {
      weight: "",
      calories: "",
      water: "",
      protein: "",
    })
  );

  const [weightHistory, setWeightHistory] = useState(
    load(STORAGE.weightHistory, [])
  );

  // Persistenz
  useEffect(() => save(STORAGE.profile, profile), [profile]);
  useEffect(() => save(STORAGE.goals, goals), [goals]);
  useEffect(() => save(STORAGE.day + todayISO(), state), [state]);

  // Gewichtshistorie
  useEffect(() => {
    if (!state.weight) return;
    const date = todayISO();
    const list = load(STORAGE.weightHistory, []);
    const updated = [...list.filter((x) => x.date !== date), { date, value: state.weight }];
    save(STORAGE.weightHistory, updated);
    setWeightHistory(updated);
  }, [state.weight]);


  // Splash nur ab dem 2. Start
  const [showSplash, setShowSplash] = useState(false);
  useEffect(() => {
    if (!profile?.name) return;

    const f = localStorage.getItem("lt_welcomed") || "0";

    if (f === "0") localStorage.setItem("lt_welcomed", "1");
    else if (f === "1") {
      setShowSplash(true);
      localStorage.setItem("lt_welcomed", "2");
      setTimeout(() => setShowSplash(false), 1400);
    }
  }, [profile?.name]);

  // Onboarding blockiert gesamte App
  if (!profile || !profile.name || !profile.heightCm || !profile.startWeightKg)
    return <Onboarding initial={profile || {}} onComplete={(p, g) => { setProfile(p); setGoals(g); }} />;

  return (
    <div className="app-wrapper">
      {showSplash ? (
        <SplashScreen name={profile?.name} />
      ) : (
        <>
          {tab === "today" && <Today state={state} setState={setState} profile={profile} goals={goals} />}
          {tab === "trends" && <Trends weightHistory={weightHistory} />}
          {tab === "goals" && <Goals profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} />}
          {tab === "patch" && <PatchNotes />}

          <div className="bottom-nav">
            <TabButton label="Heute" active={tab === "today"} onClick={() => setTab("today")} />
            <TabButton label="Trends" active={tab === "trends"} onClick={() => setTab("trends")} />
            <TabButton label="Ziele" active={tab === "goals"} onClick={() => setTab("goals")} />
            <TabButton label="Patch Notes" active={tab === "patch"} onClick={() => setTab("patch")} />
          </div>
        </>
      )}

      {/* FIXED BUTTON ALWAYS ON TOP */}
      <ThemeToggle />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
