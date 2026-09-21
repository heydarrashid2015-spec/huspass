"use client";
import {useState} from "react";
const Icon=({name})=>{const paths={home:<><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/><path d="M9.5 20v-6h5v6"/></>,building:<><path d="M4 20V7l8-4 8 4v13"/><path d="M8 10h2M14 10h2M8 14h2M14 14h2M10 20v-3h4v3"/></>,check:<><path d="m5 12 4 4L19 6"/></>,doc:<><path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 11h6M9 15h6"/></>,menu:<><path d="M5 7h14M5 12h14M5 17h14"/></>,tool:<><path d="M14.7 6.3a4 4 0 0 0-5 5L4 17l3 3 5.7-5.7a4 4 0 0 0 5-5l-2.4 2.4-3-3z"/></>,coins:<><ellipse cx="12" cy="6" rx="6" ry="3"/><path d="M6 6v4c0 1.7 2.7 3 6 3s6-1.3 6-3V6M6 10v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4M6 14v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4"/></>,calendar:<><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></>,clock:<><circle cx="12" cy="12" r="8"/><path d="M12 8v5h4"/></>};return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>};
const sections=[
 ["home","Min bolig","Boligens oplysninger, rum og installationer"],
 ["tool","Vedligeholdelse","Opgaver, service og løbende vedligehold"],
 ["coins","Udgifter & budget","Priser, budget og faktiske udgifter"],
 ["doc","Boligens dokumenter","Kvitteringer, rapporter, garantier og filer"],
 ["calendar","Fremtidsplan","Planlagte forbedringer og kommende opgaver"],
 ["clock","Boligens historik","Samlet historik for boligens ændringer"]
];
export default function Home(){const [view,setView]=useState("Overblik");return <main>
<header><div><h1>HusPass</h1><p className="tagline">Dit hjem. Altid samlet.</p></div><button className="avatar">HR</button></header>
<section className="hero"><div><p>Godt at se dig igen 👋</p><h2>Alt om dit hjem,<br/>samlet ét sted.</h2><span>Få overblik, planlæg vedligehold og hold dine dokumenter samlet.</span></div><div className="houseArt"><div className="sun"></div><div className="roof"></div><div className="houseBody"><i></i><b></b></div><div className="tree">♧</div></div></section><section className="quick"><article><i><Icon name="check"/></i><b>2</b><span>Aktive opgaver</span></article><article><i><Icon name="coins"/></i><b>0 kr.</b><span>Udgifter denne måned</span></article><article><i><Icon name="doc"/></i><b>0</b><span>Dokumenter</span></article></section>
<section className="homeHead"><small>DIN BOLIG</small><h3>Granlunden 81</h3><p>Alt det vigtige om dit hjem samlet i HusPass.</p></section>
<section className="sectionList">{sections.map(([icon,title,desc])=><button className="sectionCard" key={title} onClick={()=>setView(title)}><i>{["home","tool","coins","doc","calendar","clock"].includes(icon)?<Icon name={icon}/>:icon}</i><div><b>{title}</b><span>{desc}</span></div><strong>›</strong></button>)}</section>
<nav className="bottomNav">
{[["home","Overblik","Overblik"],["building","Min bolig","Min bolig"],["tool","Vedligeholdelse","Vedligehold"],["doc","Boligens dokumenter","Dokumenter"],["menu","Mere","Mere"]].map(([icon,key,label])=><button key={key} className={view===key?"active":""} onClick={()=>setView(key)}><i><Icon name={icon}/></i><span>{label}</span></button>)}
</nav></main>}