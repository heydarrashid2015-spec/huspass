import { readFileSync, writeFileSync } from "node:fs";

const path = "android/app/build.gradle";
const version = Number(process.env.HUSPASS_VERSION_CODE);
if (!Number.isSafeInteger(version) || version < 11 || version > 2100000000) {
  throw new Error("HUSPASS_VERSION_CODE must be an integer from 11 to 2100000000; check the current Play Console versionCode before choosing it");
}

// Google Play automatic protection requires Android minSdkVersion >= 24.
// Capacitor generates this setting in android/variables.gradle.
const variablesPath = "android/variables.gradle";
let variables = readFileSync(variablesPath, "utf8");
if (!/minSdkVersion\s*=\s*\d+/.test(variables)) {
  throw new Error("Generated Android minSdkVersion not found in variables.gradle");
}
variables = variables.replace(/minSdkVersion\s*=\s*\d+/, "minSdkVersion = 24");
writeFileSync(variablesPath, variables);

let gradle = readFileSync(path, "utf8");
if (!/versionCode\s+\d+/.test(gradle)) throw new Error("Generated Android versionCode not found");
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${version}`);
if (process.env.HUSPASS_SIGN_RELEASE === "true") {
  const required = ["HUSPASS_KEYSTORE_PATH", "HUSPASS_KEY_ALIAS", "HUSPASS_STORE_PASSWORD", "HUSPASS_KEY_PASSWORD"];
  for (const key of required) if (!process.env[key]) throw new Error(`Missing signing secret ${key}`);
  if (!/buildTypes\s*\{/.test(gradle)) throw new Error("Generated Android buildTypes not found");
  const signing = `signingConfigs {
        huspassRelease {
            storeFile file(System.getenv("HUSPASS_KEYSTORE_PATH"))
            storePassword System.getenv("HUSPASS_STORE_PASSWORD")
            keyAlias System.getenv("HUSPASS_KEY_ALIAS")
            keyPassword System.getenv("HUSPASS_KEY_PASSWORD")
        }
    }
    buildTypes {`;
  gradle = gradle.replace(/buildTypes\s*\{/, signing);
  if (!/release\s*\{/.test(gradle)) throw new Error("Generated Android release buildType not found");
  gradle = gradle.replace(/release\s*\{/, "release {\n            signingConfig signingConfigs.huspassRelease");
}
writeFileSync(path, gradle);
console.log(`Android release versionCode configured: ${version}; signing: ${process.env.HUSPASS_SIGN_RELEASE === "true" ? "enabled" : "disabled"}`);
