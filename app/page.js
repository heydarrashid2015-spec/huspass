"use client";
import {useState} from "react";
const tabs=[["🏠","Bolig"],["✓","Opgaver"],["💳","Økonomi"],["📄","Dokumenter"],["☰","Mere"]];
export default function Home(){
 const [tab,setTab]=useState("Bolig");
 const [tasks,setTasks]=useState([{id:1,text:"Tjek varmeanlæg",done:false},{id:2,text:"Skift filter i ventilation",done:true}]);
 const add=()=>{const text=prompt("Ny opgave");if(text?.trim())setTasks([...tasks,{id:Date.now(),text:text.trim(),done:false}])};
 return <main><header><div><small>MIT HJEM</small><h1>HusPass</h1></div><button className="avatar">H</button></header>
 <section className="hero"><p>Godt at se dig 👋</p><h2>Alt om dit hjem,<br/>samlet ét sted.</h2><span>Hold styr på bolig, opgaver, økonomi og dokumenter.</span></section>
 <section className="stats"><article><b>2</b><span>Aktive opgaver</span></article><article><b>0 kr.</b><span>Denne måned</span></article><article><b>0</b><span>Dokumenter</span></article></section>
 <section className="content"><div className="title"><div><small>{tab.toUpperCase()}</small><h3>{tab==="Opgaver"?"Dine opgaver":"Granlunden 81"}</h3></div><button onClick={add}>＋</button></div>
 {tab==="Opgaver"?tasks.map(t=><div className="task" key={t.id} onClick={()=>setTasks(tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x))}><i className={t.done?"done":""}>{t.done?"✓":""}</i><span className={t.done?"strike":""}>{t.text}</span></div>):
 <div className="card"><div className="house">⌂</div><div><b>Din boligprofil</b><p>Tilføj oplysninger om boligen, vedligeholdelse og installationer.</p></div><strong>›</strong></div>}
 </section>
 <nav>{tabs.map(([icon,name])=><button key={name} className={tab===name?"active":""} onClick={()=>setTab(name)}><em>{icon}</em><span>{name}</span></button>)}</nav>
 </main>}