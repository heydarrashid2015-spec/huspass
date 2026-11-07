"use client";

import { useEffect, useState } from "react";

// Android Chrome can dismiss the IME while the editable element remains focused.
// The control is a user-initiated recovery only; it never forces the IME open.
export default function KeyboardRecovery() {
  const [target, setTarget] = useState(null);
  useEffect(() => {
    if (!/Android/i.test(navigator.userAgent) || !window.visualViewport) return;
    const viewport = window.visualViewport;
    // Capture the initial full viewport, before focusing a field. The previous
    // implementation used window.innerHeight as a baseline, which may itself
    // shrink with the keyboard and prevent detecting a close transition.
    let fullHeight = viewport.height;
    let tracked = null;
    let pending = null;
    const editable = el => (el instanceof HTMLTextAreaElement ||
      (el instanceof HTMLInputElement &&
        !["checkbox","radio","file","button","submit","reset","hidden","date","time"].includes(el.type))) &&
      !el.disabled && !el.readOnly;
    const cancel = () => { if (pending !== null) clearTimeout(pending); pending = null; };
    const inspect = () => {
      cancel();
      const active = document.activeElement;
      if (!editable(active)) {
        tracked = null;
        setTarget(null);
        fullHeight = Math.max(fullHeight, viewport.height);
        return;
      }
      if (active !== tracked) { tracked = active; setTarget(null); }
      const height = viewport.height;
      // Record the full-height viewport even if Android resized the layout.
      fullHeight = Math.max(fullHeight, height);
      if (fullHeight - height > 140) {
        setTarget(null);
        return;
      }
      // A focused field with a full-height viewport suggests the IME is hidden.
      // Delay so a normal tap has time to raise the keyboard without a flash.
      pending = setTimeout(() => {
        if (document.activeElement === active && active.isConnected &&
            fullHeight - viewport.height < 100) setTarget(active);
      }, 700);
    };
    const onFocus = () => { setTarget(null); inspect(); };
    const onBlur = () => { cancel(); tracked = null; setTarget(null); };
    viewport.addEventListener("resize", inspect);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("focusout", onBlur, true);
    return () => {
      cancel();
      viewport.removeEventListener("resize", inspect);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("focusout", onBlur, true);
    };
  }, []);
  const reopen = () => {
    if (!target || !target.isConnected || document.activeElement !== target) {
      setTarget(null);
      return;
    }
    target.blur();
    target.focus({ preventScroll: true });
    try { navigator.virtualKeyboard?.show?.(); } catch {}
    setTarget(null);
  };
  if (!target) return null;
  return <button type="button" onPointerDown={event => event.preventDefault()}
    onClick={reopen} aria-label="Vis tastatur igen"
    style={{position:"fixed",right:12,bottom:16,zIndex:20000,padding:"11px 16px",
      border:"1px solid #d2e7d8",borderRadius:24,background:"#12563c",color:"#fff",
      boxShadow:"0 4px 16px #0003",fontSize:14,fontWeight:700}}>
    Vis tastatur igen
  </button>;
}
