"use client";

import { useEffect, useState } from "react";

// Recovery for Android IMEs that dismiss themselves while an editable field
// remains focused (observed when long-pressing the space bar to change language).
// Never steal focus or automatically reopen the keyboard.
export default function KeyboardRecovery() {
  const [target, setTarget] = useState(null);
  useEffect(() => {
    if (window.location.pathname === "/keyboard-test" || !/Android/i.test(navigator.userAgent) || !window.visualViewport) return;
    const viewport = window.visualViewport;
    let keyboardWasOpen = false;
    let baseline = Math.max(window.innerHeight, viewport.height);
    let tracked = null;
    const editable = el => el instanceof HTMLInputElement &&
      !["checkbox","radio","file","button","submit","reset","hidden","date","time"].includes(el.type) ||
      el instanceof HTMLTextAreaElement;
    const check = () => {
      const active = document.activeElement;
      const height = viewport.height;
      // Baseline is the full-height viewport seen while the IME is closed.
      // Keep it fixed while the field is focused, to avoid false positives.
      if (!editable(active)) {
        tracked = null;
        keyboardWasOpen = false;
        baseline = Math.max(baseline, height);
        setTarget(null);
        return;
      }
      if (active !== tracked) {
        tracked = active;
        keyboardWasOpen = false;
        setTarget(null);
      }
      if (baseline - height > 140) {
        keyboardWasOpen = true;
        setTarget(null);
      } else if (keyboardWasOpen && baseline - height < 90) {
        // IME disappeared, but the same field is still focused.
        setTarget(active);
        keyboardWasOpen = false;
      }
    };
    const onFocus = () => { tracked = document.activeElement; keyboardWasOpen = false; setTarget(null); };
    const onBlur = () => { tracked = null; keyboardWasOpen = false; setTarget(null); };
    viewport.addEventListener("resize", check);
    document.addEventListener("focusin", onFocus, true);
    document.addEventListener("focusout", onBlur, true);
    return () => {
      viewport.removeEventListener("resize", check);
      document.removeEventListener("focusin", onFocus, true);
      document.removeEventListener("focusout", onBlur, true);
    };
  }, []);
  const reopen = () => {
    if (!target || !target.isConnected || document.activeElement !== target) {
      setTarget(null);
      return;
    }
    // Executed only in response to a user tap, which permits Android Chrome
    // to show its IME. A focus cycle is needed when the field never blurred.
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
