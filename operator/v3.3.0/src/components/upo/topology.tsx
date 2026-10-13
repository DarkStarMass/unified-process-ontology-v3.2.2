import { useEffect, useLayoutEffect, useRef } from "react";

export type TopologyPoint = {
  i: number;
  x: number;
  y: number;
  z: number;
  damped: boolean;
  winner: boolean;
};

const BG = 0x0c0e12;
const GRID_A = 0x2a3038;
const GRID_B = 0x1c2026;
const WIN = 0x8eae98;
const DAMP = 0xd5dbe3;
const IDLE = 0x6e7681;
const LINE = 0x8b939e;

function drawFallback(canvas: HTMLCanvasElement, pts: TopologyPoint[]) {
  const parent = canvas.parentElement;
  const w = Math.max(2, parent?.clientWidth ?? 300);
  const h = Math.max(2, parent?.clientHeight ?? 256);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = "#0c0e12";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#1c2026";
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    const y = (h * i) / 8;
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(w - 16, y);
    ctx.stroke();
  }
  if (pts.length === 0) return;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const pad = 28;
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
  const sy = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);
  ctx.strokeStyle = "#8b939e";
  ctx.beginPath();
  pts.forEach((p, i) => {
    const x = sx(p.x);
    const y = sy(p.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  for (const p of pts) {
    ctx.fillStyle = p.winner ? "#8eae98" : p.damped ? "#d5dbe3" : "#6e7681";
    ctx.beginPath();
    ctx.arc(sx(p.x), sy(p.y), p.winner ? 7 : 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function Topology({ points, label }: { points: TopologyPoint[]; label: string }) {
  const host = useRef<HTMLDivElement>(null);
  const flatRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef(points);
  const updateRef = useRef<((pts: TopologyPoint[]) => void) | null>(null);
  const webglOn = useRef(false);
  pointsRef.current = points;

  useLayoutEffect(() => {
    const el = host.current;
    const canvas = flatRef.current;
    if (!el || !canvas) return;
    const draw = (pts: TopologyPoint[]) => {
      if (webglOn.current) return;
      drawFallback(canvas, pts);
    };
    draw(pointsRef.current);
    const ro = new ResizeObserver(() => draw(pointsRef.current));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = host.current;
    const canvas = glRef.current;
    const flat = flatRef.current;
    if (!el || !canvas) return;
    let stopped = false;
    let cleanup = () => {};

    void (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      if (stopped) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(BG);
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
      const phi = 1.05;
      const theta = 0.6;
      const radius = 22;
      camera.position.set(
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.cos(theta),
      );

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.target.set(0, 0, 0);
      controls.minDistance = 8;
      controls.maxDistance = 60;
      controls.update();

      const grid = new THREE.GridHelper(18, 10, GRID_A, GRID_B);
      grid.position.y = -3;
      scene.add(grid);
      scene.add(new THREE.AmbientLight(0xffffff, 0.75));
      const key = new THREE.DirectionalLight(0xd5dbe3, 0.9);
      key.position.set(10, 18, 12);
      scene.add(key);

      const group = new THREE.Group();
      scene.add(group);
      const geoWin = new THREE.SphereGeometry(0.55, 18, 18);
      const geo = new THREE.SphereGeometry(0.34, 16, 16);
      const matWin = new THREE.MeshStandardMaterial({ color: WIN });
      const matDamp = new THREE.MeshStandardMaterial({ color: DAMP });
      const matIdle = new THREE.MeshStandardMaterial({ color: IDLE });
      const lineMat = new THREE.LineBasicMaterial({ color: LINE });

      const fit = () => {
        const w = el.clientWidth;
        const h = el.clientHeight;
        if (w < 2 || h < 2) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h, false);
        canvas.style.width = "100%";
        canvas.style.height = "100%";
      };

      const update = (pts: TopologyPoint[]) => {
        for (const child of [...group.children]) {
          group.remove(child);
          if (child instanceof THREE.Line) child.geometry.dispose();
        }
        const linePts: InstanceType<typeof THREE.Vector3>[] = [];
        for (const p of pts) {
          linePts.push(new THREE.Vector3(p.x, p.y, p.z));
          const mesh = new THREE.Mesh(
            p.winner ? geoWin : geo,
            p.winner ? matWin : p.damped ? matDamp : matIdle,
          );
          mesh.position.set(p.x, p.y, p.z);
          group.add(mesh);
        }
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(linePts), lineMat));
      };

      if (stopped) {
        renderer.dispose();
        controls.dispose();
        geo.dispose();
        geoWin.dispose();
        matWin.dispose();
        matDamp.dispose();
        matIdle.dispose();
        lineMat.dispose();
        return;
      }

      update(pointsRef.current);
      updateRef.current = update;
      webglOn.current = true;
      if (flat) flat.style.visibility = "hidden";
      fit();

      const ro = new ResizeObserver(fit);
      ro.observe(el);
      let frame = 0;
      const loop = () => {
        frame = requestAnimationFrame(loop);
        controls.update();
        renderer.render(scene, camera);
      };
      loop();

      cleanup = () => {
        cancelAnimationFrame(frame);
        ro.disconnect();
        controls.dispose();
        geo.dispose();
        geoWin.dispose();
        matWin.dispose();
        matDamp.dispose();
        matIdle.dispose();
        lineMat.dispose();
        for (const child of [...group.children]) {
          if (child instanceof THREE.Line) child.geometry.dispose();
        }
        renderer.dispose();
        webglOn.current = false;
        updateRef.current = null;
        if (flat) {
          flat.style.visibility = "";
          drawFallback(flat, pointsRef.current);
        }
      };
    })().catch(() => {
      webglOn.current = false;
    });

    return () => {
      stopped = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (updateRef.current) updateRef.current(points);
    else if (flatRef.current && !webglOn.current) drawFallback(flatRef.current, points);
  }, [points]);

  return (
    <div
      ref={host}
      className="relative h-64 w-full overflow-hidden rounded-sm bg-background touch-none md:h-96"
      role="img"
      aria-label={label}
    >
      <canvas ref={flatRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={glRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
