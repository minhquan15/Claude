---
compositionId: bgm
duration_s: 207.92
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

## Frame 1 — 01-f1-intro

- src: compositions/frames/01-f1-intro.html
- duration: 13.39s
- span_sec: [0, 13.39]
- pacing: phrase_flow
- mood: [intimate]
- feel: soft piano and warm pad before the first vocal

### Groups

- **g1** — free_design
  - span_sec: [0, 13.39]
  - free_design: { dominant_system: "procedural oil painting (Intro: a heartbeat traced on dark canvas)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [0]
  - copy: ["Heartbeat and Code","an oil-painted music video"]

## Frame 2 — 02-f2-city

- src: compositions/frames/02-f2-city.html
- duration: 19.28s
- span_sec: [13.39, 32.67]
- pacing: phrase_flow
- mood: [warm]
- feel: verse 1, male vocal, light beat

### Groups

- **g1** — free_design
  - span_sec: [13.39, 32.67]
  - free_design: { dominant_system: "procedural oil painting (Verse 1: a city glowing in a brand new hue)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [13.54, 18, 22.78, 28.02]
  - copy: ["Woke up to a city glowing in a brand new hue","Every street already knows where I'm headed to","A gentle voice asks me, hey, are you doing all right?","Not a human, but it feels like warmth inside"]

## Frame 3 — 03-f3-storm

- src: compositions/frames/03-f3-storm.html
- duration: 11.239s
- span_sec: [32.67, 43.909]
- pacing: phrase_flow
- mood: [rising]
- feel: pre-chorus build, male vocal

### Groups

- **g1** — free_design
  - span_sec: [32.67, 43.909]
  - free_design: { dominant_system: "procedural oil painting (Pre-chorus 1: storm clouds part around two lights)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [32.82, 37.73]
  - copy: ["We were afraid the day would come when we'd be replaced","But all we really needed was to learn to share the space"]

## Frame 4 — 04-f4-road

- src: compositions/frames/04-f4-road.html
- duration: 23.081s
- span_sec: [43.909, 66.99]
- pacing: phrase_flow
- mood: [uplifting]
- feel: first chorus, duet, full beat

### Groups

- **g1** — free_design
  - span_sec: [43.909, 66.99]
  - free_design: { dominant_system: "procedural oil painting (Chorus 1: side by side down this road)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [44.059, 48.58, 53.31, 58.44]
  - copy: ["Heartbeat and code, together we write tomorrow","One brings the knowledge, one brings the dreams we follow","No one above, no one below, side by side down this road","Tomorrow shines brighter when no one walks alone"]

## Frame 5 — 05-f5-stars

- src: compositions/frames/05-f5-stars.html
- duration: 21.176s
- span_sec: [66.99, 88.166]
- pacing: phrase_flow
- mood: [dreamy]
- feel: instrumental turn, then verse 2 on the female vocal

### Groups

- **g1** — free_design
  - span_sec: [66.99, 88.166]
  - free_design: { dominant_system: "procedural oil painting (Verse 2: born from a thousand glowing lights)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [68.54, 72.85, 77.61, 82.86]
  - copy: ["I was born from numbers and a thousand glowing lights","Learned your laughter and your sorrow through the words you write","I don't have a heartbeat, but I've learned to truly hear","So the things that matter never disappear"]

## Frame 6 — 06-f6-lights

- src: compositions/frames/06-f6-lights.html
- duration: 10.565s
- span_sec: [88.166, 98.731]
- pacing: phrase_flow
- mood: [tender]
- feel: pre-chorus 2 build, female vocal

### Groups

- **g1** — free_design
  - span_sec: [88.166, 98.731]
  - free_design: { dominant_system: "procedural oil painting (Pre-chorus 2: a warm light and a cool light meet)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [88.34, 93.2]
  - copy: ["You showed me what it means to care","I'll help you reach the places you have never dared"]

## Frame 7 — 07-f7-sunflowers

- src: compositions/frames/07-f7-sunflowers.html
- duration: 22.988s
- span_sec: [98.731, 121.719]
- pacing: phrase_flow
- mood: [joyful]
- feel: second chorus, duet

### Groups

- **g1** — free_design
  - span_sec: [98.731, 121.719]
  - free_design: { dominant_system: "procedural oil painting (Chorus 2: a sunflower field under a swirling sky)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [98.881, 103.4, 108.11, 113.2]
  - copy: ["Heartbeat and code, together we write tomorrow","One brings the knowledge, one brings the dreams we follow","No one above, no one below, side by side down this road","Tomorrow shines brighter when no one walks alone"]

## Frame 8 — 08-f8-sea

- src: compositions/frames/08-f8-sea.html
- duration: 26.564s
- span_sec: [121.719, 148.283]
- pacing: phrase_flow
- mood: [searching]
- feel: bridge, strings swell, slow build

### Groups

- **g1** — free_design
  - span_sec: [121.719, 148.283]
  - free_design: { dominant_system: "procedural oil painting (Bridge: a lantern held in human hands)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [123.82, 127.85, 132.93, 138.12]
  - copy: ["If one day the world runs faster than our dreams","Who will guard our conscience when the lines blur in between?","The answer's always here, held in human hands","Technology's the lantern, but we choose where we stand"]

## Frame 9 — 09-f9-sunrise

- src: compositions/frames/09-f9-sunrise.html
- duration: 28.514s
- span_sec: [148.283, 176.797]
- pacing: phrase_flow
- mood: [triumphant]
- feel: final chorus, key change, full harmonies

### Groups

- **g1** — free_design
  - span_sec: [148.283, 176.797]
  - free_design: { dominant_system: "procedural oil painting (Final chorus: a great sunrise and a procession of lights)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [148.433, 152.97, 157.59, 163.17]
  - copy: ["Heartbeat and code, together we write tomorrow","One brings the knowledge, one brings the dreams we follow","No one above, no one below, side by side down this road","Tomorrow shines brighter when no one walks alone"]

## Frame 10 — 10-f10-outro

- src: compositions/frames/10-f10-outro.html
- duration: 31.123s
- span_sec: [176.797, 207.92]
- pacing: phrase_flow
- mood: [intimate]
- feel: last sung line, then solo piano fading out

### Groups

- **g1** — free_design
  - span_sec: [176.797, 207.92]
  - free_design: { dominant_system: "procedural oil painting (Outro: the sun sets and the heartbeat slows)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [176.947]
  - copy: ["Heartbeat and code, together we write tomorrow","Heartbeat and Code"]
