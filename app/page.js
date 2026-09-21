"use client";
import {useState} from "react";
const sections=[
 ["⌂","Min bolig","Boligens oplysninger, rum og installationer"],
 ["✓","Vedligeholdelse","Opgaver, service og løbende vedligehold"],
 ["kr","Udgifter & budget","Priser, budget og faktiske udgifter"],
 ["▤","Boligens dokumenter","Kvitteringer, rapporter, garantier og filer"],
 ["↗","Fremtidsplan","Planlagte forbedringer og kommende opgaver"],
 ["◷","Boligens historik","Samlet historik for boligens ændringer"]
];
export default function Home(){
 const [view,setView]=useState("Overblik");
 return <main>
  <header><div><small>MIT HJEM</small><h1>HusPass</h1></div><button className="avatar">H</button></header>
  <section className="hero"><p>Godt at se dig 👋</p><h2>Alt om dit hjem,<br/>samlet ét sted.</h2><span>Hold styr på din bolig, vedligeholdelse, dokumenter og planer.</span></section>
  <section className="homeHead"><small>DIN BOLIG</small><h3>Granlunden 81</h3><p>Alt det vigtige om dit hjem samlet i HusPass.</p></section>
  <section className="sectionList">
   {sections.map(([icon,title,desc])=><button className="sectionCard" key={title} onClick={()=>setView(title)}>
    <i>{icon}</i><div><b>{title}</b><span>{desc}</span></div><strong>›</strong>
   </button>)}
  </section>
  <nav className="bottomNav">
   <button className={view==="Overblik"?"active":""} onClick={()=>setView("Overblik")}><i>⌂</i><span>Overblik</span></button>
   <button className={view==="Min bolig"?"active":""} onClick={()=>setView("Min bolig")}><i>▱</i><span>Min bolig</span></button>
   <button className={view==="Vedligeholdelse"?"active":""} onClick={()=>setView("Vedligeholdelse")}><i>✓</i><span>Vedligehold</span></button>
   <button className={view==="Boligens dokumenter"?"active":""} onClick={()=>setView("Boligens dokumenter")}><i>▤</i><span>Dokumenter</span></button>
   <button className={view==="Mere"?"active":""} onClick={()=>setView("Mere")}><i>≡</i><span>Mere</span></button>
  </nav>
 </main>
}