const fs = require("fs");
const path = require("path");

if (process.platform !== "android") {
  console.log("ponytail-patch: not android, skipping SWC wasm patch");
  process.exit(0);
}

const file = path.join(
  __dirname,
  "..",
  "node_modules",
  "next",
  "dist",
  "build",
  "swc",
  "index.js"
);

try {
  const src = fs.readFileSync(file, "utf8");
  if (!src.includes("async function loadBindings(useWasmBinary = true)")) {
    const patched = src.replace(
      "async function loadBindings(useWasmBinary = false) {",
      "async function loadBindings(useWasmBinary = true) {"
    );
    fs.writeFileSync(file, patched);
    console.log("ponytail-patch: applied SWC wasm-first default for Android");
  } else {
    console.log("ponytail-patch: already patched");
  }
} catch (e) {
  console.error("ponytail-patch: failed", e.message);
}
