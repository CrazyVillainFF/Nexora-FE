import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uTilt;
  uniform float uStarSize;
  uniform float uTwinkle;
  uniform float uPointerStrength;
  uniform float uPointerActive;
  uniform float uRoll;
  uniform vec2 uPointer;
  uniform vec2 uDrag;
  attribute float aSize;
  attribute float aBrightness;
  attribute float aCore;
  attribute float aDustLane;
  varying float vBrightness;
  varying float vCore;
  varying float vTwinkle;
  varying float vDustLane;

  void main() {
    float rotation = uTime * uSpeed * 0.08;
    float cs = cos(rotation);
    float sn = sin(rotation);
    vec3 point = position;
    point.xy = mat2(cs, -sn, sn, cs) * point.xy;
    point.y *= cos(radians(uTilt));
    float rollAngle = radians(uRoll);
    point.xy = mat2(cos(rollAngle), -sin(rollAngle), sin(rollAngle), cos(rollAngle)) * point.xy;

    vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
    vec4 clipPosition = projectionMatrix * viewPosition;
    vec2 screenPosition = clipPosition.xy / clipPosition.w;
    vec2 fromPointer = screenPosition - uPointer;
    float distanceToPointer = length(fromPointer);
    float influence = uPointerActive * (1.0 - smoothstep(0.0, 0.58, distanceToPointer));
    vec2 tangent = normalize(vec2(-fromPointer.y, fromPointer.x) + vec2(0.0001));
    vec2 dragDirection = normalize(uDrag + vec2(0.0001));
    float wake = influence * uPointerStrength;
    screenPosition += tangent * wake * (0.1 + min(length(uDrag) * 0.18, 0.15));
    screenPosition += dragDirection * wake * min(length(uDrag) * 0.12, 0.07);
    clipPosition.xy = screenPosition * clipPosition.w;

    gl_Position = clipPosition;
    gl_PointSize = clamp(uStarSize * aSize * (7.0 / -viewPosition.z) * (1.0 + aCore * 2.5), 0.8, 7.0);
    vBrightness = aBrightness;
    vCore = aCore;
    vDustLane = aDustLane;
    vTwinkle = 1.0 - uTwinkle * 0.2 + uTwinkle * 0.2 * sin(uTime * (1.2 + aSize) + aBrightness * 28.0);
  }
`;

const fragmentShader = `
  uniform vec3 uArmColor;
  uniform vec3 uCoreColor;
  uniform float uIntensity;
  uniform float uShape;
  uniform float uGlow;
  uniform float uCoreBrightness;
  uniform float uDust;
  varying float vBrightness;
  varying float vCore;
  varying float vTwinkle;
  varying float vDustLane;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point) * 2.0;
    if (uShape > 0.5 && uShape < 1.5) radius = max(abs(point.x), abs(point.y)) * 2.0;
    if (uShape >= 1.5 && uShape < 2.5) radius = (abs(point.x) + abs(point.y)) * 1.4;
    if (uShape >= 2.5) radius = min(abs(point.x), abs(point.y)) * 2.0 + max(abs(point.x), abs(point.y)) * 0.8;
    float glow = exp(-radius * radius * 8.0);
    float core = smoothstep(0.02, 0.78, vCore) * clamp(uCoreBrightness, 0.0, 3.0);
    vec3 color = mix(uArmColor, uCoreColor, core * 0.86);
    color = mix(color, vec3(1.0), clamp(vBrightness * 0.3 + core * 0.3, 0.0, 0.68));
    float lane = smoothstep(0.25, 0.75, vDustLane);
    float alpha = glow * vBrightness * vTwinkle * uIntensity * (1.0 - lane * uDust * 0.25);
    gl_FragColor = vec4(color * (0.55 + glow * (0.8 + uGlow)), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const parseColor = (value, fallback) => {
  try { return new THREE.Color(value); } catch { return new THREE.Color(fallback); }
};

const BinaryOrbits = ({ arms = 3, speed = 0.75, density = 1, stars: starCount, color = '#7B4DFF', colors, backgroundColor = '#0A0A0A', mode = 'glow', core = '#FFC2EE', starSize = 1.6, sparkle = 0.5, intensity = 1, starShape = 'round', twist = 3.5, armStrength = 0.5, dust = 0.5, coreSize = 0.14, innerVoid = 0, thickness = 0.02, tilt = 62, roll = -8, scale = 1, centerX = 0.5, centerY = 0.52, twinkle = 0.35, depth = 0.4, glow = 0.45, pointerStrength = 1, wakeStrength = 1, interactive = true, hoverWake = true, paused = false, quality = 1, reducedMotion = false, className = '', style, children }) => {
  const containerRef = useRef(null);
  const armColor = colors?.[0] || color;
  const coreColor = colors?.[1] || (typeof core === 'string' ? core : '#FFC2EE');
  const coreBrightness = typeof core === 'number' ? core : 1;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    let renderer;
    let animationFrame = 0;
    let geometry;
    let material;
    let stars;
    let disposed = false;
    let width = 1;
    let height = 1;
    let pointerActive = 0;
    let targetPointerActive = 0;
    let previousPointer = { x: 0, y: 0 };
    const pointer = { x: 2, y: 2 };
    const drag = { x: 0, y: 0 };
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
    camera.position.z = 5;

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      container.dataset.webgl = 'unavailable';
      return undefined;
    }
    const clearColor = parseColor(backgroundColor, '#0A0A0A');
    renderer.setClearColor(clearColor, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * Math.max(0.25, Math.min(1, Number(quality) || 1)));
    renderer.domElement.setAttribute('aria-label', 'Touch and drag to swirl existing stars through their orbits');
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.style.touchAction = 'none';
    container.appendChild(renderer.domElement);
    container.dataset.webgl = 'ready';

    const resizeRenderer = () => {
      width = Math.max(1, container.clientWidth);
      height = Math.max(1, container.clientHeight);
      const aspect = width / height;
      const viewHeight = 5;
      camera.left = -viewHeight * aspect / 2;
      camera.right = viewHeight * aspect / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const createStars = () => {
      resizeRenderer();
      geometry?.dispose();
      material?.dispose();
      if (stars) scene.remove(stars);

      const count = Math.max(2000, Math.min(250000, Math.round(Number(starCount) || (70000 * Math.max(0.35, Number(density) || 1)))));
      const positions = new Float32Array(count * 3);
      const sizes = new Float32Array(count);
      const brightness = new Float32Array(count);
      const cores = new Float32Array(count);
      const dustLanes = new Float32Array(count);
      const armCount = Math.max(2, Number(arms) || 3);
      for (let i = 0; i < count; i += 1) {
        const progress = Math.pow(Math.random(), 0.72);
        const radius = Math.max(Number(innerVoid) * 1.72, 0.025 + progress * 1.72);
        const arm = i % armCount;
        // Keep the arms visible, but distribute stars broadly through the disc
        // so the galaxy reads as a luminous cloud rather than thin S-shaped bands.
        const armDefinition = Math.max(0, Math.min(1, Number(armStrength)));
        const scatter = (1 - armDefinition) * 0.34;
        const spread = (0.3 + progress * (0.62 + scatter)) * (Math.random() + Math.random() - 1);
        const angle = arm * Math.PI * 2 / armCount + progress * Number(twist) + spread;
        const looseDust = Math.random() < 0.13 ? (Math.random() - 0.5) * 0.7 : 0;
        const r = radius * (Math.random() < 0.07 ? 1.28 : 1);
        const spreadScale = Math.max(0.65, Number(scale) || 1);
        // The reference galaxy is wide and shallow, not a tall corkscrew.
        positions[i * 3] = (Math.cos(angle + looseDust) * r * 2.2 + (Number(centerX) - 0.5) * 3.8 * (width / height)) * spreadScale;
        positions[i * 3 + 1] = (Math.sin(angle + looseDust) * r * 1.48 + (0.52 - Number(centerY)) * 3.8) * spreadScale;
        positions[i * 3 + 2] = (Math.random() - 0.5) * Math.max(0.01, Number(thickness)) * (1 + (1 - progress) * Number(depth));
        sizes[i] = 0.48 + Math.random() * (0.5 + Math.max(0, Number(sparkle)) * 1.5);
        brightness[i] = (0.46 + Math.random() * (0.42 + Math.max(0, Number(sparkle)) * 0.12)) * (0.72 + (1 - progress) * 0.36) * (1 - Math.random() * Math.max(0, Number(dust)) * 0.32);
        cores[i] = Math.max(0, 1 - progress / Math.max(0.01, Number(coreSize)));
        dustLanes[i] = Math.random();
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
      geometry.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1));
      geometry.setAttribute('aCore', new THREE.BufferAttribute(cores, 1));
      geometry.setAttribute('aDustLane', new THREE.BufferAttribute(dustLanes, 1));
      const backgroundLuminance = clearColor.r * 0.2126 + clearColor.g * 0.7152 + clearColor.b * 0.0722;
      const useGlow = mode === 'glow' || (mode === 'auto' && backgroundLuminance < 0.5);
      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: useGlow ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: {
          uTime: { value: 0 },
          uSpeed: { value: reducedMotion || paused ? 0 : Number(speed) || 0 },
          uTilt: { value: Number(tilt) || 62 },
          uRoll: { value: Number(roll) || 0 },
          uStarSize: { value: Number(starSize) || 1.6 },
          uTwinkle: { value: Number(twinkle) || 0 },
          uPointerStrength: { value: (Number(pointerStrength) || 1) * (Number(wakeStrength) || 0) },
          uPointerActive: { value: 0 },
          uPointer: { value: new THREE.Vector2(2, 2) },
          uDrag: { value: new THREE.Vector2() },
          uArmColor: { value: parseColor(armColor, '#7B4DFF') },
          uCoreColor: { value: parseColor(coreColor, '#FFC2EE') },
          uIntensity: { value: Number(intensity) || 1 },
          uShape: { value: ({ round: 0, square: 1, diamond: 2, cross: 3 })[starShape] || 0 },
          uGlow: { value: Number(glow) || 0 },
          uCoreBrightness: { value: coreBrightness },
          uDust: { value: Number(dust) || 0 },
        },
        vertexShader,
        fragmentShader,
      });
      stars = new THREE.Points(geometry, material);
      scene.add(stars);
      container.dataset.orbitStars = String(count);
    };

    const point = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      drag.x = x - previousPointer.x;
      drag.y = y - previousPointer.y;
      pointer.x = x;
      pointer.y = y;
      previousPointer = { x, y };
      if (material) {
        material.uniforms.uPointer.value.set(pointer.x, pointer.y);
        material.uniforms.uDrag.value.set(drag.x, drag.y);
      }
    };
    const onDown = (event) => {
      if (!interactive) return;
      point(event);
      targetPointerActive = 1;
      try { renderer.domElement.setPointerCapture(event.pointerId); } catch { /* Pointer capture is not available in synthetic events. */ }
    };
    const onMove = (event) => {
      if (!interactive || !hoverWake) return;
      if (targetPointerActive || event.pointerType === 'mouse') {
        point(event);
        targetPointerActive = event.pointerType === 'mouse' ? (event.buttons ? 1 : 0) : 1;
      }
    };
    const onUp = () => { targetPointerActive = 0; };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    renderer.domElement.addEventListener('pointerup', onUp);
    renderer.domElement.addEventListener('pointercancel', onUp);

    const resizeObserver = new ResizeObserver(() => resizeRenderer());
    resizeObserver.observe(container);
    createStars();
    let lastTime = performance.now();
    const animate = (now) => {
      if (disposed) return;
      const delta = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      if (material) {
        material.uniforms.uTime.value += delta;
        pointerActive += (targetPointerActive - pointerActive) * (targetPointerActive ? 0.18 : 0.045);
        material.uniforms.uPointerActive.value = pointerActive;
        material.uniforms.uDrag.value.multiplyScalar(0.88);
        renderer.domElement.dataset.pointerActive = String(pointerActive > 0.03);
        renderer.domElement.dataset.reactedStars = String(Math.round(pointerActive * 800));
        renderer.domElement.dataset.orbitStars = container.dataset.orbitStars;
        renderer.render(scene, camera);
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      renderer.domElement.removeEventListener('pointerup', onUp);
      renderer.domElement.removeEventListener('pointercancel', onUp);
      scene.remove(stars);
      geometry?.dispose();
      material?.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, [arms, speed, density, starCount, armColor, coreColor, coreBrightness, backgroundColor, mode, starSize, sparkle, intensity, starShape, twist, armStrength, dust, coreSize, innerVoid, thickness, tilt, roll, scale, centerX, centerY, twinkle, depth, glow, pointerStrength, wakeStrength, interactive, hoverWake, paused, quality, reducedMotion]);

  return <div ref={containerRef} className={`satisfied-orbits ${className}`} style={{ '--orbit-background': backgroundColor, '--orbit-center-x': `${Number(centerX) * 100}%`, '--orbit-center-y': `${Number(centerY) * 100}%`, '--orbit-arm-color': armColor, '--orbit-core-color': coreColor, ...style }} aria-label="Interactive tilted spiral galaxy preview"><span className="satisfied-orbits__hint">Touch and drag to swirl the existing orbiting stars</span>{children}</div>;
};

export default BinaryOrbits;
