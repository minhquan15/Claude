---
compositionId: bgm
duration_s: 165.46
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
- duration: 10.147s
- span_sec: [0, 10.147]
- pacing: phrase_flow
- mood: [intimate]
- feel: sparse warm pad and soft percussion before the beat enters

### Groups

- **g1** — free_design
  - span_sec: [0, 10.147]
  - free_design: { dominant_system: "procedural oil painting (Intro: a heartbeat traced on dark canvas)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [0]
  - copy: ["Heartbeat and Code","an oil-painted music video"]

## Frame 2 — 02-f2-city

- src: compositions/frames/02-f2-city.html
- duration: 20.201s
- span_sec: [10.147, 30.348]
- pacing: phrase_flow
- mood: [warm]
- feel: low-energy verse, steady light beat, phrase-shaped

### Groups

- **g1** — free_design
  - span_sec: [10.147, 30.348]
  - free_design: { dominant_system: "procedural oil painting (Verse 1: a city glowing in a brand new hue)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [10.297, 15.286, 20.348, 25.41]
  - copy: ["Woke up to a city glowing in a brand new hue","Every street already knows where I'm headed to","A gentle voice asks me, hey, are you doing alright?","Not a human, but it feels like warmth inside"]

## Frame 3 — 03-f3-storm

- src: compositions/frames/03-f3-storm.html
- duration: 10.124s
- span_sec: [30.348, 40.472]
- pacing: phrase_flow
- mood: [rising]
- feel: pre-chorus lift with a surge at 33s and a hi-hat fill into the chorus

### Groups

- **g1** — free_design
  - span_sec: [30.348, 40.472]
  - free_design: { dominant_system: "procedural oil painting (Pre-chorus 1: storm clouds part around two lights)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [30.498, 35.51]
  - copy: ["We were afraid the day would come when we'd be replaced","But all we really needed was to learn to share the space"]

## Frame 4 — 04-f4-road

- src: compositions/frames/04-f4-road.html
- duration: 20.202s
- span_sec: [40.472, 60.674]
- pacing: phrase_flow
- mood: [uplifting]
- feel: full chorus, high energy, kick on the downbeats

### Groups

- **g1** — free_design
  - span_sec: [40.472, 60.674]
  - free_design: { dominant_system: "procedural oil painting (Chorus 1: side by side down this road)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [40.622, 45.611, 50.673, 55.712]
  - copy: ["Heartbeat and code, together we write tomorrow","One brings the knowledge, one brings the dreams we follow","No one above, no one below, side by side down this road","Tomorrow shines brighter when no one walks alone"]

## Frame 5 — 05-f5-stars

- src: compositions/frames/05-f5-stars.html
- duration: 20.201s
- span_sec: [60.674, 80.875]
- pacing: phrase_flow
- mood: [dreamy]
- feel: energy drops at 62s; quiet verse, dense soft hits

### Groups

- **g1** — free_design
  - span_sec: [60.674, 80.875]
  - free_design: { dominant_system: "procedural oil painting (Verse 2: born from a thousand glowing lights)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [60.824, 65.812, 70.874, 75.936]
  - copy: ["I was born from numbers and a thousand glowing lights","Learned your laughter and your sorrow through the words you write","I don't have a heartbeat, but I've learned to truly hear","So the things that matter never disappear"]

## Frame 6 — 06-f6-lights

- src: compositions/frames/06-f6-lights.html
- duration: 10.124s
- span_sec: [80.875, 90.999]
- pacing: phrase_flow
- mood: [tender]
- feel: medium pre-chorus build with a sustained hi-hat fill at 88s

### Groups

- **g1** — free_design
  - span_sec: [80.875, 90.999]
  - free_design: { dominant_system: "procedural oil painting (Pre-chorus 2: a warm light and a cool light meet)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [81.025, 86.037]
  - copy: ["You showed me what it means to care","I'll help you reach the places you have never dared"]

## Frame 7 — 07-f7-sunflowers

- src: compositions/frames/07-f7-sunflowers.html
- duration: 20.201s
- span_sec: [90.999, 111.2]
- pacing: phrase_flow
- mood: [joyful]
- feel: second chorus, the loudest stretch yet (peak 0.83 at 96s)

### Groups

- **g1** — free_design
  - span_sec: [90.999, 111.2]
  - free_design: { dominant_system: "procedural oil painting (Chorus 2: a sunflower field under a swirling sky)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [91.149, 96.138, 101.2, 106.238]
  - copy: ["Heartbeat and code, together we write tomorrow","One brings the knowledge, one brings the dreams we follow","No one above, no one below, side by side down this road","Tomorrow shines brighter when no one walks alone"]

## Frame 8 — 08-f8-sea

- src: compositions/frames/08-f8-sea.html
- duration: 20.225s
- span_sec: [111.2, 131.425]
- pacing: phrase_flow
- mood: [searching]
- feel: bridge after the 109s surge; medium energy building toward the key change

### Groups

- **g1** — free_design
  - span_sec: [111.2, 131.425]
  - free_design: { dominant_system: "procedural oil painting (Bridge: a lantern held in human hands)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [111.35, 116.339, 121.401, 126.463]
  - copy: ["If one day the world runs faster than our dreams","Who will guard our conscience when the lines blur in between?","The answer's always here, held in human hands","Technology's the lantern, but we choose where we stand"]

## Frame 9 — 09-f9-sunrise

- src: compositions/frames/09-f9-sunrise.html
- duration: 19.574s
- span_sec: [131.425, 150.999]
- pacing: phrase_flow
- mood: [triumphant]
- feel: final chorus up a whole step, sustained high energy

### Groups

- **g1** — free_design
  - span_sec: [131.425, 150.999]
  - free_design: { dominant_system: "procedural oil painting (Final chorus: a great sunrise and a procession of lights)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [131.575, 136.564, 141.626, 146.664]
  - copy: ["Heartbeat and code, together we write tomorrow","One brings the knowledge, one brings the dreams we follow","No one above, no one below, side by side down this road","Tomorrow shines brighter when no one walks alone"]

## Frame 10 — 10-f10-outro

- src: compositions/frames/10-f10-outro.html
- duration: 14.461s
- span_sec: [150.999, 165.46]
- pacing: phrase_flow
- mood: [intimate]
- feel: energy falls away to silence; soft final hits

### Groups

- **g1** — free_design
  - span_sec: [150.999, 165.46]
  - free_design: { dominant_system: "procedural oil painting (Outro: the sun sets and the heartbeat slows)", primitives: ["bg-flow-field", "blur-resolve"], density_topology: "hold" }
  - anchors: [151.549, 156.599]
  - copy: ["Heartbeat and code","Together we write tomorrow","Heartbeat and Code"]
