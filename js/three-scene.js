/**
 * DemandIQ Smart Restock - Interactive 3D Warehouse & Inventory Digital Twin
 * Powered by Three.js WebGL & Raycasting Micro-Interactions
 */

(function () {
  'use strict';

  const container = document.getElementById('three-container');
  if (!container) return;

  // Scene, Camera, Renderer
  let scene, camera, renderer, controls;
  let cratesGroup, warehouseGroup, laserBeam, particlesSystem;
  let isExploded = false;
  let isWireframe = false;
  let autoRotate = true;
  let hoveredObject = null;
  const interactiveCrates = [];

  const tooltipEl = document.getElementById('three-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipSku = document.getElementById('tooltip-sku');
  const tooltipStock = document.getElementById('tooltip-stock');
  const tooltipBadge = document.getElementById('tooltip-badge');

  // Palette matching PRD
  const COLORS = {
    critical: 0xEF4444,
    soon: 0xF59E0B,
    ok: 0x10B981,
    overstock: 0x3B82F6,
    floor: 0x080D1A,
    grid: 0x1E293B,
    rack: 0x334155,
    cyan: 0x06B6D4,
    emerald: 0x10B981
  };

  // Sample SKU data for 3D crates
  const CRATE_DATA = [
    { sku: 'PANJABI-001', name: 'Premium Cotton Panjabi White', stock: 4, cover: '1.8 Days', status: 'critical', label: 'জরুরি — স্টক শেষ হবে', action: 'Order 45 units today', color: COLORS.critical },
    { sku: 'SAREE-002', name: 'Dhakai Jamdani Saree Crimson', stock: 2, cover: '2.4 Days', status: 'critical', label: 'জরুরি — স্টক শেষ হবে', action: 'Order 15 units today', color: COLORS.critical },
    { sku: 'KABLI-006', name: 'Royal Kabli Suit Charcoal', stock: 5, cover: '5.2 Days', status: 'soon', label: 'এই সপ্তাহে অর্ডার করুন', action: 'Order 20 units by Friday', color: COLORS.soon },
    { sku: 'KURTI-003', name: 'Floral Embroidered Kurti', stock: 14, cover: '6.5 Days', status: 'soon', label: 'এই সপ্তাহে অর্ডার করুন', action: 'Order 30 units soon', color: COLORS.soon },
    { sku: 'POLO-004', name: 'Classic Pique Polo Navy', stock: 78, cover: '42 Days', status: 'ok', label: 'সব ঠিক আছে', action: 'Healthy coverage', color: COLORS.ok },
    { sku: 'JEANS-007', name: 'Slim Stretch Denim Jeans', stock: 65, cover: '48 Days', status: 'ok', label: 'সব ঠিক আছে', action: 'Healthy coverage', color: COLORS.ok },
    { sku: 'TSHIRT-005', name: 'Urban Graphic Tee Olive', stock: 165, cover: '140 Days', status: 'overstock', label: 'বেশি স্টক (আটকে থাকা টাকা)', action: '৳48,000 cash locked. Run clearance promo', color: COLORS.overstock },
    { sku: 'WINTER-010', name: 'Warm Fleece Hoodie Grey', stock: 88, cover: '180 Days', status: 'overstock', label: 'বেশি স্টক (আটকে থাকা টাকা)', action: '৳35,000 tied up. Discount suggested', color: COLORS.overstock },
  ];

  function init() {
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene setup
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070B14, 0.025);

    // 2. Camera setup (Isometric perspective)
    camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(24, 20, 24);

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.maxPolarAngle = Math.PI / 2.05; // don't go below ground
      controls.minDistance = 12;
      controls.maxDistance = 50;
      controls.target.set(0, 2, 0);
    }

    // 5. Lighting
    buildLighting();

    // 6. World geometry
    warehouseGroup = new THREE.Group();
    cratesGroup = new THREE.Group();

    buildWarehouseFloor();
    buildStorageRacks();
    buildInteractiveCrates();
    buildLaserScanner();
    buildDataParticleStream();

    warehouseGroup.add(cratesGroup);
    scene.add(warehouseGroup);

    // 7. Event Listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('mousemove', onPointerMove);
    renderer.domElement.addEventListener('click', onPointerClick);
    setupHUDButtons();
    setupScrollTriggerSync();

    // 8. Animation Loop
    animate();
  }

  function buildLighting() {
    const ambientLight = new THREE.AmbientLight(0x94A3B8, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.3);
    dirLight.position.set(15, 25, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    // Accent Cyber Point Lights
    const cyanLight = new THREE.PointLight(COLORS.cyan, 2.5, 30);
    cyanLight.position.set(-8, 6, -8);
    scene.add(cyanLight);

    const emeraldLight = new THREE.PointLight(COLORS.emerald, 2.2, 30);
    emeraldLight.position.set(8, 7, 8);
    scene.add(emeraldLight);

    const redBeacon = new THREE.PointLight(COLORS.critical, 1.8, 15);
    redBeacon.position.set(-3, 3, 3);
    scene.add(redBeacon);
  }

  function buildWarehouseFloor() {
    // Floor plane
    const floorGeo = new THREE.PlaneGeometry(60, 60);
    const floorMat = new THREE.MeshStandardMaterial({
      color: COLORS.floor,
      roughness: 0.25,
      metalness: 0.8
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.02;
    floor.receiveShadow = true;
    warehouseGroup.add(floor);

    // Cyber Grid on floor
    const gridHelper = new THREE.GridHelper(50, 50, 0x06B6D4, 0x1E293B);
    gridHelper.position.y = 0;
    warehouseGroup.add(gridHelper);

    // Circular Holographic Platform Ring
    const ringGeo = new THREE.RingGeometry(11, 11.2, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10B981, side: THREE.DoubleSide, transparent: true, opacity: 0.6 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    warehouseGroup.add(ring);

    const outerRingGeo = new THREE.RingGeometry(16, 16.15, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, side: THREE.DoubleSide, transparent: true, opacity: 0.35 });
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
    outerRing.rotation.x = -Math.PI / 2;
    outerRing.position.y = 0.02;
    warehouseGroup.add(outerRing);
  }

  function buildStorageRacks() {
    const rackMat = new THREE.MeshStandardMaterial({
      color: COLORS.rack,
      metalness: 0.85,
      roughness: 0.3
    });

    // Create 4 isometric warehouse aisles/shelves
    const shelfPositions = [
      { x: -5, z: -4 },
      { x: -5, z: 4 },
      { x: 5, z: -4 },
      { x: 5, z: 4 }
    ];

    shelfPositions.forEach((pos) => {
      const rackGroup = new THREE.Group();
      rackGroup.position.set(pos.x, 0, pos.z);

      // Vertical upright pillars
      const pillarGeo = new THREE.BoxGeometry(0.2, 6, 0.2);
      const p1 = new THREE.Mesh(pillarGeo, rackMat); p1.position.set(-2, 3, -1);
      const p2 = new THREE.Mesh(pillarGeo, rackMat); p2.position.set(2, 3, -1);
      const p3 = new THREE.Mesh(pillarGeo, rackMat); p3.position.set(-2, 3, 1);
      const p4 = new THREE.Mesh(pillarGeo, rackMat); p4.position.set(2, 3, 1);
      [p1, p2, p3, p4].forEach(p => { p.castShadow = true; rackGroup.add(p); });

      // Horizontal shelves (3 levels)
      const beamGeo = new THREE.BoxGeometry(4.2, 0.15, 2.2);
      for (let level = 1; level <= 3; level++) {
        const beam = new THREE.Mesh(beamGeo, rackMat);
        beam.position.set(0, level * 1.8, 0);
        beam.castShadow = true;
        beam.receiveShadow = true;
        rackGroup.add(beam);
      }

      warehouseGroup.add(rackGroup);
    });
  }

  function buildInteractiveCrates() {
    const boxGeo = new THREE.BoxGeometry(1.2, 1.0, 1.2);

    // Positions on shelves
    const slotOffsets = [
      // Left aisle 1 (Critical zone)
      { x: -6, y: 2.4, z: -4.5, dataIdx: 0 },
      { x: -4, y: 2.4, z: -4.5, dataIdx: 1 },
      // Left aisle 2 (Soon zone)
      { x: -6, y: 4.2, z: 3.5, dataIdx: 2 },
      { x: -4, y: 2.4, z: 3.5, dataIdx: 3 },
      // Right aisle 1 (Healthy OK zone)
      { x: 4, y: 2.4, z: -4.5, dataIdx: 4 },
      { x: 6, y: 4.2, z: -4.5, dataIdx: 5 },
      // Right aisle 2 (Overstock zone)
      { x: 4, y: 2.4, z: 4.5, dataIdx: 6 },
      { x: 6, y: 2.4, z: 4.5, dataIdx: 7 },
    ];

    slotOffsets.forEach((slot, index) => {
      const data = CRATE_DATA[slot.dataIdx % CRATE_DATA.length];

      // Glassy / Hi-tech Crate Material
      const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.2,
        metalness: 0.6,
        transparent: true,
        opacity: 0.92,
        emissive: data.color,
        emissiveIntensity: 0.25
      });

      const mesh = new THREE.Mesh(boxGeo, mat);
      mesh.position.set(slot.x, slot.y, slot.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      // Base home position for explode toggle
      mesh.userData = {
        ...data,
        homePos: mesh.position.clone(),
        explodedPos: new THREE.Vector3(slot.x * 1.6, slot.y * 1.3 + 1.2, slot.z * 1.6),
        originalColor: data.color,
        targetY: slot.y
      };

      // Add a status halo ring under the crate
      const ringGeo = new THREE.RingGeometry(0.8, 0.95, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: data.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = -0.48;
      mesh.add(ring);

      // Glowing beacon antenna
      const beaconGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.4);
      const beaconMat = new THREE.MeshBasicMaterial({ color: data.color });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.set(0, 0.6, 0);
      mesh.add(beacon);

      const bulbGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const bulb = new THREE.Mesh(bulbGeo, beaconMat);
      bulb.position.set(0, 0.8, 0);
      mesh.add(bulb);

      cratesGroup.add(mesh);
      interactiveCrates.push(mesh);
    });
  }

  function buildLaserScanner() {
    // Horizontal scanning laser plane that sweeps up and down
    const planeGeo = new THREE.PlaneGeometry(16, 16);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    laserBeam = new THREE.Mesh(planeGeo, planeMat);
    laserBeam.rotation.x = -Math.PI / 2;
    laserBeam.position.y = 2;
    warehouseGroup.add(laserBeam);
  }

  function buildDataParticleStream() {
    const particleCount = 280;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const c1 = new THREE.Color(0x10B981);
    const c2 = new THREE.Color(0x06B6D4);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 24;
      positions[i * 3 + 1] = Math.random() * 9 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 24;

      const mixed = c1.clone().lerp(c2, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending
    });

    particlesSystem = new THREE.Points(geometry, material);
    warehouseGroup.add(particlesSystem);
  }

  // Pointer Interaction
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function onPointerMove(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(interactiveCrates, false);

    if (intersects.length > 0) {
      const target = intersects[0].object;
      if (hoveredObject !== target) {
        if (hoveredObject) resetCrateHighlight(hoveredObject);
        hoveredObject = target;
        highlightCrate(hoveredObject);
      }
      showTooltip(event.clientX - rect.left, event.clientY - rect.top, target.userData);
    } else {
      if (hoveredObject) {
        resetCrateHighlight(hoveredObject);
        hoveredObject = null;
      }
      hideTooltip();
    }
  }

  function onPointerClick(event) {
    if (!hoveredObject) return;
    const data = hoveredObject.userData;

    // Trigger visual celebration wave
    const popTween = () => {
      hoveredObject.scale.set(1.35, 1.35, 1.35);
      setTimeout(() => hoveredObject.scale.set(1.15, 1.15, 1.15), 180);
    };
    popTween();

    // Trigger product modal in main UI if SKU matches
    if (window.DemandIQApp && typeof window.DemandIQApp.openProductModalBySku === 'function') {
      window.DemandIQApp.openProductModalBySku(data.sku);
    }
  }

  function highlightCrate(mesh) {
    mesh.material.emissiveIntensity = 0.85;
    mesh.scale.set(1.15, 1.15, 1.15);
  }

  function resetCrateHighlight(mesh) {
    mesh.material.emissiveIntensity = 0.25;
    mesh.scale.set(1, 1, 1);
  }

  function showTooltip(x, y, data) {
    if (!tooltipEl) return;
    tooltipTitle.textContent = data.name;
    tooltipSku.textContent = `${data.sku} • ${data.cover}`;
    tooltipStock.textContent = `Stock: ${data.stock} units • Action: ${data.action}`;
    tooltipBadge.textContent = data.label;
    tooltipBadge.style.backgroundColor = `${data.status === 'critical' ? 'rgba(239, 68, 68, 0.2)' : data.status === 'soon' ? 'rgba(245, 158, 11, 0.2)' : data.status === 'ok' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`;
    tooltipBadge.style.color = `#${data.color.toString(16).padStart(6, '0')}`;

    tooltipEl.style.left = `${x}px`;
    tooltipEl.style.top = `${y}px`;
    tooltipEl.style.display = 'block';
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  // HUD Control Buttons
  function setupHUDButtons() {
    const btnRotate = document.getElementById('btn-3d-rotate');
    const btnExplode = document.getElementById('btn-3d-explode');
    const btnWireframe = document.getElementById('btn-3d-wireframe');
    const btnReset = document.getElementById('btn-3d-reset');

    if (btnRotate) {
      btnRotate.addEventListener('click', () => {
        autoRotate = !autoRotate;
        btnRotate.classList.toggle('active', autoRotate);
      });
    }

    if (btnExplode) {
      btnExplode.addEventListener('click', () => {
        isExploded = !isExploded;
        btnExplode.classList.toggle('active', isExploded);
      });
    }

    if (btnWireframe) {
      btnWireframe.addEventListener('click', () => {
        isWireframe = !isWireframe;
        btnWireframe.classList.toggle('active', isWireframe);
        interactiveCrates.forEach(c => {
          c.material.wireframe = isWireframe;
        });
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        camera.position.set(24, 20, 24);
        if (controls) {
          controls.target.set(0, 2, 0);
          controls.update();
        }
      });
    }
  }

  // Scroll Synchronization for 3D Camera & Visual Storytelling
  function setupScrollTriggerSync() {
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(Math.max(scrollY / docHeight, 0), 1);

      // Subtle isometric orbit tilt based on scroll progress
      if (!isExploded) {
        const angle = progress * Math.PI * 1.2;
        const radius = 28 - progress * 4;
        camera.position.x = Math.sin(angle) * radius + 10;
        camera.position.z = Math.cos(angle) * radius + 10;
        camera.position.y = 20 - progress * 6;
      }
      lastScrollY = scrollY;
    }, { passive: true });
  }

  function onWindowResize() {
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  // Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Auto rotate warehouse when idle
    if (autoRotate && warehouseGroup) {
      warehouseGroup.rotation.y += 0.003;
    }

    // Laser beam vertical oscillation
    if (laserBeam) {
      laserBeam.position.y = 2.5 + Math.sin(elapsedTime * 1.5) * 1.8;
      laserBeam.rotation.z = Math.sin(elapsedTime * 0.5) * 0.05;
    }

    // Animated Crate positions (Smooth Explode Transition)
    interactiveCrates.forEach((crate) => {
      const targetPos = isExploded ? crate.userData.explodedPos : crate.userData.homePos;
      crate.position.lerp(targetPos, 0.08);

      // Gentle floating bob
      if (!isExploded) {
        crate.position.y = crate.userData.targetY + Math.sin(elapsedTime * 2 + crate.userData.homePos.x) * 0.08;
      }
    });

    // Animate Particles
    if (particlesSystem) {
      const positions = particlesSystem.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 1.5;
        if (positions[i] < 0.2) {
          positions[i] = 9.5;
        }
      }
      particlesSystem.geometry.attributes.position.needsUpdate = true;
    }

    if (controls) {
      controls.update();
    }

    renderer.render(scene, camera);
  }

  // Public method for tab sync
  window.ThreeWarehouse = {
    focusStatus: function (statusKey) {
      interactiveCrates.forEach(c => {
        if (c.userData.status === statusKey) {
          c.scale.set(1.3, 1.3, 1.3);
          c.material.emissiveIntensity = 1.0;
        } else {
          c.scale.set(0.85, 0.85, 0.85);
          c.material.emissiveIntensity = 0.1;
        }
      });
      setTimeout(() => {
        interactiveCrates.forEach(c => resetCrateHighlight(c));
      }, 2500);
    }
  };

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
