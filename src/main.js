import * as THREE from 'three';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x85cdf8);
scene.fog = new THREE.Fog(0x85cdf8, 34, 120);

const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 12, 12);

scene.add(new THREE.AmbientLight(0xffffff, 0.5));
scene.add(new THREE.HemisphereLight(0xbce8ff, 0x78b47d, 0.45));

const sun = new THREE.DirectionalLight(0xfff4cf, 1.25);
sun.position.set(18, 30, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -50;
sun.shadow.camera.right = 50;
sun.shadow.camera.top = 50;
sun.shadow.camera.bottom = -50;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);
const walkwayRects = [];
const blockedPondRects = [];

function registerBlockedRect(minX, maxX, minZ, maxZ) {
  blockedPondRects.push({ minX, maxX, minZ, maxZ });
}

function rectsOverlap(a, b) {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxZ < b.minZ || a.minZ > b.maxZ);
}

function pondOverlapsBlocked(minX, maxX, minZ, maxZ) {
  const rect = { minX, maxX, minZ, maxZ };
  for (const blocked of blockedPondRects) {
    if (rectsOverlap(rect, blocked)) {
      return true;
    }
  }
  return false;
}

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(260, 28, 18),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      topColor: { value: new THREE.Color(0x7ebff2) },
      bottomColor: { value: new THREE.Color(0xd8f4ff) },
      offset: { value: 25.0 },
      exponent: { value: 0.65 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        float t = max(pow(max(h, 0.0), exponent), 0.0);
        gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
      }
    `
  })
);
scene.add(sky);

function makeCanvasTexture(size, painter) {
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = size;
  textureCanvas.height = size;
  const ctx = textureCanvas.getContext('2d');
  painter(ctx, size);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

function random2D(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

const grassTexture = makeCanvasTexture(256, (ctx, size) => {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#9cf0c2');
  gradient.addColorStop(1, '#6bcf9f');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2200; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = `rgba(${56 + Math.random() * 45}, ${138 + Math.random() * 85}, ${90 + Math.random() * 45}, 0.42)`;
    ctx.fillRect(x, y, 2, 2);
  }
});
grassTexture.repeat.set(20, 20);

const dirtTexture = makeCanvasTexture(256, (ctx, size) => {
  ctx.fillStyle = '#e4d6a4';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1100; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 190 + Math.floor(Math.random() * 45);
    ctx.fillStyle = `rgba(${shade}, ${shade - 17}, ${shade - 50}, 0.4)`;
    ctx.fillRect(x, y, 2, 2);
  }
});
dirtTexture.repeat.set(4.5, 4.5);

const roofTexture = makeCanvasTexture(256, (ctx, size) => {
  ctx.fillStyle = '#cf7d58';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#b76243';
  for (let y = 0; y < size; y += 26) {
    ctx.fillRect(0, y + 2, size, 7);
    ctx.fillRect(0, y + 14, size, 3);
  }
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(96, 96),
  new THREE.MeshStandardMaterial({ map: grassTexture, color: 0x92e2bc, roughness: 0.98 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

function createRoad(width, depth, x, z) {
  walkwayRects.push({
    minX: x - width * 0.5 - 0.2,
    maxX: x + width * 0.5 + 0.2,
    minZ: z - depth * 0.5 - 0.2,
    maxZ: z + depth * 0.5 + 0.2
  });

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.3, 0.1, depth + 0.3),
    new THREE.MeshStandardMaterial({ color: 0xa8c38f, roughness: 1 })
  );
  base.position.set(x, 0.075, z);
  base.receiveShadow = true;
  world.add(base);

  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.14, depth),
    new THREE.MeshStandardMaterial({ map: dirtTexture, color: 0xe3d8a8, roughness: 1 })
  );
  road.position.set(x, 0.12, z);
  road.receiveShadow = true;
  world.add(road);
}

function isOnWalkway(x, z, margin = 0.15) {
  for (const rect of walkwayRects) {
    if (x > rect.minX - margin && x < rect.maxX + margin && z > rect.minZ - margin && z < rect.maxZ + margin) {
      return true;
    }
  }
  return false;
}

function createHouse({ x, z, wallColor = 0xb9c3c5, roofColor = 0xc97552, doorColor = 0x6f4f3a }) {
  const house = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3.9, 2.4, 3.6),
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.86, metalness: 0.04 })
  );
  base.position.y = 1.25;
  base.castShadow = true;
  base.receiveShadow = true;
  house.add(base);

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(3.45, 1.1, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xd7dbde, roughness: 0.86 })
  );
  top.position.y = 2.95;
  top.castShadow = true;
  house.add(top);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.45, 0.75, 3.95),
    new THREE.MeshStandardMaterial({ color: roofColor, map: roofTexture, roughness: 0.84 })
  );
  roof.position.y = 3.73;
  roof.castShadow = true;
  house.add(roof);

  const lipL = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.62, 3.95), new THREE.MeshStandardMaterial({ color: 0xa95a3e, roughness: 0.86 }));
  lipL.position.set(-2.22, 3.41, 0);
  lipL.rotation.z = Math.PI * 0.13;
  lipL.castShadow = true;
  house.add(lipL);

  const lipR = lipL.clone();
  lipR.position.x = 2.22;
  lipR.rotation.z = -Math.PI * 0.13;
  house.add(lipR);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0x2f506b, emissive: 0x16314b, emissiveIntensity: 0.7, roughness: 0.35 });
  const topWindow = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.4, 0.12), windowMat);
  topWindow.position.set(0, 2.9, 1.92);
  house.add(topWindow);

  const frontWindowL = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.62, 0.12), windowMat);
  frontWindowL.position.set(1.3, 1.22, 1.92);
  house.add(frontWindowL);

  const frontWindowR = frontWindowL.clone();
  frontWindowR.position.x = 0.1;
  house.add(frontWindowR);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 1.2, 0.16),
    new THREE.MeshStandardMaterial({ color: doorColor, roughness: 0.88 })
  );
  door.position.set(-1.25, 0.82, 1.92);
  house.add(door);

  house.position.set(x, 0, z);
  registerBlockedRect(x - 2.4, x + 2.4, z - 2.2, z + 2.2);
  world.add(house);
}

function createLab(x, z) {
  const lab = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(8.2, 2.9, 4.9),
    new THREE.MeshStandardMaterial({ color: 0xc4cbbb, roughness: 0.84 })
  );
  base.position.y = 1.5;
  base.castShadow = true;
  base.receiveShadow = true;
  lab.add(base);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(8.9, 0.82, 5.55),
    new THREE.MeshStandardMaterial({ color: 0x5fae91, map: roofTexture, roughness: 0.82 })
  );
  roof.position.y = 3.4;
  roof.castShadow = true;
  lab.add(roof);

  const roofTop = new THREE.Mesh(
    new THREE.BoxGeometry(5.4, 0.5, 2.1),
    new THREE.MeshStandardMaterial({ color: 0x3f6b8d, roughness: 0.8 })
  );
  roofTop.position.set(0.4, 3.95, 0.2);
  roofTop.castShadow = true;
  lab.add(roofTop);

  const window = new THREE.Mesh(
    new THREE.BoxGeometry(3.8, 0.9, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x476286, emissive: 0x1d3150, emissiveIntensity: 0.5, roughness: 0.35 })
  );
  window.position.set(0.7, 1.2, 2.52);
  lab.add(window);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 1.3, 0.14),
    new THREE.MeshStandardMaterial({ color: 0x8f4f3b, roughness: 0.85 })
  );
  door.position.set(-2.2, 0.9, 2.52);
  lab.add(door);

  lab.position.set(x, 0, z);
  registerBlockedRect(x - 4.8, x + 4.8, z - 3.1, z + 3.1);
  world.add(lab);
}

function isInRanges(value, ranges = []) {
  for (const [min, max] of ranges) {
    if (value >= min && value <= max) {
      return true;
    }
  }
  return false;
}

function createFenceLine(startX, startZ, segments, horizontal = true, gateRanges = []) {
  const postGeo = new THREE.BoxGeometry(0.2, 1, 0.26);
  const railGeo = horizontal ? new THREE.BoxGeometry(0.74, 0.1, 0.1) : new THREE.BoxGeometry(0.1, 0.1, 0.74);
  const mat = new THREE.MeshStandardMaterial({ color: 0x92989e, roughness: 0.9 });
  const nodes = [];

  for (let i = 0; i <= segments; i += 1) {
    const px = horizontal ? startX + i * 0.7 : startX;
    const pz = horizontal ? startZ : startZ + i * 0.7;
    const axis = horizontal ? px : pz;
    const blocked = isInRanges(axis, gateRanges) || isOnWalkway(px, pz, 0.2);
    nodes.push({ x: px, z: pz, blocked });

    if (blocked) {
      continue;
    }

    const post = new THREE.Mesh(postGeo, mat);
    post.position.set(px, 0.56, pz);
    post.castShadow = true;
    world.add(post);
  }

  for (let i = 0; i < nodes.length - 1; i += 1) {
    const a = nodes[i];
    const b = nodes[i + 1];
    if (a.blocked || b.blocked) {
      continue;
    }

    const railX = (a.x + b.x) * 0.5;
    const railZ = (a.z + b.z) * 0.5;
    if (isOnWalkway(railX, railZ, 0.22)) {
      continue;
    }

    const rail = new THREE.Mesh(railGeo, mat);
    rail.position.set(railX, 0.68, railZ);
    rail.castShadow = true;
    world.add(rail);
  }
}

function createFenceRect(minX, maxX, minZ, maxZ, gates = {}) {
  const sx = Math.round((maxX - minX) / 0.7);
  const sz = Math.round((maxZ - minZ) / 0.7);
  createFenceLine(minX, minZ, sx, true, gates.bottom);
  createFenceLine(minX, maxZ, sx, true, gates.top);
  createFenceLine(minX, minZ, sz, false, gates.left);
  createFenceLine(maxX, minZ, sz, false, gates.right);

  const band = 0.45;
  registerBlockedRect(minX - band, maxX + band, minZ - band, minZ + band);
  registerBlockedRect(minX - band, maxX + band, maxZ - band, maxZ + band);
  registerBlockedRect(minX - band, minX + band, minZ - band, maxZ + band);
  registerBlockedRect(maxX - band, maxX + band, minZ - band, maxZ + band);
}

function createPond(x, z, width, depth) {
  const offsets = [
    [0, 0], [0, -2], [0, 2], [2, 0], [-2, 0], [3, -2], [-3, -2], [3, 2], [-3, 2]
  ];

  let placeX = x;
  let placeZ = z;
  let found = false;
  for (const [ox, oz] of offsets) {
    const cx = x + ox;
    const cz = z + oz;
    const minX = cx - width * 0.5 - 0.5;
    const maxX = cx + width * 0.5 + 0.5;
    const minZ = cz - depth * 0.5 - 0.5;
    const maxZ = cz + depth * 0.5 + 0.5;

    if (!pondOverlapsBlocked(minX, maxX, minZ, maxZ)) {
      placeX = cx;
      placeZ = cz;
      found = true;
      break;
    }
  }

  if (!found) {
    return null;
  }

  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(width + 0.6, 0.2, depth + 0.6),
    new THREE.MeshStandardMaterial({ color: 0x876849 })
  );
  edge.position.set(placeX, 0.11, placeZ);
  edge.receiveShadow = true;
  world.add(edge);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.15, depth),
    new THREE.MeshStandardMaterial({ color: 0x58a7e6, transparent: true, opacity: 0.9, roughness: 0.2, metalness: 0.1 })
  );
  water.position.set(placeX, 0.14, placeZ);
  water.receiveShadow = true;
  world.add(water);

  registerBlockedRect(
    placeX - width * 0.5 - 0.45,
    placeX + width * 0.5 + 0.45,
    placeZ - depth * 0.5 - 0.45,
    placeZ + depth * 0.5 + 0.45
  );

  return water;
}

function createSign(x, z, rotationY = 0) {
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), new THREE.MeshStandardMaterial({ color: 0x7a583d }));
  post.position.set(x, 0.45, z);
  post.castShadow = true;
  world.add(post);

  const board = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.55, 0.14), new THREE.MeshStandardMaterial({ color: 0xe8daa0 }));
  board.position.set(x, 1.07, z);
  board.rotation.y = rotationY;
  board.castShadow = true;
  world.add(board);
}

function createRoundTree(x, z, scale = 1, hueOffset = 0) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12 * scale, 0.15 * scale, 0.9 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x7b5034, roughness: 0.93 })
  );
  trunk.position.y = 0.42 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  const leafColor = new THREE.Color().setHSL(0.36 + hueOffset, 0.42, 0.46);
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.95 });

  const canopy1 = new THREE.Mesh(new THREE.SphereGeometry(0.62 * scale, 10, 9), leafMat);
  canopy1.position.set(0, 1.18 * scale, 0);
  canopy1.castShadow = true;
  tree.add(canopy1);

  const canopy2 = new THREE.Mesh(new THREE.SphereGeometry(0.45 * scale, 10, 9), leafMat);
  canopy2.position.set(-0.34 * scale, 1.02 * scale, 0.1 * scale);
  canopy2.castShadow = true;
  tree.add(canopy2);

  const canopy3 = new THREE.Mesh(new THREE.SphereGeometry(0.42 * scale, 10, 9), leafMat);
  canopy3.position.set(0.3 * scale, 1.0 * scale, -0.12 * scale);
  canopy3.castShadow = true;
  tree.add(canopy3);

  tree.position.set(x, 0, z);
  world.add(tree);
}

function fillForest() {
  for (let x = -38; x <= 38; x += 1.7) {
    for (let z = -38; z <= 38; z += 1.7) {
      const d = Math.hypot(x, z);
      if (d < 18 || d > 45) continue;
      if (x > -16 && x < 15 && z < 15 && z > -31) continue;

      const noise = random2D(x, z);
      if (noise > 0.3) continue;

      const hueOffset = (random2D(x + 11, z + 7) - 0.5) * 0.08;
      const scale = 0.9 + random2D(x + 3.1, z + 1.7) * 0.35;
      createRoundTree(x + (noise - 0.15) * 0.4, z + (noise - 0.15) * 0.35, scale, hueOffset);
    }
  }
}

function createFlowerTuft(x, z) {
  const colors = [0xf191c1, 0xf5d27a, 0x93d9ff, 0xfaf8ff];
  for (let i = 0; i < 8; i += 1) {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 5), new THREE.MeshStandardMaterial({ color: 0x3f9a4f }));
    stem.position.set(x + (Math.random() - 0.5) * 0.5, 0.2, z + (Math.random() - 0.5) * 0.5);
    world.add(stem);

    const bloom = new THREE.Mesh(new THREE.SphereGeometry(0.06, 7, 7), new THREE.MeshStandardMaterial({ color: colors[i % colors.length] }));
    bloom.position.set(stem.position.x, 0.3, stem.position.z);
    world.add(bloom);
  }
}

// Pallet-town-like road network.
createRoad(3.3, 33, 0, 1.5);
createRoad(22.5, 3.1, 0, 1.1);
createRoad(3.1, 12.5, -10, -3.8);
createRoad(3.1, 10.8, -10, -12.5);
createRoad(3.1, 8.4, 9.8, -3.4);
createRoad(14.5, 3.1, -4.2, -8.8);
createRoad(13.5, 3.1, 4.5, -13);
createRoad(15.5, 3.1, 4.8, -17.8);

createHouse({ x: -10, z: -3.2, wallColor: 0xbec4c8, roofColor: 0x4ea497 });
createHouse({ x: -10, z: -12, wallColor: 0xc4c9c8, roofColor: 0x59af8f });
createHouse({ x: 0, z: 8.9, wallColor: 0xbdbcbc, roofColor: 0xc97758 });
createLab(9.8, -8.5);

createFenceRect(-16.8, 16.8, -18.8, 12.8, {
  top: [[-1.8, 1.8]],
  bottom: [[2.4, 7.2]],
  left: [[-0.4, 2.6]],
  right: [[-4.8, -1.8]]
});

const villagePond = createPond(-9, -2.3, 4.8, 3.4);
const southPond = createPond(0.5, -24.4, 8.6, 5.2);
createSign(2.3, 13.6, 0);
createSign(-17.6, 0.8, Math.PI * 0.5);
createSign(17.6, -3.6, Math.PI * 0.5);
createSign(9.4, -19.8, 0);

createFlowerTuft(-12.8, -1.2);
createFlowerTuft(7.4, -1.8);
createFlowerTuft(-8.3, -10.5);
createFlowerTuft(3.6, 5.8);

fillForest();

const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.32, 0.9, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 })
);
player.position.set(0, 0.92, -0.5);
player.castShadow = true;
scene.add(player);

const playerRadius = 0.35;
const colliders = [];

function addBoxCollider(minX, maxX, minZ, maxZ) {
  colliders.push({ type: 'box', minX, maxX, minZ, maxZ });
}

function addCircleCollider(x, z, radius) {
  if (isOnWalkway(x, z, radius + 0.2)) {
    return;
  }
  colliders.push({ type: 'circle', x, z, radius });
}

function overlapsBox(x, z, radius, box) {
  const cx = THREE.MathUtils.clamp(x, box.minX, box.maxX);
  const cz = THREE.MathUtils.clamp(z, box.minZ, box.maxZ);
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < radius * radius;
}

function overlapsCircle(x, z, radius, circle) {
  const dx = x - circle.x;
  const dz = z - circle.z;
  const r = radius + circle.radius;
  return dx * dx + dz * dz < r * r;
}

function hasCollision(x, z, radius) {
  for (const collider of colliders) {
    if (collider.type === 'box' && overlapsBox(x, z, radius, collider)) return true;
    if (collider.type === 'circle' && overlapsCircle(x, z, radius, collider)) return true;
  }
  return false;
}

addBoxCollider(-11.9, -8.2, -4.8, -1.5);
addBoxCollider(-11.9, -8.2, -13.6, -10.1);
addBoxCollider(-3.9, 3.9, 7.1, 10.9);
addBoxCollider(5.8, 13.9, -10.9, -6.2);
addBoxCollider(-11.4, -6.5, -4.1, -0.7);
addBoxCollider(-3.9, 4.9, -27.2, -21.7);

[
  [-16, 13], [16, 12], [-16, 2], [16, 1],
  [-15, -11], [15, -12], [11, -21], [-11, -21]
].forEach(([x, z]) => addCircleCollider(x, z, 1.2));

const keys = {};
let camAngle = Math.PI * 0.2;
let waterTime = 0;

window.addEventListener('keydown', (event) => {
  keys[event.code] = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.code] = false;
});

function update() {
  const baseSpeed = keys.ShiftLeft || keys.ShiftRight ? 0.14 : 0.09;
  let moveX = 0;
  let moveZ = 0;

  if (keys.KeyW) moveZ -= 1;
  if (keys.KeyS) moveZ += 1;
  if (keys.KeyA) moveX -= 1;
  if (keys.KeyD) moveX += 1;

  if (moveX !== 0 || moveZ !== 0) {
    const length = Math.hypot(moveX, moveZ);
    moveX = (moveX / length) * baseSpeed;
    moveZ = (moveZ / length) * baseSpeed;

    const nextX = player.position.x + moveX;
    if (!hasCollision(nextX, player.position.z, playerRadius)) player.position.x = nextX;

    const nextZ = player.position.z + moveZ;
    if (!hasCollision(player.position.x, nextZ, playerRadius)) player.position.z = nextZ;
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -18.5, 18.5);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -30.2, 17.8);

  if (keys.KeyQ) camAngle += 0.026;
  if (keys.KeyE) camAngle -= 0.026;

  waterTime += 0.018;
  if (villagePond) villagePond.material.opacity = 0.84 + Math.sin(waterTime) * 0.06;
  if (southPond) southPond.material.opacity = 0.82 + Math.sin(waterTime + 1.5) * 0.07;

  const camDistance = 10;
  camera.position.x = player.position.x + Math.sin(camAngle) * camDistance;
  camera.position.z = player.position.z + Math.cos(camAngle) * camDistance;
  camera.position.y = 7.8;
  camera.lookAt(player.position.x, player.position.y + 0.6, player.position.z);
}

function loop() {
  update();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loop();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
