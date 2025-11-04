// LeanTrack – First-Run (Language + Units), Imperial ft/in, FAB Menu, ICS, Export/Import, i18n
const { useState, useEffect, useMemo } = React;

/* ---------- Storage + Helpers ---------- */
const STORAGE = {
  profile:'lt_profile',
  goals:'lt_goals',
  day:'lt_day_',
  units:'lt_units',
  lang:'lt_lang',
  welcomed:'lt_welcomed'
};

const load = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb; } catch { return fb; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const setRaw = (k, v) => localStorage.setItem(k, v);
const getRaw = (k, fb=null) => localStorage.getItem(k) ?? fb;

const pad2 = (n) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; };

/* ---------- Theme ---------- */
function getStoredTheme(){ try{ return localStorage.getItem("leantrack_theme_lp") || localStorage.getItem("lt_theme") || "system"; }catch{ return "system"; } }
function applyTheme(t){ try{ document.documentElement.setAttribute("data-theme", t); localStorage.setItem("leantrack_theme_lp", t); localStorage.setItem("lt_theme", t);}catch{} }

/* ---------- i18n ---------- */
const LANGS = [
  { code:"en", label:"English" }, { code:"de", label:"Deutsch" },
  { code:"es", label:"Español" }, { code:"fr", label:"Français" },
  { code:"pt", label:"Português" },{ code:"ru", label:"Русский" },
  { code:"zh", label:"中文" },    { code:"hi", label:"हिन्दी" },
  { code:"ar", label:"العربية" }, { code:"bn", label:"বাংলা" },
  { code:"pa", label:"ਪੰਜਾਬੀ" }, { code:"ur", label:"اردو" },
  { code:"id", label:"Bahasa Indonesia" }, { code:"tr", label:"Türkçe" },
  { code:"it", label:"Italiano" }, { code:"pl", label:"Polski" },
  { code:"uk", label:"Українська" }, { code:"nl", label:"Nederlands" },
  { code:"sv", label:"Svenska" }, { code:"el", label:"Ελληνικά" }
];

const STR = {
  en: {
    appTitle: "LeanTrack",
    today: "Today", trends: "Trends", goals: "Goals",
    weight: "Weight", weightUnitKg: "kg", weightUnitLb: "lb", weightUnitSt: "st",
    caloriesToday: "Calories (today)", water: "Water", waterUnitMl:"ml", waterUnitFlOz:"fl oz",
    protein: "Protein (g)", activity: "Activity (walking)", steps: "Steps", minutes: "Minutes", km: "km", mi: "mi",
    burned: "Burned (≈)", bmiToday: "BMI (today)", weightProgress: "Weight progress", noGoal: "No goal set",
    name: "Name", age: "Age", height: "Height", heightCm:"cm", heightFt:"ft", heightIn:"in",
    startWeight: "Start weight", targetWeight: "Target weight",
    dailyCalories: "Daily calories (goal)", dailyWater: "Daily water (goal)", dailyProtein: "Daily protein (goal)",
    onboardingTitle: "Welcome to LeanTrack", onboardingNote: "Enter base data once. You can change it later in \"Goals\".", done: "Done",
    trendsHint: "Tap for more info",
    // Menu / FAB
    menu: "Menu", theme: "Theme", menuInstall: "Install", menuLanguage: "Language", menuReminder: "Reminders", menuData: "Export / Import", menuUnits:"Units",
    close: "Close",
    // Install helper
    installTitle: "Install to Home Screen",
    androidSteps: ["Open Chrome/Brave", "Menu (⋮)", "Add to Home screen"],
    iosSteps: ["Open Safari", "Share icon (⬆️)", "Add to Home Screen"],
    desktopSteps: ["Open Chrome/Edge", "Click install icon in the address bar"],
    // Reminders
    reminderTitle: "Create reminder (ICS)", reminderWhat: "What is it for?", reminderWhen: "Time", reminderDays: "Repeat",
    reminderDaily: "Daily", reminderWeekdays: "Specific days",
    weekdayMo:"Mon", weekdayTu:"Tue", weekdayWe:"Wed", weekdayTh:"Thu", weekdayFr:"Fri", weekdaySa:"Sat", weekdaySu:"Sun",
    exportICS: "Export .ics",
    // Data
    dataTitle: "Data", exportAll: "Export all data (.json)", importAll: "Import data (.json)", imported: "Imported.",
    // First-run
    firstrunTitle:"Quick setup", chooseLanguage:"Choose language", chooseUnits:"Choose units",
    unitsMetric:"Metric (kg, cm, ml, km)", unitsImperial:"US/Imperial (lb, ft/in, fl oz, mi)", unitsUK:"UK (st, ft/in, ml, mi)",
    continue:"Continue",
    // Misc
    hintEst: "Estimate based on your weight & inputs."
  },
  de: {
    appTitle: "LeanTrack",
    today: "Heute", trends: "Trends", goals: "Ziele",
    weight: "Gewicht", weightUnitKg: "kg", weightUnitLb: "lb", weightUnitSt: "st",
    caloriesToday: "Kalorien (heute)", water: "Wasser", waterUnitMl:"ml", waterUnitFlOz:"fl oz",
    protein: "Protein (g)", activity: "Aktivität (Gehen)", steps: "Schritte", minutes: "Minuten", km: "km", mi:"mi",
    burned: "Verbrannt (≈)", bmiToday: "BMI (heute)", weightProgress: "Gewichts-Fortschritt", noGoal: "Kein Ziel gesetzt",
    name: "Name", age: "Alter", height: "Größe", heightCm:"cm", heightFt:"ft", heightIn:"in",
    startWeight: "Startgewicht", targetWeight: "Zielgewicht",
    dailyCalories: "Tägliche Kalorien (Ziel)", dailyWater: "Tägliches Wasser (Ziel)", dailyProtein: "Tägliches Protein (Ziel)",
    onboardingTitle: "Willkommen bei LeanTrack", onboardingNote: "Bitte einmalig Basisdaten eingeben. Später in „Ziele“ änderbar.", done: "Fertig",
    trendsHint: "Tippen für mehr Infos",
    // Menü / FAB
    menu: "Menü", theme: "Theme", menuInstall: "Installieren", menuLanguage: "Sprache", menuReminder: "Reminder", menuData: "Export / Import", menuUnits:"Einheiten",
    close: "Schließen",
    // Install-Hilfe
    installTitle: "Zum Startbildschirm hinzufügen",
    androidSteps: ["Chrome/Brave öffnen", "Menü (⋮)", "Zum Startbildschirm hinzufügen"],
    iosSteps: ["Safari öffnen", "Teilen-Icon (⬆️)", "Zum Home-Bildschirm"],
    desktopSteps: ["Chrome/Edge öffnen", "Installations-Icon in der Adresszeile"],
    // Reminder
    reminderTitle: "Erinnerung erstellen (ICS)", reminderWhat:"Worum geht's?", reminderWhen:"Uhrzeit", reminderDays:"Wiederholen",
    reminderDaily:"Täglich", reminderWeekdays:"Bestimmte Tage",
    weekdayMo:"Mo", weekdayTu:"Di", weekdayWe:"Mi", weekdayTh:"Do", weekdayFr:"Fr", weekdaySa:"Sa", weekdaySu:"So",
    exportICS:"Als .ics exportieren",
    // Daten
    dataTitle:"Daten", exportAll:"Alle Daten exportieren (.json)", importAll:"Daten importieren (.json)", imported:"Importiert.",
    // First-run
    firstrunTitle:"Schnelle Einrichtung", chooseLanguage:"Sprache wählen", chooseUnits:"Einheiten wählen",
    unitsMetric:"Metrisch (kg, cm, ml, km)", unitsImperial:"US/Imperial (lb, ft/in, fl oz, mi)", unitsUK:"UK (st, ft/in, ml, mi)",
    continue:"Weiter",
    hintEst:"Schätzung, basierend auf Gewicht & Eingaben."
  }
};

function tFactory(lang){
  const base = STR.en, cur = STR[lang] || {};
  return (key)=> (cur[key] ?? base[key] ?? key);
}

/* ---------- Units + Conversion (store internally as SI) ---------- */
const DEFAULT_UNITS = { system:'metric', weight:'kg', height:'cm', volume:'ml', distance:'km' };
const UNITS_PRESETS = {
  metric:  { system:'metric',  weight:'kg', height:'cm', volume:'ml',   distance:'km' },
  imperial:{ system:'imperial',weight:'lb', height:'ft', volume:'floz', distance:'mi' },
  uk:      { system:'uk',      weight:'st', height:'ft', volume:'ml',   distance:'mi' }
};
// weight
const kgToLb = kg => kg*2.20462;
const lbToKg = lb => lb/2.20462;
const kgToSt = kg => kg/6.35029;
const stToKg = st => st*6.35029;
// height
const cmToIn = cm => cm/2.54;
const inToCm = inch => inch*2.54;
// water
const mlToFlOz = ml => ml/29.5735;
const flOzToMl = oz => oz*29.5735;
// distance
const kmToMi = km => km/1.60934;
const miToKm = mi => mi*1.60934;

function estimateActivityKcal({ weightKg, distanceKm, minutes, steps }){
  const w = Number(weightKg)||0, d=Number(distanceKm)||0, m=Number(minutes)||0, s=Number(steps)||0;
  if (w<=0){ if(d) return Math.round(d*55); if(s) return Math.round(s*0.04); if(m) return Math.round(m*2.5); return 0; }
  if (d>0) return Math.round(w*0.8*d);
  if (m>0) return Math.round((3.3*3.5*w/200)*m);
  if (s>0) return Math.round(w*0.8*(s*0.00075));
  return 0;
}

function calcBMI(wKg, hCm){
  const m = Number(hCm)/100, kg = Number(wKg);
  if(!m||!kg) return undefined;
  return Number((kg/(m*m)).toFixed(1));
}

function loadAllDaysSortedDesc(){
  const arr=[];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith(STORAGE.day)){
      const date=k.replace(STORAGE.day,"");
      try{ arr.push({date, ...(JSON.parse(localStorage.getItem(k))||{})}); }catch{}
    }
  }
  return arr.sort((a,b)=> b.date.localeCompare(a.date));
}
function formatDateDE(iso){
  if(!iso||iso.length<10) return iso||"";
  const [y,m,d]=iso.split("-");
  const mon=["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"][Math.max(1,Math.min(12,parseInt(m,10)))-1];
  return `${d}. ${mon} ${y}`;
}

/* ---------- ErrorBoundary ---------- */
class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state={error:null}; }
  static getDerivedStateFromError(error){ return {error}; }
  componentDidCatch(error, info){ console.error("LeanTrack Error:", error, info); }
  render(){
    if(this.state.error){
      return (<div className="screen"><h2>Oops – error</h2><p className="muted">{String(this.state.error)}</p><button className="btn" onClick={()=>location.reload()}>Reload</button></div>);
    }
    return this.props.children;
  }
}

/* ---------- UI Primitives ---------- */
function TabButton({label, active, onClick}){ return <button className={active?"tab-btn active":"tab-btn"} onClick={onClick}>{label}</button>; }
function TextInput({ label, value, onChange, placeholder }){ return (<div className="card-input"><label>{label}</label><input type="text" placeholder={placeholder} value={value ?? ''} onChange={(e)=> onChange(e.target.value)} /></div>); }
function NumberInput({ label, value, onChange, placeholder }){ return (<div className="card-input"><label>{label}</label><input type="number" inputMode="decimal" placeholder={placeholder} value={value ?? ''} onChange={(e)=> onChange(e.target.value)} /></div>); }
function ProgressBar({ value, max, unit }){
  const v=Math.max(0,Number(value)||0), m=Math.max(0,Number(max)||0), pct=m>0?Math.min(100,Math.round((v/m)*100)):0;
  return (<div><div className="muted" style={{marginBottom:6}}>{m>0?`${v}${unit?' '+unit:''} / ${m}${unit?' '+unit:''} (${pct}%)`:'Kein Ziel gesetzt'}</div><div style={{height:12, background:'var(--stroke)', borderRadius:999}}><div style={{width:pct+'%', height:'100%', background:'var(--success)', borderRadius:999}}></div></div></div>);
}

/* ---------- Header (Logo | Title | Theme) ---------- */
function AppHeader({ title, onToggleTheme }){
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-header-left">
          <svg className="app-logo" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-label="LeanTrack Logo">
            <rect width="512" height="512" rx="120" fill="currentColor" opacity=".1"/>
            <path d="M120 330 L220 250 L310 290 L400 180" stroke="var(--accent)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <div className="app-header-title">{title}</div>
        <div className="app-header-right">
          <button className="theme-toggle" aria-label="Theme" onClick={onToggleTheme}>🌓</button>
        </div>
      </div>
    </header>
  );
}

/* ---------- First-Run Prompt (Language + Units) ---------- */
function FirstRun({ lang, setLang, units, setUnits, onContinue }){
  const t = tFactory(lang||'en');
  return (
    <div className="firstrun-fullscreen">
      <div className="firstrun-card">
        <h2>{t('firstrunTitle')}</h2>
        <div className="card-input" style={{marginTop:12}}>
          <label>{t('chooseLanguage')}</label>
          <div className="chip-row">
            {LANGS.map(l=>(
              <button key={l.code} className={"chip"+((lang||'en')===l.code?" active":"")} onClick={()=> setLang(l.code)}>{l.label}</button>
            ))}
          </div>
        </div>
        <div className="card-input" style={{marginTop:12}}>
          <label>{t('chooseUnits')}</label>
          <div className="chip-col">
            <button className={"chip block"+(units?.system==='metric'?" active":"")} onClick={()=> setUnits(UNITS_PRESETS.metric)}>{t('unitsMetric')}</button>
            <button className={"chip block"+(units?.system==='imperial'?" active":"")} onClick={()=> setUnits(UNITS_PRESETS.imperial)}>{t('unitsImperial')}</button>
            <button className={"chip block"+(units?.system==='uk'?" active":"")} onClick={()=> setUnits(UNITS_PRESETS.uk)}>{t('unitsUK')}</button>
          </div>
        </div>
        <div style={{display:'flex', justifyContent:'flex-end', gap:8, marginTop:14}}>
          <button className="btn primary" onClick={onContinue}>{t('continue')}</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Onboarding ---------- */
function Onboarding({ initial, onComplete, t, units }){
  const [name,setName]=useState(initial?.name||'');
  const [age,setAge]=useState(initial?.age||'');
  const [heightCm,setHeightCm]=useState(initial?.heightCm||'');
  const [startWeightKg,setStartWeightKg]=useState(initial?.startWeightKg||'');
  const [targetWeightKg,setTargetWeightKg]=useState(load(STORAGE.goals,{targetWeightKg:''})?.targetWeightKg||'');

  const [ft, setFt] = useState('');
  const [inch, setInch] = useState('');
  useEffect(()=>{
    if(units?.height==='ft'){
      const cm = Number(heightCm)||0;
      const totalIn = cmToIn(cm);
      const f = Math.floor(totalIn/12);
      const i = Math.round(totalIn - f*12);
      setFt(f?String(f):'');
      setInch(i?String(i):'');
    }
  },[]);

  const bmi=useMemo(()=>calcBMI(startWeightKg, heightCm),[startWeightKg,heightCm]);
  const ready=name.trim() && (units.height==='cm' ? heightCm : (ft||inch)) && startWeightKg;

  const HeightInputs = units.height==='cm' ? (
    <NumberInput label={`${t('height')} (${t('heightCm')})`} value={heightCm} onChange={setHeightCm} placeholder="180" />
  ) : (
    <div className="card-input">
      <label>{t('height')} ({t('heightFt')}/{t('heightIn')})</label>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        <input type="number" placeholder={t('heightFt')} value={ft} onChange={(e)=> setFt(e.target.value)} />
        <input type="number" placeholder={t('heightIn')} value={inch} onChange={(e)=> setInch(e.target.value)} />
      </div>
    </div>
  );

  const WeightInput = (() => {
    const unit = units.weight==='kg'?t('weightUnitKg'):(units.weight==='lb'?t('weightUnitLb'):t('weightUnitSt'));
    return <NumberInput label={`${t('startWeight')} (${unit})`} value={
      (function(){
        const kg = Number(startWeightKg)||0;
        if(units.weight==='kg') return startWeightKg;
        if(units.weight==='lb') return kg? String(Math.round(kgToLb(kg)*10)/10) : '';
        if(units.weight==='st') return kg? String(Math.round(kgToSt(kg)*10)/10) : '';
        return startWeightKg;
      })()
    } onChange={(v)=>{
      const num = Number(v)||0;
      if(units.weight==='kg') setStartWeightKg(v);
      else if(units.weight==='lb') setStartWeightKg(String(Math.round(lbToKg(num)*10)/10));
      else setStartWeightKg(String(Math.round(stToKg(num)*10)/10));
    }} placeholder={units.weight==='kg'?'88.9':(units.weight==='lb'?'196':'13.5')} />
  })();

  return (<div className="screen">
    <h2>{t('onboardingTitle')}</h2>
    <p className="muted">{t('onboardingNote')}</p>
    <div className="card-group">
      <TextInput label={t('name')} value={name} onChange={setName} placeholder="Max" />
      <NumberInput label={t('age')} value={age} onChange={setAge} placeholder="30" />
      {HeightInputs}
      {WeightInput}
      <NumberInput label={`${t('targetWeight')} (${units.weight==='kg'?t('weightUnitKg'):units.weight==='lb'?t('weightUnitLb'):t('weightUnitSt')})`} value={
        (function(){
          const kg = Number(targetWeightKg)||0;
          if(units.weight==='kg') return targetWeightKg;
          if(units.weight==='lb') return kg? String(Math.round(kgToLb(kg)*10)/10) : '';
          if(units.weight==='st') return kg? String(Math.round(kgToSt(kg)*10)/10) : '';
          return targetWeightKg;
        })()
      } onChange={(v)=>{
        const num=Number(v)||0;
        if(units.weight==='kg') setTargetWeightKg(v);
        else if(units.weight==='lb') setTargetWeightKg(String(Math.round(lbToKg(num)*10)/10));
        else setTargetWeightKg(String(Math.round(stToKg(num)*10)/10));
      }} placeholder={units.weight==='kg'?'80':'176'} />
    </div>

    <div className="card-group" style={{marginTop:14}}>
      <div className="card-input">
        <label>{t('bmiToday')}</label>
        <div style={{display:'flex', alignItems:'baseline', gap:8}}>
          <div style={{fontSize:26, fontWeight:700}}>{bmi ?? '—'}</div>
          <div className="muted"></div>
        </div>
      </div>
    </div>

    <button className="btn primary" disabled={!ready} style={{marginTop:20}}
      onClick={()=>{
        let finalHeightCm = heightCm;
        if (units.height==='ft'){
          const f = Number(ft)||0, i=Number(inch)||0;
          const cm = inToCm(f*12 + i);
          finalHeightCm = String(Math.round(cm*10)/10);
        }
        const profile = { name: name.trim(), age, heightCm: finalHeightCm, startWeightKg };
        const defaults = { dailyCalories:"2000", dailyWaterMl:"2000", dailyProteinG:"120", targetWeightKg };
        const goals = Object.assign(defaults, load(STORAGE.goals, {}));
        goals.targetWeightKg = targetWeightKg;
        save(STORAGE.profile, profile);
        save(STORAGE.goals, goals);
        setRaw(STORAGE.welcomed, "0");
        onComplete({ profile, goals });
      }}
    >{t('done')}</button>
  </div>);
}

/* ---------- Today ---------- */
function Today({ state, setState, profile, goals, t, units }){
  const { weight, calories, water, protein, steps, minutes, distanceKm } = state;

  const weightLabelUnit = units.weight==='kg'?t('weightUnitKg'):units.weight==='lb'?t('weightUnitLb'):t('weightUnitSt');
  const waterUnit = units.volume==='ml'?t('waterUnitMl'):t('waterUnitFlOz');

  const displayWeight = (function(){
    const kg = Number(weight||profile?.startWeightKg)||0;
    if(units.weight==='kg') return weight ?? '';
    if(units.weight==='lb') return kg? String(Math.round(kgToLb(kg))) : '';
    if(units.weight==='st') return kg? String(Math.round(kgToSt(kg)*10)/10) : '';
    return weight ?? '';
  })();

  const setWeightDisplay = (v)=>{
    const num=Number(v)||0;
    if(units.weight==='kg') setState(s=>({...s, weight: v}));
    else if(units.weight==='lb') setState(s=>({...s, weight: String(Math.round(lbToKg(num)*10)/10)}));
    else setState(s=>({...s, weight: String(Math.round(stToKg(num)*10)/10)}));
  };

  const kcalTarget = Number(goals?.dailyCalories)||0;
  const waterProgressMax = units.volume==='ml' ? Number(goals?.dailyWaterMl)||0
                       : (Number(goals?.dailyWaterMl)? Math.round(mlToFlOz(Number(goals?.dailyWaterMl))) : 0);

  const waterNow = units.volume==='ml' ? (Number(water)||0) : (water ? Number(water) : 0);

  const kcalBurn=estimateActivityKcal({
    weightKg: Number(weight||profile?.startWeightKg)||0,
    distanceKm: units.distance==='km' ? Number(distanceKm)||0 : (distanceKm ? miToKm(Number(distanceKm)) : 0),
    minutes, steps
  });

  return (<div className="screen">
    <h2>{t('today')}</h2>
    <div className="card-group">
      <NumberInput label={`${t('weight')} (${weightLabelUnit})`} value={displayWeight} placeholder={units.weight==='kg'?'88.9':(units.weight==='lb'?'196':'13.5')} onChange={setWeightDisplay} />

      <div className="card-input">
        <label>{t('caloriesToday')}</label>
        <input type="number" placeholder="600" value={calories ?? ""} onChange={(e)=> setState(s=>({...s, calories:e.target.value}))}/>
        <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
          {[100,250,500].map(inc=> <button key={inc} className="btn" onClick={()=> setState(s=>({...s, calories:String((Number(s.calories)||0)+inc)}))}>+{inc}</button>)}
          {Number(calories)>0 && (<button className="btn" onClick={()=> setState(s=>({...s, calories:String(Math.max(0,(Number(s.calories)||0)-100))}))}>-100</button>)}
        </div>
        <div style={{marginTop:10}}><ProgressBar value={Number(calories)||0} max={kcalTarget} unit="kcal"/></div>
      </div>

      <div className="card-input">
        <label>{t('water')} ({waterUnit})</label>
        <input type="number" placeholder={units.volume==='ml'?'1500':'50'} value={
          (function(){ return units.volume==='ml' ? (water ?? '') : (water ? water : ''); })()
        } onChange={(e)=> {
          const val=Number(e.target.value)||0;
          if(units.volume==='ml') setState(s=>({...s, water:String(val)}));
          else setState(s=>({...s, water:String(val)}));
        }}/>
        <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
          {(units.volume==='ml' ? [250,500] : [8,16]).map(inc=> (
            <button key={inc} className="btn" onClick={()=>{
              setState(s=>{
                const cur = Number(s.water)||0;
                return {...s, water: String(cur + inc)};
              });
            }}>+{inc} {waterUnit}</button>
          ))}
          {(Number(waterNow)>0) && (
            <button className="btn" onClick={()=> setState(s=>({...s, water:String(Math.max(0,(Number(s.water)||0) - (units.volume==='ml'?250:8)))}))}>
              -{units.volume==='ml'?250:8} {waterUnit}
            </button>
          )}
        </div>
        <div style={{marginTop:10}}>
          <ProgressBar value={Number(waterNow)||0} max={waterProgressMax} unit={waterUnit}/>
        </div>
      </div>

      <div className="card-input">
        <label>{t('protein')}</label>
        <input type="number" placeholder="150" value={protein ?? ""} onChange={(e)=> setState(s=>({...s, protein:e.target.value}))}/>
        <div style={{display:'flex', gap:8, marginTop:8, flexWrap:'wrap'}}>
          {[10,25,50].map(inc=> <button key={inc} className="btn" onClick={()=> setState(s=>({...s, protein:String((Number(s.protein)||0)+inc)}))}>+{inc} g</button>)}
          {Number(protein)>0 && (<button className="btn" onClick={()=> setState(s=>({...s, protein:String(Math.max(0,(Number(s.protein)||0)-10))}))}>-10 g</button>)}
        </div>
        <div style={{marginTop:10}}><ProgressBar value={Number(protein)||0} max={Number(goals?.dailyProteinG)||0} unit="g"/></div>
      </div>

      <div className="card-input">
        <label>{t('activity')}</label>
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
          <input type="number" placeholder={t('steps')} value={steps ?? ""} onChange={(e)=> setState(s=>({...s, steps:e.target.value}))}/>
          <input type="number" placeholder={t('minutes')} value={minutes ?? ""} onChange={(e)=> setState(s=>({...s, minutes:e.target.value}))}/>
          <input type="number" placeholder="km/mi" value={distanceKm ?? ""} onChange={(e)=> setState(s=>({...s, distanceKm:e.target.value}))}/>
          <div style={{display:'flex', alignItems:'center'}} className="muted">{t('hintEst')}</div>
        </div>
        <div style={{marginTop:10}} className="muted">{t('burned')}: <strong>{kcalBurn}</strong> kcal</div>
      </div>
    </div>

    <div className="card-group" style={{marginTop:14}}>
      <div className="card-input">
        <label>{t('bmiToday')}</label>
        <div style={{display:'flex', alignItems:'baseline', gap:8}}>
          <div style={{fontSize:26, fontWeight:700}}>{calcBMI(Number(weight||profile?.startWeightKg)||0, Number(profile?.heightCm)||0) ?? '—'}</div>
          <div className="muted"></div>
        </div>
      </div>
      <div className="card-input">
        <label>{t('weightProgress')}</label>
        <GoalProgress profile={profile} goals={goals} currentWeight={weight} />
      </div>
    </div>
  </div>);
}

function GoalProgress({ profile, goals, currentWeight }){
  const start=Number(profile?.startWeightKg), target=Number(goals?.targetWeightKg), current=Number(currentWeight||start);
  if(!start||!target) return <div className="muted">—</div>;
  const total=start-target, done=Math.max(0,start-current), pct=Math.max(0,Math.min(100,Math.round((done/total)*100)));
  return (<div><div className="muted" style={{marginBottom:6}}>{done.toFixed(1)} kg von {total.toFixed(1)} kg erreicht ({pct}%)</div><div style={{height:12, background:'var(--stroke)', borderRadius:999}}><div style={{width:pct+'%', height:'100%', background:'var(--success)', borderRadius:999}}></div></div></div>);
}

/* ---------- Trends ---------- */
function Trends({ t }){
  const [expanded,setExpanded]=useState(new Set());
  const days=useMemo(()=> loadAllDaysSortedDesc(), []);
  const toggle=(date)=> setExpanded(prev=>{ const next=new Set(prev); next.has(date)?next.delete(date):next.add(date); return next; });
  if(days.length===0) return (<div className="screen"><h2>{t('trends')}</h2><p className="muted">—</p></div>);
  return (<div className="screen"><h2>{t('trends')}</h2>
    {days.map(d=>{ const open=expanded.has(d.date);
      const kcalBurn=estimateActivityKcal({ weightKg:d.weight, distanceKm:d.distanceKm, minutes:d.minutes, steps:d.steps });
      return (<div key={d.date} className="card-group" style={{marginTop:12}}>
        <div className="card-input card-collapsible">
          <button className="collapsible-header" aria-expanded={open} aria-controls={`day-${d.date}`} onClick={()=>toggle(d.date)}>
            <div className="collapsible-title trend-title">
              <div className="trend-date">{formatDateDE(d.date)}</div>
              <div className="trend-hint">{t('trendsHint')}</div>
            </div>
            <span className={"chevron"+(open?" rotate":"")}>▾</span>
          </button>
          <div id={`day-${d.date}`} className={"collapsible-body"+(open?" open":"")} role="region" aria-hidden={!open}>
            <div className="collapsible-grid">
              <div className="kv"><span className="k">{t('weight')}</span><span className="v">{d.weight ? `${d.weight} kg` : "—"}</span></div>
              <div className="kv"><span className="k">Kcal</span><span className="v">{d.calories ? `${d.calories} kcal` : "—"}</span></div>
              <div className="kv"><span className="k">{t('water')}</span><span className="v">{d.water ? `${d.water} ml` : "—"}</span></div>
              <div className="kv"><span className="k">{t('protein')}</span><span className="v">{d.protein ? `${d.protein} g` : "—"}</span></div>
              <div className="kv"><span className="k">{t('steps')}</span><span className="v">{d.steps || 0}</span></div>
              <div className="kv"><span className="k">{t('minutes')}</span><span className="v">{d.minutes || 0}</span></div>
              <div className="kv"><span className="k">{t('km')}</span><span className="v">{d.distanceKm ? `${d.distanceKm} km` : "0 km"}</span></div>
              <div className="kv"><span className="k">{t('burned')}</span><span className="v">{kcalBurn} kcal</span></div>
            </div>
          </div>
        </div>
      </div>); })}
  </div>);
}

/* ---------- Goals ---------- */
function Goals({ profile, setProfile, goals, setGoals, t, units }){
  const [ft, setFt] = useState('');
  const [inch, setInch] = useState('');
  useEffect(()=>{
    if(units.height==='ft'){
      const cm = Number(profile?.heightCm)||0;
      const totalIn = cmToIn(cm);
      const f = Math.floor(totalIn/12);
      const i = Math.round(totalIn - f*12);
      setFt(String(f||'')); setInch(String(i||''));
    }
  }, [units.height]);

  const HeightInputs = units.height==='cm' ? (
    <NumberInput label={`${t('height')} (${t('heightCm')})`} value={profile?.heightCm ?? ""} onChange={(v)=> setProfile(p=>({...p, heightCm:v}))} placeholder="180" />
  ) : (
    <div className="card-input">
      <label>{t('height')} ({t('heightFt')}/{t('heightIn')})</label>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
        <input type="number" placeholder={t('heightFt')} value={ft} onChange={(e)=>{
          const f=Number(e.target.value)||0; setFt(e.target.value);
          const inches = f*12 + (Number(inch)||0); const cm = inToCm(inches);
          setProfile(p=>({...p, heightCm:String(Math.round(cm*10)/10)}));
        }}/>
        <input type="number" placeholder={t('heightIn')} value={inch} onChange={(e)=>{
          const i=Number(e.target.value)||0; setInch(e.target.value);
          const inches = (Number(ft)||0)*12 + i; const cm = inToCm(inches);
          setProfile(p=>({...p, heightCm:String(Math.round(cm*10)/10)}));
        }}/>
      </div>
    </div>
  );

  return (<div className="screen"><h2>{t('goals')}</h2>
    <div className="card-group">
      <TextInput   label={t('name')} value={profile?.name ?? ""} onChange={(v)=> setProfile(p=>({...p, name:v}))} placeholder="Max"/>
      <NumberInput label={t('age')} value={profile?.age ?? ""}  onChange={(v)=> setProfile(p=>({...p, age:v}))} placeholder="30"/>
      {HeightInputs}
      <NumberInput label={`${t('startWeight')} (${units.weight==='kg'?t('weightUnitKg'):units.weight==='lb'?t('weightUnitLb'):t('weightUnitSt')})`} value={
        (function(){
          const kg = Number(profile?.startWeightKg)||0;
          if(units.weight==='kg') return profile?.startWeightKg ?? '';
          if(units.weight==='lb') return kg? String(Math.round(kgToLb(kg)*10)/10) : '';
          if(units.weight==='st') return kg? String(Math.round(kgToSt(kg)*10)/10) : '';
          return profile?.startWeightKg ?? '';
        })()
      } onChange={(v)=>{
        const num=Number(v)||0;
        if(units.weight==='kg') setProfile(p=>({...p, startWeightKg:v}));
        else if(units.weight==='lb') setProfile(p=>({...p, startWeightKg:String(Math.round(lbToKg(num)*10)/10)}));
        else setProfile(p=>({...p, startWeightKg:String(Math.round(stToKg(num)*10)/10)}));
      }} placeholder={units.weight==='kg'?'88.9':(units.weight==='lb'?'196':'13.5')} />
      <NumberInput label={`${t('targetWeight')} (${units.weight==='kg'?t('weightUnitKg'):units.weight==='lb'?t('weightUnitLb'):t('weightUnitSt')})`} value={
        (function(){
          const kg = Number(goals?.targetWeightKg)||0;
          if(units.weight==='kg') return goals?.targetWeightKg ?? '';
          if(units.weight==='lb') return kg? String(Math.round(kgToLb(kg)*10)/10) : '';
          if(units.weight==='st') return kg? String(Math.round(kgToSt(kg)*10)/10) : '';
          return goals?.targetWeightKg ?? '';
        })()
      } onChange={(v)=>{
        const num=Number(v)||0;
        if(units.weight==='kg') setGoals(g=>({...g, targetWeightKg:v}));
        else if(units.weight==='lb') setGoals(g=>({...g, targetWeightKg:String(Math.round(lbToKg(num)*10)/10)}));
        else setGoals(g=>({...g, targetWeightKg:String(Math.round(stToKg(num)*10)/10)}));
      }} placeholder={units.weight==='kg'?'80':'176'} />
      <NumberInput label={t('dailyCalories')} value={goals?.dailyCalories ?? ""} onChange={(v)=> setGoals(g=>({...g, dailyCalories:v}))} placeholder="2000"/>
      <NumberInput label={`${t('dailyWater')} (${units.volume==='ml'?t('waterUnitMl'):t('waterUnitFlOz')})`} value={
        (function(){
          const ml = Number(goals?.dailyWaterMl)||0;
          if(units.volume==='ml') return goals?.dailyWaterMl ?? '';
          return ml? String(Math.round(mlToFlOz(ml))) : '';
        })()
      } onChange={(v)=>{
        const num=Number(v)||0;
        if(units.volume==='ml') setGoals(g=>({...g, dailyWaterMl:v}));
        else setGoals(g=>({...g, dailyWaterMl:String(Math.round(flOzToMl(num)))}));
      }} placeholder={units.volume==='ml'?'2000':'68'} />
      <NumberInput label={t('dailyProtein')} value={goals?.dailyProteinG ?? ""} onChange={(v)=> setGoals(g=>({...g, dailyProteinG:v}))} placeholder="120"/>
    </div>
  </div>);
}

/* ---------- Menu Sheet (Install, Language, Reminders, Data, Units) ---------- */
function MenuSheet({ open, onClose, t, lang, setLang, units, setUnits }){
  const [section, setSection] = useState(null);
  const [installEvt, setInstallEvt] = useState(null);
  useEffect(()=>{
    const handler = (e)=>{ e.preventDefault(); setInstallEvt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return ()=> window.removeEventListener('beforeinstallprompt', handler);
  },[]);
  const doInstall = async ()=>{
    if (installEvt && installEvt.prompt){ await installEvt.prompt(); setInstallEvt(null); }
    else setSection('install');
  };

  const chooseLang = (code)=> { setLang(code); save(STORAGE.lang, code); };
  const applyUnitsPreset = (preset)=> { setUnits(preset); save(STORAGE.units, preset); };

  const [remTitle, setRemTitle] = useState('');
  const [time, setTime] = useState('20:00');
  const [mode, setMode] = useState('daily');
  const [days, setDays] = useState({mo:true, tu:false, we:false, th:false, fr:false, sa:false, su:false});
  const toggleDay = (k)=> setDays(d=>({...d, [k]: !d[k]}));
  const exportICS = ()=>{
    const [hh, mm] = (time||'20:00').split(':').map(x=>pad2(x));
    const dt = new Date();
    const DTSTART = `${dt.getFullYear()}${pad2(dt.getMonth()+1)}${pad2(dt.getDate())}T${hh}${mm}00`;
    let rrule = `FREQ=DAILY`;
    if (mode==='weekdays'){
      const map = {mo:'MO', tu:'TU', we:'WE', th:'TH', fr:'FR', sa:'SA', su:'SU'};
      const byday = Object.entries(days).filter(([,v])=>v).map(([k])=>map[k]);
      rrule = `FREQ=WEEKLY;BYDAY=${byday.join(',')||'MO'}`;
    }
    const uid = `leantrack-${Date.now()}@local`;
    const ics = [
      'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//LeanTrack//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${DTSTART}`,
      `DTSTART:${DTSTART}`,
      `SUMMARY:${(remTitle||'LeanTrack Reminder').replace(/\n/g,' ')}`,
      `RRULE:${rrule}`,
      'END:VEVENT','END:VCALENDAR'
    ].join('\r\n');
    const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leantrack-reminder.ics'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  };

  const exportAll = ()=>{
    const data = {};
    for(let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if(!k) continue;
      if (k.startsWith('lt_') || k.startsWith(STORAGE.day)) data[k] = localStorage.getItem(k);
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'leantrack-data.json'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 1000);
  };
  const importAll = async (file)=>{
    const txt = await file.text();
    const json = JSON.parse(txt);
    Object.entries(json).forEach(([k,v])=> localStorage.setItem(k, v));
    alert(t('imported'));
  };

  return (
    <div className={"sheet "+(open?"open":"")}>
      <div className="sheet-scrim" onClick={()=>{ setSection(null); onClose(); }}></div>
      <div className="sheet-card">
        {!section && (
          <div className="grid-menu">
            <button className="btn" onClick={doInstall}>{t('menuInstall')}</button>
            <button className="btn" onClick={()=> setSection('language')}>{t('menuLanguage')}</button>
            <button className="btn" onClick={()=> setSection('reminder')}>{t('menuReminder')}</button>
            <button className="btn" onClick={()=> setSection('data')}>{t('menuData')}</button>
            <button className="btn" onClick={()=> setSection('units')}>{t('menuUnits')}</button>
            <button className="btn ghost" onClick={()=>{ setSection(null); onClose(); }}>{t('close')}</button>
          </div>
        )}

        {section==='install' && (
          <div className="card-input">
            <h3 style={{margin:'0 0 8px'}}>{t('installTitle')}</h3>
            <div className="muted" style={{marginBottom:8}}>Android</div>
            <ol style={{margin:'0 0 12px 18px'}}>{t('androidSteps').map((s,i)=><li key={i}>{s}</li>)}</ol>
            <div className="muted" style={{marginBottom:8}}>iOS</div>
            <ol style={{margin:'0 0 12px 18px'}}>{t('iosSteps').map((s,i)=><li key={i}>{s}</li>)}</ol>
            <div className="muted" style={{marginBottom:8}}>Desktop</div>
            <ol style={{margin:'0 0 12px 18px'}}>{t('desktopSteps').map((s,i)=><li key={i}>{s}</li>)}</ol>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:10}}>
              <button className="btn" onClick={()=> setSection(null)}>{t('close')}</button>
            </div>
          </div>
        )}

        {section==='language' && (
          <div className="card-input">
            <h3 style={{margin:'0 0 8px'}}>{t('menuLanguage')}</h3>
            <div className="chip-row" role="listbox" aria-label={t('menuLanguage')}>
              {LANGS.map(l=>(
                <button key={l.code}
                        className={"chip"+(lang===l.code?" active":"")}
                        onClick={()=> chooseLang(l.code)}
                        role="option" aria-selected={lang===l.code}>
                  {l.label}
                </button>
              ))}
            </div>
            <div className="muted" style={{marginTop:8}}>Untranslated languages fallback to English.</div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:10}}>
              <button className="btn" onClick={()=> setSection(null)}>{t('close')}</button>
            </div>
          </div>
        )}

        {section==='units' && (
          <div className="card-input">
            <h3 style={{margin:'0 0 8px'}}>{t('menuUnits')}</h3>
            <div className="chip-col">
              <button className={"chip block"+(units.system==='metric'?' active':'')} onClick={()=> applyUnitsPreset(UNITS_PRESETS.metric)}>{t('unitsMetric')}</button>
              <button className={"chip block"+(units.system==='imperial'?' active':'')} onClick={()=> applyUnitsPreset(UNITS_PRESETS.imperial)}>{t('unitsImperial')}</button>
              <button className={"chip block"+(units.system==='uk'?' active':'')} onClick={()=> applyUnitsPreset(UNITS_PRESETS.uk)}>{t('unitsUK')}</button>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:10}}>
              <button className="btn" onClick={()=> setSection(null)}>{t('close')}</button>
            </div>
          </div>
        )}

        {section==='reminder' && (
          <div className="card-input">
            <h3 style={{margin:'0 0 8px'}}>{t('reminderTitle')}</h3>
            <div className="card-group" style={{marginTop:6}}>
              <div className="card-input">
                <label>{t('reminderWhat')}</label>
                <input type="text" placeholder="e.g. Log LeanTrack at 20:00" value={remTitle} onChange={(e)=> setRemTitle(e.target.value)} />
              </div>
              <div className="card-input">
                <label>{t('reminderWhen')}</label>
                <input type="time" value={time} onChange={(e)=> setTime(e.target.value)} />
              </div>
              <div className="card-input">
                <label>{t('reminderDays')}</label>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  <label><input type="radio" name="rmode" checked={mode==='daily'} onChange={()=> setMode('daily')} /> {t('reminderDaily')}</label>
                  <label><input type="radio" name="rmode" checked={mode==='weekdays'} onChange={()=> setMode('weekdays')} /> {t('reminderWeekdays')}</label>
                </div>
                {mode==='weekdays' && (
                  <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:8}}>
                    {[
                      ['mo',t('weekdayMo')],['tu',t('weekdayTu')],['we',t('weekdayWe')],
                      ['th',t('weekdayTh')],['fr',t('weekdayFr')],['sa',t('weekdaySa')],['su',t('weekdaySu')]
                    ].map(([k,lab])=>(
                      <button key={k} className={"chip"+(days[k]?" active":"")} onClick={()=> toggleDay(k)}>{lab}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:10}}>
              <button className="btn" onClick={exportICS}>{t('exportICS')}</button>
              <button className="btn" onClick={()=> setSection(null)}>{t('close')}</button>
            </div>
          </div>
        )}

        {section==='data' && (
          <div className="card-input">
            <h3 style={{margin:'0 0 8px'}}>{t('dataTitle')}</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
              <button className="btn" onClick={exportAll}>{t('exportAll')}</button>
              <label className="btn" style={{cursor:'pointer'}}>
                {t('importAll')}
                <input type="file" accept="application/json" style={{display:'none'}} onChange={(e)=> e.target.files?.[0] && importAll(e.target.files[0])}/>
              </label>
            </div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:10}}>
              <button className="btn" onClick={()=> setSection(null)}>{t('close')}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* ---------- Splash ---------- */
function SplashScreen({ name }){
  const h=new Date().getHours();
  const greet = h<11?"Guten Morgen":h<17?"Guten Tag":h<22?"Guten Abend":"Gute Nacht";
  return (<div className="splash-fullscreen"><h1>{greet}, {name||'du'} 🎉</h1></div>);
}

/* ---------- Root ---------- */
const EMPTY_DAY={ weight:"", calories:"", water:"", protein:"", steps:"", minutes:"", distanceKm:"" };

function App(){
  useEffect(()=>{ applyTheme(getStoredTheme()); }, []);

  const [lang, _setLang] = useState(load(STORAGE.lang, null));
  const [units, _setUnits] = useState(load(STORAGE.units, null));
  const t = tFactory(lang || 'en');

  const setLang = (code)=>{ _setLang(code); save(STORAGE.lang, code); };
  const setUnits = (u)=>{ _setUnits(u); save(STORAGE.units, u); };

  const [tab,setTab]=useState("today");
  const [currentDate,setCurrentDate]=useState(todayISO());
  const [profile,setProfile]=useState(load(STORAGE.profile,null));
  const [goals,setGoals]=useState(load(STORAGE.goals,{ dailyCalories:"2000", dailyWaterMl:"2000", dailyProteinG:"120", targetWeightKg:"" }));
  const [state,setState]=useState(load(STORAGE.day + currentDate, {...EMPTY_DAY}));

  useEffect(()=> save(STORAGE.profile,profile),[profile]);
  useEffect(()=> save(STORAGE.goals,goals),[goals]);
  useEffect(()=> save(STORAGE.day + currentDate,state),[state,currentDate]);

  useEffect(()=>{
    const id=setInterval(()=>{
      const tISO=todayISO();
      if(tISO!==currentDate){
        setCurrentDate(tISO);
        setState(load(STORAGE.day + tISO, {...EMPTY_DAY}));
      }
    }, 60000);
    return ()=> clearInterval(id);
  }, [currentDate]);

  if (!lang || !units){
    return (
      <ErrorBoundary>
        <FirstRun
          lang={lang||'en'} setLang={setLang}
          units={units||DEFAULT_UNITS} setUnits={setUnits}
          onContinue={()=> { if(!lang) setLang('en'); if(!units) setUnits(DEFAULT_UNITS); }}
        />
      </ErrorBoundary>
    );
  }

  if(!profile || !profile.name || !profile.heightCm || !profile.startWeightKg){
    return (
      <ErrorBoundary>
        <Onboarding
          initial={profile||{}}
          onComplete={({ profile: p, goals: g })=>{
            setProfile(p); setGoals(g);
            const tISO=todayISO(); setCurrentDate(tISO); setState(load(STORAGE.day + tISO, {...EMPTY_DAY}));
            setTab("today");
          }}
          t={t} units={units}
        />
      </ErrorBoundary>
    );
  }

  const [showSplash,setShowSplash]=useState(false);
  useEffect(()=>{
    const f=getRaw(STORAGE.welcomed)||"0";
    if(f==="0") setRaw(STORAGE.welcomed,"1");
    else if(f==="1"){
      setShowSplash(true); setRaw(STORAGE.welcomed,"2");
      const to=setTimeout(()=> setShowSplash(false), 1400);
      return ()=> clearTimeout(to);
    }
  }, []);

  const toggleTheme=()=>{ const cur=getStoredTheme(); applyTheme(cur==='dark'?'light':'dark'); };

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ErrorBoundary>
      <div className="app-wrapper">
        <AppHeader title={t('appTitle')} onToggleTheme={toggleTheme} />
        {showSplash ? (
          <SplashScreen name={profile?.name}/>
        ) : (
          <>
            {tab==="today"  && <Today  state={state} setState={setState} profile={profile} goals={goals} t={t} units={units}/> }
            {tab==="trends" && <Trends t={t}/> }
            {tab==="goals"  && <Goals  profile={profile} setProfile={setProfile} goals={goals} setGoals={setGoals} t={t} units={units}/> }

            <div className="bottom-nav">
              <TabButton label={t('today')}  active={tab==="today"}  onClick={()=>setTab("today")}/>
              <TabButton label={t('trends')} active={tab==="trends"} onClick={()=>setTab("trends")}/>
              <TabButton label={t('goals')}  active={tab==="goals"}   onClick={()=>setTab("goals")}/>
            </div>

            {/* FAB Hamburger bottom-right */}
            <button className="fab-menu" aria-label={t('menu')} onClick={()=> setMenuOpen(true)}>☰</button>
            <MenuSheet open={menuOpen} onClose={()=> setMenuOpen(false)} t={t} lang={lang} setLang={setLang} units={units} setUnits={setUnits}/>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
