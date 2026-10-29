import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Timer,
  WebGLRenderer,
} from "three";
import { simplexNoise } from "./noise.glsl";

export interface HeroScene {
  /** Convergencia de partículas + crecimiento del blob; resuelve al terminar */
  playIntro(duration?: number): Promise<void>;
  dispose(): void;
}

const PARTICLES = 3200;

const blobVertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform float uPointer;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;
  ${simplexNoise}
  void main() {
    float n = snoise(position * 1.3 + vec3(0.0, uTime * 0.22, uTime * 0.12));
    float detail = snoise(position * 2.4 - uTime * 0.3) * 0.03;
    float amp = 0.22 + uPointer * 0.12;
    vec3 displaced = position + normal * (n * amp + detail) * uIntro;
    vNoise = n;
    vec4 mv = modelViewMatrix * vec4(displaced * uIntro, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

const blobFragment = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vView;
  varying float vNoise;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 2.2);
    vec3 violet = vec3(0.49, 0.36, 1.0);
    vec3 cyan = vec3(0.0, 0.83, 1.0);
    vec3 pink = vec3(1.0, 0.3, 0.55);
    float t = sin(vNoise * 2.4 + fresnel * 3.0 + uTime * 0.25) * 0.5 + 0.5;
    // el rosa queda como acento mínimo: sin él la iridiscencia se lee violeta/cian pura
    vec3 irid = mix(mix(violet, cyan, t), pink, smoothstep(0.55, 1.0, vNoise * 0.5 + 0.5) * 0.22);
    vec3 base = vec3(0.02, 0.015, 0.05);
    vec3 color = mix(base, irid, 0.12 + fresnel * 0.95);
    color += cyan * pow(fresnel, 5.0) * 0.6;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const particleVertex = /* glsl */ `
  uniform float uTime;
  uniform float uIntro;
  uniform float uPixelRatio;
  attribute vec3 aStart;
  attribute float aSeed;
  varying float vSeed;
  void main() {
    float t = smoothstep(0.0, 1.0, clamp(uIntro * 1.2 - aSeed * 0.2, 0.0, 1.0));
    vec3 p = mix(aStart, position, t);
    float angle = uTime * (0.05 + aSeed * 0.08);
    p.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * p.xz;
    p.y += sin(uTime * 0.6 + aSeed * 40.0) * 0.04;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (2.0 + aSeed * 3.5) * uPixelRatio * (6.0 / -mv.z);
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
  }
`;

const particleFragment = /* glsl */ `
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float alpha = smoothstep(0.5, 0.0, d);
    vec3 color = mix(vec3(0.49, 0.36, 1.0), vec3(0.0, 0.83, 1.0), vSeed);
    gl_FragColor = vec4(color, alpha * 0.75);
  }
`;

function buildParticles(count: number): BufferGeometry {
  const target = new Float32Array(count * 3);
  const start = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // dirección uniforme sobre la esfera (método de Marsaglia simplificado)
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const dir = [s * Math.cos(theta), u, s * Math.sin(theta)];
    const r = 1.7 + Math.pow(Math.random(), 2) * 2.2;
    const r0 = 7 + Math.random() * 6;
    for (let k = 0; k < 3; k++) {
      target[i * 3 + k] = dir[k] * r;
      start[i * 3 + k] = dir[k] * r0 + (Math.random() - 0.5) * 4;
    }
    seeds[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(target, 3));
  geometry.setAttribute("aStart", new BufferAttribute(start, 3));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
}

export function initHero(
  canvas: HTMLCanvasElement,
  container: HTMLElement,
  options?: { onContextLost?: () => void },
): HeroScene {
  const compact = container.getBoundingClientRect().width < 768;
  let frame = 0;
  let running = false;
  let contextLost = false;
  const renderer = new WebGLRenderer({
    canvas,
    antialias: !compact,
    alpha: true,
    powerPreference: "high-performance",
  });
  const pixelRatio = Math.min(window.devicePixelRatio, compact ? 1.5 : 2);
  renderer.setPixelRatio(pixelRatio);
  const onContextLost = (event: Event) => {
    event.preventDefault();
    contextLost = true;
    running = false;
    cancelAnimationFrame(frame);
    options?.onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onContextLost);

  const scene = new Scene();
  const camera = new PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  const group = new Group();
  scene.add(group);

  const blobGeometry = new IcosahedronGeometry(1.25, compact ? 20 : 48);
  const blobMaterial = new ShaderMaterial({
    vertexShader: blobVertex,
    fragmentShader: blobFragment,
    uniforms: { uTime: { value: 0 }, uIntro: { value: 0 }, uPointer: { value: 0 } },
  });
  const blob = new Mesh(blobGeometry, blobMaterial);
  group.add(blob);

  const particleGeometry = buildParticles(compact ? 1600 : PARTICLES);
  const particleMaterial = new ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    uniforms: { uTime: { value: 0 }, uIntro: { value: 0 }, uPixelRatio: { value: pixelRatio } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  group.add(new Points(particleGeometry, particleMaterial));

  const pointer = { x: 0, y: 0, tx: 0, ty: 0, energy: 0 };
  const onPointer = (event: PointerEvent) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    pointer.energy = 1;
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  let offsetX = 0;
  let offsetY = 0;
  let baseScale = 1;
  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // en pantallas angostas se aleja la cámara para que el blob no se corte
    camera.position.z = width < 768 ? 9 : 7;
    // en desktop el blob se corre a la derecha para no tapar el titular
    offsetX = width >= 1024 ? 1.6 : 0;
    // en mobile va arriba y más chico para que el texto quede legible
    offsetY = width < 768 ? 2.1 : 0;
    baseScale = width < 768 ? 0.75 : 1;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  let inView = true;
  const intersection = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    loop();
  });
  intersection.observe(container);

  const timer = new Timer();
  const render = (now: number) => {
    timer.update(now);
    const elapsed = timer.getElapsed();
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    pointer.energy *= 0.96;

    const scroll = Math.min(window.scrollY / Math.max(container.offsetHeight, 1), 1);
    group.rotation.y = elapsed * 0.08 + pointer.x * 0.5 + scroll * 1.2;
    group.rotation.x = pointer.y * 0.3 + scroll * 0.4;
    group.position.set(offsetX, offsetY + scroll * 1.2, 0);
    group.scale.setScalar(baseScale * (1 - scroll * 0.25));

    blobMaterial.uniforms.uTime.value = elapsed;
    blobMaterial.uniforms.uPointer.value += (pointer.energy - blobMaterial.uniforms.uPointer.value) * 0.08;
    particleMaterial.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
  };

  const tick = (now: number) => {
    if (!running) return;
    render(now);
    frame = requestAnimationFrame(tick);
  };

  // solo renderiza si el hero está visible y la pestaña activa
  const motionPreference = matchMedia("(prefers-reduced-motion: reduce)");
  function loop() {
    const shouldRun = inView && !document.hidden && !motionPreference.matches && !contextLost;
    if (shouldRun && !running) {
      running = true;
      frame = requestAnimationFrame(tick);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(frame);
    }
  }
  document.addEventListener("visibilitychange", loop);
  motionPreference.addEventListener("change", loop);
  loop();

  return {
    playIntro(duration = 2.4) {
      return new Promise((resolve) => {
        const begin = performance.now();
        const step = (now: number) => {
          const t = Math.min((now - begin) / (duration * 1000), 1);
          const eased = 1 - Math.pow(1 - t, 4);
          blobMaterial.uniforms.uIntro.value = eased;
          particleMaterial.uniforms.uIntro.value = eased;
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      });
    },
    dispose() {
      running = false;
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", loop);
      motionPreference.removeEventListener("change", loop);
      resizeObserver.disconnect();
      intersection.disconnect();
      blobGeometry.dispose();
      blobMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      timer.dispose();
      renderer.dispose();
    },
  };
}
