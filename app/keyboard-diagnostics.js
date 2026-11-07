"use client";

import { useEffect, useState } from "react";

// Opt-in, device-local IME diagnostics. No field values, typed characters,
// personal data, network requests or persistent storage.
export default function KeyboardDiagnostics() {
  const [enabled, setEnabled] = useState(false);
  const [events, setEvents] = useState([]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("keyboardDebug") !== "1") return;
    setEnabled(true);
    let lastFocused = null;
    const label = el => el instanceof HTMLTextAreaElement ? "textarea" :
      el instanceof HTMLInputElement ? "input" : "other";
    const record = (event, detail = "") => {
      const active = document.activeElement;
      setEvents(previous => [...previous.slice(-11), {
        event, detail, active: label(active), at: new Date().toLocaleTimeString()
      }]);
    };
    const onFocusIn = event => {
      if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
      lastFocused = event.target;
      record("focusin", label(event.target));
    };
    const onFocusOut = event => {
      if (!(event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)) return;
      record("focusout", label(event.target));
    };
    const onCompositionStart = () => record("compositionstart");
    const onCompositionEnd = () => record("compositionend");
    const onVisibility = () => record("visibility", document.visibilityState);
    const onViewport = () => record("viewport", String(Math.round(window.visualViewport?.height || window.innerHeight)));
    const onPointer = event => {
      // Detect pointer activity in the web page; Android keyboard touches are
      // outside the DOM and must not be mistaken for a web-page tap.
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        record("field-pointer", label(event.target));
      }
    };
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    document.addEventListener("compositionstart", onCompositionStart, true);
    document.addEventListener("compositionend", onCompositionEnd, true);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerdown", onPointer, true);
    window.visualViewport?.addEventListener("resize", onViewport);
    record("diagnostics-start");
    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      document.removeEventListener("compositionstart", onCompositionStart, true);
      document.removeEventListener("compositionend", onCompositionEnd, true);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerdown", onPointer, true);
      window.visualViewport?.removeEventListener("resize", onViewport);
      lastFocused = null;
    };
  }, []);
  if (!enabled) return null;
  return <aside aria-label="Keyboard diagnostics" style={{
    position:"fixed",left:8,right:8,bottom:8,zIndex:2147483647,
    maxHeight:"28vh",overflowY:"auto",padding:10,borderRadius:12,
    background:"#132e27",color:"#fff",fontSize:11,
    boxShadow:"0 4px 20px #0005",pointerEvents:"none"
  }}>
    <strong>Keyboard diagnostics (local only)</strong>
    {events.map((entry,i)=><div key={i}>{entry.at} · {entry.event} {entry.detail} · active: {entry.active}</div>)}
  </aside>;
}
