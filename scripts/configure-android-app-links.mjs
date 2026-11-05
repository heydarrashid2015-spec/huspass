import {readFileSync, writeFileSync} from "node:fs";

const path = "android/app/src/main/AndroidManifest.xml";
let xml = readFileSync(path, "utf8");
const marker = "android:autoVerify=\"true\"";
if (!xml.includes(marker)) {
  const intentFilter = `        <intent-filter android:autoVerify="true">
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="https" android:host="www.huspass.dk" />
        </intent-filter>
`;
  const activity = /(<activity\b[^>]*>)/;
  if (!activity.test(xml)) throw new Error("Capacitor Android Activity not found");
  xml = xml.replace(activity, "$1\n" + intentFilter);
  writeFileSync(path, xml);
}
console.log("Verified Android App Links configured for www.huspass.dk");
