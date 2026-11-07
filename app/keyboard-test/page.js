"use client";

import { useEffect, useState } from "react";

// Standalone diagnostic route: native inputs, no HusPass state, navigation,
// forms, keyboard recovery, or service worker registration.
export default function KeyboardTest() {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const log = event => {
      const active = document.activeElement;
      const field = active instanceof HTMLInputElement ? "input" :
        active instanceof HTMLTextAreaElement ? "textarea" : "other";
      const height = Math.round(window.visualViewport?.height ?? window.innerHeight);
      setEvents(previous => [...previous.slice(-9), {
        name: event.type, field, height
      }]);
    };
    const types = ["focusin", "focusout", "compositionstart", "compositionend"];
    types.forEach(type => document.addEventListener(type, log, true));
    window.visualViewport?.addEventListener("resize", log);
    return () => {
      types.forEach(type => document.removeEventListener(type, log, true));
      window.visualViewport?.removeEventListener("resize", log);
    };
  }, []);
  return <main style={{maxWidth:520,margin:"0 auto",padding:24,minHeight:"100vh"}}>
    <h1>Keyboard test</h1>
    <p>Independent input test. Long-press the space bar to switch language.</p>
    <label htmlFor="ime-plain">Plain text input</label>
    <input id="ime-plain" type="text" autoComplete="off"
      style={{display:"block",width:"100%",padding:14,margin:"12px 0 24px",fontSize:18}} />
    <label htmlFor="ime-area">Plain textarea</label>
    <textarea id="ime-area" rows={3}
      style={{display:"block",width:"100%",padding:14,margin:"12px 0 24px",fontSize:18}} />
    <section aria-label="IME event log" style={{fontSize:12,padding:12,background:"#eef5f1",borderRadius:8}}>
      <strong>Events (no typed text recorded)</strong>
      {events.map((entry,i)=><div key={i}>{entry.name} · {entry.field} · viewport {entry.height}</div>)}
    </section>
  </main>;
}
