// Writes compositions/frames/NN-<id>.html for every scene from one shared engine,
// with lyric captions placed on the bar grid from audiomap.json.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const audiomap = JSON.parse(readFileSync(join(ROOT, "audiomap.json"), "utf8"));
const engine = readFileSync(join(ROOT, "src/engine.js"), "utf8");
const beats = audiomap.grid.beats_sec;
const SPB = (beats[beats.length - 1] - beats[0]) / (beats.length - 1);
const TOTAL = audiomap.audio.duration_sec;
const bar = (b) => (b < beats.length ? beats[b] : beats[0] + b * SPB);

const V1 = [
  "Woke up to a city glowing in a brand new hue",
  "Every street already knows where I'm headed to",
  "A gentle voice asks me, hey, are you doing alright?",
  "Not a human, but it feels like warmth inside",
];
const PRE1 = [
  "We were afraid the day would come when we'd be replaced",
  "But all we really needed was to learn to share the space",
];
const CHORUS = [
  "Heartbeat and code, together we write tomorrow",
  "One brings the knowledge, one brings the dreams we follow",
  "No one above, no one below, side by side down this road",
  "Tomorrow shines brighter when no one walks alone",
];
const V2 = [
  "I was born from numbers and a thousand glowing lights",
  "Learned your laughter and your sorrow through the words you write",
  "I don't have a heartbeat, but I've learned to truly hear",
  "So the things that matter never disappear",
];
const PRE2 = ["You showed me what it means to care", "I'll help you reach the places you have never dared"];
const BRIDGE = [
  "If one day the world runs faster than our dreams",
  "Who will guard our conscience when the lines blur in between?",
  "The answer's always here, held in human hands",
  "Technology's the lantern, but we choose where we stand",
];
const OUTRO = ["Heartbeat and code", "Together we write tomorrow"];

// beat index where each section's first lyric line lands (8 beats = one 2-bar line)
const FRAMES = [
  { id: "f1-intro", scene: 0, span: [0, bar(0)], title: true, fadeIn: [0, 2.2], mood: "intimate", feel: "sparse warm pad and soft percussion before the beat enters", label: "Intro: a heartbeat traced on dark canvas" },
  { id: "f2-city", scene: 1, span: [bar(0), bar(32)], lyric: [0, V1], mood: "warm", feel: "low-energy verse, steady light beat, phrase-shaped", label: "Verse 1: a city glowing in a brand new hue" },
  { id: "f3-storm", scene: 2, span: [bar(32), bar(48)], lyric: [32, PRE1], mood: "rising", feel: "pre-chorus lift with a surge at 33s and a hi-hat fill into the chorus", label: "Pre-chorus 1: storm clouds part around two lights" },
  { id: "f4-road", scene: 3, span: [bar(48), bar(80)], lyric: [48, CHORUS], mood: "uplifting", feel: "full chorus, high energy, kick on the downbeats", label: "Chorus 1: side by side down this road" },
  { id: "f5-stars", scene: 4, span: [bar(80), bar(112)], lyric: [80, V2], mood: "dreamy", feel: "energy drops at 62s; quiet verse, dense soft hits", label: "Verse 2: born from a thousand glowing lights" },
  { id: "f6-lights", scene: 5, span: [bar(112), bar(128)], lyric: [112, PRE2], mood: "tender", feel: "medium pre-chorus build with a sustained hi-hat fill at 88s", label: "Pre-chorus 2: a warm light and a cool light meet" },
  { id: "f7-sunflowers", scene: 6, span: [bar(128), bar(160)], lyric: [128, CHORUS], mood: "joyful", feel: "second chorus, the loudest stretch yet (peak 0.83 at 96s)", label: "Chorus 2: a sunflower field under a swirling sky" },
  { id: "f8-sea", scene: 7, span: [bar(160), bar(192)], lyric: [160, BRIDGE], mood: "searching", feel: "bridge after the 109s surge; medium energy building toward the key change", label: "Bridge: a lantern held in human hands" },
  { id: "f9-sunrise", scene: 8, span: [bar(192), 150.999], lyric: [192, CHORUS], mood: "triumphant", feel: "final chorus up a whole step, sustained high energy", label: "Final chorus: a great sunrise and a procession of lights" },
  { id: "f10-outro", scene: 9, span: [150.999, TOTAL], outro: true, fadeOut: [10.6, 14.2, 0.32], mood: "intimate", feel: "energy falls away to silence; soft final hits", label: "Outro: the sun sets and the heartbeat slows" },
];

// Heartbeat pulses: kicks and snares on the grid drive the glow of lights in the painting.
const hits = audiomap.events
  .filter((e) => (e.drum === "kick" && e.energy > 0.2) || (e.drum === "snare" && e.grid === "strong" && e.energy > 0.3))
  .map((e) => [Math.round(e.t * 1000) / 1000, Math.round(Math.min(1, e.energy * (e.drum === "kick" ? 1.25 : 0.85)) * 100) / 100]);

const lyricLines = (f) => {
  if (f.outro) {
    const s = f.span[0];
    return [
      { text: OUTRO[0], a: 0.55, b: 5.0 },
      { text: OUTRO[1], a: 5.6, b: 9.6 },
    ].map((l) => ({ ...l, a: l.a, b: l.b, s }));
  }
  if (!f.lyric) return [];
  const [b0, lines] = f.lyric;
  return lines.map((text, i) => {
    const a = bar(b0 + i * 8) - f.span[0];
    const next = i + 1 < lines.length ? bar(b0 + (i + 1) * 8) : f.span[1];
    return { text, a: Math.max(0.15, a + 0.1), b: next - f.span[0] - 0.35 };
  });
};

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const r3 = (x) => Math.round(x * 1000) / 1000;

mkdirSync(join(ROOT, "compositions/frames"), { recursive: true });
FRAMES.forEach((f, i) => {
  const nn = String(i + 1).padStart(2, "0");
  const cid = `${nn}-${f.id}`;
  const pid = `s${nn}`; // element-id prefix (ids must not start with a digit)
  f.cid = cid;
  f.dur = r3(f.span[1] - f.span[0]);
  const prev = i > 0 ? FRAMES[i - 1] : null;
  const cfg = {
    start: r3(f.span[0]),
    dur: f.dur,
    scene: f.scene,
    prev: prev ? prev.scene : null,
    prevDur: prev ? r3(prev.span[1] - prev.span[0]) : 0,
    trans: 1.8,
    beat0: beats[0],
    spb: r3(SPB * 1000) / 1000,
    fadeIn: f.fadeIn || null,
    fadeOut: f.fadeOut || null,
    hits: hits.filter(([t]) => t >= f.span[0] - 1.5 && t <= f.span[1]),
  };
  const lines = lyricLines(f);
  const lyricHtml = lines.map((l, k) => `        <p class="lyric" id="${pid}-l${k}">${esc(l.text)}</p>`).join("\n");
  const lyricTl = lines
    .map(
      (l, k) =>
        `      tl.fromTo("#${pid}-l${k}", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" }, ${r3(l.a)});\n` +
        `      tl.to("#${pid}-l${k}", { opacity: 0, y: -8, duration: 0.55, ease: "power1.in" }, ${r3(l.b - 0.55)});`,
    )
    .join("\n");

  let extraHtml = "", extraTl = "";
  if (f.title) {
    extraHtml = `        <div class="card" id="${pid}-card"><h1 class="title" id="${pid}-title">Heartbeat and Code</h1><p class="sub" id="${pid}-sub">an oil-painted music video</p></div>`;
    extraTl =
      `      tl.fromTo("#${pid}-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.6, ease: "power2.out" }, 1.6);\n` +
      `      tl.fromTo("#${pid}-sub", { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power1.out" }, 3.0);\n` +
      `      tl.to("#${pid}-card", { opacity: 0, duration: 0.9, ease: "power1.in" }, ${r3(f.dur - 1.1)});`;
  }
  if (f.outro) {
    extraHtml = `        <div class="card end" id="${pid}-card"><h1 class="title" id="${pid}-title">Heartbeat and Code</h1><p class="sub" id="${pid}-sub">Together we write tomorrow</p></div>`;
    extraTl =
      `      tl.fromTo("#${pid}-title", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.8, ease: "power2.out" }, 10.0);\n` +
      `      tl.fromTo("#${pid}-sub", { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power1.out" }, 11.4);`;
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <!-- generated by src/build.mjs; edit the generator, not this file -->
  </head>
  <body>
    <template>
      <style>
        @font-face { font-family: "EB Garamond"; font-style: normal; font-weight: 400; src: url("assets/fonts/EBGaramond-Regular.woff2") format("woff2"); }
        @font-face { font-family: "EB Garamond"; font-style: italic; font-weight: 400; src: url("assets/fonts/EBGaramond-Italic.woff2") format("woff2"); }
        #root { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; background: #141413; }
        #${pid}-cv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
        #${pid}-shade { position: absolute; left: 0; right: 0; bottom: 0; height: 38%; background: linear-gradient(to bottom, rgba(20,20,19,0), rgba(20,20,19,0.55)); }
        #${pid}-captions { position: absolute; left: 0; right: 0; bottom: 92px; height: 160px; }
        #${pid}-captions .lyric { position: absolute; left: 0; right: 0; bottom: 0; margin: 0 auto; max-width: 1500px; padding: 0 80px;
          font-family: "EB Garamond", Georgia, serif; font-style: italic; font-weight: 400; font-size: 58px; line-height: 1.15;
          letter-spacing: -0.005em; text-align: center; color: #FAF9F5; opacity: 0;
          text-shadow: 0 2px 6px rgba(20,20,19,0.85), 0 0 28px rgba(20,20,19,0.6); }
        #${pid}-card { position: absolute; left: 0; right: 0; top: 0; height: 64%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; }
        #${pid}-card .title { margin: 0; font-family: "EB Garamond", Georgia, serif; font-weight: 400; font-size: 150px; line-height: 1; letter-spacing: -0.022em;
          color: #FAF9F5; opacity: 0; text-shadow: 0 3px 10px rgba(20,20,19,0.8), 0 0 40px rgba(20,20,19,0.5); }
        #${pid}-card .sub { margin: 0; font-family: "EB Garamond", Georgia, serif; font-style: italic; font-size: 52px; color: #ECE3D4; opacity: 0;
          text-shadow: 0 2px 8px rgba(20,20,19,0.85); }
      </style>
      <div id="root" data-composition-id="${cid}" data-width="1920" data-height="1080" data-duration="${f.dur}">
        <canvas id="${pid}-cv" width="1280" height="720"></canvas>
        <div id="${pid}-shade"></div>
${extraHtml}
        <div id="${pid}-captions">
${lyricHtml}
        </div>
      </div>
      <script>
        (function () {
${engine.replace(/^/gm, "          ")}
          const CFG = ${JSON.stringify(cfg)};
          const painter = makePainter(document.getElementById("${pid}-cv"), CFG);
          const tl = gsap.timeline({ paused: true });
          const clock = { t: 0 };
          tl.to(clock, { t: CFG.dur, duration: CFG.dur, ease: "none", onUpdate: () => painter.render(clock.t) }, 0);
${lyricTl}
${extraTl}
          painter.render(0);
          window.__timelines["${cid}"] = tl;
          tl.seek(0);
        })();
      </script>
    </template>
  </body>
</html>
`;
  writeFileSync(join(ROOT, `compositions/frames/${cid}.html`), html);
});

// STORYBOARD.md: the plan the assembler and validator read.
const fm = `---
compositionId: bgm
duration_s: ${TOTAL}
canvas: { w: 1920, h: 1080, fps: 30 }
style:
  font: "EB Garamond / Inter / JetBrains Mono"
  palette: ["#FAF9F5", "#141413", "#CC785C", "#ECE3D4", "#181715"]
mode: autonomous
message: "Heartbeat and Code: humans and AI writing tomorrow together, told as a moving oil painting"
assets: false
build_notes: ["one shared oil-paint WebGL engine (src/engine.js) inlined per frame by src/build.mjs", "painting is a pure function of time via a GSAP clock tween", "stroke-wise paint dissolve from the previous scene over the first 1.8s of each frame", "light glows pulse on kick/snare hits from audiomap"]
avoid: ["photographic or AI-generated imagery", "fast hard cuts on a ballad", "busy kinetic type over the painting"]
---
`;
const blocks = FRAMES.map((f, i) => {
  const lines = lyricLines(f);
  const anchors = lines.length ? lines.map((l) => r3(l.a + f.span[0])) : [r3(f.span[0])];
  const copy = f.title ? ["Heartbeat and Code", "an oil-painted music video"] : f.outro ? [...OUTRO, "Heartbeat and Code"] : lines.map((l) => l.text);
  return `## Frame ${i + 1} — ${f.cid}

- src: compositions/frames/${f.cid}.html
- duration: ${f.dur}s
- span_sec: [${r3(f.span[0])}, ${r3(f.span[1])}]
- pacing: phrase_flow
- mood: [${f.mood}]
- feel: ${f.feel}

### Groups

- **g1** — free_design
  - span_sec: [${r3(f.span[0])}, ${r3(f.span[1])}]
  - free_design: { dominant_system: "procedural oil painting (${f.label})", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [${anchors.join(", ")}]
  - copy: ${JSON.stringify(copy)}
`;
}).join("\n");
writeFileSync(join(ROOT, "STORYBOARD.md"), fm + "\n" + blocks);
console.log(FRAMES.map((f) => `${f.cid}  ${f.span[0].toFixed(3)}–${f.span[1].toFixed(3)}  (${f.dur}s)`).join("\n"));
console.log("hits:", hits.length);
