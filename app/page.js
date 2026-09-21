"use client";
import {useEffect,useState} from "react";
const tabs=[["🏠","Bolig"],["✓","Opgaver"],["💳","Økonomi"],["📄","Dokumenter"],["☰","Mere"]];
const initial=[{id:1,text:"Tjek varmeanlæg",done:false},{id:2,text:"Skift filter i ventilation",done:true}];
export default function Home(){
 const [tab,setTab]=useState("Bolig");
 const [tasks,setTasks]=useState(initial);
 const [expenses,setExpenses]=useState([]);
 const [docs,setDocs]=useState([]);
 useEffect(()=>{try{setTasks(JSON.parse(localStorage.getItem("huspass_tasks"))||initial);setExpenses(JSON.parse(localStorage.getItem("huspass_expenses"))||[]);setDocs(JSON.parse(localStorage.getItem("huspass_docs"))||[])}catch{}},[]);
 useEffect(()=>{localStorage.setItem("huspass_tasks",JSON.stringify(tasks))},[tasks]);
 useEffect(()=>{localStorage.setItem("huspass_expenses",JSON.stringify(expenses))},[expenses]);
 useEffect(()=>{localStorage.setItem("huspass_docs",JSON.stringify(docs))},[docs]);
 const add=()=>{
  if(tab==="Opgaver"){const text=prompt("Ny opgave");if(text?.trim())setTasks([...tasks,{id:Date.now(),text:text.trim(),done:false}])}
  if(tab==="Økonomi"){const text=prompt("Hvad har du betalt for?");if(!text?.trim())return;const amount=Number(prompt("Beløb i kr.")||0);if(amount>0)setExpenses([...expenses,{id:Date.now(),text:text.trim(),amount}])}
  if(tab==="Dokumenter"){const text=prompt("Navn på dokument");if(text?.trim())setDocs([...docs,{id:Date.now(),text:text.trim(),date:new Date().toLocaleDateString("da-DK")}])}
 };
 const total=expenses.reduce((s,x)=>s+x.amount,0), active=tasks.filter(x=>!x.done).length;
 const rows=tab==="Opgaver"?tasks:tab==="Økonomi"?expenses:tab==="Dokumenter"?docs:[];
 return <main><header><div><small>MIT HJEM</small><h1>HusPass</h1></div><button className="avatar">H</button></header>
 <section className="hero"><p>Godt at se dig 👋</p><h2>Alt om dit hjem,<br/>samlet ét sted.</h2><span>Hold styr på bolig, opgaver, økonomi og dokumenter.</span></section>
 <section className="stats"><article><b>{active}</b><span>Aktive opgaver</span></article><article><b>{total.toLocaleString("da-DK")} kr.</b><span>Udgifter</span></article><article><b>{docs.length}</b><span>Dokumenter</span></article></section>
 <section className="content"><div className="title"><div><small>{tab.toUpperCase()}</small><h3>{tab==="Bolig"?"Granlunden 81":tab}</h3></div>{["Opgaver","Økonomi","Dokumenter"].includes(tab)&&<button onClick={add}>＋</button>}</div>
 {tab==="Bolig"&&<><div className="card"><div className="house">⌂</div><div><b>Din boligprofil</b><p>Oplysninger om boligen, vedligeholdelse og installationer.</p></div><strong>›</strong></div><div className="info"><span>Adresse</span><b>Granlunden 81</b><span>Vedligeholdelse</span><b>Samlet i HusPass</b></div></>}
 {tab==="Opgaver"&&rows.map(t=><div className="task" key={t.id} onClick={()=>setTasks(tasks.map(x=>x.id===t.id?{...x,done:!x.done}:x))}><i className={t.done?"done":""}>{t.done?"✓":""}</i><span className={t.done?"strike":""}>{t.text}</span></div>)}
 {tab==="Økonomi"&&<>{!rows.length&&<p className="empty">Ingen udgifter endnu. Tryk + for at tilføje.</p>}{rows.map(x=><div className="listrow" key={x.id}><span>{x.text}</span><b>{x.amount.toLocaleString("da-DK")} kr.</b></div>)}</>}
 {tab==="Dokumenter"&&<>{!rows.length&&<p className="empty">Ingen dokumenter registreret endnu. Tryk + for at tilføje.</p>}{rows.map(x=><div className="listrow" key={x.id}><span>📄 {x.text}</span><small>{x.date}</small></div>)}</>}
 {tab==="Mere"&&<div className="menu"><button>👤 Profil <b>›</b></button><button>🔔 Påmindelser <b>›</b></button><button>⚙️ Indstillinger <b>›</b></button><button>ℹ️ Om HusPass <b>›</b></button></div>}
 </section>
 <nav>{tabs.map(([icon,name])=><button key={name} className={tab===name?"active":""} onClick={()=>setTab(name)}><em>{icon}</em><span>{name}</span></button>)}</nav>
 </main>}