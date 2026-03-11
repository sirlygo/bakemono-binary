import * as THREE from 'three';

const canvas = document.getElementById('game');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x83c9ff);
scene.fog = new THREE.Fog(0x83c9ff, 16, 56);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(8, 8, 8);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xfff2c8, 1.1);
sun.position.set(10, 18, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -26;
sun.shadow.camera.right = 26;
sun.shadow.camera.top = 26;
sun.shadow.camera.bottom = -26;
scene.add(sun);

const world = new THREE.Group();
scene.add(world);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(52, 52),
  new THREE.MeshStandardMaterial({ color: 0x67b35f })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
world.add(ground);

const villagePad = new THREE.Mesh(
  new THREE.CylinderGeometry(15.5, 15.5, 0.35, 36),
  new THREE.MeshStandardMaterial({ color: 0x8fd17a })
);
villagePad.position.y = 0.18;
villagePad.receiveShadow = true;
world.add(villagePad);

function createRoadSegment(width, depth, x, z) {
  const road = new THREE.Mesh(
    new THREE.BoxGeometry(width, 0.12, depth),
    new THREE.MeshStandardMaterial({ color: 0xc2ac86, roughness: 1 })
  );
  road.position.set(x, 0.3, z);
  road.receiveShadow = true;
  world.add(road);
}

createRoadSegment(3.8, 23, 0, 0.7);
createRoadSegment(17.5, 2.8, 0, 2.2);
createRoadSegment(6.5, 2.5, -7.4, -4.8);
createRoadSegment(6.5, 2.5, 7.4, -4.8);

function createHouse({ x, z, bodyColor, roofColor, doorSide = 1, scale = 1 }) {
  const home = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(2.7 * scale, 2.1 * scale, 2.5 * scale),
    new THREE.MeshStandardMaterial({ color: bodyColor })
  );
  base.position.y = 1.2 * scale;
  base.castShadow = true;
  base.receiveShadow = true;
  home.add(base);

  const roof = new THREE.Mesh(
    new THREE.ConeGeometry(2.08 * scale, 1.3 * scale, 4),
    new THREE.MeshStandardMaterial({ color: roofColor })
  );
  roof.position.y = 2.95 * scale;
  roof.rotation.y = Math.PI * 0.25;
  roof.castShadow = true;
  home.add(roof);

  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.65 * scale, 1.1 * scale, 0.14 * scale),
    new THREE.MeshStandardMaterial({ color: 0x7b4c2b })
  );
  door.position.set(0.45 * scale * doorSide, 0.66 * scale, 1.32 * scale);
  home.add(door);

  const windowMaterial = new THREE.MeshStandardMaterial({ color: 0xa8ebff, emissive: 0x1f4760, emissiveIntensity: 0.35 });
  const windowLeft = new THREE.Mesh(new THREE.BoxGeometry(0.55 * scale, 0.45 * scale, 0.12 * scale), windowMaterial);
  windowLeft.position.set(-0.7 * scale, 1.24 * scale, 1.32 * scale);
  home.add(windowLeft);

  const windowRight = windowLeft.clone();
  windowRight.position.x = 0.7 * scale;
  home.add(windowRight);

  const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.35 * scale, 0.95 * scale, 0.35 * scale),
    new THREE.MeshStandardMaterial({ color: 0x8c8c8c })
  );
  chimney.position.set(-0.6 * scale, 3.3 * scale, -0.35 * scale);
  chimney.castShadow = true;
  home.add(chimney);

  home.position.set(x, 0, z);
  world.add(home);
}

createHouse({ x: 0, z: 7, bodyColor: 0xf7f2dd, roofColor: 0xc74141, scale: 1.15 });
createHouse({ x: -7.5, z: -3.8, bodyColor: 0xf3f7ff, roofColor: 0x4f7ddb, doorSide: -1 });
createHouse({ x: 7.5, z: -3.8, bodyColor: 0xf8f2e4, roofColor: 0x46a461, doorSide: 1 });

function createFenceLine(startX, startZ, segments, horizontal = true) {
  const postGeometry = new THREE.BoxGeometry(0.16, 0.8, 0.16);
  const railGeometry = new THREE.BoxGeometry(horizontal ? 1 : 0.1, 0.1, horizontal ? 0.1 : 1);
  const material = new THREE.MeshStandardMaterial({ color: 0xe6dcb5 });

  for (let i = 0; i <= segments; i += 1) {
    const post = new THREE.Mesh(postGeometry, material);
    const px = horizontal ? startX + i : startX;
    const pz = horizontal ? startZ : startZ + i;
    post.position.set(px, 0.7, pz);
    post.castShadow = true;
    world.add(post);

    if (i < segments) {
      const railTop = new THREE.Mesh(railGeometry, material);
      railTop.position.set(horizontal ? px + 0.5 : px, 0.85, horizontal ? pz : pz + 0.5);
      railTop.castShadow = true;
      world.add(railTop);

      const railMid = railTop.clone();
      railMid.position.y = 0.55;
      world.add(railMid);
    }
  }
}

createFenceLine(-11, 10, 22, true);
createFenceLine(-11, -11, 22, true);
createFenceLine(-11, -11, 21, false);
createFenceLine(11, -11, 21, false);

function createTree(x, z, size = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16 * size, 0.2 * size, 1.1 * size, 8),
    new THREE.MeshStandardMaterial({ color: 0x8a5734 })
  );
  trunk.position.set(x, 0.75 * size, z);
  trunk.castShadow = true;
  world.add(trunk);

  const leaves = new THREE.Mesh(
    new THREE.SphereGeometry(0.72 * size, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x2d9745 })
  );
  leaves.position.set(x, 1.8 * size, z);
  leaves.castShadow = true;
  world.add(leaves);
}

[
  [-12, -7, 1.2], [-9.5, -8.5, 1], [-7.5, -10, 1.15],
  [11.5, -9.5, 1.2], [12.5, -6.5, 1], [10.2, -11.3, 1.15],
  [-12, 7, 1], [12.4, 8.2, 1.1], [-8.2, 12, 1], [8.2, 12, 1]
].forEach(([x, z, size]) => createTree(x, z, size));

const pond = new THREE.Mesh(
  new THREE.CylinderGeometry(3.2, 3.2, 0.16, 28),
  new THREE.MeshStandardMaterial({ color: 0x56b7e8, transparent: true, opacity: 0.9 })
);
pond.position.set(-14, 0.12, 4.5);
pond.receiveShadow = true;
world.add(pond);

const pondRim = new THREE.Mesh(
  new THREE.TorusGeometry(3.2, 0.23, 12, 32),
  new THREE.MeshStandardMaterial({ color: 0xb7db9f })
);
pondRim.rotation.x = Math.PI / 2;
pondRim.position.set(-14, 0.22, 4.5);
world.add(pondRim);

const lab = new THREE.Mesh(
  new THREE.BoxGeometry(6, 2.5, 3.3),
  new THREE.MeshStandardMaterial({ color: 0xdce8ef })
);
lab.position.set(0, 1.45, -8.8);
lab.castShadow = true;
lab.receiveShadow = true;
world.add(lab);

const labRoof = new THREE.Mesh(
  new THREE.BoxGeometry(6.5, 0.45, 3.8),
  new THREE.MeshStandardMaterial({ color: 0x6d899e })
);
labRoof.position.set(0, 2.95, -8.8);
labRoof.castShadow = true;
world.add(labRoof);

const player = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.32, 0.9, 6, 12),
  new THREE.MeshStandardMaterial({ color: 0xffffff })
);
player.position.set(0, 0.92, 3);
player.castShadow = true;
scene.add(player);

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
    player.position.x += moveX;
    player.position.z += moveZ;
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
