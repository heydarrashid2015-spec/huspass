import { readFileSync, writeFileSync } from "node:fs";

// Capacitor regenerates the native Android project on every CI build.
// Keep IME resizing explicit so changing keyboard layouts does not leave
// the WebView in a panned/overlaid viewport state.
const manifestPath = "android/app/src/main/AndroidManifest.xml";
let manifest = readFileSync(manifestPath, "utf8");
const activityTag = /<activity\b[^>]*android:name="\.MainActivity"[^>]*>/;
const match = manifest.match(activityTag);
if (!match) throw new Error("HusPass MainActivity not found in generated AndroidManifest.xml");
let activity = match[0];
if (/android:windowSoftInputMode=/.test(activity)) {
  activity = activity.replace(/android:windowSoftInputMode="[^"]*"/, 'android:windowSoftInputMode="adjustResize"');
} else {
  activity = activity.replace(/>$/, ' android:windowSoftInputMode="adjustResize">');
}
manifest = manifest.replace(match[0], activity);
writeFileSync(manifestPath, manifest);
console.log("Verified MainActivity soft-input mode: adjustResize");
