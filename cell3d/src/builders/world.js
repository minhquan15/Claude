import * as THREE from 'three';
import { ORG } from '../data/organelles.js';
import { SEED, Occupancy, NUC, RER_MAX_R } from '../layout.js';
import { mulberry32, makeNoise3 } from '../util.js';
import { shared } from './materials.js';
import { buildMembrane } from './membrane.js';
import { buildNucleus } from './nucleus.js';
import { buildRER } from './rer.js';
import { buildSER } from './ser.js';
import { buildRibosomes } from './ribosome.js';
import { buildGolgi } from './golgi.js';
import { buildMitochondria } from './mitochondria.js';
import { buildLysosomes, buildPeroxisomes, buildVesicles } from './smallorganelles.js';
import { buildCentrosome } from './centrosome.js';
import { buildCytoskeleton } from './cytoskeleton.js';
import { buildPathway } from './pathway.js';

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

/**
 * Dựng toàn bộ tế bào. Mỗi bộ dựng dùng PRNG riêng (seed cố định) nên bố cục luôn như nhau.
 * `onProgress(i, total)` được gọi giữa các giai đoạn để cập nhật thanh tiến độ.
 */
export async function buildWorld(onProgress = () => {}) {
  const root = new THREE.Group();
  root.name = 'cell';
  const ctx = {
    noise: makeNoise3(mulberry32(SEED)),
    occ: new Occupancy(),
  };
  const seeded = (k) => mulberry32(SEED + k * 7919);
  // vùng nhân + lưới nội chất hạt là một khối đã chiếm chỗ
  ctx.occ.add(NUC.center, RER_MAX_R);

  const stages = [];
  const step = async (fn) => {
    fn();
    onProgress(stages.length + 1);
    stages.push(1);
    await nextFrame();
  };

  const mems = {};
  await step(() => {
    root.add((mems.membrane = buildMembrane(seeded(1), ctx)));
    root.add(buildNucleus(seeded(2), ctx));
  });
  await step(() => {
    root.add(buildRER(seeded(3), ctx));
    root.add(buildSER(seeded(4), ctx));
  });
  await step(() => {
    root.add(buildGolgi(seeded(5), ctx));
    root.add(buildCentrosome(seeded(6), ctx));
    root.add(buildVesicles(seeded(7), ctx));
  });
  await step(() => {
    const mito = buildMitochondria(seeded(8), ctx);
    root.add(mito);
    mems.mito = mito;
    root.add(buildLysosomes(seeded(9), ctx));
    root.add(buildPeroxisomes(seeded(10), ctx));
    root.add(buildRibosomes(seeded(11), ctx));
  });
  await step(() => {
    root.add(buildCytoskeleton(seeded(12), ctx));
    mems.pathway = buildPathway(seeded(13), ctx);
    root.add(mems.pathway.group);
  });

  // điểm tiêu cự cho từng bào quan (gợi ý trong organelles.js, được "bắt" vào vật thể thật)
  const focus = {};
  for (const o of Object.values(ORG)) focus[o.id] = new THREE.Vector3(...o.position);
  if (ctx.rerFocus) focus.rer.copy(ctx.rerFocus);
  if (ctx.serFocus) focus.ser.copy(ctx.serFocus);
  if (ctx.ribosomeFocus) focus.ribosome.copy(ctx.ribosomeFocus);
  if (ctx.mitoFocus) focus.mitochondria.copy(ctx.mitoFocus);
  if (ctx.lysoFocus) focus.lysosome.copy(ctx.lysoFocus);
  if (ctx.peroxFocus) focus.peroxisome.copy(ctx.peroxFocus);

  // danh sách vật thể có thể chọn
  const pickables = [];
  root.traverse((o) => {
    if ((o.isMesh || o.isInstancedMesh) && o.userData.org) pickables.push(o);
  });

  return {
    root,
    ctx,
    focus,
    pickables,
    pathway: mems.pathway,
    membraneMaterial: ctx.membraneMaterial,
    update(t, motion) {
      shared.uTime.value = t;
      shared.uMotion.value = motion;
      mems.mito.userData.update(t, motion);
    },
    stats: {
      pores: ctx.poreCount,
      mitochondria: ctx.mitoCount,
      ribosomes: 3600 + ctx.ribosomeFreeCount,
    },
  };
}
