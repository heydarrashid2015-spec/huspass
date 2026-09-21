"use client";
import {useState} from "react";
const Icon=({name})=>{const paths={home:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/></>,building:<><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M10 21v-3h4v3"/></>,check:<><path d="m5 12 4 4L19 6"/></>,doc:<><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,menu:<><path d="M5 7h14M5 12h14M5 17h14"/></>};return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>};
const sections=[
 ["home","Min bolig","Boligens oplysninger, rum og installationer"],
 ["check","Vedligeholdelse","Opgaver, service og løbende vedligehold"],
 ["kr","Udgifter & budget","Priser, budget og faktiske udgifter"],
 ["doc","Boligens dokumenter","Kvitteringer, rapporter, garantier og filer"],
 ["↗","Fremtidsplan","Planlagte forbedringer og kommende opgaver"],
 ["◷","Boligens historik","Samlet historik for boligens ændringer"]
];
export default function Home(){const [view,setView]=useState("Overblik");return <main>
<header><div><small>MIT HJEM</small><h1>HusPass</h1></div><button className="avatar">H</button></header>
<section className="hero"><p>Godt at se dig 👋</p><h2>Alt om dit hjem,<br/>samlet ét sted.</h2><span>Hold styr på din bolig, vedligeholdelse, dokumenter og planer.</span></section>
<section className="homeHead"><small>DIN BOLIG</small><h3>Granlunden 81</h3><p>Alt det vigtige om dit hjem samlet i HusPass.</p></section>
<section className="sectionList">{sections.map(([icon,title,desc])=><button className="sectionCard" key={title} onClick={()=>setView(title)}><i>{["home","check","doc"].includes(icon)?<Icon name={icon}/>:icon}</i><div><b>{title}</b><span>{desc}</span></div><strong>›</strong></button>)}</section>
<nav className="bottomNav">
{[["home","Overblik","Overblik"],["building","Min bolig","Min bolig"],["check","Vedligeholdelse","Vedligehold"],["doc","Boligens dokumenter","Dokumenter"],["menu","Mere","Mere"]].map(([icon,key,label])=><button key={key} className={view===key?"active":""} onClick={()=>setView(key)}><i><Icon name={icon}/></i><span>{label}</span></button>)}
</nav></main>}