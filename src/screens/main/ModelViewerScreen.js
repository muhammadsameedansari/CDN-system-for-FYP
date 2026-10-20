import React, { useRef, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Platform,
  ScrollView, Dimensions,
} from 'react-native';
import { ElectricalEngine } from '../../simulation/ElectricalEngine';
import { PlumbingEngine }   from '../../simulation/PlumbingEngine';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const BASE_URL = Platform.OS === 'web'
  ? 'http://localhost:8000'
  : 'http://192.168.0.13:8000';

// ── Mobile 3D Viewer (WebView with Three.js CDN) ──────────────────────────
function MobileViewer({ modelUrl }) {
  const [loaded, setLoaded] = useState(false);

  // Architectural viewer — light bg, camera presets, roof toggle
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#F2EFE9; overflow:hidden; font-family:Arial,sans-serif; }
  canvas { display:block; }
  #loading {
    position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
    color:#5A4A3A; font-size:15px; text-align:center;
    background:rgba(242,239,233,0.9); padding:20px 28px; border-radius:12px;
    box-shadow:0 4px 16px rgba(0,0,0,0.12);
  }
  #loading span { display:block; font-size:28px; margin-bottom:8px; }
  #controls {
    position:fixed; bottom:12px; left:50%; transform:translateX(-50%);
    display:flex; gap:8px; flex-wrap:wrap; justify-content:center;
  }
  .ctrl-btn {
    background:rgba(255,255,255,0.88); border:1.5px solid #C8BFB0;
    color:#4A3C2E; font-size:11px; font-weight:700;
    padding:7px 14px; border-radius:20px; cursor:pointer;
    box-shadow:0 2px 8px rgba(0,0,0,0.10); letter-spacing:0.3px;
  }
  .ctrl-btn:hover { background:#fff; border-color:#8B6F47; color:#5A3A1A; }
  .ctrl-btn.active { background:#8B6F47; color:#fff; border-color:#8B6F47; }
  #hint {
    position:fixed; top:10px; right:12px;
    color:#9A8A7A; font-size:9px; text-align:right;
    background:rgba(255,255,255,0.6); padding:4px 8px; border-radius:8px;
  }
  #scale-info {
    position:fixed; top:10px; left:12px;
    background:rgba(255,255,255,0.82); border:1px solid #D0C8BC;
    color:#5A4A3A; font-size:10px; padding:5px 10px; border-radius:8px;
    line-height:1.6;
  }
</style>
</head>
<body>
<div id="loading"><span>🏗️</span>Generating Naqsha...<br><small style="color:#8A7A6A;margin-top:4px;display:block">Building architectural model</small></div>
<div id="hint">Pinch to zoom • Drag to rotate</div>
<div id="scale-info">📐 Grid: 1m × 1m<br>🧱 Walls: 9 inch brick<br>📏 Height: 10 ft</div>
<div id="controls">
  <button class="ctrl-btn active" onclick="setView('3d')" id="btn3d">🏠 3D View</button>
  <button class="ctrl-btn" onclick="setView('top')" id="btnTop">⬆️ Top (Plan)</button>
  <button class="ctrl-btn" onclick="setView('front')" id="btnFront">↗️ Front Elevation</button>
  <button class="ctrl-btn" onclick="toggleRoof()" id="btnRoof">🔺 Hide Roof</button>
</div>
<script src="https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.153.0/examples/js/loaders/GLTFLoader.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.153.0/examples/js/controls/OrbitControls.js"></script>
<script>
  const W = window.innerWidth, H = window.innerHeight;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xF2EFE9);
  scene.fog = new THREE.Fog(0xF2EFE9, 80, 200);

  // Architectural daylight lighting
  scene.add(new THREE.AmbientLight(0xFFFFFF, 0.85));
  const sun = new THREE.DirectionalLight(0xFFF8F0, 1.10);
  sun.position.set(30, 50, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 200;
  sun.shadow.camera.left = -50;
  sun.shadow.camera.right = 50;
  sun.shadow.camera.top = 50;
  sun.shadow.camera.bottom = -50;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xF0F4FF, 0.30);
  fill.position.set(-20, 10, -15);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(50, W/H, 0.1, 500);
  camera.position.set(22, 18, 26);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  document.body.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 3;
  controls.maxDistance = 120;
  controls.maxPolarAngle = Math.PI / 1.95;
  controls.target.set(0, 1, 0);

  let roofNode = null;
  let roofVisible = true;
  let modelSize = 25;

  const loader = new THREE.GLTFLoader();
  loader.load(
    '${modelUrl}',
    function(gltf) {
      const model = gltf.scene;
      model.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
          if (c.material) {
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach(m => { m.vertexColors = false; m.needsUpdate = true; });
          }
        }
        // find roof node by name
        if (c.name === 'roof') roofNode = c;
        if (c.isGroup && c.name === 'roof') roofNode = c;
      });
      // Also check direct children
      gltf.scene.children.forEach(child => {
        if (child.name === 'roof') roofNode = child;
      });
      const bbox = new THREE.Box3().setFromObject(model);
      const center = bbox.getCenter(new THREE.Vector3());
      model.position.sub(center);
      model.position.y += (bbox.max.y - bbox.min.y) / 2;
      scene.add(model);
      document.getElementById('loading').style.display = 'none';
      modelSize = bbox.getSize(new THREE.Vector3()).length();
      camera.position.set(modelSize*0.78, modelSize*0.55, modelSize*0.78);
      camera.lookAt(0, 0, 0);
      controls.update();
    },
    function(xhr) {
      if (xhr.total) {
        const pct = Math.round(xhr.loaded / xhr.total * 100);
        document.querySelector('#loading small').textContent = 'Loading ' + pct + '%...';
      }
    },
    function(err) {
      document.getElementById('loading').innerHTML = '<span>⚠️</span>Failed to load<br><small>Check backend connection</small>';
    }
  );

  function setView(mode) {
    const s = modelSize || 25;
    const btns = ['btn3d','btnTop','btnFront'];
    btns.forEach(id => document.getElementById(id).classList.remove('active'));
    if (mode === 'top') {
      camera.position.set(0.01, s*1.4, 0.01);
      camera.lookAt(0, 0, 0);
      controls.maxPolarAngle = Math.PI;
      document.getElementById('btnTop').classList.add('active');
    } else if (mode === 'front') {
      camera.position.set(0, s*0.38, s*1.10);
      camera.lookAt(0, s*0.15, 0);
      controls.maxPolarAngle = Math.PI / 1.95;
      document.getElementById('btnFront').classList.add('active');
    } else {
      camera.position.set(s*0.78, s*0.55, s*0.78);
      camera.lookAt(0, 0, 0);
      controls.maxPolarAngle = Math.PI / 1.95;
      document.getElementById('btn3d').classList.add('active');
    }
    controls.update();
  }

  function toggleRoof() {
    if (!roofNode) {
      // fallback: traverse scene for roof
      scene.traverse(obj => { if (obj.name === 'roof') roofNode = obj; });
    }
    roofVisible = !roofVisible;
    if (roofNode) {
      roofNode.visible = roofVisible;
    } else {
      // if node not found by name, try mesh index approach
      let i = 0;
      scene.traverse(obj => {
        if (obj.isMesh) {
          i++;
          if (i > 30) obj.visible = roofVisible; // rough split
        }
      });
    }
    const btn = document.getElementById('btnRoof');
    btn.textContent = roofVisible ? '🔺 Hide Roof' : '🏠 Show Roof';
    btn.classList.toggle('active', !roofVisible);
  }

  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
</script>
</body>
</html>
  `;

  try {
    const { WebView } = require('react-native-webview');
    return (
      <View style={{ height: SCREEN_H * 0.52, backgroundColor: '#F2EFE9' }}>
        {!loaded && (
          <View style={mv.loadingOverlay}>
            <ActivityIndicator size="large" color="#8B6F47" />
            <Text style={mv.loadingText}>Naqsha Load Ho Raha Hai...</Text>
          </View>
        )}
        <WebView
          source={{ html }}
          style={{ flex: 1, backgroundColor: '#F2EFE9' }}
          onLoad={() => setLoaded(true)}
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          allowFileAccess
          allowUniversalAccessFromFileURLs
        />
      </View>
    );
  } catch {
    return (
      <View style={mv.errorBox}>
        <Text style={mv.errorText}>⚠️ WebView not available</Text>
      </View>
    );
  }
}

const mv = StyleSheet.create({
  loadingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10, backgroundColor: '#F2EFE9',
  },
  loadingText: { color: '#6A5A4A', marginTop: 10, fontSize: 13, fontWeight: '600' },
  errorBox:    { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2EFE9', padding: 20 },
  errorText:   { color: '#B04030', fontSize: 13, textAlign: 'center' },
});
function buildRoomLayout(rooms) {
  const ROOM_SIZES = {
    bedroom:(5,4.5), kitchen:[4.5,4.0], washroom:[3.0,2.5],
    lounge:[6.5,5.5], dining:[5.0,4.5], garage:[6.0,3.5],
    garden:[7.0,5.0], office:[4.5,4.0], default:[4.5,4.0],
  };
  const sizes = {
    bedroom:[5.0,4.5], kitchen:[4.5,4.0], washroom:[3.0,2.5],
    lounge:[6.5,5.5],  dining:[5.0,4.5],  garage:[6.0,3.5],
    garden:[7.0,5.0],  office:[4.5,4.0],  default:[4.5,4.0],
  };
  const WALL_T = 0.22;
  const PER_ROW = 3;
  let layout = [];
  let xCur = 0, zCur = 0, maxD = 0, count = 0;

  for (const room of rooms) {
    const cnt  = room.count || 1;
    const size = sizes[room.id] || sizes.default;
    const [w, d] = size;
    for (let i = 0; i < cnt; i++) {
      if (count > 0 && count % PER_ROW === 0) {
        xCur = 0; zCur += maxD + WALL_T; maxD = 0;
      }
      layout.push({ id: room.id, label: room.label || room.id, x: xCur, z: zCur, w, d });
      maxD = Math.max(maxD, d);
      xCur += w + WALL_T;
      count++;
    }
  }
  // Center offset
  const allX = layout.map(r => r.x + r.w);
  const allZ = layout.map(r => r.z + r.d);
  const hW   = allX.length ? Math.max(...allX) : 10;
  const hD   = allZ.length ? Math.max(...allZ) : 8;
  const offX = hW / 2;
  const offZ = hD / 2;
  return layout.map(r => ({ ...r, x: r.x - offX, z: r.z - offZ }));
}

// ── Three.js 3D Viewer with simulation overlays ────────────────────────────
function WebViewer({ modelUrl, rooms, simMode, elEngine, plEngine, onSimEvent }) {
  const mountRef   = useRef(null);
  const threeRef   = useRef({});  // stores THREE, scene, camera, renderer, etc.
  const overlayRef = useRef({ elObjects: [], plObjects: [], particles: [] });

  // ── Initialize Three.js once ─────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web' || !mountRef.current) return;
    let animId;

    const init = async () => {
      const THREE        = await import('three');
      const { GLTFLoader }    = await import('three/examples/jsm/loaders/GLTFLoader.js');
      const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

      const container = mountRef.current;
      const W = container.clientWidth  || SCREEN_W;
      const H = container.clientHeight || SCREEN_H * 0.6;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xF2EFE9);
      scene.fog = new THREE.Fog(0xF2EFE9, 80, 200);

      // Architectural daylight lighting
      scene.add(new THREE.AmbientLight(0xFFFFFF, 0.85));
      const sun  = new THREE.DirectionalLight(0xFFF8F0, 1.10);
      sun.position.set(30, 50, 20);
      sun.castShadow = true;
      sun.shadow.mapSize.width  = 2048;
      sun.shadow.mapSize.height = 2048;
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xF0F4FF, 0.28);
      fill.position.set(-20, 10, -15);
      scene.add(fill);

      // Camera
      const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 500);
      camera.position.set(20, 16, 25);
      camera.lookAt(0, 0, 0);

      // Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      container.appendChild(renderer.domElement);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.minDistance   = 4;
      controls.maxDistance   = 100;
      controls.maxPolarAngle = Math.PI / 2.05;

      // Load GLB model
      const loader = new GLTFLoader();
      loader.load(modelUrl, (gltf) => {
        const model = gltf.scene;
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow    = true;
            child.receiveShadow = true;
            if (child.material) {
              const mats = Array.isArray(child.material) ? child.material : [child.material];
              mats.forEach(m => { m.vertexColors = false; m.needsUpdate = true; });
            }
          }
        });
        const bbox   = new THREE.Box3().setFromObject(model);
        const center = bbox.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.position.y += (bbox.max.y - bbox.min.y) / 2;
        scene.add(model);
        const size = bbox.getSize(new THREE.Vector3()).length();
        camera.position.set(size*0.75, size*0.55, size*0.75);
        camera.lookAt(0, 0, 0);
        controls.update();
      }, undefined, err => console.error('GLB error:', err));

      // Click handler for simulation interactions
      const raycaster = new THREE.Raycaster();
      const mouse     = new THREE.Vector2();

      renderer.domElement.addEventListener('click', (e) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
        mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(
          overlayRef.current.elObjects.concat(overlayRef.current.plObjects), true
        );
        if (hits.length > 0) {
          const obj = hits[0].object;
          if (obj.userData.simId) onSimEvent(obj.userData.simType, obj.userData.simId);
        }
      });

      // Animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        animId = requestAnimationFrame(animate);
        const t = clock.getElapsedTime();
        // Animate particles
        overlayRef.current.particles.forEach(p => {
          p.position.y += 0.03;
          p.material.opacity = 0.8 - ((p.position.y - p.userData.baseY) / 1.5);
          if (p.position.y > p.userData.baseY + 1.2) {
            p.position.y = p.userData.baseY;
            p.material.opacity = 0.8;
          }
          // Light flicker for active lights
          if (p.userData.isLight) {
            p.material.opacity = 0.7 + 0.3 * Math.sin(t * 8 + p.userData.phase);
          }
        });
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Resize
      const onResize = () => {
        const W2 = container.clientWidth, H2 = container.clientHeight;
        camera.aspect = W2/H2; camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
      };
      window.addEventListener('resize', onResize);

      threeRef.current = { THREE, scene, camera, renderer, controls };
    };

    init().catch(console.error);
    return () => {
      cancelAnimationFrame(animId);
      const { renderer } = threeRef.current;
      if (renderer) {
        renderer.dispose();
        if (mountRef.current?.contains(renderer.domElement))
          mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, [modelUrl]);

  // ── Rebuild overlays whenever simMode or engine state changes ─────────────
  useEffect(() => {
    const { THREE, scene } = threeRef.current;
    if (!THREE || !scene) return;

    // Clear old overlays
    overlayRef.current.elObjects.forEach(o => scene.remove(o));
    overlayRef.current.plObjects.forEach(o => scene.remove(o));
    overlayRef.current.particles.forEach(o => scene.remove(o));
    overlayRef.current = { elObjects: [], plObjects: [], particles: [] };

    if (!simMode) return;

    if (simMode === 'electrical' && elEngine) {
      buildElectricalOverlay(THREE, scene, elEngine);
    }
    if (simMode === 'plumbing' && plEngine) {
      buildPlumbingOverlay(THREE, scene, plEngine);
    }
  }, [simMode, elEngine, plEngine]);

  // ── Electrical overlay builder ────────────────────────────────────────────
  const buildElectricalOverlay = (THREE, scene, engine) => {
    const objs = [];
    const particles = [];

    Object.values(engine.circuits).forEach(circuit => {
      const { x, z, w, d } = circuit;

      // Wire from main panel to switches (yellow lines)
      circuit.switches.forEach(sw => {
        const points = [
          new THREE.Vector3(x,        1.1, z),
          new THREE.Vector3(sw.wx,    1.1, sw.wz),
          new THREE.Vector3(sw.wx,    sw.wy, sw.wz),
        ];
        const geo  = new THREE.BufferGeometry().setFromPoints(points);
        const mat  = new THREE.LineBasicMaterial({ color: sw.isOn ? 0xffee00 : 0x444400, linewidth: 2 });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        objs.push(line);

        // Switch box
        const swGeo  = new THREE.BoxGeometry(0.18, 0.12, 0.05);
        const swMat  = new THREE.MeshStandardMaterial({
          color: sw.isOn ? 0xffdd00 : 0x222222,
          emissive: sw.isOn ? 0xffaa00 : 0x000000,
          emissiveIntensity: sw.isOn ? 0.8 : 0,
        });
        const swMesh = new THREE.Mesh(swGeo, swMat);
        swMesh.position.set(sw.wx, sw.wy, sw.wz);
        swMesh.userData = { simType: 'switch', simId: sw.id };
        scene.add(swMesh);
        objs.push(swMesh);

        // Switch label sprite
        const swLabel = makeTextSprite(THREE, sw.label, sw.isOn ? '#ffdd00' : '#888888');
        swLabel.position.set(sw.wx, sw.wy + 0.25, sw.wz);
        scene.add(swLabel);
        objs.push(swLabel);
      });

      // Wire from switch to lights
      circuit.lights.forEach(lt => {
        const sw = circuit.switches.find(s => s.id === lt.connectedTo);
        if (sw) {
          const points = [
            new THREE.Vector3(sw.wx, sw.wy, sw.wz),
            new THREE.Vector3(lt.wx, sw.wy, lt.wz),
            new THREE.Vector3(lt.wx, lt.wy,  lt.wz),
          ];
          const geo  = new THREE.BufferGeometry().setFromPoints(points);
          const mat  = new THREE.LineBasicMaterial({ color: lt.isOn ? 0xffee00 : 0x333300 });
          const line = new THREE.Line(geo, mat);
          scene.add(line);
          objs.push(line);
        }

        // Light bulb mesh
        const ltGeo  = new THREE.SphereGeometry(0.12, 8, 8);
        const ltMat  = new THREE.MeshStandardMaterial({
          color:             lt.isOn ? 0xfffacc : 0x444444,
          emissive:          lt.isOn ? 0xffee88 : 0x000000,
          emissiveIntensity: lt.isOn ? 1.2 : 0,
          transparent: true,
          opacity: lt.isOn ? 1.0 : 0.5,
        });
        const ltMesh = new THREE.Mesh(ltGeo, ltMat);
        ltMesh.position.set(lt.wx, lt.wy, lt.wz);
        ltMesh.userData = { simType: 'light', simId: lt.id };
        scene.add(ltMesh);
        objs.push(ltMesh);

        // Point light when ON
        if (lt.isOn) {
          const ptLight = new THREE.PointLight(0xfff5cc, 1.5, 6);
          ptLight.position.set(lt.wx, lt.wy - 0.2, lt.wz);
          scene.add(ptLight);
          objs.push(ptLight);

          // Glow particle
          const pGeo = new THREE.SphereGeometry(0.25, 6, 6);
          const pMat = new THREE.MeshBasicMaterial({ color: 0xffee44, transparent: true, opacity: 0.35 });
          const p    = new THREE.Mesh(pGeo, pMat);
          p.position.set(lt.wx, lt.wy, lt.wz);
          p.userData = { baseY: lt.wy, isLight: true, phase: Math.random()*Math.PI*2 };
          scene.add(p);
          particles.push(p);
          objs.push(p);
        }
      });

      // Sockets (small grey boxes)
      circuit.sockets.forEach(sk => {
        const skGeo  = new THREE.BoxGeometry(0.1, 0.08, 0.04);
        const skMat  = new THREE.MeshStandardMaterial({ color: 0x555566 });
        const skMesh = new THREE.Mesh(skGeo, skMat);
        skMesh.position.set(sk.wx, sk.wy, sk.wz);
        scene.add(skMesh);
        objs.push(skMesh);
      });
    });

    overlayRef.current.elObjects  = objs;
    overlayRef.current.particles  = particles;
  };

  // ── Plumbing overlay builder ──────────────────────────────────────────────
  const buildPlumbingOverlay = (THREE, scene, engine) => {
    const objs      = [];
    const particles = [];

    Object.values(engine.systems).forEach(system => {
      // Main valve
      if (system.mainValve) {
        const mv    = system.mainValve;
        const vGeo  = new THREE.CylinderGeometry(0.1, 0.1, 0.15, 8);
        const vMat  = new THREE.MeshStandardMaterial({
          color:   mv.isOpen ? 0x00aaff : 0x003366,
          emissive: mv.isOpen ? 0x004488 : 0x000000,
        });
        const vMesh = new THREE.Mesh(vGeo, vMat);
        vMesh.position.set(...mv.worldPos);
        vMesh.userData = { simType: 'valve', simId: system.roomId + '_0' };
        scene.add(vMesh);
        objs.push(vMesh);
      }

      // Pipes (blue lines)
      system.pipes.forEach(pipe => {
        const points = pipe.worldPath.map(([px,py,pz]) => new THREE.Vector3(px, py, pz));
        const geo    = new THREE.BufferGeometry().setFromPoints(points);
        const mat    = new THREE.LineBasicMaterial({
          color: pipe.isActive ? 0x00ccff : 0x003355,
          linewidth: 2,
        });
        const line = new THREE.Line(geo, mat);
        scene.add(line);
        objs.push(line);

        // Water flow particles along pipe when active
        if (pipe.isActive) {
          for (let i = 0; i < 4; i++) {
            const t   = i / 4;
            const idx = Math.floor(t * (points.length - 1));
            const pt  = points[Math.min(idx, points.length-1)];
            const pGeo = new THREE.SphereGeometry(0.06, 6, 6);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x44ddff, transparent: true, opacity: 0.8 });
            const p    = new THREE.Mesh(pGeo, pMat);
            p.position.copy(pt);
            p.userData = { baseY: pt.y, isLight: false, phase: i * 0.5 };
            scene.add(p);
            particles.push(p);
            objs.push(p);
          }
        }
      });

      // Fixtures (tap/shower meshes)
      system.fixtures.forEach(fx => {
        const fxGeo  = new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8);
        const fxMat  = new THREE.MeshStandardMaterial({
          color:             fx.isOpen ? 0x00eeff : 0x445566,
          emissive:          fx.isOpen ? 0x00aabb : 0x000000,
          emissiveIntensity: fx.isOpen ? 0.6 : 0,
          metalness: 0.7, roughness: 0.3,
        });
        const fxMesh = new THREE.Mesh(fxGeo, fxMat);
        fxMesh.position.set(...fx.worldPos);
        fxMesh.userData = { simType: 'fixture', simId: fx.id };
        scene.add(fxMesh);
        objs.push(fxMesh);

        // Label
        const label = makeTextSprite(THREE, fx.label, fx.isOpen ? '#00eeff' : '#445566');
        label.position.set(fx.worldPos[0], fx.worldPos[1] + 0.3, fx.worldPos[2]);
        scene.add(label);
        objs.push(label);

        // Water drop particles when flowing
        if (fx.isFlowing) {
          for (let i = 0; i < 5; i++) {
            const pGeo = new THREE.SphereGeometry(0.04, 5, 5);
            const pMat = new THREE.MeshBasicMaterial({ color: 0x44aaff, transparent: true, opacity: 0.8 });
            const p    = new THREE.Mesh(pGeo, pMat);
            p.position.set(
              fx.worldPos[0] + (Math.random()-0.5)*0.1,
              fx.worldPos[1] - i * 0.18,
              fx.worldPos[2] + (Math.random()-0.5)*0.1,
            );
            p.userData = { baseY: fx.worldPos[1] - 0.1, isLight: false };
            scene.add(p);
            particles.push(p);
            objs.push(p);
          }
        }
      });
    });

    overlayRef.current.plObjects  = objs;
    overlayRef.current.particles  = [...overlayRef.current.particles, ...particles];
  };

  // ── Text sprite helper ────────────────────────────────────────────────────
  const makeTextSprite = (THREE, text, color = '#ffffff') => {
    const canvas  = document.createElement('canvas');
    canvas.width  = 256; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, 256, 64);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(text, 128, 40);
    const texture = new THREE.CanvasTexture(canvas);
    const mat     = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite  = new THREE.Sprite(mat);
    sprite.scale.set(1.2, 0.3, 1);
    return sprite;
  };

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: SCREEN_H * 0.55, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
    />
  );
}

// ── Simulation Panel ───────────────────────────────────────────────────────
function SimPanel({ simMode, elEngine, plEngine, onToggleSwitch, onToggleFixture, onAllOff, onAllOn }) {
  if (!simMode) return null;

  if (simMode === 'electrical' && elEngine) {
    const circuits = elEngine.getState();
    return (
      <ScrollView style={sp.panel} showsVerticalScrollIndicator={false}>
        <View style={sp.header}>
          <Text style={sp.headerText}>💡 Electrical Controls</Text>
          <View style={sp.headerBtns}>
            <TouchableOpacity style={sp.allBtn} onPress={onAllOn}>
              <Text style={sp.allBtnText}>All ON</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[sp.allBtn, sp.allBtnOff]} onPress={onAllOff}>
              <Text style={sp.allBtnText}>All OFF</Text>
            </TouchableOpacity>
          </View>
        </View>
        {Object.entries(circuits).map(([key, circuit]) => (
          <View key={key} style={sp.roomSection}>
            <Text style={sp.roomTitle}>
              {circuit.roomLabel} — {circuit.roomId}
            </Text>
            {circuit.switches.map(sw => (
              <TouchableOpacity
                key={sw.id}
                style={[sp.switchRow, sw.isOn && sp.switchRowOn]}
                onPress={() => onToggleSwitch(sw.id)}
              >
                <Text style={sp.switchIcon}>{sw.isOn ? '🟡' : '⚫'}</Text>
                <Text style={[sp.switchLabel, sw.isOn && sp.switchLabelOn]}>{sw.label}</Text>
                <View style={[sp.toggleBtn, sw.isOn && sp.toggleBtnOn]}>
                  <Text style={sp.toggleBtnText}>{sw.isOn ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={sp.lightsRow}>
              {circuit.lights.map(lt => (
                <View key={lt.id} style={[sp.lightChip, lt.isOn && sp.lightChipOn]}>
                  <Text style={sp.lightChipText}>{lt.isOn ? '💡' : '🔦'} {lt.label}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  if (simMode === 'plumbing' && plEngine) {
    const systems = plEngine.getState();
    const hasAny  = Object.keys(systems).length > 0;
    return (
      <ScrollView style={sp.panel} showsVerticalScrollIndicator={false}>
        <View style={sp.header}>
          <Text style={sp.headerText}>🚿 Plumbing Controls</Text>
          <TouchableOpacity style={[sp.allBtn, sp.allBtnOff]} onPress={onAllOff}>
            <Text style={sp.allBtnText}>Close All</Text>
          </TouchableOpacity>
        </View>
        {!hasAny && (
          <View style={sp.emptyMsg}>
            <Text style={sp.emptyMsgText}>No plumbing fixtures in selected rooms.</Text>
          </View>
        )}
        {Object.entries(systems).map(([key, system]) => (
          <View key={key} style={sp.roomSection}>
            <Text style={sp.roomTitle}>{system.roomLabel} — Plumbing</Text>
            {system.fixtures.map(fx => (
              <TouchableOpacity
                key={fx.id}
                style={[sp.switchRow, fx.isOpen && sp.switchRowWater]}
                onPress={() => onToggleFixture(fx.id)}
              >
                <Text style={sp.switchIcon}>{fx.isOpen ? '💧' : '🔒'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[sp.switchLabel, fx.isOpen && sp.switchLabelWater]}>{fx.label}</Text>
                  <Text style={sp.flowRate}>{fx.flowRate} L/min</Text>
                </View>
                <View style={[sp.toggleBtn, fx.isOpen && sp.toggleBtnWater]}>
                  <Text style={sp.toggleBtnText}>{fx.isOpen ? 'OPEN' : 'CLOSED'}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    );
  }

  return null;
}

const sp = StyleSheet.create({
  panel:       { maxHeight: 200, backgroundColor: '#0d1f33', paddingHorizontal: 12, paddingTop: 4 },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  headerText:  { color: '#fff', fontWeight: '800', fontSize: 14 },
  headerBtns:  { flexDirection: 'row', gap: 8 },
  allBtn:      { backgroundColor: '#e94560', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  allBtnOff:   { backgroundColor: '#334466' },
  allBtnText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  roomSection: { marginBottom: 10 },
  roomTitle:   { color: '#64ffda', fontSize: 11, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#162030',
    borderRadius: 8, padding: 8, marginBottom: 4, gap: 8,
    borderWidth: 1, borderColor: '#1e3050',
  },
  switchRowOn:    { backgroundColor: '#1a2a10', borderColor: '#ffee00' },
  switchRowWater: { backgroundColor: '#0a2035', borderColor: '#00ccff' },
  switchIcon:     { fontSize: 16 },
  switchLabel:    { flex: 1, color: '#aaa', fontSize: 12, fontWeight: '600' },
  switchLabelOn:  { color: '#ffee00' },
  switchLabelWater:{ color: '#00ccff' },
  flowRate:       { color: '#556677', fontSize: 10, marginTop: 2 },
  toggleBtn:      { backgroundColor: '#333', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3 },
  toggleBtnOn:    { backgroundColor: '#e6aa00' },
  toggleBtnWater: { backgroundColor: '#0088bb' },
  toggleBtnText:  { color: '#fff', fontSize: 10, fontWeight: '800' },
  lightsRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  lightChip:      { backgroundColor: '#1a1a1a', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  lightChipOn:    { backgroundColor: '#3a3300' },
  lightChipText:  { color: '#888', fontSize: 10 },
  emptyMsg:       { padding: 16, alignItems: 'center' },
  emptyMsgText:   { color: '#556677', fontSize: 12 },
});

// ── Main ModelViewerScreen ─────────────────────────────────────────────────
export default function ModelViewerScreen({ navigation, route }) {
  const { designId, rooms = [], projectName = 'My House', style = 'modern' } = route?.params || {};

  const [loading, setLoading]   = useState(true);
  const [modelUrl, setModelUrl] = useState(null);
  const [error, setError]       = useState('');
  const [simMode, setSimMode]   = useState(null);
  const [, forceUpdate]         = useState(0);

  // Build room layout for simulation engines
  const roomLayout = buildRoomLayout(rooms);

  // Initialize engines (stable refs)
  const elEngineRef = useRef(null);
  const plEngineRef = useRef(null);

  if (!elEngineRef.current && roomLayout.length > 0) {
    elEngineRef.current = new ElectricalEngine(roomLayout);
  }
  if (!plEngineRef.current && roomLayout.length > 0) {
    plEngineRef.current = new PlumbingEngine(roomLayout);
  }

  useEffect(() => { fetchModel(); }, []);

  const fetchModel = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BASE_URL}/models/generate`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer dev_token' },
        body:    JSON.stringify({ design_id: designId, rooms }),
      });
      const data = await res.json();
      setModelUrl(res.ok ? `${BASE_URL}${data.model_url}` : `${BASE_URL}/models/sample/sample_3bed`);
    } catch {
      setModelUrl(`${BASE_URL}/models/sample/sample_3bed`);
    } finally {
      setLoading(false);
    }
  };

  // ── Simulation event handlers ──────────────────────────────────────────────
  const handleSimEvent = (type, id) => {
    if (type === 'switch') handleToggleSwitch(id);
    if (type === 'fixture') handleToggleFixture(id);
  };

  const handleToggleSwitch = (switchId) => {
    elEngineRef.current?.toggleSwitch(switchId);
    forceUpdate(n => n + 1);
  };

  const handleToggleFixture = (fixtureId) => {
    plEngineRef.current?.toggleFixture(fixtureId);
    forceUpdate(n => n + 1);
  };

  const handleElAllOn  = () => { elEngineRef.current?.allOn();  forceUpdate(n => n + 1); };
  const handleElAllOff = () => { elEngineRef.current?.allOff(); forceUpdate(n => n + 1); };
  const handlePlAllOff = () => { plEngineRef.current?.allOff(); forceUpdate(n => n + 1); };

  const ROOM_COLORS = {
    bedroom:'#87CEEB', kitchen:'#FAD787', washroom:'#87FAD0',
    lounge:'#FABA87',  dining:'#DE87FA',  garage:'#BEBEBE',
    garden:'#87FA87',  office:'#FA8787',
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={s.topTitle}>{projectName}</Text>
          <Text style={s.topSub}>{style.charAt(0).toUpperCase() + style.slice(1)} Style</Text>
        </View>
        <TouchableOpacity style={s.regenBtn} onPress={fetchModel}>
          <Text style={s.regenBtnText}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* 3D Viewer */}
      <View style={s.viewerWrapper}>
        {loading ? (
          <View style={s.loadingBox}>
            <ActivityIndicator size="large" color="#64ffda" />
            <Text style={s.loadingText}>Generating 3D Model...</Text>
          </View>
        ) : error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠️ {error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={fetchModel}>
              <Text style={s.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : Platform.OS === 'web' ? (
          <WebViewer
            modelUrl={modelUrl}
            rooms={rooms}
            simMode={simMode}
            elEngine={elEngineRef.current}
            plEngine={plEngineRef.current}
            onSimEvent={handleSimEvent}
          />
        ) : (
          <MobileViewer modelUrl={modelUrl} />
        )}
      </View>

      {/* Simulation mode toggle */}
      <View style={s.simBar}>
        <TouchableOpacity
          style={[s.simBtn, simMode === 'electrical' && s.simBtnElActive]}
          onPress={() => setSimMode(simMode === 'electrical' ? null : 'electrical')}
        >
          <Text style={s.simBtnIcon}>💡</Text>
          <Text style={s.simBtnText}>Electrical</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.simBtn, simMode === 'plumbing' && s.simBtnPlActive]}
          onPress={() => setSimMode(simMode === 'plumbing' ? null : 'plumbing')}
        >
          <Text style={s.simBtnIcon}>🚿</Text>
          <Text style={s.simBtnText}>Plumbing</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.simBtn, !simMode && s.simBtnOff]}
          onPress={() => setSimMode(null)}
        >
          <Text style={s.simBtnIcon}>🏠</Text>
          <Text style={s.simBtnText}>3D View</Text>
        </TouchableOpacity>
      </View>

      {/* Simulation Panel */}
      <SimPanel
        simMode={simMode}
        elEngine={elEngineRef.current}
        plEngine={plEngineRef.current}
        onToggleSwitch={handleToggleSwitch}
        onToggleFixture={handleToggleFixture}
        onAllOn={handleElAllOn}
        onAllOff={simMode === 'electrical' ? handleElAllOff : handlePlAllOff}
      />

      {/* Room pills */}
      <View style={s.roomListSection}>
        <Text style={s.roomListTitle}>Rooms</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.roomList}>
            {rooms.map((room, i) => (
              <View key={i} style={[s.roomPill, { backgroundColor: ROOM_COLORS[room.id] || '#ddd' }]}>
                <Text style={s.roomPillText}>{room.label} ×{room.count}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2EFE9' },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#4A3728', paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn:     { padding: 4 },
  backBtnText: { color: '#a8b2d8', fontSize: 14, fontWeight: '600' },
  topTitle:    { color: '#fff', fontSize: 15, fontWeight: '800' },
  topSub:      { color: '#64ffda', fontSize: 11 },
  regenBtn:    { backgroundColor: '#e94560', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  regenBtnText:{ color: '#fff', fontSize: 18, fontWeight: '800' },

  viewerWrapper: { backgroundColor: '#F2EFE9' },
  loadingBox:    { height: SCREEN_H * 0.45, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2EFE9' },
  loadingText:   { color: '#6A5A4A', marginTop: 12, fontSize: 14 },
  errorBox:      { height: SCREEN_H * 0.4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2EFE9' },
  errorText:     { color: '#B04030', fontSize: 13, marginBottom: 12 },
  retryBtn:      { backgroundColor: '#8B6F47', borderRadius: 8, paddingHorizontal: 20, paddingVertical: 8 },
  retryBtnText:  { color: '#fff', fontWeight: '700' },
  nativeMsg:     { height: 200, alignItems: 'center', justifyContent: 'center', padding: 20 },
  nativeMsgText: { color: '#fff', fontSize: 14, textAlign: 'center' },

  simBar: {
    flexDirection: 'row', backgroundColor: '#EDE8E0',
    paddingHorizontal: 12, paddingVertical: 8, gap: 8,
    borderTopWidth: 1, borderTopColor: '#D0C8BC',
  },
  simBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F8F4EE', borderRadius: 10, padding: 8, gap: 5,
    borderWidth: 1, borderColor: '#C8BFB0',
  },
  simBtnElActive: { backgroundColor: '#3A2E00', borderColor: '#D4AA00' },
  simBtnPlActive: { backgroundColor: '#002040', borderColor: '#0088CC' },
  simBtnOff:      { backgroundColor: '#4A3728', borderColor: '#8B6F47' },
  simBtnIcon:     { fontSize: 14 },
  simBtnText:     { color: '#5A4A3A', fontWeight: '600', fontSize: 11 },

  roomListSection: { backgroundColor: '#EDE8E0', paddingHorizontal: 12, paddingVertical: 8 },
  roomListTitle:   { color: '#8A7A6A', fontSize: 10, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  roomList:        { flexDirection: 'row', gap: 6 },
  roomPill:        { borderRadius: 14, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#C0B8A8' },
  roomPillText:    { fontSize: 11, fontWeight: '700', color: '#2A1F14' },
});
