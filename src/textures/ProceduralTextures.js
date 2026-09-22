import * as THREE from 'three';

// Fast high-quality pseudo-random hash
function hash2D(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

// 2D Smooth Value Noise
function valueNoise(x, y) {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const fx = x - i;
  const fy = y - j;

  const u = fx * fx * (3.0 - 2.0 * fx);
  const v = fy * fy * (3.0 - 2.0 * fy);

  const a = hash2D(i, j);
  const b = hash2D(i + 1, j);
  const c = hash2D(i, j + 1);
  const d = hash2D(i + 1, j + 1);

  return a * (1 - u) * (1 - v) +
         b * u * (1 - v) +
         c * (1 - u) * v +
         d * u * v;
}

// Multi-octave Fractal Brownian Motion (fBM)
function fbm(x, y, octaves = 5, lacunarity = 2.0, gain = 0.5) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1.0;
  for (let i = 0; i < octaves; i++) {
    sum += valueNoise(x * freq, y * freq) * amp;
    freq *= lacunarity;
    amp *= gain;
  }
  return sum;
}

// Voronoi / Worley cellular noise (for stone pebbles, gravel, aggregates)
function voronoi(x, y) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);

  let minDist = 1.0;
  let secondDist = 1.0;

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const cx = xi + dx;
      const cy = yi + dy;
      const px = cx + hash2D(cx, cy);
      const py = cy + hash2D(cy, cx);

      const dist = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      if (dist < minDist) {
        secondDist = minDist;
        minDist = dist;
      } else if (dist < secondDist) {
        secondDist = dist;
      }
    }
  }
  return { d1: minDist, d2: secondDist, edge: secondDist - minDist };
}

// 3x3 Sobel Filter for true tangent-space Normal Maps
function generateSobelNormals(heights, width, height, strength = 3.5) {
  const normals = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    const ym1 = (y - 1 + height) % height;
    const yp1 = (y + 1) % height;

    for (let x = 0; x < width; x++) {
      const xm1 = (x - 1 + width) % width;
      const xp1 = (x + 1) % width;

      // Sobel kernel X
      // -1  0  1
      // -2  0  2
      // -1  0  1
      const tl = heights[ym1 * width + xm1];
      const ml = heights[y * width + xm1];
      const bl = heights[yp1 * width + xm1];
      const tr = heights[ym1 * width + xp1];
      const mr = heights[y * width + xp1];
      const br = heights[yp1 * width + xp1];

      const dx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);

      // Sobel kernel Y
      // -1 -2 -1
      //  0  0  0
      //  1  2  1
      const tc = heights[ym1 * width + x];
      const bc = heights[yp1 * width + x];

      const dy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);

      const dz = 1.0 / strength;

      // Normalize vector
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const nx = (dx / len) * 0.5 + 0.5;
      const ny = (-dy / len) * 0.5 + 0.5;
      const nz = (dz / len) * 0.5 + 0.5;

      const idx = (y * width + x) * 4;
      normals[idx] = Math.floor(nx * 255);
      normals[idx + 1] = Math.floor(ny * 255);
      normals[idx + 2] = Math.floor(nz * 255);
      normals[idx + 3] = 255;
    }
  }
  return normals;
}

// Configures standard AAA texture properties (anisotropy, filtering, repeat)
function finalizeTexture(canvas, repeatX = 1, repeatY = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 16;
  return tex;
}

let cachedTextures = null;

export function getProceduralPBRTextures() {
  if (cachedTextures) return cachedTextures;

  const size = 1024; // High-resolution 1024x1024 master canvas size

  // =========================================================================
  // 1. HYPER-REALISTIC ASPHALT ROAD (Pebble aggregate, tar sheen, road lines)
  // =========================================================================
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = size;
  roadCanvas.height = size;
  const roadCtx = roadCanvas.getContext('2d');
  const roadRoughCanvas = document.createElement('canvas');
  roadRoughCanvas.width = size;
  roadRoughCanvas.height = size;
  const roadRoughCtx = roadRoughCanvas.getContext('2d');

  const roadHeights = new Float32Array(size * size);
  const roadImg = roadCtx.createImageData(size, size);
  const roadRough = roadRoughCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Voronoi pebbles + micro-grit
      const v = voronoi(x * 0.08, y * 0.08);
      const macro = fbm(x * 0.005, y * 0.005, 4);
      const micro = hash2D(x, y) * 0.15;
      const crack = Math.pow(Math.abs(fbm(x * 0.02, y * 0.02, 3) - 0.5) * 2, 8) * 0.3;

      const pebbleH = (1.0 - v.d1) * 0.5;
      const totalH = Math.max(0, Math.min(1, pebbleH * 0.6 + macro * 0.25 + micro - crack));
      roadHeights[y * size + x] = totalH;

      // Base dark basalt & mineral flecks
      const mineralFleck = hash2D(x * 3, y * 3) > 0.96 ? 45 : 0;
      const baseTone = Math.floor(28 + totalH * 32 + mineralFleck);
      roadImg.data[idx] = baseTone;
      roadImg.data[idx + 1] = baseTone + 1;
      roadImg.data[idx + 2] = baseTone + 3;
      roadImg.data[idx + 3] = 255;

      // Roughness: tar binders are semi-gloss (140), aggregate pebbles are matte (210)
      const r = Math.floor(150 + totalH * 80);
      roadRough.data[idx] = r;
      roadRough.data[idx + 1] = r;
      roadRough.data[idx + 2] = r;
      roadRough.data[idx + 3] = 255;

      // Faded, weathered Double Yellow Highway Center Lines
      const inLine1 = x >= 492 && x <= 504;
      const inLine2 = x >= 520 && x <= 532;
      if (inLine1 || inLine2) {
        // Paint chipping mask
        const chip = fbm(x * 0.1, y * 0.05, 3);
        if (chip > 0.28) {
          roadImg.data[idx] = 225 + Math.floor(chip * 25);
          roadImg.data[idx + 1] = 175 + Math.floor(chip * 20);
          roadImg.data[idx + 2] = 25;
          // Paint is slightly smoother
          roadRough.data[idx] = 130;
          roadHeights[y * size + x] += 0.08;
        }
      }

      // Tire Skid Marks down traffic lanes
      const inTireTrack1 = (x >= 280 && x <= 330);
      const inTireTrack2 = (x >= 694 && x <= 744);
      if (inTireTrack1 || inTireTrack2) {
        const skidAlpha = Math.sin((x % 50) / 50 * Math.PI) * 0.25;
        roadImg.data[idx] = Math.max(12, Math.floor(roadImg.data[idx] * (1.0 - skidAlpha)));
        roadImg.data[idx + 1] = Math.max(12, Math.floor(roadImg.data[idx + 1] * (1.0 - skidAlpha)));
        roadImg.data[idx + 2] = Math.max(12, Math.floor(roadImg.data[idx + 2] * (1.0 - skidAlpha)));
      }
    }
  }

  roadCtx.putImageData(roadImg, 0, 0);
  roadRoughCtx.putImageData(roadRough, 0, 0);

  const roadNormCanvas = document.createElement('canvas');
  roadNormCanvas.width = size;
  roadNormCanvas.height = size;
  const roadNormCtx = roadNormCanvas.getContext('2d');
  const roadNormals = generateSobelNormals(roadHeights, size, size, 4.0);
  roadNormCtx.putImageData(new ImageData(roadNormals, size, size), 0, 0);

  const roadMap = finalizeTexture(roadCanvas, 1, 6);
  const roadNormal = finalizeTexture(roadNormCanvas, 1, 6);
  const roadRoughness = finalizeTexture(roadRoughCanvas, 1, 6);

  // =========================================================================
  // 2. ULTRA-DETAILED SUBURBAN LAWN GRASS (Blade clusters & soil depth)
  // =========================================================================
  const grassCanvas = document.createElement('canvas');
  grassCanvas.width = size;
  grassCanvas.height = size;
  const grassCtx = grassCanvas.getContext('2d');
  const grassHeights = new Float32Array(size * size);
  const grassImg = grassCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Fine grass blade noise
      const blade = Math.abs(Math.sin(x * 0.4 + fbm(x * 0.05, y * 0.05, 3) * 4.0));
      const clump = fbm(x * 0.02, y * 0.02, 4);
      const h = Math.max(0, Math.min(1, blade * 0.65 + clump * 0.35));
      grassHeights[y * size + x] = h;

      // Lawn striping / mowing direction (subtle light & dark green bands)
      const mowStripe = Math.sin(y * 0.035) * 0.12;

      // Grass color palette (forest green to vibrant spring lime)
      const r = Math.floor((32 + h * 38) * (1.0 + mowStripe));
      const g = Math.floor((95 + h * 85) * (1.0 + mowStripe));
      const b = Math.floor((22 + h * 28) * (1.0 + mowStripe));

      grassImg.data[idx] = Math.max(15, Math.min(255, r));
      grassImg.data[idx + 1] = Math.max(45, Math.min(255, g));
      grassImg.data[idx + 2] = Math.max(10, Math.min(255, b));
      grassImg.data[idx + 3] = 255;
    }
  }

  grassCtx.putImageData(grassImg, 0, 0);
  const grassNormCanvas = document.createElement('canvas');
  grassNormCanvas.width = size;
  grassNormCanvas.height = size;
  const grassNormCtx = grassNormCanvas.getContext('2d');
  const grassNormals = generateSobelNormals(grassHeights, size, size, 4.5);
  grassNormCtx.putImageData(new ImageData(grassNormals, size, size), 0, 0);

  const grassMap = finalizeTexture(grassCanvas, 14, 14);
  const grassNormal = finalizeTexture(grassNormCanvas, 14, 14);

  // =========================================================================
  // 3. BROOM-FINISHED CONCRETE SIDEWALK & CURB (Brushed texture & joint seams)
  // =========================================================================
  const walkCanvas = document.createElement('canvas');
  walkCanvas.width = size;
  walkCanvas.height = size;
  const walkCtx = walkCanvas.getContext('2d');
  const walkHeights = new Float32Array(size * size);
  const walkImg = walkCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Broom finish: subtle parallel hairline scratches along Y
      const broom = Math.sin(x * 1.5) * 0.08 + hash2D(x, y) * 0.12;
      const macro = fbm(x * 0.01, y * 0.01, 3);
      let h = Math.max(0, Math.min(1, 0.5 + broom + macro * 0.25));

      let tone = Math.floor(140 + h * 35);
      let isJoint = false;

      // Expansion joints every 256px
      if (x % 256 < 6 || y % 256 < 6) {
        tone = Math.max(35, tone - 75);
        h *= 0.2;
        isJoint = true;
      }

      walkHeights[y * size + x] = h;

      walkImg.data[idx] = tone;
      walkImg.data[idx + 1] = isJoint ? tone - 2 : tone - 1;
      walkImg.data[idx + 2] = isJoint ? tone - 4 : tone - 3;
      walkImg.data[idx + 3] = 255;
    }
  }

  walkCtx.putImageData(walkImg, 0, 0);
  const walkNormCanvas = document.createElement('canvas');
  walkNormCanvas.width = size;
  walkNormCanvas.height = size;
  const walkNormCtx = walkNormCanvas.getContext('2d');
  const walkNormals = generateSobelNormals(walkHeights, size, size, 3.2);
  walkNormCtx.putImageData(new ImageData(walkNormals, size, size), 0, 0);

  const walkMap = finalizeTexture(walkCanvas, 12, 1);
  const walkNormal = finalizeTexture(walkNormCanvas, 12, 1);

  // =========================================================================
  // 4. RETRO 1950s CLAPBOARD HOUSE SIDING (Wood grain, lap bevels & nails)
  // =========================================================================
  const makePbrSiding = (rBase, gBase, bBase) => {
    const sCanvas = document.createElement('canvas');
    sCanvas.width = size;
    sCanvas.height = size;
    const sCtx = sCanvas.getContext('2d');
    const sHeights = new Float32Array(size * size);
    const sImg = sCtx.createImageData(size, size);

    const plankHeight = 64; // 16 horizontal planks per texture tile

    for (let y = 0; y < size; y++) {
      const plankY = y % plankHeight;
      // Overlapping shadow bevel at bottom of each plank
      const bevel = (plankY >= plankHeight - 6)
        ? 0.45 // Deep drop shadow under plank lip
        : (plankY <= 4 ? 1.18 : 1.0); // Highlighted top lip

      for (let x = 0; x < size; x++) {
        const idx = (y * size + x) * 4;

        // Horizontal wood grain fibers
        const grain = (Math.sin(x * 0.15 + fbm(x * 0.02, y * 0.005, 3) * 6.0) - 0.5) * 16;
        const totalH = Math.max(0, Math.min(1, (plankY / plankHeight) * 0.7 + (grain / 32) + 0.2));
        sHeights[y * size + x] = totalH;

        // Nail head indents every 256px along X near bottom edge of plank
        const isNail = (x % 256 >= 126 && x % 256 <= 130) && (plankY >= 48 && plankY <= 52);

        let r = Math.floor(rBase * bevel + grain);
        let g = Math.floor(gBase * bevel + grain);
        let b = Math.floor(bBase * bevel + grain);

        if (isNail) {
          r = 45; g = 50; b = 55;
          sHeights[y * size + x] = 0.1;
        }

        sImg.data[idx] = Math.max(0, Math.min(255, r));
        sImg.data[idx + 1] = Math.max(0, Math.min(255, g));
        sImg.data[idx + 2] = Math.max(0, Math.min(255, b));
        sImg.data[idx + 3] = 255;
      }
    }

    sCtx.putImageData(sImg, 0, 0);

    const sNormCanvas = document.createElement('canvas');
    sNormCanvas.width = size;
    sNormCanvas.height = size;
    const sNormCtx = sNormCanvas.getContext('2d');
    const sNormals = generateSobelNormals(sHeights, size, size, 4.0);
    sNormCtx.putImageData(new ImageData(sNormals, size, size), 0, 0);

    return {
      map: finalizeTexture(sCanvas, 4, 3),
      normalMap: finalizeTexture(sNormCanvas, 4, 3),
    };
  };

  const houseGreen = makePbrSiding(135, 178, 155); // Retro Pastel Seafoam Green
  const houseBlue = makePbrSiding(130, 165, 205);   // Retro Powder Sky Blue

  // =========================================================================
  // 5. ARCHITECTURAL ASPHALT ROOF SHINGLES (3-tab overlapping granules)
  // =========================================================================
  const roofCanvas = document.createElement('canvas');
  roofCanvas.width = size;
  roofCanvas.height = size;
  const roofCtx = roofCanvas.getContext('2d');
  const roofHeights = new Float32Array(size * size);
  const roofImg = roofCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const shingleRow = Math.floor(y / 48);
    const rowY = y % 48;
    const xOffset = (shingleRow % 2 === 0) ? 0 : 64;

    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const shingleX = (x + xOffset) % 128;

      // Granular mineral granules
      const granule = hash2D(x * 2, y * 2) * 22;
      const shadowLip = (rowY >= 42) ? 0.45 : (rowY <= 4 ? 1.15 : 1.0);
      const seam = (shingleX <= 3) ? 0.35 : 1.0;

      const totalH = Math.max(0, Math.min(1, ((48 - rowY) / 48) * 0.7 + (granule / 60)));
      roofHeights[y * size + x] = totalH;

      const baseTone = Math.floor((36 + granule) * shadowLip * seam);
      roofImg.data[idx] = baseTone;
      roofImg.data[idx + 1] = baseTone + 2;
      roofImg.data[idx + 2] = baseTone + 5;
      roofImg.data[idx + 3] = 255;
    }
  }

  roofCtx.putImageData(roofImg, 0, 0);
  const roofNormCanvas = document.createElement('canvas');
  roofNormCanvas.width = size;
  roofNormCanvas.height = size;
  const roofNormCtx = roofNormCanvas.getContext('2d');
  const roofNormals = generateSobelNormals(roofHeights, size, size, 4.5);
  roofNormCtx.putImageData(new ImageData(roofNormals, size, size), 0, 0);

  const roofMap = finalizeTexture(roofCanvas, 6, 6);
  const roofNormal = finalizeTexture(roofNormCanvas, 6, 6);

  // =========================================================================
  // 6. POLISHED OAK HARDWOOD FLOOR (Interior Planks)
  // =========================================================================
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = size;
  woodCanvas.height = size;
  const woodCtx = woodCanvas.getContext('2d');
  const woodHeights = new Float32Array(size * size);
  const woodImg = woodCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const plankIdx = Math.floor(y / 40);
    const plankY = y % 40;
    const plankShift = (plankIdx * 137) % 256;

    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const plankX = (x + plankShift) % 256;

      // Dark bevel line between floorboards
      const isSeam = (plankY <= 2 || plankY >= 38 || plankX <= 2);

      // Fine oak grain
      const grain = Math.sin(x * 0.2 + fbm(x * 0.03, y * 0.01, 3) * 8.0) * 14;
      const plankTint = ((plankIdx % 3) - 1) * 10;

      let r = 135 + grain + plankTint;
      let g = 88 + grain * 0.8 + plankTint;
      let b = 52 + grain * 0.5 + plankTint;

      let h = 0.5 + (grain / 40);
      if (isSeam) {
        r *= 0.35;
        g *= 0.35;
        b *= 0.35;
        h = 0.1;
      }

      woodHeights[y * size + x] = h;

      woodImg.data[idx] = Math.max(0, Math.min(255, Math.floor(r)));
      woodImg.data[idx + 1] = Math.max(0, Math.min(255, Math.floor(g)));
      woodImg.data[idx + 2] = Math.max(0, Math.min(255, Math.floor(b)));
      woodImg.data[idx + 3] = 255;
    }
  }

  woodCtx.putImageData(woodImg, 0, 0);
  const woodNormCanvas = document.createElement('canvas');
  woodNormCanvas.width = size;
  woodNormCanvas.height = size;
  const woodNormCtx = woodNormCanvas.getContext('2d');
  const woodNormals = generateSobelNormals(woodHeights, size, size, 3.5);
  woodNormCtx.putImageData(new ImageData(woodNormals, size, size), 0, 0);

  const woodMap = finalizeTexture(woodCanvas, 4, 4);
  const woodNormal = finalizeTexture(woodNormCanvas, 4, 4);

  // =========================================================================
  // 7. NEVADA MOJAVE DESERT SAND & GRAVEL (Wind-blown dunes & sun-baked earth)
  // =========================================================================
  const sandCanvas = document.createElement('canvas');
  sandCanvas.width = size;
  sandCanvas.height = size;
  const sandCtx = sandCanvas.getContext('2d');
  const sandHeights = new Float32Array(size * size);
  const sandImg = sandCtx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Aeolian wind ripples
      const ripple = Math.sin((x + y * 0.6) * 0.08 + fbm(x * 0.01, y * 0.01, 3) * 4.0) * 0.25;
      const macro = fbm(x * 0.006, y * 0.006, 5);
      const grain = hash2D(x, y) * 0.12;

      const totalH = Math.max(0, Math.min(1, 0.45 + ripple + macro * 0.35 + grain));
      sandHeights[y * size + x] = totalH;

      const r = Math.floor(185 + totalH * 45);
      const g = Math.floor(155 + totalH * 35);
      const b = Math.floor(110 + totalH * 25);

      sandImg.data[idx] = r;
      sandImg.data[idx + 1] = g;
      sandImg.data[idx + 2] = b;
      sandImg.data[idx + 3] = 255;
    }
  }

  sandCtx.putImageData(sandImg, 0, 0);
  const sandNormCanvas = document.createElement('canvas');
  sandNormCanvas.width = size;
  sandNormCanvas.height = size;
  const sandNormCtx = sandNormCanvas.getContext('2d');
  const sandNormals = generateSobelNormals(sandHeights, size, size, 3.5);
  sandNormCtx.putImageData(new ImageData(sandNormals, size, size), 0, 0);

  const sandMap = finalizeTexture(sandCanvas, 14, 14);
  const sandNormal = finalizeTexture(sandNormCanvas, 14, 14);

  cachedTextures = {
    road: { map: roadMap, normalMap: roadNormal, roughnessMap: roadRoughness, roughness: 0.82, metalness: 0.12 },
    grass: { map: grassMap, normalMap: grassNormal, roughness: 0.88, metalness: 0.04 },
    sidewalk: { map: walkMap, normalMap: walkNormal, roughness: 0.78, metalness: 0.08 },
    houseGreen: { map: houseGreen.map, normalMap: houseGreen.normalMap, roughness: 0.65, metalness: 0.1 },
    houseBlue: { map: houseBlue.map, normalMap: houseBlue.normalMap, roughness: 0.65, metalness: 0.1 },
    roof: { map: roofMap, normalMap: roofNormal, roughness: 0.85, metalness: 0.15 },
    woodFloor: { map: woodMap, normalMap: woodNormal, roughness: 0.4, metalness: 0.1 },
    sand: { map: sandMap, normalMap: sandNormal, roughness: 0.95, metalness: 0.0 },
  };

  return cachedTextures;
}
