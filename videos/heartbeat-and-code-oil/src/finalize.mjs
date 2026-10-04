// Point index.html at the vendored GSAP (the render browser cannot reach the CDN here).
import { readFileSync, writeFileSync } from "node:fs";
const p = new URL("../index.html", import.meta.url);
const html = readFileSync(p, "utf8").replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/gsap[^>]*><\/script>/, '<script src="assets/gsap.min.js"></script>');
writeFileSync(p, html);
