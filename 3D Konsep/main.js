import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa3d3f0);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById("app").appendChild(renderer.domElement);

const ambient = new THREE.AmbientLight(0xffffff, 0.75);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(20, 35, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const helperGround = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.MeshStandardMaterial({ color: 0x7aa57a, roughness: 1, metalness: 0 })
);
helperGround.rotation.x = -Math.PI / 2;
helperGround.position.y = -0.001;
helperGround.receiveShadow = true;
scene.add(helperGround);

// Camera controls and mode state
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.08;
orbitControls.minDistance = 8;
orbitControls.maxDistance = 80;

let isIsometricMode = false;

function applyFreeOrbitControls() {
  orbitControls.enableRotate = true;
  orbitControls.enablePan = true;
  orbitControls.enableZoom = true;
  orbitControls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  orbitControls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  orbitControls.panSpeed = 1;
  orbitControls.screenSpacePanning = false;
  orbitControls.zoomSpeed = 1.0;
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.05;
  orbitControls.minPolarAngle = 0;
  orbitControls.maxPolarAngle = Math.PI * 0.85;
  orbitControls.target.y = 0;
}

function applyIsometricControls() {
  orbitControls.enableRotate = false;
  orbitControls.enablePan = true;
  orbitControls.enableZoom = true;
  orbitControls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  orbitControls.touches = {
    ONE: THREE.TOUCH.PAN,
    TWO: THREE.TOUCH.DOLLY_PAN,
  };
  orbitControls.panSpeed = 1.2;
  orbitControls.screenSpacePanning = false;
  orbitControls.zoomSpeed = 1.0;
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.minPolarAngle = Math.PI * 0.19;
  orbitControls.maxPolarAngle = Math.PI * 0.19;
  orbitControls.target.y = 0;
}

applyFreeOrbitControls();

const pointerControls = new PointerLockControls(camera, document.body);

const initialOrbitTarget = new THREE.Vector3(0, 0, 0);
const initialOrbitOffset = new THREE.Vector3(18, 20, 18);

camera.position.copy(initialOrbitTarget).add(initialOrbitOffset);
orbitControls.target.copy(initialOrbitTarget);
orbitControls.update();

let mode = "orbit";
let isTransitioning = false;

// UI references
const coordsEl = document.getElementById("coords");
const isoBtn = document.getElementById("isoBtn");
const enterBtn = document.getElementById("enterBtn");
const saveBtn = document.getElementById("saveBtn");
const orbitPanel = document.getElementById("orbitPanel");
const fpPanel = document.getElementById("fpPanel");
const crosshair = document.getElementById("crosshair");
const errorMessage = document.getElementById("errorMessage");
const minimapEl = document.getElementById("minimap");
const minimapCanvas = document.getElementById("minimapCanvas");
const minimapDot = document.getElementById("minimapDot");
const loadingScreen = document.getElementById("loadingScreen");
const loadingBar = document.getElementById("loadingBar");
const loadingPercent = document.getElementById("loadingPercent");

// Model loading
const loader = new GLTFLoader();
const collisionMeshes = [];

function setLoadingProgress(percent) {
  const clamped = Math.max(0, Math.min(100, percent));
  loadingBar.style.width = `${clamped.toFixed(0)}%`;
  loadingPercent.textContent = `${clamped.toFixed(0)}%`;
}

function hideLoadingScreen() {
  loadingScreen.classList.add("hidden");
}

function onModelLoaded(gltf) {
  const city = gltf.scene;

  city.traverse((obj) => {
    if (obj.isMesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      collisionMeshes.push(obj);
    }
  });

  scene.add(city);
  setLoadingProgress(100);
  hideLoadingScreen();
}

function loadCityModel(paths, index = 0) {
  if (index >= paths.length) {
    hideLoadingScreen();
    errorMessage.classList.remove("hidden");
    return;
  }

  loader.load(
    paths[index],
    onModelLoaded,
    (event) => {
      if (event.total > 0) {
        setLoadingProgress((event.loaded / event.total) * 100);
      }
    },
    () => {
      loadCityModel(paths, index + 1);
    }
  );
}

loadCityModel(["/assets/city.glb", "./assets/city.glb"]);

// Pin system (click-to-place marker on XZ plane at Y=0)
const pinGroup = new THREE.Group();
const savedWaypointGroup = new THREE.Group();
scene.add(savedWaypointGroup);

const savedWaypoints = [];
const savedMarkerMeshes = [];
const maxWaypoints = 5;

const pinBody = new THREE.Mesh(
  new THREE.ConeGeometry(0.5, 1.5, 20),
  new THREE.MeshStandardMaterial({ color: 0xd93a3a, roughness: 0.35, metalness: 0.1 })
);
pinBody.position.y = 1.9;
pinBody.castShadow = true;

const pinHead = new THREE.Mesh(
  new THREE.SphereGeometry(0.6, 16, 16),
  new THREE.MeshStandardMaterial({ color: 0xff5e5e, roughness: 0.35, metalness: 0.1 })
);
pinHead.position.y = 3.4;
pinHead.castShadow = true;
pinHead.material.depthTest = false;
pinHead.renderOrder = 999;

const glowRing = new THREE.Mesh(
  new THREE.TorusGeometry(2.5, 0.15, 16, 48),
  new THREE.MeshBasicMaterial({ color: 0xff4d4d, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
);
glowRing.rotation.x = -Math.PI / 2;
glowRing.position.y = 0.08;

const pinGlowLight = new THREE.PointLight(0xff3333, 2, 15);
pinGlowLight.position.set(0, 2.4, 0);

pinGroup.add(pinBody, pinHead, glowRing, pinGlowLight);
pinGroup.scale.set(4, 4, 4);
pinGroup.position.set(0, 0, 0);
scene.add(pinGroup);

const raycaster = new THREE.Raycaster();
const mouseNdc = new THREE.Vector2();
const clickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const clickPoint = new THREE.Vector3();
let pointerDownMeta = null;
const pinMoveStart = new THREE.Vector3();
const pinMoveEnd = new THREE.Vector3();
let pinMoveElapsed = 0;
const pinMoveDuration = 0.4;
let pinMoveActive = false;

function refreshSaveButton() {
  saveBtn.textContent = `Save Point (${savedWaypoints.length}/${maxWaypoints})`;
  saveBtn.disabled = savedWaypoints.length >= maxWaypoints;
}

function addSavedWaypointMarker(position) {
  const marker = new THREE.Mesh(
    new THREE.ConeGeometry(0.17, 0.35, 14),
    new THREE.MeshStandardMaterial({ color: 0xffd54f, roughness: 0.45, metalness: 0.1 })
  );
  marker.position.set(position.x, 0.18, position.z);
  marker.castShadow = true;
  marker.userData.waypoint = { x: position.x, z: position.z };
  savedWaypointGroup.add(marker);
  savedMarkerMeshes.push(marker);
}

function saveCurrentPoint() {
  if (mode !== "orbit" || isTransitioning || savedWaypoints.length >= maxWaypoints) {
    return;
  }

  const point = { x: pinGroup.position.x, z: pinGroup.position.z };
  const hasDuplicate = savedWaypoints.some((p) => Math.hypot(p.x - point.x, p.z - point.z) < 0.2);
  if (hasDuplicate) {
    return;
  }

  savedWaypoints.push(point);
  addSavedWaypointMarker(point);
  refreshSaveButton();
}

refreshSaveButton();

function updateCoordsHud() {
  coordsEl.textContent = `X: ${pinGroup.position.x.toFixed(2)}, Z: ${pinGroup.position.z.toFixed(2)}`;
}

updateCoordsHud();

function setMouseNdc(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouseNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouseNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function updateCoordsHudAt(position) {
  coordsEl.textContent = `X: ${position.x.toFixed(2)}, Z: ${position.z.toFixed(2)}`;
}

function animatePinTo(position) {
  pinMoveStart.copy(pinGroup.position);
  pinMoveEnd.set(position.x, 0, position.z);
  pinMoveElapsed = 0;
  pinMoveActive = true;
  updateCoordsHudAt(pinMoveEnd);
  updateMinimapDot(pinMoveEnd);
}

renderer.domElement.addEventListener("pointerdown", (event) => {
  if (mode !== "orbit" || isTransitioning) {
    return;
  }

  pointerDownMeta = {
    x: event.clientX,
    y: event.clientY,
    t: performance.now(),
  };
});

window.addEventListener("pointerup", (event) => {
  if (!pointerDownMeta || mode !== "orbit" || isTransitioning) {
    return;
  }

  const deltaX = event.clientX - pointerDownMeta.x;
  const deltaY = event.clientY - pointerDownMeta.y;
  const distance = Math.hypot(deltaX, deltaY);
  const elapsedMs = performance.now() - pointerDownMeta.t;
  pointerDownMeta = null;

  if (distance >= 6 || elapsedMs >= 200) {
    return;
  }

  setMouseNdc(event);
  raycaster.setFromCamera(mouseNdc, camera);

  const savedHit = raycaster.intersectObjects(savedMarkerMeshes, false);
  if (savedHit.length > 0) {
    const wp = savedHit[0].object.userData.waypoint;
    animatePinTo(wp);
    return;
  }

  if (raycaster.ray.intersectPlane(clickPlane, clickPoint)) {
    animatePinTo({ x: clickPoint.x, z: clickPoint.z });
  }
});

saveBtn.addEventListener("click", () => {
  saveCurrentPoint();
});

// Minimap (orbit mode only)
const minimapSize = 180;
const minimapWorldHalfSize = 60;
const minimapCamera = new THREE.OrthographicCamera(
  -minimapWorldHalfSize,
  minimapWorldHalfSize,
  minimapWorldHalfSize,
  -minimapWorldHalfSize,
  0.1,
  300
);
minimapCamera.position.set(0, 120, 0);
minimapCamera.up.set(0, 0, -1);
minimapCamera.lookAt(0, 0, 0);

const minimapTarget = new THREE.WebGLRenderTarget(minimapSize, minimapSize);
const minimapCtx = minimapCanvas.getContext("2d");
const minimapPixels = new Uint8Array(minimapSize * minimapSize * 4);
const minimapImageData = minimapCtx.createImageData(minimapSize, minimapSize);

function renderMinimap() {
  renderer.setRenderTarget(minimapTarget);
  renderer.render(scene, minimapCamera);
  renderer.setRenderTarget(null);
  renderer.readRenderTargetPixels(minimapTarget, 0, 0, minimapSize, minimapSize, minimapPixels);

  const dst = minimapImageData.data;
  for (let y = 0; y < minimapSize; y += 1) {
    const srcRow = minimapSize - 1 - y;
    for (let x = 0; x < minimapSize; x += 1) {
      const srcIndex = (srcRow * minimapSize + x) * 4;
      const dstIndex = (y * minimapSize + x) * 4;
      dst[dstIndex] = minimapPixels[srcIndex];
      dst[dstIndex + 1] = minimapPixels[srcIndex + 1];
      dst[dstIndex + 2] = minimapPixels[srcIndex + 2];
      dst[dstIndex + 3] = minimapPixels[srcIndex + 3];
    }
  }

  minimapCtx.putImageData(minimapImageData, 0, 0);
}

function updateMinimapDot(position = pinGroup.position) {
  const normalizedX = (position.x + minimapWorldHalfSize) / (2 * minimapWorldHalfSize);
  const normalizedZ = (position.z + minimapWorldHalfSize) / (2 * minimapWorldHalfSize);

  const x = THREE.MathUtils.clamp(normalizedX * minimapSize, 5, minimapSize - 5);
  const y = THREE.MathUtils.clamp(normalizedZ * minimapSize, 5, minimapSize - 5);

  minimapDot.style.left = `${x}px`;
  minimapDot.style.top = `${y}px`;
}

// First-person movement and collision
const moveState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const moveSpeed = 4.0;
const eyeHeight = 1.7;
const walkDirection = new THREE.Vector3();
const sideDirection = new THREE.Vector3();
const movement = new THREE.Vector3();
const downRay = new THREE.Raycaster();
const forwardRay = new THREE.Raycaster();

function setMovementKey(code, pressed) {
  if (code === "KeyW" || code === "ArrowUp") moveState.forward = pressed;
  if (code === "KeyS" || code === "ArrowDown") moveState.backward = pressed;
  if (code === "KeyA" || code === "ArrowLeft") moveState.left = pressed;
  if (code === "KeyD" || code === "ArrowRight") moveState.right = pressed;
}

window.addEventListener("keydown", (event) => {
  if (mode === "firstPerson") {
    setMovementKey(event.code, true);

    if (event.code === "Escape") {
      pointerControls.unlock();
      returnToOrbit();
    }
  }
});

window.addEventListener("keyup", (event) => {
  setMovementKey(event.code, false);
});

function hasForwardCollision(direction) {
  if (direction.lengthSq() === 0 || collisionMeshes.length === 0) {
    return false;
  }

  const origin = camera.position.clone();
  origin.y = 1.1;
  forwardRay.set(origin, direction.clone().normalize());
  forwardRay.far = 0.7;

  const hits = forwardRay.intersectObjects(collisionMeshes, true);
  return hits.length > 0;
}

function hasGroundBelow(nextPosition) {
  if (collisionMeshes.length === 0) {
    return true;
  }

  const probe = nextPosition.clone();
  probe.y = 5;
  downRay.set(probe, new THREE.Vector3(0, -1, 0));
  downRay.far = 10;

  const hits = downRay.intersectObjects(collisionMeshes, true);
  return hits.length > 0;
}

function updateFirstPerson(deltaSeconds) {
  movement.set(0, 0, 0);
  pointerControls.getDirection(walkDirection);
  walkDirection.y = 0;
  walkDirection.normalize();

  sideDirection.crossVectors(new THREE.Vector3(0, 1, 0), walkDirection).normalize();

  if (moveState.forward) movement.add(walkDirection);
  if (moveState.backward) movement.sub(walkDirection);
  if (moveState.left) movement.add(sideDirection);
  if (moveState.right) movement.sub(sideDirection);

  if (movement.lengthSq() === 0) {
    camera.position.y = eyeHeight;
    return;
  }

  movement.normalize().multiplyScalar(moveSpeed * deltaSeconds);
  const direction = movement.clone().normalize();

  if (hasForwardCollision(direction)) {
    camera.position.y = eyeHeight;
    return;
  }

  const nextPos = camera.position.clone().add(movement);
  nextPos.y = eyeHeight;

  if (!hasGroundBelow(nextPos)) {
    camera.position.y = eyeHeight;
    return;
  }

  camera.position.copy(nextPos);
}

// Transition helpers (manual tween with ease-in-out)
function easeInOut(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function animateTransition(durationMs, onUpdate, onComplete) {
  const start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / durationMs);
    onUpdate(easeInOut(t));
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onComplete();
    }
  }

  requestAnimationFrame(step);
}

function setOrbitUi(visible) {
  orbitPanel.classList.toggle("hidden", !visible);
  pinGroup.visible = visible;
  savedWaypointGroup.visible = visible;
  minimapEl.classList.toggle("hidden", !visible);
}

function setFirstPersonUi(visible) {
  fpPanel.classList.toggle("hidden", !visible);
  crosshair.classList.toggle("hidden", !visible);
}

function moveToIsometricView() {
  if (mode !== "orbit" || isTransitioning) {
    return;
  }

  isIsometricMode = true;
  isoBtn.textContent = "Free Orbit";
  applyIsometricControls();

  isTransitioning = true;
  orbitControls.enabled = false;

  const target = orbitControls.target.clone();
  const startCam = camera.position.clone();
  const startTarget = orbitControls.target.clone();

  const toCamera = startCam.clone().sub(startTarget);
  const spherical = new THREE.Spherical().setFromVector3(toCamera);
  spherical.phi = Math.PI * 0.19;
  const endCam = target.clone().add(new THREE.Vector3().setFromSpherical(spherical));

  animateTransition(
    900,
    (k) => {
      camera.position.lerpVectors(startCam, endCam, k);
      orbitControls.target.lerpVectors(startTarget, target, k);
      orbitControls.update();
    },
    () => {
      isTransitioning = false;
      orbitControls.enabled = true;
      orbitControls.update();
    }
  );
}

function exitIsometricView() {
  if (mode !== "orbit" || isTransitioning) {
    return;
  }

  isIsometricMode = false;
  isoBtn.textContent = "Isometric POV";
  applyFreeOrbitControls();
  orbitControls.update();
}

// Orbit -> first person transition
function enterFirstPerson() {
  if (mode !== "orbit" || isTransitioning) {
    return;
  }

  isTransitioning = true;
  orbitControls.enabled = false;

  const startCam = camera.position.clone();
  const startTarget = orbitControls.target.clone();
  const pinPos = pinGroup.position.clone();
  const endCam = new THREE.Vector3(pinPos.x, eyeHeight, pinPos.z);
  const endTarget = new THREE.Vector3(pinPos.x, eyeHeight, pinPos.z - 1);

  animateTransition(
    1500,
    (k) => {
      camera.position.lerpVectors(startCam, endCam, k);
      orbitControls.target.lerpVectors(startTarget, new THREE.Vector3(pinPos.x, 0, pinPos.z), k);
      camera.lookAt(endTarget);
    },
    () => {
      mode = "firstPerson";
      isTransitioning = false;
      camera.position.set(pinPos.x, eyeHeight, pinPos.z);
      pointerControls.getObject().position.copy(camera.position);
      setOrbitUi(false);
      setFirstPersonUi(true);
    }
  );
}

// First person -> orbit transition
function returnToOrbit() {
  if (mode !== "firstPerson" || isTransitioning) {
    return;
  }

  isTransitioning = true;
  pointerControls.unlock();

  const pinPos = pinGroup.position.clone();
  const orbitTarget = new THREE.Vector3(pinPos.x, 0, pinPos.z);
  const endCam = orbitTarget.clone().add(initialOrbitOffset);

  const startCam = camera.position.clone();
  const startTarget = new THREE.Vector3(camera.position.x, 0, camera.position.z - 1);

  animateTransition(
    1200,
    (k) => {
      camera.position.lerpVectors(startCam, endCam, k);
      orbitControls.target.lerpVectors(startTarget, orbitTarget, k);
      camera.lookAt(orbitControls.target);
    },
    () => {
      mode = "orbit";
      isTransitioning = false;
      orbitControls.enabled = true;
      orbitControls.update();
      setOrbitUi(true);
      setFirstPersonUi(false);
      camera.position.copy(endCam);
      updateCoordsHud();
    }
  );
}

enterBtn.addEventListener("click", () => {
  enterFirstPerson();
});

isoBtn.addEventListener("click", () => {
  if (isIsometricMode) {
    exitIsometricView();
  } else {
    moveToIsometricView();
  }
});

renderer.domElement.addEventListener("click", () => {
  if (mode === "firstPerson" && !pointerControls.isLocked && !isTransitioning) {
    pointerControls.lock();
  }
});

renderer.domElement.addEventListener(
  "wheel",
  (event) => {
    if (mode !== "orbit" || !isIsometricMode || isTransitioning) {
      return;
    }

    event.preventDefault();
    const zoomStep = 2.2;
    const minHeight = 5;
    const maxHeight = 140;
    const direction = Math.sign(event.deltaY);
    camera.position.y = THREE.MathUtils.clamp(camera.position.y + direction * zoomStep, minHeight, maxHeight);
  },
  { passive: false }
);

pointerControls.addEventListener("unlock", () => {
  if (mode === "firstPerson" && !isTransitioning) {
    returnToOrbit();
  }
});

// Responsive canvas
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (pinMoveActive) {
    pinMoveElapsed += delta;
    const t = Math.min(pinMoveElapsed / pinMoveDuration, 1);
    const eased = easeInOut(t);
    pinGroup.position.lerpVectors(pinMoveStart, pinMoveEnd, eased);

    if (t >= 1) {
      pinMoveActive = false;
      pinGroup.position.copy(pinMoveEnd);
      updateCoordsHud();
    }
  }

  if (mode === "orbit") {
    orbitControls.update();
    if (isIsometricMode) {
      orbitControls.target.y = 0;
      const minHeight = 5;
      if (camera.position.y < minHeight) {
        camera.position.y = minHeight;
      }
    }
  }

  if (mode === "firstPerson" && !isTransitioning) {
    updateFirstPerson(delta);
  }

  if (mode === "orbit") {
    renderMinimap();
    updateMinimapDot();
  }

  renderer.render(scene, camera);
}

animate();
