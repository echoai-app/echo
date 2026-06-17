'use client';

/* Cinematic 3D motion-graphics scene for the Echo explainer.
   A flying camera tours six "beats" of animated 3D objects. Built only from
   broadly-supported materials (standard/basic + RoundedBox) — no Sparkles/Stars/
   transmission/additive, which break software renderers. Driven by one elapsed
   clock so it stays in sync with the kinetic text overlay. */

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

const PEACH = '#ED9C74', PEACHD = '#D97B4E', LAV = '#A98FE0', MINT = '#7FC7A6', SKY = '#7FB3E8', SUN = '#F5CE74', ROSE = '#EB8197';

const sat = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { x = sat(x); return x * x * (3 - 2 * x); };
const env = (t: number, a: number, b: number, r = 0.9) => (t <= a || t >= b ? 0 : Math.min(smooth((t - a) / r), smooth((b - t) / r)));

const CAM: { t: number; p: [number, number, number]; l: [number, number, number] }[] = [
  { t: 0, p: [0, 0.4, 9.5], l: [0, 0, 0] },
  { t: 8, p: [0, 0, 5], l: [0, 0, 0] },
  { t: 13, p: [-3.4, 1.2, 6.2], l: [-0.2, 0.2, 0] },
  { t: 24, p: [3.2, 0.5, 6.6], l: [0, 0, 0] },
  { t: 37, p: [0, -0.4, 7.6], l: [0, 0, 0] },
  { t: 50, p: [3.6, 2.2, 7.2], l: [0, 0.2, 0] },
  { t: 62, p: [0, 0, 11], l: [0, 0, 0] },
];
function camAt(t: number, out: { p: THREE.Vector3; l: THREE.Vector3 }) {
  let a = CAM[0], b = CAM[1];
  for (let i = 0; i < CAM.length - 1; i++) { if (t >= CAM[i].t && t <= CAM[i + 1].t) { a = CAM[i]; b = CAM[i + 1]; break; } }
  if (t >= CAM[CAM.length - 1].t) a = b = CAM[CAM.length - 1];
  const k = b.t === a.t ? 1 : smooth((t - a.t) / (b.t - a.t));
  out.p.set(a.p[0] + (b.p[0] - a.p[0]) * k, a.p[1] + (b.p[1] - a.p[1]) * k, a.p[2] + (b.p[2] - a.p[2]) * k);
  out.l.set(a.l[0] + (b.l[0] - a.l[0]) * k, a.l[1] + (b.l[1] - a.l[1]) * k, a.l[2] + (b.l[2] - a.l[2]) * k);
}

// soft glow halo (normal blending — software-safe)
function Glow({ color, scale = 1, opacity = 0.3 }: { color: string; scale?: number; opacity?: number }) {
  return <mesh scale={scale}><sphereGeometry args={[1, 20, 20]} /><meshBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} /></mesh>;
}

// deterministic pseudo-random (pure — keeps particles stable + lint-clean)
const rnd = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// drifting particle dots (custom — no shader particle system)
function Dust({ count = 60, spread = 13, color = SUN, size = 0.045 }: { count?: number; spread?: number; color?: string; size?: number }) {
  const g = useRef<THREE.Group>(null);
  const data = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: (rnd(i * 4 + 1) - 0.5) * spread, y: (rnd(i * 4 + 2) - 0.5) * spread, z: (rnd(i * 4 + 3) - 0.5) * spread * 0.6,
    s: size * (0.5 + rnd(i * 4 + 4)), ph: rnd(i * 4 + 5) * Math.PI * 2,
  })), [count, spread, size]);
  useFrame((st) => { if (g.current) { const t = st.clock.elapsedTime; g.current.children.forEach((c, i) => { c.position.y = data[i].y + Math.sin(t * 0.4 + data[i].ph) * 0.5; }); } });
  return <group ref={g}>{data.map((d, i) => (
    <mesh key={i} position={[d.x, d.y, d.z]}><sphereGeometry args={[d.s, 8, 8]} /><meshBasicMaterial color={color} transparent opacity={0.7} /></mesh>
  ))}</group>;
}

function EchoOrb({ s = 1 }: { s?: number }) {
  const m = useRef<THREE.Mesh>(null);
  useFrame((st) => { if (m.current) m.current.scale.setScalar(1 + Math.sin(st.clock.elapsedTime * 1.6) * 0.05); });
  return (
    <group scale={s}>
      <Glow color={PEACH} scale={1.9} opacity={0.22} />
      <Glow color={LAV} scale={1.4} opacity={0.28} />
      <mesh ref={m}>
        <sphereGeometry args={[0.62, 48, 48]} />
        <meshStandardMaterial color={LAV} emissive={PEACH} emissiveIntensity={0.85} roughness={0.25} metalness={0.1} />
      </mesh>
      <mesh position={[-0.16, 0.16, 0.5]}><sphereGeometry args={[0.08, 16, 16]} /><meshBasicMaterial color="#ffffff" /></mesh>
    </group>
  );
}

export function ExplainerScene({ startMs, running }: { startMs: number; running: boolean }) {
  const { camera } = useThree();
  const cam = useMemo(() => ({ p: new THREE.Vector3(), l: new THREE.Vector3() }), []);
  const trail = useMemo(() => Array.from({ length: 6 }, () => new THREE.Vector3()), []);

  const b0 = useRef<THREE.Group>(null), b1 = useRef<THREE.Group>(null), b2 = useRef<THREE.Group>(null),
    b3 = useRef<THREE.Group>(null), b4 = useRef<THREE.Group>(null), b5 = useRef<THREE.Group>(null);
  const shards = useRef<THREE.Group>(null);
  const sonar = useRef<THREE.Group>(null);
  const chips = useRef<THREE.Group>(null);
  const mem = useRef<THREE.Mesh>(null);
  const ghosts = useRef<THREE.Group>(null);
  const stack = useRef<THREE.Group>(null);

  useFrame(() => {
    const t = running ? (performance.now() - startMs) / 1000 : 0.01;
    camAt(t, cam);
    camera.position.set(cam.p.x + Math.sin(t * 0.4) * 0.18, cam.p.y + Math.sin(t * 0.6) * 0.1, cam.p.z);
    camera.lookAt(cam.l);

    if (b0.current) b0.current.scale.setScalar(env(t, -1, 8.6));
    if (b1.current) b1.current.scale.setScalar(env(t, 8, 18.4));
    if (b2.current) b2.current.scale.setScalar(env(t, 18, 30.4));
    if (b3.current) b3.current.scale.setScalar(env(t, 30, 45.4));
    if (b4.current) b4.current.scale.setScalar(env(t, 45, 56.4));
    if (b5.current) b5.current.scale.setScalar(env(t, 56, 99));

    if (shards.current) {
      const lp = sat((t - 9.5) / 4);
      shards.current.children.forEach((c, i) => {
        const a = (i / 12) * Math.PI * 2, r = lp * 2.3;
        c.position.set(Math.cos(a) * r, Math.sin(a) * r * 0.7, Math.sin(a * 2) * r * 0.4);
        c.rotation.set(lp * 6 + i, lp * 5, 0);
        c.scale.setScalar(Math.max(0.001, 1 - lp * 0.75));
      });
    }
    if (sonar.current) sonar.current.children.forEach((c, i) => {
      const ph = ((t * 0.6 + i / 3) % 1);
      c.scale.setScalar(0.4 + ph * 2.6);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - ph) * 0.5;
    });
    if (chips.current) chips.current.rotation.y = t * 0.5;

    if (mem.current) {
      const lp = sat((t - 31) / 12);
      const x = -2.6 + lp * 5.2;
      mem.current.position.set(x, Math.sin(lp * Math.PI) * 0.4, 0);
      mem.current.rotation.set(t * 1.6, t * 1.9, 0);
      const col = x < -0.6 ? PEACH : x < 1.3 ? MINT : SKY;
      (mem.current.material as THREE.MeshStandardMaterial).emissive.set(col);
      // ghost trail follows recent positions
      for (let k = trail.length - 1; k > 0; k--) trail[k].copy(trail[k - 1]);
      trail[0].copy(mem.current.position);
      if (ghosts.current) ghosts.current.children.forEach((gc, i) => {
        gc.position.copy(trail[Math.min(i, trail.length - 1)]);
        gc.scale.setScalar(Math.max(0.001, (1 - i / 6) * 0.8));
        ((gc as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = (1 - i / 6) * 0.5;
      });
    }
    if (stack.current) stack.current.rotation.y = -0.5 + Math.sin(t * 0.5) * 0.4 + t * 0.12;
  });

  return (
    <>
      <color attach="background" args={['#191230']} />
      <fog attach="fog" args={['#191230', 12, 26]} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[5, 6, 8]} intensity={1.5} color={'#FFE9D6'} />
      <directionalLight position={[-6, -2, 4]} intensity={0.7} color={LAV} />

      <Dust count={70} spread={15} color={SUN} />
      <Dust count={34} spread={9} color={LAV} size={0.06} />

      {/* 0 · intro */}
      <group ref={b0}><EchoOrb s={1.3} /></group>

      {/* 1 · the problem */}
      <group ref={b1}>
        <Float speed={2} rotationIntensity={0.3} floatIntensity={0.6}>
          <group ref={shards}>
            {Array.from({ length: 12 }).map((_, i) => (
              <mesh key={i}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshStandardMaterial color={i % 2 ? LAV : PEACH} emissive={i % 2 ? LAV : PEACH} emissiveIntensity={0.35} roughness={0.4} /></mesh>
            ))}
          </group>
        </Float>
        <Glow color={ROSE} scale={1.3} opacity={0.18} />
      </group>

      {/* 2 · the experience */}
      <group ref={b2}>
        <EchoOrb s={1} />
        <group ref={sonar} rotation={[Math.PI / 2.3, 0, 0]}>
          {[0, 1, 2].map(i => (
            <mesh key={i}><torusGeometry args={[0.7, 0.035, 12, 56]} /><meshBasicMaterial color={SKY} transparent opacity={0.4} /></mesh>
          ))}
        </group>
        <group ref={chips}>
          {[PEACH, LAV, MINT, SKY, SUN, ROSE, PEACHD].map((c, i, arr) => {
            const a = (i / arr.length) * Math.PI * 2;
            return (
              <group key={i} position={[Math.cos(a) * 2.4, Math.sin(a) * 0.5, Math.sin(a) * 2.4]}>
                <Float speed={3} floatIntensity={0.5}>
                  <RoundedBox args={[0.85, 0.32, 0.12]} radius={0.15}><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.25} roughness={0.45} /></RoundedBox>
                </Float>
              </group>
            );
          })}
        </group>
      </group>

      {/* 3 · memory on Walrus + Sui (hero) */}
      <group ref={b3}>
        <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 5.6, 8]} /><meshBasicMaterial color={SUN} transparent opacity={0.45} /></mesh>
        {([[-1.7, MINT], [0.6, SUN], [2.5, SKY]] as [number, string][]).map(([x, c], i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.58, 0.055, 16, 44]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.55} roughness={0.3} /></mesh>
            {i === 2 ? (
              <Float speed={3} rotationIntensity={1} floatIntensity={0.5}>
                <mesh><icosahedronGeometry args={[0.44, 0]} /><meshStandardMaterial color={SKY} emissive={SKY} emissiveIntensity={0.6} roughness={0.12} metalness={0.4} flatShading /></mesh>
              </Float>
            ) : (
              <mesh><sphereGeometry args={[0.32, 24, 24]} /><meshStandardMaterial color={c} emissive={c} emissiveIntensity={0.45} roughness={0.3} /></mesh>
            )}
            <Glow color={c} scale={0.95} opacity={0.22} />
          </group>
        ))}
        <group ref={ghosts}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i}><boxGeometry args={[0.3, 0.3, 0.3]} /><meshBasicMaterial color={SUN} transparent opacity={0.4} depthWrite={false} /></mesh>
          ))}
        </group>
        <mesh ref={mem}><boxGeometry args={[0.34, 0.34, 0.34]} /><meshStandardMaterial color="#fff" emissive={PEACH} emissiveIntensity={1} roughness={0.2} /></mesh>
      </group>

      {/* 4 · the stack */}
      <group ref={b4}>
        <group ref={stack}>
          {[PEACH, SUN, LAV, MINT, SKY].map((c, i, arr) => (
            <Float key={i} speed={1.5} floatIntensity={0.3} rotationIntensity={0.08}>
              <group position={[0, (arr.length / 2 - i) * 0.66 - 0.33, 0]}>
                <RoundedBox args={[3, 0.52, 1.5]} radius={0.12}><meshStandardMaterial color={c} roughness={0.4} metalness={0.1} emissive={c} emissiveIntensity={0.14} /></RoundedBox>
              </group>
            </Float>
          ))}
        </group>
      </group>

      {/* 5 · close */}
      <group ref={b5}><EchoOrb s={1.2} /></group>
    </>
  );
}
