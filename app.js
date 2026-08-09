/* FUELTRACK AI v0.5 — cały plik app.js */
const FK="fueltrack_food_v04",WK="fueltrack_workouts_v04",GK="fueltrack_goals_v04";
const GOALS={kcal:2200,protein:180,carbs:200,fat:70};
const OLD=["fueltrack_fitatu_v04","fueltrack_fitatu_v03","fueltrack_fitatu_v02","fueltrack_fitatu","fitatuData","fitatu_data","fueltrack_data","fueltrack_rows"];
const MIC="Błonnik (g)|Błonnik|g;Cukry (g)|Cukry|g;Kwas omega 3 (g)|Omega-3|g;Kwas omega 6 (g)|Omega-6|g;Kofeina (mg)|Kofeina|mg;Kwas foliowy (ug)|Kwas foliowy|µg;Witamina A (ug)|Witamina A|µg;Witamina B1 (mg)|Witamina B1|mg;Witamina B2 (mg)|Witamina B2|mg;Witamina B6 (mg)|Witamina B6|mg;Witamina B12 (ug)|Witamina B12|µg;Witamina C (mg)|Witamina C|mg;Witamina D (ug)|Witamina D|µg;Witamina E (mg)|Witamina E|mg;Witamina PP (mg)|Witamina PP|mg;Witamina K (ug)|Witamina K|µg;Cynk (mg)|Cynk|mg;Fosfor (mg)|Fosfor|mg;Jod (ug)|Jod|µg;Magnez (mg)|Magnez|mg;Potas (mg)|Potas|mg;Selen (ug)|Selen|µg;Sód (mg)|Sód|mg;Wapń (mg)|Wapń|mg;Żelazo (mg)|Żelazo|mg;Sól (g)|Sól|g;Cholesterol (mg)|Cholesterol|mg;Nasycone (g)|Kwasy nasycone|g".split(";").map(x=>x.split("|"));
let food=[],workouts=[],date="",goals={...GOALS};

const $=id=>document.getElementById(id);
const N=x=>{
  let n=parseFloat(String(x??"").replace(",",".").replace(/[^\d.-]/g,""));
  return Number.isFinite(n)?n:0
};
const F=x=>Number(x||0).toLocaleString("pl-PL",{maximumFractionDigits:2});
const E=x=>String(x??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
const P=x=>{try{return JSON.parse(x)}catch{return null}};

function msg(t,err=false){
  let b=$("status")||document.createElement("div");
  b.id="fueltrackMsg";
  b.textContent=t;
  b.style.cssText="position:fixed;left:16px;right:16px;bottom:18px;z-index:99999;padding:14px;border-radius:14px;background:"+(err?"#b42318":"#16794b")+";color:#fff;font-weight:700;text-align:center";
  document.body.appendChild(b);
  clearTimeout(b._t);
  b._t=setTimeout(()=>b.remove(),3500)
}

function fit(a){
  return Array.isArray(a)&&a.length&&a[0]&&typeof a[0]==="object"&&("Data"in a[0]||"data"in a[0])
}

function norm(a){
  return Array.isArray(a)?a.filter(x=>x&&typeof x==="object").map(x=>({...x,Data:x.Data||x.data||""})):[]
}

function recover(){
  let c=[];
  for(let i=0;i<localStorage.length;i++){
    let k=localStorage.key(i),p=P(localStorage.getItem(k));
    if(fit(p))c.push(norm(p));
    if(p&&Array.isArray(p.rows)&&fit(p.rows))c.push(norm(p.rows))
  }
  for(let k of OLD){
    let p=P(localStorage.getItem(k));
    if(fit(p))return norm(p);
    if(p&&Array.isArray(p.rows)&&fit(p.rows))return norm(p.rows)
  }
  return c.sort((a,b)=>b.length-a.length)[0]||[]
}

function save(){
  localStorage.setItem(FK,JSON.stringify(food));
  localStorage.setItem(WK,JSON.stringify(workouts))
}

function load(){
  let f=P(localStorage.getItem(FK));
  food=fit(f)?norm(f):recover();
  if(food.length)localStorage.setItem(FK,JSON.stringify(food));

  let w=P(localStorage.getItem(WK));
  workouts=Array.isArray(w)?w:[];

  goals={...GOALS,...(P(localStorage.getItem(GK))||{})}
}

function csv(s){
  s=s.replace(/^\uFEFF/,"");
  let R=[],r=[],c="",q=0;

  for(let i=0;i<s.length;i++){
    let x=s[i],n=s[i+1];

    if(x==='"'){
      if(q&&n==='"'){c+='"';i++}
      else q=!q
    }
    else if(x===","&&!q){
      r.push(c);
      c=""
    }
    else if((x==="\n"||x==="\r")&&!q){
      if(x==="\r"&&n==="\n")i++;
      r.push(c);
      c="";
      if(r.some(v=>v.trim()))R.push(r);
      r=[]
    }
    else c+=x
  }

  if(c!==""||r.length){
    r.push(c);
    if(r.some(v=>v.trim()))R.push(r)
  }

  if(!R.length)return[];

  let h=R[0].map(x=>x.trim());

  return R.slice(1)
    .map(v=>Object.fromEntries(h.map((x,i)=>[x,(v[i]??"").trim()])))
    .filter(o=>Object.values(o).some(Boolean))
}

function importCSV(file){
  file.text().then(t=>{
    let a=csv(t);

    if(!a.length)throw Error("CSV jest pusty.");
    if(!(a[0]&&"Data"in a[0]))throw Error("Nie znaleziono kolumny Data.");

    let ds=[...new Set(a.map(x=>x.Data).filter(Boolean))];
    let ex=new Set(food.map(x=>x.Data).filter(Boolean));
    let conf=ds.filter(d=>ex.has(d));

    if(conf.length){
      let rep=confirm(
        `Import zawiera ${ds.length} dni.\n`+
        `Dni już zapisane: ${conf.length}\n\n`+
        `OK — zastąp te dni.\n`+
        `Anuluj — zachowaj stare i dodaj tylko nowe.`
      );

      if(rep){
        let s=new Set(conf);
        food=food.filter(x=>!s.has(x.Data));
        food.push(...a)
      }
      else{
        food.push(...a.filter(x=>!ex.has(x.Data)))
      }
    }
    else{
      food.push(...a)
    }

    localStorage.setItem(FK,JSON.stringify(food));
    date=ds[0]||date;
    render();
    msg(`Zaimportowano ${a.length} rekordów Fitatu.`)
  }).catch(e=>msg(e.message||"Błąd importu.",true))
}

function dates(){
  return[
    ...new Set(
      [...food.map(x=>x.Data),...workouts.map(x=>x.date)]
      .filter(Boolean)
    )
  ].sort().reverse()
}

function totals(d){
  let rows=food.filter(x=>x.Data===d);
  let t={kcal:0,protein:0,carbs:0,fat:0};

  rows.forEach(x=>{
    t.kcal+=N(x["kalorie (kcal)"]);
    t.protein+=N(x["Białka (g)"]);
    t.carbs+=N(x["Węglowodany (g)"]);
    t.fat+=N(x["Tłuszcze (g)"])
  });

  return{rows,t}
}

function dateUI(){
  let s=$("dateSelect"),ds=dates();
  if(!s)return;

  if(!ds.length){
    date="";
    s.innerHTML='<option>Brak danych</option>'
  }
  else{
    if(!ds.includes(date))date=ds[0];

    s.innerHTML=ds
      .map(d=>`<option value="${E(d)}">${E(d)}</option>`)
      .join("");

    s.value=date
  }

  if($("selectedDateLabel"))
    $("selectedDateLabel").textContent=date||"Brak danych";

  if($("dayCount"))
    $("dayCount").textContent=`${ds.length} ${ds.length===1?"dzień":"dni"}`
}

function meals(){
  let b=$("meals"),rows=food.filter(x=>x.Data===date);
  if(!b)return;

  if(!rows.length){
    b.innerHTML="<p>Brak posiłków dla tego dnia.</p>";
    return
  }

  let g={};

  rows.forEach(x=>{
    let m=x.Posiłek||"Inne";
    if(!g[m])g[m]=[];
    g[m].push(x)
  });

  b.innerHTML=Object.entries(g).map(([m,a])=>`
    <div class="meal">
      <h3>${E(m)}</h3>

      ${a.map(x=>`
        <div class="product" style="padding:10px 0;border-bottom:1px solid #eee">
          <strong>${E(x["Produkty i potrawy"]||"Produkt")}</strong>

          <div>
            ${F(N(x["kalorie (kcal)"]))} kcal
            · B ${F(N(x["Białka (g)"]))} g
            · W ${F(N(x["Węglowodany (g)"]))} g
            · T ${F(N(x["Tłuszcze (g)"]))} g
          </div>
        </div>
      `).join("")}
    </div>
  `).join("")
}

function balance(){
  if(!$("dailyBalance")){
    let h=document.querySelector(".hero");

    if(h){
      let s=document.createElement("section");
      s.id="dailyBalance";
      s.className="card";

      s.innerHTML=`
        <div class="section-head">
          <h2>Bilans dnia</h2>
        </div>

        <div id="balanceContent"></div>
      `;

      h.after(s)
    }
  }

  let b=$("balanceContent");
  if(!b)return;

  let t=totals(date).t;

  let row=(id,n,v,g,u,i)=>`
    <div style="margin:14px 0">

      <div style="display:flex;justify-content:space-between;gap:8px">
        <strong>${i} ${n}</strong>
        <span>
          <b>${F(v)}</b> / ${F(g)} ${u}
        </span>
      </div>

      <div style="height:13px;background:#e8ecf2;border-radius:99px;overflow:hidden;margin-top:7px">
        <div
          id="${id}"
          style="
            height:100%;
            width:${Math.min(100,v/g*100||0)}%;
            background:linear-gradient(90deg,#2563eb,#22c55e);
            border-radius:99px;
            transition:.3s
          "
        ></div>
      </div>

    </div>
  `;

  b.innerHTML=
    row("kcalBar","Kalorie",t.kcal,goals.kcal,"kcal","🔥")+
    row("proteinBar","Białko",t.protein,goals.protein,"g","🥩")+
    row("carbsBar","Węglowodany",t.carbs,goals.carbs,"g","🍚")+
    row("fatBar","Tłuszcz",t.fat,goals.fat,"g","🥑")
}

function macro(){
  let t=totals(date).t;

  [
    ["kcal",t.kcal],
    ["protein",t.protein],
    ["carbs",t.carbs],
    ["fat",t.fat]
  ].forEach(([i,v])=>{
    if($(i))$(i).textContent=F(v)
  })
}

function micro(){
  let b=$("micros"),r=totals(date).rows;
  if(!b)return;

  b.innerHTML=MIC.map(([c,n,u])=>{
    let v=r.reduce((s,x)=>s+N(x[c]),0);

    return v
      ?`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee">
          <span>${E(n)}</span>
          <strong>${F(v)} ${u}</strong>
        </div>`
      :""
  }).join("")||"<p>Brak wartości mikroelementów.</p>"
}

function collapsible(cid,did,title){
  let c=$(cid);

  if(!c||$(did))return;

  let card=c.closest("section.card")||c.parentElement?.closest("section");

  if(!card||!card.parentElement)return;

  let h=card.querySelector(".section-head");
  let head=h?.querySelector("h1,h2,h3,h4,h5,h6");

  let extra=h
    ?[...h.children]
      .filter(x=>x!==head)
      .map(x=>x.outerHTML)
      .join("")
    :"";

  let d=document.createElement("details");
  d.id=did;
  d.className="card";

  let s=document.createElement("summary");

  s.style="cursor:pointer;list-style:none;font-size:22px;font-weight:800;padding:0;user-select:none";

  s.innerHTML=
    `${E(head?.textContent?.trim()||title)}
     <span style="float:right;opacity:.5">▼</span>
     ${extra}`;

  d.appendChild(s);
  card.before(d);
  d.appendChild(c);
  card.remove()
}

function workoutUI(){
  if($("workoutSection"))return;

  let s=document.createElement("section");

  s.id="workoutSection";
  s.className="card";

  let fields=[
    ["wType","text","Rodzaj, np. Easy Run / Interwały"],
    ["wDistance","number","Dystans km"],
    ["wTime","text","Czas, np. 52:34"],
    ["wPace","text","Tempo, np. 5:18/km"],
    ["wHr","number","Średnie tętno"],
    ["wMaxHr","number","Maksymalne tętno"],
    ["wCalories","number","Kalorie treningu"],
    ["wCadence","number","Kadencja"],
    ["wElevation","number","Przewyższenie m"]
  ];

  s.innerHTML=`
    <div class="section-head">
      <h2>🏃 Trening</h2>
      <button id="addWorkoutBtn" class="secondary">
        ＋ Dodaj trening
      </button>
    </div>

    <div id="workouts"></div>

    <div
      id="workoutForm"
      style="
        display:none;
        margin-top:16px;
        padding:16px;
        border-radius:18px;
        background:#f5f6fa
      "
    >

      <h3>Nowy trening</h3>

      ${fields.map(f=>`
        <input
          id="${f[0]}"
          type="${f[1]}"
          placeholder="${f[2]}"
          style="
            width:100%;
            box-sizing:border-box;
            padding:12px;
            margin:5px 0;
            border-radius:12px;
            border:1px solid #ddd;
            font:inherit
          "
        >
      `).join("")}

      <textarea
        id="wNote"
        rows="3"
        placeholder="Odczucia / notatka"
        style="
          width:100%;
          box-sizing:border-box;
          padding:12px;
          margin:5px 0;
          border-radius:12px;
          border:1px solid #ddd;
          font:inherit
        "
      ></textarea>

      <div style="display:flex;gap:8px">

        <button
          id="saveWorkoutBtn"
          class="primary"
          style="flex:1"
        >
          Zapisz trening
        </button>

        <button
          id="cancelWorkoutBtn"
          class="secondary"
          style="flex:1"
        >
          Anuluj
        </button>

      </div>

    </div>
  `;

  let m=$("meals")?.closest("section");

  if(m)m.after(s);

  $("addWorkoutBtn").onclick=()=>{
    if(!date)return msg("Najpierw wybierz dzień.",true);

    $("workoutForm").style.display="block";

    $("workoutForm").scrollIntoView({
      behavior:"smooth",
      block:"center"
    })
  };

  $("cancelWorkoutBtn").onclick=()=>
    $("workoutForm").style.display="none";

  $("saveWorkoutBtn").onclick=saveWorkout
}

function saveWorkout(){
  let w={
    id:String(Date.now()),
    date,
    type:$("wType").value.trim(),
    distance:N($("wDistance").value),
    time:$("wTime").value.trim(),
    pace:$("wPace").value.trim(),
    hr:N($("wHr").value),
    maxHr:N($("wMaxHr").value),
    calories:N($("wCalories").value),
    cadence:N($("wCadence").value),
    elevation:N($("wElevation").value),
    note:$("wNote").value.trim()
  };

  if(!w.type&&!w.distance&&!w.time)
    return msg("Wpisz rodzaj, dystans albo czas.",true);

  workouts.push(w);
  save();

  $("workoutForm").style.display="none";

  render();
  msg("Trening zapisany.")
}

function renderWorkouts(){
  let b=$("workouts");
  if(!b)return;

  let a=workouts.filter(w=>w.date===date);

  if(!a.length){
    b.innerHTML='<p style="color:#777">Brak treningów dla tego dnia.</p>';
    return
  }

  b.innerHTML=a.map(w=>`
    <div
      style="
        padding:16px;
        margin:10px 0;
        border-radius:18px;
        background:#f5f6fa
      "
    >

      <b style="font-size:18px">
        🏃 ${E(w.type||"Trening")}
      </b>

      <div
        style="
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:9px;
          margin-top:10px
        "
      >

        ${
          w.distance
          ?`<div>
              <small>Dystans</small><br>
              <b>${F(w.distance)} km</b>
            </div>`
          :""
        }

        ${
          w.time
          ?`<div>
              <small>Czas</small><br>
              <b>${E(w.time)}</b>
            </div>`
          :""
        }

        ${
          w.pace
          ?`<div>
              <small>Tempo</small><br>
              <b>${E(w.pace)}</b>
            </div>`
          :""
        }

        ${
          w.hr
          ?`<div>
              <small>Śr. HR</small><br>
              <b>${F(w.hr)}</b>
            </div>`
          :""
        }

        ${
          w.maxHr
          ?`<div>
              <small>Max HR</small><br>
              <b>${F(w.maxHr)}</b>
            </div>`
          :""
        }

        ${
          w.calories
          ?`<div>
              <small>Kalorie</small><br>
              <b>${F(w.calories)} kcal</b>
            </div>`
          :""
        }

        ${
          w.cadence
          ?`<div>
              <small>Kadencja</small><br>
              <b>${F(w.cadence)}</b>
            </div>`
          :""
        }

        ${
          w.elevation
          ?`<div>
              <small>Przewyższenie</small><br>
              <b>${F(w.elevation)} m</b>
            </div>`
          :""
        }

      </div>

      ${
        w.note
        ?`<div
            style="
              margin-top:10px;
              border-top:1px solid #ddd;
              padding-top:10px
            "
          >
            📝 ${E(w.note)}
          </div>`
        :""
      }

      <button
        data-del="${E(w.id)}"
        style="
          margin-top:12px;
          border:0;
          border-radius:10px;
          padding:8px 12px;
          background:#fee4e2;
          color:#b42318;
          font-weight:700
        "
      >
        Usuń trening
      </button>

    </div>
  `).join("");

  b.querySelectorAll("[data-del]").forEach(x=>{
    x.onclick=()=>{
      if(confirm("Usunąć ten trening?")){
        workouts=workouts.filter(w=>String(w.id)!==String(x.dataset.del));
        save();
        render()
      }
    }
  })
}

function history(){
  let b=$("history"),ds=dates();

  if(!b)return;

  b.innerHTML=ds.length
    ?ds.map(d=>`
      <div
        style="
          display:flex;
          justify-content:space-between;
          padding:11px 0;
          border-bottom:1px solid #eee
        "
      >
        <button
          data-d="${E(d)}"
          style="
            border:0;
            background:none;
            font-weight:700;
            font-size:16px
          "
        >
          ${E(d)}
        </button>

        <span>
          ${F(totals(d).t.kcal)} kcal
          ${
            workouts.filter(w=>w.date===d).length
            ?" · 🏃 "+workouts.filter(w=>w.date===d).length
            :""
          }
        </span>
      </div>
    `).join("")
    :"<p>Brak zapisanych dni.</p>";

  b.querySelectorAll("[data-d]").forEach(x=>{
    x.onclick=()=>{
      date=x.dataset.d;
      render();
      scrollTo({top:0,behavior:"smooth"})
    }
  })
}

function report(d){
  let {rows,t}=totals(d);

  let txt=
    `FUELTRACK AI\n`+
    `RAPORT DNIA: ${d}\n\n`;

  let g={};

  rows.forEach(x=>{
    let m=x.Posiłek||"Inne";
    if(!g[m])g[m]=[];
    g[m].push(x)
  });

  Object.entries(g).forEach(([m,a])=>{
    txt+=m.toUpperCase()+"\n";

    a.forEach(x=>{
      txt+=
        `• ${x["Produkty i potrawy"]||"Produkt"}`+
        `${x["ilość (g)"]?" — "+x["ilość (g)"]+" g":""}`+
        ` — ${F(N(x["kalorie (kcal)"]))} kcal`+
        ` | B ${F(N(x["Białka (g)"]))} g`+
        ` | W ${F(N(x["Węglowodany (g)"]))} g`+
        ` | T ${F(N(x["Tłuszcze (g)"]))} g\n`
    });

    txt+="\n"
  });

  txt+=
    `PODSUMOWANIE\n`+
    `Kalorie: ${F(t.kcal)} kcal\n`+
    `Białko: ${F(t.protein)} g\n`+
    `Węglowodany: ${F(t.carbs)} g\n`+
    `Tłuszcz: ${F(t.fat)} g\n\n`+
    `MIKROELEMENTY\n`;

  MIC.forEach(([c,n,u])=>{
    let v=rows.reduce((s,x)=>s+N(x[c]),0);
    if(v)txt+=`${n}: ${F(v)} ${u}\n`
  });

  txt+="\nTRENINGI\n";

  let ws=workouts.filter(w=>w.date===d);

  if(!ws.length){
    txt+="Brak zapisanych treningów.\n"
  }
  else{
    ws.forEach(w=>{
      txt+=`• ${w.type||"Trening"}`;

      if(w.distance)txt+=` | ${F(w.distance)} km`;
      if(w.time)txt+=` | ${w.time}`;
      if(w.pace)txt+=` | ${w.pace}`;
      if(w.hr)txt+=` | HR ${F(w.hr)}`;
      if(w.maxHr)txt+=` | Max HR ${F(w.maxHr)}`;
      if(w.calories)txt+=` | ${F(w.calories)} kcal`;
      if(w.cadence)txt+=` | kad. ${F(w.cadence)}`;
      if(w.elevation)txt+=` | +${F(w.elevation)} m`;
      if(w.note)txt+=` | ${w.note}`;

      txt+="\n"
    })
  }

  return txt
}

async function copy(){
  if(!date)return msg("Brak wybranego dnia.",true);

  let t=report(date);

  try{
    await navigator.clipboard.writeText(t)
  }
  catch{
    let x=document.createElement("textarea");
    x.value=t;
    document.body.append(x);
    x.select();
    document.execCommand("copy");
    x.remove()
  }

  msg("Raport skopiowany.")
}

function render(){
  dateUI();
  macro();
  balance();
  meals();
  micro();
  renderWorkouts();
  history()
}

document.addEventListener("DOMContentLoaded",()=>{
  load();

  let inp=$("fileInput");
  let imp=$("importBtn");

  if(imp&&inp){
    imp.onclick=()=>inp.click();

    inp.onchange=e=>{
      let f=e.target.files[0];
      if(f)importCSV(f);
      inp.value=""
    }
  }

  let ds=$("dateSelect");

  if(ds)
    ds.onchange=e=>{
      date=e.target.value;
      render()
    };

  let cp=$("copyBtn");

  if(cp)
    cp.onclick=copy;

  workoutUI();

  collapsible("micros","macroMicroDetails","Makro i mikro");
  collapsible("history","historyDetails","Historia");

  render()
});
