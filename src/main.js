import * as THREE from 'three';

const canvas = document.getElementById('game');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x86cfff);
scene.fog = new THREE.Fog(0x86cfff, 18, 64);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 8, 8);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

const sun = new THREE.DirectionalLight(0xfff2c8, 1.15);
sun.position.set(10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 28;
sun.shadow.camera.top = 28;
sun.shadow.camera.bottom = -28;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

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

const baseGrassTexture = makeCanvasTexture(256, (ctx, size) => {
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#94e6bd');
  gradient.addColorStop(1, '#68cda0');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1400; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const green = 150 + Math.floor(Math.random() * 65);
    ctx.fillStyle = `rgb(${62 + Math.floor(Math.random() * 25)}, ${green}, ${110 + Math.floor(Math.random() * 28)})`;
    ctx.fillRect(x, y, 2, 2);
  }
});
baseGrassTexture.repeat.set(10, 10);

const pathTexture = makeCanvasTexture(256, (ctx, size) => {
  ctx.fillStyle = '#bfeacb';
  ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 1200; i += 1) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const shade = 175 + Math.floor(Math.random() * 45);
    ctx.fillStyle = `rgb(${shade - 40}, ${shade}, ${shade - 25})`;
    ctx.fillRect(x, y, 2, 2);
  }
});
pathTexture.repeat.set(3.5, 3.5);

const roofTexture = makeCanvasTexture(256, (ctx, size) => {
  ctx.fillStyle = '#da8d6a';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#ca7155';
  for (let y = 0; y < size; y += 32) {
    ctx.fillRect(0, y + 4, size, 7);
    ctx.fillRect(0, y + 18, size, 3);
  }
});

const brickTexture = makeCanvasTexture(256, (ctx, size) => {
  ctx.fillStyle = '#ccb96e';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = 'rgba(159, 130, 58, 0.55)';
  ctx.lineWidth = 2;
  const rows = 9;
  const cols = 7;
  const w = size / cols;
  const h = size / rows;
  for (let r = 0; r < rows; r += 1) {
    for (let c = -1; c < cols; c += 1) {
      const x = c * w + (r % 2 === 0 ? 0 : w * 0.5);
      ctx.strokeRect(x, r * h, w, h);
    }
  }
});

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(60, 60),
  new THREE.MeshStandardMaterial({ map: baseGrassTexture, color: 0x8de0bb, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

const villagePad = new THREE.Mesh(
  new THREE.CylinderGeometry(16, 16, 0.22, 40),
  new THREE.MeshStandardMaterial({ map: pathTexture, color: 0xc7f1d2, roughness: 1 })
);
villagePad.position.y = 0.12;
villagePad.receiveShadow = true;
world.add(villagePad);

function addSoftPatch(x, z, radius, color) {
  const patch = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 24),
    new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.7 })
  );
  patch.rotation.x = -Math.PI / 2;
  patch.position.set(x, 0.13, z);
  world.add(patch);
}

[
  [0, 7.5, 4.5, 0xc5eed0],
  [-7.2, -3.8, 4.2, 0xbde8cb],
  [7.2, -3.8, 4.2, 0xbde8cb],
  [0, -8.5, 5, 0xb8e5c8]
].forEach(([x, z, radius, color]) => addSoftPatch(x, z, radius, color));

function createRoadSegment(width, depth, x, z) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.1, depth),
    new THREE.MeshStandardMaterial({ color: 0xb7e8c5, map: pathTexture, roughness: 1 })
  );
  road.position.set(x, 0.18, z);
  road.receiveShadow = true;
  world.add(road);
}

createRoadSegment(3.8, 23, 0, 0.8);
createRoadSegment(17.5, 2.8, 0, 2.3);
createRoadSegment(6.5, 2.5, -7.4, -4.7);
createRoadSegment(6.5, 2.5, 7.4, -4.7);

function createPokemonHouse({ x, z, wallColor = 0xb6bdc4, roofColor = 0xd47b5e, doorColor = 0x7c5a43 }) {
  const house = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(3.5, 2.3, 3.2),
    new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9 })
  );
  base.position.y = 1.25;
  base.castShadow = true;
  base.receiveShadow = true;
  house.add(base);

  const topFloor = new THREE.Mesh(
    new THREE.BoxGeometry(3.2, 1.2, 2.9),
    new THREE.MeshStandardMaterial({ color: 0xc5ccd4, roughness: 0.9 })
  );
  topFloor.position.y = 2.95;
  topFloor.castShadow = true;
  house.add(topFloor);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(4.05, 0.75, 3.35),
    new THREE.MeshStandardMaterial({ color: roofColor, map: roofTexture, roughness: 0.9 })
  );
  roof.position.y = 3.72;
  roof.castShadow = true;
  house.add(roof);

  const roofLeft = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.65, 3.35),
    new THREE.MeshStandardMaterial({ color: 0xc26b50, roughness: 0.9 })
  );
  roofLeft.position.set(-2.05, 3.38, 0);
  roofLeft.rotation.z = Math.PI * 0.14;
  roofLeft.castShadow = true;
  house.add(roofLeft);

  const roofRight = roofLeft.clone();
  roofRight.position.x = 2.05;
  roofRight.rotation.z = -Math.PI * 0.14;
  house.add(roofRight);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 1.2, 0.16),
    new THREE.MeshStandardMaterial({ color: doorColor })
  );
  door.position.set(-1.1, 0.8, 1.69);
  house.add(door);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 1.34, 0.09),
    new THREE.MeshStandardMaterial({ color: 0x38506d })
  );
  frame.position.set(-1.1, 0.82, 1.76);
  house.add(frame);

  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x2e4761, emissive: 0x10253a, emissiveIntensity: 0.6 });

  const topWindow = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.45, 0.12), windowMaterial);
  topWindow.position.set(0, 2.9, 1.67);
  house.add(topWindow);

  const lowerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.12), windowMaterial);
  lowerLeft.position.set(0.4, 1.2, 1.67);
  house.add(lowerLeft);

  const lowerRight = lowerLeft.clone();
  lowerRight.position.x = 1.45;
  house.add(lowerRight);

  house.position.set(x, 0, z);
  world.add(house);
}

createPokemonHouse({ x: -7.5, z: -3.8 });
createPokemonHouse({ x: 7.5, z: -3.8, wallColor: 0xc4c3bc, roofColor: 0xd8a071, doorColor: 0x3f7a63 });

function createLab(x, z) {
  const lab = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(7, 2.6, 4.1),
    new THREE.MeshStandardMaterial({ color: 0xd6c776, map: brickTexture, roughness: 0.85 })
  );
  base.position.y = 1.35;
  base.castShadow = true;
  base.receiveShadow = true;
  lab.add(base);

  const roof = new THREE.Mesh(
    new THREE.BoxGeometry(7.4, 0.35, 4.5),
    new THREE.MeshStandardMaterial({ color: 0x7b7f86, roughness: 0.82 })
  );
  roof.position.y = 2.85;
  roof.castShadow = true;
  lab.add(roof);

  const roofGrid = new THREE.GridHelper(6.4, 8, 0x969ba5, 0x969ba5);
  roofGrid.position.set(0, 3.03, 0);
  lab.add(roofGrid);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 1.6, 1),
    new THREE.MeshStandardMaterial({ color: 0x7f3a3d })
  );
  chimney.position.set(2.2, 3.55, -1.35);
  chimney.castShadow = true;
  lab.add(chimney);

  const chimneyTop = new THREE.Mesh(
    new THREE.BoxGeometry(1, 0.55, 0.8),
    new THREE.MeshStandardMaterial({ color: 0x51242c })
  );
  chimneyTop.position.set(2.2, 4.35, -1.35);
  lab.add(chimneyTop);

  const roundWindowGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 20);
  const roundWindowMat = new THREE.MeshStandardMaterial({ color: 0x728fc4, emissive: 0x253c65, emissiveIntensity: 0.45 });
  [-2.4, -0.8, 0.8, 2.4].forEach((xOffset) => {
    const win = new THREE.Mesh(roundWindowGeo, roundWindowMat);
    win.rotation.x = Math.PI / 2;
    win.position.set(xOffset, 2.15, 2.08);
    lab.add(win);
  });

  const frontWindow = new THREE.Mesh(
    new THREE.BoxGeometry(3.4, 0.8, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x4c6288, emissive: 0x1f3152, emissiveIntensity: 0.4 })
  );
  frontWindow.position.set(-1.1, 1.15, 2.08);
  lab.add(frontWindow);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 1.25, 0.15),
    new THREE.MeshStandardMaterial({ color: 0x5c9f82 })
  );
  door.position.set(2.05, 0.86, 2.09);
  lab.add(door);

  lab.position.set(x, 0, z);
  world.add(lab);
}

createLab(0, 7.3);

function createFenceLine(startX, startZ, segments, horizontal = true) {
  const postGeometry = new THREE.BoxGeometry(0.2, 1, 0.28);
  const material = new THREE.MeshStandardMaterial({ color: 0x949a9e, roughness: 0.85 });

  for (let i = 0; i <= segments; i += 1) {
    const post = new THREE.Mesh(postGeometry, material);
    const px = horizontal ? startX + i * 0.7 : startX;
    const pz = horizontal ? startZ : startZ + i * 0.7;
    post.position.set(px, 0.56, pz);
    post.castShadow = true;
    world.add(post);
  }
}

createFenceLine(-10.7, -0.8, 12, true);
createFenceLine(3.7, -0.8, 12, true);

function createFlowerPatch(x, z) {
  const bed = new THREE.Mesh(
    new THREE.BoxGeometry(4.8, 0.2, 2.6),
    new THREE.MeshStandardMaterial({ color: 0x7d684b })
  );
  bed.position.set(x, 0.2, z);
  world.add(bed);

  const flowerGeo = new THREE.SphereGeometry(0.18, 8, 8);
  const leafGeo = new THREE.ConeGeometry(0.1, 0.3, 6);
  for (let i = -5; i <= 5; i += 1) {
    for (let j = -2; j <= 2; j += 1) {
      const stem = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: 0x4b8b42 }));
      stem.position.set(x + i * 0.38, 0.42, z + j * 0.42);
      stem.castShadow = true;
      world.add(stem);

      const bloom = new THREE.Mesh(
        flowerGeo,
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xd86061 : 0xc74953 })
      );
      bloom.position.set(x + i * 0.38, 0.62, z + j * 0.42);
      bloom.castShadow = true;
      world.add(bloom);
    }
  }
}

createFlowerPatch(-8, 1.7);

function createPineTree(x, z, scale = 1) {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11 * scale, 0.14 * scale, 0.7 * scale, 8),
    new THREE.MeshStandardMaterial({ color: 0x7a5134 })
  );
  trunk.position.y = 0.35 * scale;
  trunk.castShadow = true;
  tree.add(trunk);

  [
    { radius: 0.5, height: 0.72, y: 0.72 },
    { radius: 0.42, height: 0.67, y: 1.08 },
    { radius: 0.32, height: 0.6, y: 1.4 }
  ].forEach(({ radius, height, y }) => {
    const layer = new THREE.Mesh(
      new THREE.ConeGeometry(radius * scale, height * scale, 7),
      new THREE.MeshStandardMaterial({ color: 0x49a354, roughness: 0.95 })
    );
    layer.position.y = y * scale;
    layer.castShadow = true;
    tree.add(layer);
  });

  tree.position.set(x, 0, z);
  world.add(tree);
}

function addForestRing() {
  for (let x = -21; x <= 21; x += 1.6) {
    for (let z = -21; z <= 21; z += 1.6) {
      const distance = Math.hypot(x, z);
      if (distance < 12 || distance > 25) {
        continue;
      }
      if (Math.random() > 0.72) {
        continue;
      }
      createPineTree(x + (Math.random() - 0.5) * 0.35, z + (Math.random() - 0.5) * 0.35, 0.95 + Math.random() * 0.28);
    }
  }
}

addForestRing();

const pond = new THREE.Mesh(
  new THREE.BoxGeometry(5.3, 0.18, 4.7),
  new THREE.MeshStandardMaterial({ color: 0x5aa7e8, transparent: true, opacity: 0.9 })
);
pond.position.set(-13, 0.14, 9.8);
pond.receiveShadow = true;
world.add(pond);

const pondEdge = new THREE.Mesh(
  new THREE.BoxGeometry(5.8, 0.22, 5.2),
  new THREE.MeshStandardMaterial({ color: 0x8a6a48 })
);
pondEdge.position.set(-13, 0.12, 9.8);
pondEdge.receiveShadow = true;
world.add(pondEdge);

const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.32, 0.9, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
player.position.set(0, 0.92, 3);
player.castShadow = true;
scene.add(player);

const playerRadius = 0.35;
const colliders = [];

function addBoxCollider(minX, maxX, minZ, maxZ) {
  colliders.push({ type: 'box', minX, maxX, minZ, maxZ });
}

function addCircleCollider(x, z, radius) {
  colliders.push({ type: 'circle', x, z, radius });
}

function overlapsBox(x, z, radius, collider) {
  const closestX = THREE.MathUtils.clamp(x, collider.minX, collider.maxX);
  const closestZ = THREE.MathUtils.clamp(z, collider.minZ, collider.maxZ);
  const dx = x - closestX;
  const dz = z - closestZ;
  return dx * dx + dz * dz < radius * radius;
}

function overlapsCircle(x, z, radius, collider) {
  const dx = x - collider.x;
  const dz = z - collider.z;
  const allowedDistance = radius + collider.radius;
  return dx * dx + dz * dz < allowedDistance * allowedDistance;
}

function hasCollision(x, z, radius) {
  for (const collider of colliders) {
    if (collider.type === 'box' && overlapsBox(x, z, radius, collider)) {
      return true;
    }
    if (collider.type === 'circle' && overlapsCircle(x, z, radius, collider)) {
      return true;
    }
  }
  return false;
}

addBoxCollider(-9.2, -5.6, -5.4, -2.2);
addBoxCollider(5.6, 9.2, -5.4, -2.2);
addBoxCollider(-3.6, 3.6, 5.2, 9.2);
addBoxCollider(-15.9, -10.1, 7.2, 12.4);

[
  [-12, -10], [-9, -11], [11, -10], [13, -8],
  [-15, 0], [15, 0], [-15, 12], [14, 12]
].forEach(([x, z]) => addCircleCollider(x, z, 1.1));

const keys = {};
let camAngle = Math.PI * 0.2;

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
    if (!hasCollision(nextX, player.position.z, playerRadius)) {
      player.position.x = nextX;
    }

    const nextZ = player.position.z + moveZ;
    if (!hasCollision(player.position.x, nextZ, playerRadius)) {
      player.position.z = nextZ;
    }
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -15.5, 15.5);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -13.5, 14.5);

  if (keys.KeyQ) camAngle += 0.026;
  if (keys.KeyE) camAngle -= 0.026;

  const camDistance = 9;
  camera.position.x = player.position.x + Math.sin(camAngle) * camDistance;
  camera.position.z = player.position.z + Math.cos(camAngle) * camDistance;
  camera.position.y = 6.5;
  camera.lookAt(player.position.x, player.position.y + 0.65, player.position.z);
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
