'use client';

/* eslint-disable react-hooks/immutability -- R3F is an imperative renderer:
   mutating the camera / three objects inside useEffect & useFrame is the
   idiomatic (and only performant) way to animate; these are not React state. */

import React, { Suspense, useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Outlines, RoundedBox, ContactShadows } from '@react-three/drei';
import type { OrbState } from '../ui';

/* ============================================================================
   ImmersiveRoom3D — the real-3D seated reflection room (Three.js / R3F).

   First-person camera fixed at seated eye level: you sit at a small table,
   the Echo companion across from you on a couch. Drag (mouse/touch) to look
   around — clamped yaw/pitch, no walking. Toon pastel materials + inverted-
   hull ink outlines keep Echo's doodle brand in 3D. Primitive geometry only:
   no models, no textures (one tiny canvas gradient for the window), no
   physics. Loaded lazily, client-only; the CSS room remains the fallback.
   ========================================================================== */

const INK = '#352A1F';
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const damp = THREE.MathUtils.damp;

export interface Room3DApi { reset: () => void }

/* Shared 3-step cel-shade gradient — gives every toon material proper banded
   shading (lit / mid / shadow) instead of flat lambert. Created once. */
let _grad: THREE.DataTexture | null = null;
function toonGrad(): THREE.DataTexture {
  if (!_grad) {
    const steps = new Uint8Array([150, 205, 255]);
    _grad = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
    _grad.minFilter = THREE.NearestFilter;
    _grad.magFilter = THREE.NearestFilter;
    _grad.needsUpdate = true;
  }
  return _grad;
}
function Toon(props: { color?: string; map?: THREE.Texture; side?: THREE.Side }) {
  return <meshToonMaterial {...props} gradientMap={toonGrad()} />;
}


/* Tiny hand-drawn paintings — real little scenes rendered to canvas once and
   shared as textures by every frame in the room. */
let _paintings: { sunsetHills: THREE.CanvasTexture; sailboat: THREE.CanvasTexture; tinyHouse: THREE.CanvasTexture } | null = null;
function paintingTextures() {
  if (_paintings) return _paintings;
  const make = (draw: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 192;
    const g = c.getContext('2d')!;
    draw(g);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  };
  const sunsetHills = make(g => {
    const sky = g.createLinearGradient(0, 0, 0, 130);
    sky.addColorStop(0, '#F7CBA4'); sky.addColorStop(1, '#E7C0DE');
    g.fillStyle = sky; g.fillRect(0, 0, 256, 192);
    g.fillStyle = '#F5CE74'; g.beginPath(); g.arc(180, 62, 26, 0, 7); g.fill();
    g.fillStyle = '#AEDAB9'; g.beginPath(); g.ellipse(60, 168, 120, 58, 0, 0, 7); g.fill();
    g.fillStyle = '#7FC295'; g.beginPath(); g.ellipse(215, 182, 130, 62, 0, 0, 7); g.fill();
    g.strokeStyle = '#8A6748'; g.lineWidth = 7; g.beginPath(); g.moveTo(74, 150); g.lineTo(74, 112); g.stroke();
    g.fillStyle = '#5FA97C';
    [[74, 96, 22], [60, 108, 15], [89, 108, 15]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); });
    g.strokeStyle = '#5A4632'; g.lineWidth = 3;
    [[120, 50], [142, 42]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x - 8, y + 4); g.quadraticCurveTo(x, y - 4, x + 8, y + 4); g.stroke(); });
  });
  const sailboat = make(g => {
    const sky = g.createLinearGradient(0, 0, 0, 110);
    sky.addColorStop(0, '#B7A6DE'); sky.addColorStop(1, '#E8B7C8');
    g.fillStyle = sky; g.fillRect(0, 0, 256, 110);
    g.fillStyle = '#FFF3D0'; g.beginPath(); g.arc(205, 42, 20, 0, 7); g.fill();
    g.fillStyle = '#B7A6DE'; g.beginPath(); g.arc(214, 36, 18, 0, 7); g.fill();
    g.fillStyle = '#8FB8DD'; g.fillRect(0, 110, 256, 82);
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.globalAlpha = 0.5;
    for (let y = 124; y < 188; y += 16) { g.beginPath(); g.moveTo(10, y); g.quadraticCurveTo(40, y - 5, 70, y); g.quadraticCurveTo(100, y + 5, 130, y); g.stroke(); }
    g.globalAlpha = 1;
    g.fillStyle = '#8A5A3B'; g.beginPath(); g.moveTo(86, 128); g.lineTo(170, 128); g.lineTo(154, 148); g.lineTo(102, 148); g.closePath(); g.fill();
    g.strokeStyle = '#5A4632'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 128); g.lineTo(128, 58); g.stroke();
    g.fillStyle = '#FBF1E0'; g.beginPath(); g.moveTo(128, 58); g.lineTo(128, 120); g.lineTo(86, 120); g.closePath(); g.fill();
    g.fillStyle = '#ED9C74'; g.beginPath(); g.moveTo(132, 64); g.lineTo(132, 116); g.lineTo(166, 116); g.closePath(); g.fill();
  });
  const tinyHouse = make(g => {
    g.fillStyle = '#FBF1E0'; g.fillRect(0, 0, 256, 192);
    g.fillStyle = '#AEDAB9'; g.fillRect(0, 150, 256, 42);
    g.fillStyle = '#F4B89A'; g.fillRect(82, 92, 92, 62);
    g.fillStyle = '#ED9C74'; g.beginPath(); g.moveTo(70, 96); g.lineTo(128, 52); g.lineTo(186, 96); g.closePath(); g.fill();
    g.fillStyle = '#8A5A3B'; g.fillRect(118, 116, 22, 38);
    g.fillStyle = '#A9C9E9'; g.fillRect(94, 108, 18, 18); g.fillRect(146, 108, 18, 18);
    g.strokeStyle = '#B5A188'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(150, 64); g.quadraticCurveTo(162, 52, 156, 38); g.quadraticCurveTo(172, 36, 168, 22); g.stroke();
  });
  _paintings = { sunsetHills, sailboat, tinyHouse };
  return _paintings;
}

/* ---------------- seated look-around camera ---------------- */
function LookControls({ apiRef }: { apiRef: React.MutableRefObject<Room3DApi | null> }) {
  const { camera, gl } = useThree();
  const v = useRef({ yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, drag: false, lx: 0, ly: 0, basePitch: 0 });
  // cinematic entrance: drift down + forward into your seat
  const intro = useRef({ t0: -1, done: false });

  useEffect(() => {
    camera.position.set(0, 1.22, 2.9);
    camera.lookAt(0, 1.0, -1.2);
    v.current.basePitch = camera.rotation.x;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) intro.current.done = true;
    const el = gl.domElement;
    el.style.touchAction = 'none';
    const down = (e: PointerEvent) => {
      v.current.drag = true; v.current.lx = e.clientX; v.current.ly = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      const s = v.current;
      if (!s.drag) return;
      // grab-the-world feel; clamped so you can't spin past the room
      s.tyaw = clamp(s.tyaw + (e.clientX - s.lx) * 0.0032, -0.8, 0.8);
      // negative = looking down (toward your own knees), positive = up
      s.tpitch = clamp(s.tpitch + (e.clientY - s.ly) * 0.0022, -0.46, 0.28);
      s.lx = e.clientX; s.ly = e.clientY;
    };
    const up = (e: PointerEvent) => {
      v.current.drag = false;
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      el.style.cursor = 'grab';
    };
    el.style.cursor = 'grab';
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    apiRef.current = { reset: () => { v.current.tyaw = 0; v.current.tpitch = 0; } };
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame((st, dt) => {
    const s = v.current;
    s.yaw = damp(s.yaw, s.tyaw, 7.5, dt);
    s.pitch = damp(s.pitch, s.tpitch, 7.5, dt);
    const t = st.clock.elapsedTime;
    // entrance dolly — ease from above/behind down into the seat
    if (!intro.current.done) {
      if (intro.current.t0 < 0) intro.current.t0 = t;
      const p = Math.min(1, (t - intro.current.t0) / 2.8);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      camera.position.set(0, 1.22 + 0.5 * (1 - e), 2.9 + 1.9 * (1 - e));
      if (p >= 1) intro.current.done = true;
    }
    // gentle seated sway so the room feels alive even untouched
    const swayY = Math.sin(t * 0.32) * 0.012;
    const swayP = Math.cos(t * 0.26) * 0.007;
    camera.rotation.order = 'YXZ';
    camera.rotation.y = s.yaw + swayY;
    camera.rotation.x = s.basePitch + s.pitch + swayP;
    camera.rotation.z = 0;
  });
  return null;
}

/* ---------------- the companion — a cute mascot robot ---------------- */
// A chubby white + cyan helper-bot with a glowing visor and happy eyes, built
// to match the reference. Fully gesture-driven: floats and bobs, blinks, waves
// hello on arrival, leans + nods while listening, and its eyes/mouth glow-pulse
// while Echo speaks.
const BOT_WHITE = '#ECEFF5';
const BOT_TEAL = '#5BD2D8';
const BOT_GLOW = '#D2E8FF';
const BOT_VISOR = '#2540E6';

function CompanionModel({ state }: { state: OrbState }) {
  const root = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyes = useRef<THREE.Group>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const waveArm = useRef<THREE.Group>(null);
  const aura = useRef<THREE.Mesh>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const cheeks = useRef<THREE.Group>(null);
  const waveT0 = useRef(-1);
  const talk = useRef(0);

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    // a gentle, settled hover — subtle bob with the faintest squash, no jelly
    const bob = Math.sin(t * 1.25);
    if (root.current) {
      const y = 1.05 + bob * 0.018;
      root.current.position.y = y;
      const sx = 1 + bob * 0.008;
      const sy = 1 - bob * 0.008;
      root.current.scale.set(0.64 * sx, 0.64 * sy, 0.64 * sx);
      root.current.rotation.z = damp(root.current.rotation.z, Math.sin(t * 0.7) * 0.055 + (state === 'speaking' ? Math.sin(t * 2.0) * 0.02 : 0), 4, dt);
      root.current.position.z = damp(root.current.position.z, state === 'listening' ? -1.16 : -1.26, 5, dt);
      // ground shadow on the couch shrinks/fades as it floats higher
      if (shadow.current) {
        const lift = y - 1.05;
        const s = Math.max(0.45, 1 - lift * 4);
        shadow.current.scale.set(s, s, s);
        (shadow.current.material as THREE.MeshBasicMaterial).opacity = 0.2 * s;
      }
    }
    // cheeks blush a little brighter while listening — bashful & sweet
    if (cheeks.current) {
      cheeks.current.children.forEach((c) => {
        const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = damp(m.opacity, state === 'listening' ? 0.92 : 0.72, 4, dt);
      });
    }
    // head: cute idle tilt; dips down to listen
    if (head.current) {
      head.current.rotation.x = damp(head.current.rotation.x, state === 'listening' ? Math.sin(t * 1.9) * 0.06 + 0.13 : Math.sin(t * 1.2) * 0.03, 5, dt);
      head.current.rotation.z = damp(head.current.rotation.z, Math.sin(t * 0.9) * 0.045, 4, dt);
    }
    // blink: squash the happy eyes briefly every ~3.6s
    const cyc = t % 3.6;
    const blink = cyc < 0.12 ? 0.12 : 1;
    if (eyes.current) eyes.current.scale.y = damp(eyes.current.scale.y, blink, 30, dt);
    // mouth glows + opens while speaking
    const target = state === 'speaking' ? Math.min(1, Math.abs(Math.sin(t * 8.5)) * 0.7 + 0.18) : 0;
    talk.current = damp(talk.current, target, 16, dt);
    if (mouth.current) {
      mouth.current.scale.set(0.55 + talk.current * 0.5, Math.max(0.05, talk.current), 1);
      (mouth.current.material as THREE.MeshBasicMaterial).opacity = 0.18 + talk.current * 0.8;
    }
    // wave hello on arrival, then the arm settles to a gentle rest
    if (waveArm.current) {
      if (waveT0.current < 0) waveT0.current = t;
      const wt = t - waveT0.current;
      const tgt = wt > 0.4 && wt < 3.2 ? -2.2 + Math.sin(wt * 8) * 0.35 : -0.55;
      waveArm.current.rotation.z = damp(waveArm.current.rotation.z, tgt, wt < 3.2 ? 8 : 4, dt);
    }
    // soft glow aura, breathes while speaking
    if (aura.current) {
      const on = state === 'speaking' ? 1 : 0;
      const mat = aura.current.material as THREE.MeshBasicMaterial;
      mat.opacity = damp(mat.opacity, on * (0.12 + Math.sin(t * 2.4) * 0.05), 5, dt);
      aura.current.scale.setScalar(1 + (state === 'speaking' ? Math.sin(t * 2.4) * 0.05 : 0));
    }
  });

  return (
   <>
    {/* a soft shadow on the couch cushion — grounds the floaty bot in the room */}
    <mesh ref={shadow} position={[-0.3, 0.54, -1.18]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.42, 28]} />
      <meshBasicMaterial color="#6E4B36" transparent opacity={0.2} depthWrite={false} />
    </mesh>
    <group ref={root} position={[-0.3, 1.05, -1.26]} scale={0.64}>
      {/* glow aura */}
      <mesh ref={aura} position={[0, 0, -0.3]}>
        <sphereGeometry args={[0.95, 20, 16]} />
        <meshBasicMaterial color="#86CCFF" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* head */}
      <group ref={head} position={[0, 0.26, 0]}>
        <RoundedBox args={[0.98, 0.86, 0.84]} radius={0.32} smoothness={6} castShadow>
          <Toon color={BOT_WHITE} />
          <Outlines thickness={0.012} color={INK} />
        </RoundedBox>
        {/* little top nub + a glowing antenna bead */}
        <RoundedBox args={[0.34, 0.18, 0.32]} radius={0.08} position={[0.02, 0.52, -0.02]}>
          <Toon color={BOT_WHITE} />
          <Outlines thickness={0.01} color={INK} />
        </RoundedBox>
        <mesh position={[0.02, 0.66, -0.02]}>
          <sphereGeometry args={[0.055, 14, 12]} />
          <meshBasicMaterial color={BOT_TEAL} />
        </mesh>
        <mesh position={[0.005, 0.675, 0.01]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        {/* visor */}
        <group position={[0, 0.0, 0.43]}>
          <RoundedBox args={[0.68, 0.52, 0.14]} radius={0.24} smoothness={6}>
            <meshBasicMaterial color={BOT_VISOR} />
          </RoundedBox>
          {/* glossy sheen */}
          <mesh position={[0.13, 0.14, 0.08]} scale={[1, 0.5, 1]} rotation={[0, 0, -0.3]}>
            <sphereGeometry args={[0.17, 16, 12]} />
            <meshBasicMaterial color="#86A8FF" transparent opacity={0.5} />
          </mesh>
          {/* happy glowing eyes — big curved smiles, with a twinkle each */}
          <group ref={eyes} position={[0, -0.01, 0.1]}>
            {[-0.16, 0.16].map((x) => (
              <group key={x} position={[x, 0, 0]}>
                <mesh>
                  <torusGeometry args={[0.1, 0.028, 12, 20, Math.PI]} />
                  <meshBasicMaterial color={BOT_GLOW} />
                </mesh>
                <mesh position={[0.03, 0.06, 0.02]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshBasicMaterial color="#FFFFFF" />
                </mesh>
              </group>
            ))}
          </group>
          {/* mouth — glows + opens when speaking */}
          <mesh ref={mouth} position={[0, -0.19, 0.1]} scale={[0.55, 0.05, 1]}>
            <sphereGeometry args={[0.07, 14, 10]} />
            <meshBasicMaterial color={BOT_GLOW} transparent opacity={0.18} />
          </mesh>
        </group>
        {/* rosy blush cheeks — pure cuteness */}
        <group ref={cheeks}>
          <mesh position={[-0.37, -0.16, 0.34]} scale={[1, 0.72, 0.4]}>
            <sphereGeometry args={[0.1, 14, 12]} />
            <meshBasicMaterial color="#FF9FB2" transparent opacity={0.72} />
          </mesh>
          <mesh position={[0.37, -0.16, 0.34]} scale={[1, 0.72, 0.4]}>
            <sphereGeometry args={[0.1, 14, 12]} />
            <meshBasicMaterial color="#FF9FB2" transparent opacity={0.72} />
          </mesh>
        </group>
        {/* side port (dark) */}
        <mesh position={[-0.5, 0.02, 0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.1, 18]} />
          <Toon color={BOT_WHITE} />
          <Outlines thickness={0.008} color={INK} />
        </mesh>
        <mesh position={[-0.56, 0.02, 0.06]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 0.05, 16]} />
          <meshBasicMaterial color="#23223A" />
        </mesh>
        {/* cyan ear fins */}
        {[-1, 1].map((s) => (
          <RoundedBox key={s} args={[0.11, 0.36, 0.17]} radius={0.05} position={[s * 0.47, 0.2, -0.12]} rotation={[0.12, 0, s * -0.38]}>
            <Toon color={BOT_TEAL} />
            <Outlines thickness={0.008} color={INK} />
          </RoundedBox>
        ))}
      </group>

      {/* body — chubby & round */}
      <group position={[0, -0.44, 0]}>
        <mesh scale={[1, 1.04, 0.96]} castShadow>
          <sphereGeometry args={[0.46, 28, 22]} />
          <Toon color={BOT_WHITE} />
          <Outlines thickness={0.011} color={INK} />
        </mesh>
        {/* thin chest line */}
        <mesh position={[0, 0.13, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.34, 8]} />
          <meshBasicMaterial color="#23223A" />
        </mesh>
        {/* teal bib — sits proud on the round belly */}
        <mesh position={[0, -0.02, 0.4]} rotation={[Math.PI, 0, 0]} scale={[1, 1, 0.5]}>
          <coneGeometry args={[0.2, 0.3, 22]} />
          <Toon color={BOT_TEAL} />
          <Outlines thickness={0.008} color={INK} />
        </mesh>
      </group>

      {/* arms (capsule + ball hand) */}
      <group position={[-0.36, -0.28, 0.06]} rotation={[0, 0, 0.62]}>
        <mesh castShadow><capsuleGeometry args={[0.08, 0.22, 8, 14]} /><Toon color={BOT_WHITE} /><Outlines thickness={0.009} color={INK} /></mesh>
        <mesh position={[0, -0.2, 0]}><sphereGeometry args={[0.1, 14, 12]} /><Toon color={BOT_WHITE} /><Outlines thickness={0.009} color={INK} /></mesh>
      </group>
      <group ref={waveArm} position={[0.36, -0.2, 0.06]}>
        <group position={[0, -0.18, 0]}>
          <mesh castShadow><capsuleGeometry args={[0.08, 0.22, 8, 14]} /><Toon color={BOT_WHITE} /><Outlines thickness={0.009} color={INK} /></mesh>
          <mesh position={[0, -0.2, 0]}><sphereGeometry args={[0.1, 14, 12]} /><Toon color={BOT_WHITE} /><Outlines thickness={0.009} color={INK} /></mesh>
        </group>
      </group>
    </group>
   </>
  );
}

/* ---------------- you — first-person seated presence ---------------- */
// Your own cozy knees, hands and feet, visible at the bottom of the view and
// rewarded when you glance down: you're IN the room, not watching a diorama.
function YourPresence() {
  return (
    <group position={[0, 0, 2.68]}>
      {/* your floor cushion */}
      <mesh position={[0, 0.12, 0.25]}>
        <cylinderGeometry args={[0.52, 0.56, 0.22, 24]} />
        <Toon color="#CBBCEE" />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      {/* thighs — cozy sage lounge pants, knees rising into the view */}
      <mesh position={[-0.23, 0.58, -0.1]} rotation={[1.15, 0, 0.08]} castShadow>
        <capsuleGeometry args={[0.13, 0.46, 8, 14]} />
        <Toon color="#AEDAB9" />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <mesh position={[0.23, 0.58, -0.1]} rotation={[1.15, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.13, 0.46, 8, 14]} />
        <Toon color="#AEDAB9" />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      {/* shins folding down */}
      <mesh position={[-0.21, 0.22, -0.42]} rotation={[0.35, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.34, 8, 14]} />
        <Toon color="#AEDAB9" />
        <Outlines thickness={0.016} color={INK} />
      </mesh>
      <mesh position={[0.21, 0.22, -0.42]} rotation={[0.35, 0, 0]}>
        <capsuleGeometry args={[0.1, 0.34, 8, 14]} />
        <Toon color="#AEDAB9" />
        <Outlines thickness={0.016} color={INK} />
      </mesh>
      {/* feet — cream socks */}
      <mesh position={[-0.22, 0.07, -0.62]} scale={[1, 0.72, 1.5]}>
        <sphereGeometry args={[0.105, 16, 12]} />
        <Toon color="#FFFDF8" />
        <Outlines thickness={0.014} color={INK} />
      </mesh>
      <mesh position={[0.22, 0.07, -0.62]} scale={[1, 0.72, 1.5]}>
        <sphereGeometry args={[0.105, 16, 12]} />
        <Toon color="#FFFDF8" />
        <Outlines thickness={0.014} color={INK} />
      </mesh>
      {/* hands resting on your knees */}
      <mesh position={[-0.24, 0.74, 0.04]} scale={[1, 0.8, 1.1]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <Toon color="#F8E4D2" />
        <Outlines thickness={0.014} color={INK} />
      </mesh>
      <mesh position={[0.24, 0.74, 0.04]} scale={[1, 0.8, 1.1]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <Toon color="#F8E4D2" />
        <Outlines thickness={0.014} color={INK} />
      </mesh>
    </group>
  );
}

/* ---------------- window clouds — drifting slowly past the sunset ---------------- */
function Clouds() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const base = [[-0.12, -0.18], [0.06, -0.14], [-0.3, -0.14]] as const;
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.x = base[i][0] + Math.sin(t * 0.06 + i * 2.4) * 0.09;
    });
  });
  return (
    <group>
      {base.map(([cx, cy], i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[cx, cy, 0.058]} scale={[1.6, 0.7, 1]}>
          <circleGeometry args={[0.09, 16]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- fireplace — flicker, warmth, the heart of the room ---------------- */
function Fireplace() {
  const { gl } = useThree();
  const flames = useRef<(THREE.Group | null)[]>([]);
  const embers = useRef<(THREE.Mesh | null)[]>([]);
  const smoke = useRef<(THREE.Mesh | null)[]>([]);
  const glow = useRef<THREE.PointLight>(null);
  const glowPlane = useRef<THREE.Mesh>(null);
  const stokeT = useRef(-10);
  const wantStoke = useRef(false);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (wantStoke.current) { stokeT.current = t; wantStoke.current = false; }
    // a click on the hearth stokes the fire for a moment
    const se = t - stokeT.current;
    const stoke = se > 0 && se < 1.6 ? Math.sin((se / 1.6) * Math.PI) * 0.7 : 0;
    flames.current.forEach((f, i) => {
      if (!f) return;
      const n = Math.sin(t * (5.5 + i * 1.7) + i * 2.1) * 0.5 + Math.sin(t * (10.5 + i * 1.3) + i) * 0.35;
      f.scale.y = (0.82 + n * 0.26) * (1 + stoke * 0.6);
      f.scale.x = (1 - n * 0.1) * (1 + stoke * 0.15);
      f.rotation.z = Math.sin(t * (3.2 + i) + i * 2) * 0.07;
      f.position.x = (i - 1) * 0.11 + Math.sin(t * 2.6 + i * 2) * 0.014;
    });
    embers.current.forEach((m, i) => {
      if (!m) return;
      const speed = 0.22 + i * 0.04 + stoke * 0.3;
      const p = (t * speed + i * 0.29) % 1;
      m.position.y = 0.48 + p * (0.6 + stoke * 0.4);
      m.position.x = (i - 2.5) * 0.045 + Math.sin(p * 9 + i * 2) * 0.035;
      (m.material as THREE.MeshBasicMaterial).opacity = (0.85 + stoke * 0.15) * (1 - p);
    });
    smoke.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * (0.12 + i * 0.03) + i * 0.37) % 1;
      m.position.y = 0.95 + p * 0.5;
      m.position.x = Math.sin(p * 4 + i * 2) * 0.05;
      const sc = 0.5 + p * 1.1;
      m.scale.setScalar(sc);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.12 * (1 - p);
    });
    if (glow.current) glow.current.intensity = 2.6 + stoke * 2.4 + Math.sin(t * 7.3) * 0.5 + Math.sin(t * 13.7) * 0.3;
    if (glowPlane.current) (glowPlane.current.material as THREE.MeshBasicMaterial).opacity = 0.22 + stoke * 0.2 + Math.sin(t * 6.1) * 0.05;
  });
  const stoke = (e: { stopPropagation: () => void }) => { e.stopPropagation(); wantStoke.current = true; };
  const hoverOn = () => { gl.domElement.style.cursor = 'pointer'; };
  const hoverOff = () => { gl.domElement.style.cursor = 'grab'; };
  return (
    <group position={[3.32, 0, -0.7]} rotation={[0, -Math.PI / 2, 0]}
      onClick={stoke} onPointerOver={hoverOn} onPointerOut={hoverOff}>
      {/* mantel + body */}
      <RoundedBox args={[1.7, 1.4, 0.5]} radius={0.06} position={[0, 0.7, 0]} castShadow>
        <Toon color="#E8C9A0" />
        <Outlines thickness={0.03} color={INK} />
      </RoundedBox>
      <RoundedBox args={[1.9, 0.14, 0.62]} radius={0.04} position={[0, 1.45, 0]}>
        <Toon color="#D9B583" />
        <Outlines thickness={0.022} color={INK} />
      </RoundedBox>
      {/* framed art above the mantel */}
      <group position={[0, 2.15, -0.08]}>
        <RoundedBox args={[0.86, 0.66, 0.05]} radius={0.02}>
          <Toon color="#FFFDF8" />
          <Outlines thickness={0.014} color={INK} />
        </RoundedBox>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.72, 0.52]} />
          <meshBasicMaterial map={paintingTextures().sailboat} />
        </mesh>
      </group>
      {/* the opening */}
      <mesh position={[0, 0.55, 0.18]}>
        <boxGeometry args={[1.0, 0.78, 0.24]} />
        <meshBasicMaterial color="#3A2B20" />
      </mesh>
      {/* logs */}
      <mesh position={[-0.1, 0.24, 0.26]} rotation={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.6, 8]} />
        <Toon color="#8A6748" />
      </mesh>
      <mesh position={[0.1, 0.24, 0.28]} rotation={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.055, 0.055, 0.55, 8]} />
        <Toon color="#7A5A3E" />
      </mesh>
      {/* layered flames — outer / mid / bright core, additive so they glow */}
      {[0, 1, 2].map(i => (
        <group key={i} ref={(el) => { flames.current[i] = el; }} position={[(i - 1) * 0.11, 0.42, 0.28]}>
          <mesh position={[0, 0.16, 0]}>
            <coneGeometry args={[i === 1 ? 0.125 : 0.09, i === 1 ? 0.5 : 0.34, 10]} />
            <meshBasicMaterial color="#E8581F" transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.12, 0.01]}>
            <coneGeometry args={[i === 1 ? 0.085 : 0.06, i === 1 ? 0.36 : 0.24, 10]} />
            <meshBasicMaterial color="#FF9D45" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.08, 0.02]}>
            <coneGeometry args={[i === 1 ? 0.045 : 0.032, i === 1 ? 0.22 : 0.15, 8]} />
            <meshBasicMaterial color="#FFE9A8" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* glowing flame bases — teardrop roots */}
      {[-0.11, 0, 0.11].map((fx, i) => (
        <mesh key={'b' + i} position={[fx, 0.4, 0.28]} scale={[1, 0.6, 1]}>
          <sphereGeometry args={[i === 1 ? 0.085 : 0.06, 10, 8]} />
          <meshBasicMaterial color="#FF9D45" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {/* charred log ends */}
      <mesh position={[-0.36, 0.24, 0.28]} rotation={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.062, 0.062, 0.04, 8]} />
        <Toon color="#43332A" />
      </mesh>
      <mesh position={[0.33, 0.24, 0.33]} rotation={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.057, 0.057, 0.04, 8]} />
        <Toon color="#43332A" />
      </mesh>
      {/* soft smoke wisps above the fire */}
      {[0, 1, 2].map(i => (
        <mesh key={'s' + i} ref={(el) => { smoke.current[i] = el; }} position={[0, 1.0, 0.24]}>
          <sphereGeometry args={[0.07, 10, 8]} />
          <meshBasicMaterial color="#C9BCB0" transparent opacity={0.1} depthWrite={false} />
        </mesh>
      ))}
      {/* soft glow billboard behind the flames */}
      <mesh ref={glowPlane} position={[0, 0.55, 0.26]}>
        <circleGeometry args={[0.42, 20]} />
        <meshBasicMaterial color="#FF9D45" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* embers drifting up from the fire */}
      {[0, 1, 2, 3, 4, 5].map(i => (
        <mesh key={'e' + i} ref={(el) => { embers.current[i] = el; }} position={[0, 0.55, 0.3]}>
          <sphereGeometry args={[i % 3 === 0 ? 0.014 : 0.01, 6, 5]} />
          <meshBasicMaterial color={i % 2 ? '#FFB066' : '#FF8A4A'} transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
      {/* candle pair on the mantel */}
      <mesh position={[-0.55, 1.62, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.2, 10]} />
        <Toon color="#FBF1E0" />
        <Outlines thickness={0.008} color={INK} />
      </mesh>
      <mesh position={[-0.55, 1.76, 0]}>
        <sphereGeometry args={[0.022, 8, 6]} />
        <meshBasicMaterial color="#FFE9A8" toneMapped={false} />
      </mesh>
      <mesh position={[0.5, 1.58, 0]}>
        <sphereGeometry args={[0.085, 14, 10]} />
        <Toon color="#AEDAB9" />
        <Outlines thickness={0.01} color={INK} />
      </mesh>
      {/* warm flicker light */}
      <pointLight ref={glow} position={[0, 0.7, 0.7]} color="#FF9D5C" intensity={2.6} distance={6} decay={1.6} />
      {/* hearth glow on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0.75]}>
        <circleGeometry args={[0.7, 22]} />
        <meshBasicMaterial color="#FFB066" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------------- a mug you can pick up and sip ---------------- */
function SipMug({ x, z, color, flip = false }: { x: number; z: number; color: string; flip?: boolean }) {
  const { gl } = useThree();
  const g = useRef<THREE.Group>(null);
  const steam = useRef<(THREE.Mesh | null)[]>([]);
  const sipT = useRef(-10);
  const want = useRef(false);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (want.current) { if (t - sipT.current > 2) sipT.current = t; want.current = false; }
    const e = t - sipT.current;
    // lift toward you, tip back for a sip, settle back down
    let p = 0;
    if (e > 0 && e < 2) p = e < 0.55 ? e / 0.55 : e < 1.35 ? 1 : Math.max(0, 1 - (e - 1.35) / 0.6);
    const ease = p * p * (3 - 2 * p);
    if (g.current) {
      g.current.position.y = 0.66 + ease * 0.42;
      g.current.position.z = z + ease * 0.5;
      g.current.rotation.x = ease * -0.55;
    }
    // steam puffs harder right after a sip
    steam.current.forEach((m, i) => {
      if (!m) return;
      const sp = (t * 0.4 + i * 0.33) % 1;
      m.position.y = 0.1 + sp * 0.24;
      m.position.x = Math.sin(sp * 6 + i) * 0.02;
      (m.material as THREE.MeshBasicMaterial).opacity = (0.4 + ease * 0.4) * (1 - sp);
    });
  });
  return (
    <group ref={g} position={[x, 0.66, z]}
      onClick={(e) => { e.stopPropagation(); want.current = true; }}
      onPointerOver={() => { gl.domElement.style.cursor = 'pointer'; }}
      onPointerOut={() => { gl.domElement.style.cursor = 'grab'; }}>
      <mesh castShadow>
        <cylinderGeometry args={[0.07, 0.062, 0.13, 18]} />
        <Toon color={color} />
        <Outlines thickness={0.012} color={INK} />
      </mesh>
      <mesh position={[flip ? 0.085 : -0.085, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.045, 0.014, 8, 16]} />
        <Toon color={color} />
      </mesh>
      {/* rim highlight */}
      <mesh position={[0, 0.065, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.066, 0.007, 8, 20]} />
        <Toon color="#FBF1E0" />
      </mesh>
      {/* cocoa inside, with two little marshmallows */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.06, 16]} />
        <meshBasicMaterial color="#8A5A3B" />
      </mesh>
      <mesh position={[-0.015, 0.066, 0.012]} rotation={[0.2, 0.5, 0]}>
        <boxGeometry args={[0.022, 0.012, 0.022]} />
        <meshBasicMaterial color="#FFFDF8" />
      </mesh>
      <mesh position={[0.018, 0.066, -0.01]} rotation={[0, -0.4, 0.15]}>
        <boxGeometry args={[0.02, 0.012, 0.02]} />
        <meshBasicMaterial color="#FFF4E4" />
      </mesh>
      {[0, 1, 2].map(i => (
        <mesh key={i} ref={(el) => { steam.current[i] = el; }} position={[0, 0.12, 0]}>
          <sphereGeometry args={[0.014, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- a sleeping cat that actually looks like a cat ------------ */
function Cat() {
  const { gl } = useThree();
  const body = useRef<THREE.Group>(null);
  const headG = useRef<THREE.Group>(null);
  const earL = useRef<THREE.Mesh>(null);
  const earR = useRef<THREE.Mesh>(null);
  const eyesOpen = useRef<THREE.Group>(null);
  const eyesShut = useRef<THREE.Group>(null);
  const tail = useRef<THREE.Mesh>(null);
  const hearts = useRef<(THREE.Mesh | null)[]>([]);
  const wakeT = useRef(-10);
  const want = useRef(false);

  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (want.current) { if (t - wakeT.current > 2.4) wakeT.current = t; want.current = false; }
    const e = t - wakeT.current;
    const awake = e > 0 && e < 2.2 ? Math.sin(Math.min(1, e / 0.4) * Math.PI * 0.5) * (e > 1.7 ? (2.2 - e) / 0.5 : 1) : 0;
    // slow belly breathing
    if (body.current) body.current.scale.y = 1 + Math.sin(t * 1.05) * 0.04;
    // head lifts + turns toward you when poked
    if (headG.current) {
      headG.current.position.y = 0.16 + awake * 0.09;
      headG.current.rotation.z = awake * 0.25;
      headG.current.rotation.y = awake * 0.5;
    }
    // ears twitch — tiny idle flicks, big perk when awake
    const flick = (t % 7) > 6.82 ? 0.25 : 0;
    if (earL.current) earL.current.rotation.z = 0.22 + awake * 0.12 + flick;
    if (earR.current) earR.current.rotation.z = -0.18 - awake * 0.12;
    // eyes: shut arcs asleep, round eyes when poked awake
    if (eyesOpen.current) eyesOpen.current.scale.setScalar(Math.max(0.0001, awake));
    if (eyesShut.current) eyesShut.current.scale.setScalar(Math.max(0.0001, 1 - awake));
    // tail: slow sweep asleep, happy wag awake
    if (tail.current) tail.current.rotation.z = 0.15 + Math.sin(t * (0.6 + awake * 8)) * (0.1 + awake * 0.3);
    hearts.current.forEach((m, i) => {
      if (!m) return;
      const hp = awake > 0 ? Math.min(1, Math.max(0, (e - 0.25 - i * 0.18) / 1.3)) : 1;
      m.position.y = 0.34 + hp * 0.36;
      m.position.x = 0.12 + i * 0.07 + Math.sin(hp * 5 + i) * 0.03;
      (m.material as THREE.MeshBasicMaterial).opacity = awake > 0 ? Math.max(0, 0.9 * (1 - hp)) : 0;
    });
  });

  const FUR = '#F0B380', FUR_DARK = '#D8935C', CREAM = '#FBE9D2';
  return (
    <group position={[1.05, 0, -0.25]} rotation={[0, -0.7, 0]}
      onClick={(e) => { e.stopPropagation(); want.current = true; }}
      onPointerOver={() => { gl.domElement.style.cursor = 'pointer'; }}
      onPointerOut={() => { gl.domElement.style.cursor = 'grab'; }}>
      <group ref={body}>
        {/* curled body */}
        <mesh position={[0, 0.13, 0]} scale={[1.18, 0.74, 0.95]} castShadow>
          <sphereGeometry args={[0.17, 24, 18]} />
          <Toon color={FUR} />
          <Outlines thickness={0.016} color={INK} />
        </mesh>
        {/* tabby stripes along the back */}
        {[-0.07, 0.01, 0.09].map((sx, i) => (
          <mesh key={i} position={[sx, 0.225, 0]} rotation={[0, 0, 0.15 - i * 0.15]} scale={[0.35, 0.1, 1.05]}>
            <sphereGeometry args={[0.12, 10, 8]} />
            <Toon color={FUR_DARK} />
          </mesh>
        ))}
        {/* head — muzzle, nose, whiskers, ears */}
        <group ref={headG} position={[0.17, 0.18, 0.1]}>
          <mesh castShadow>
            <sphereGeometry args={[0.12, 20, 16]} />
            <Toon color={FUR} />
            <Outlines thickness={0.013} color={INK} />
          </mesh>
          {/* muzzle */}
          <mesh position={[0.045, -0.035, 0.06]} scale={[1.15, 0.8, 1]}>
            <sphereGeometry args={[0.052, 14, 10]} />
            <Toon color={CREAM} />
          </mesh>
          {/* tiny content smile */}
          <mesh position={[0.092, -0.035, 0.085]} rotation={[0.2, 0.6, Math.PI]}>
            <torusGeometry args={[0.013, 0.0045, 6, 10, Math.PI]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          {/* pink nose */}
          <mesh position={[0.085, -0.012, 0.083]} rotation={[0, 0.6, Math.PI]}>
            <coneGeometry args={[0.016, 0.018, 4]} />
            <meshBasicMaterial color="#E58B9B" />
          </mesh>
          {/* whiskers */}
          {[-0.06, 0, 0.05].map((wy, i) => (
            <group key={i}>
              <mesh position={[0.1, -0.03 + wy * 0.3, 0.115]} rotation={[0, 0.45, 0.12 + wy]}>
                <cylinderGeometry args={[0.0014, 0.0014, 0.085, 4]} />
                <meshBasicMaterial color="#FFFDF8" transparent opacity={0.85} />
              </mesh>
            </group>
          ))}
          {/* ears with inner */}
          <mesh ref={earL} position={[-0.035, 0.1, 0.035]} rotation={[0, 0, 0.22]}>
            <coneGeometry args={[0.045, 0.09, 4]} />
            <Toon color={FUR_DARK} />
            <Outlines thickness={0.008} color={INK} />
          </mesh>
          <mesh position={[-0.033, 0.092, 0.045]} rotation={[0, 0, 0.22]}>
            <coneGeometry args={[0.024, 0.05, 4]} />
            <meshBasicMaterial color="#F0B4BE" />
          </mesh>
          <mesh ref={earR} position={[0.055, 0.095, -0.01]} rotation={[0, 0, -0.18]}>
            <coneGeometry args={[0.045, 0.09, 4]} />
            <Toon color={FUR_DARK} />
            <Outlines thickness={0.008} color={INK} />
          </mesh>
          {/* sleeping eyes (gentle shut arcs) */}
          <group ref={eyesShut}>
            <mesh position={[0.045, 0.012, 0.092]} rotation={[0.25, 0.55, Math.PI]}>
              <torusGeometry args={[0.018, 0.0045, 6, 10, Math.PI]} />
              <meshBasicMaterial color={INK} />
            </mesh>
            <mesh position={[0.1, 0.012, 0.038]} rotation={[0.25, 1.1, Math.PI]}>
              <torusGeometry args={[0.018, 0.0045, 6, 10, Math.PI]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          </group>
          {/* awake eyes (round, sweet) */}
          <group ref={eyesOpen} scale={0.0001}>
            <mesh position={[0.045, 0.015, 0.094]}>
              <sphereGeometry args={[0.014, 8, 6]} />
              <meshBasicMaterial color={INK} />
            </mesh>
            <mesh position={[0.1, 0.015, 0.04]}>
              <sphereGeometry args={[0.014, 8, 6]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          </group>
        </group>
        {/* front paws tucked under the chin */}
        <mesh position={[0.16, 0.045, 0.16]} scale={[1.4, 0.7, 1]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <Toon color={CREAM} />
          <Outlines thickness={0.007} color={INK} />
        </mesh>
        <mesh position={[0.21, 0.045, 0.1]} scale={[1.4, 0.7, 1]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <Toon color={CREAM} />
          <Outlines thickness={0.007} color={INK} />
        </mesh>
        {/* hind haunch */}
        <mesh position={[-0.12, 0.15, -0.02]} scale={[0.9, 0.75, 0.85]}>
          <sphereGeometry args={[0.13, 16, 12]} />
          <Toon color={FUR} />
          <Outlines thickness={0.012} color={INK} />
        </mesh>
        {/* striped tail wrapped around the body */}
        <mesh ref={tail} position={[-0.14, 0.07, 0.08]} rotation={[Math.PI / 2, 0, 0.15]}>
          <torusGeometry args={[0.15, 0.034, 8, 16, Math.PI * 1.25]} />
          <Toon color={FUR_DARK} />
          <Outlines thickness={0.01} color={INK} />
        </mesh>
        {/* happy hearts when poked */}
        {[0, 1, 2].map(i => (
          <mesh key={'h' + i} ref={(el) => { hearts.current[i] = el; }} position={[0.1, 0.34, 0.1]}>
            <sphereGeometry args={[0.022, 8, 6]} />
            <meshBasicMaterial color="#EB8197" transparent opacity={0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ---------------- a wall clock that actually ticks ---------------- */
function WallClock() {
  const minute = useRef<THREE.Mesh>(null);
  const hour = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (minute.current) minute.current.rotation.z = -t * 0.105; // ~1 turn/min
    if (hour.current) hour.current.rotation.z = -t * 0.0087;
  });
  return (
    <group position={[1.7, 2.35, -3.18]}>
      <mesh>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 24]} />
        <Toon color="#FFFDF8" />
        <Outlines thickness={0.012} color={INK} />
      </mesh>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh ref={minute} position={[0, 0, -0.03]}>
          <boxGeometry args={[0.016, 0.15, 0.008]} />
          <meshBasicMaterial color={INK} />
        </mesh>
        <mesh ref={hour} position={[0, 0, -0.032]}>
          <boxGeometry args={[0.02, 0.1, 0.008]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.026]} rotation={[Math.PI / 2, 0, 0]}>
        <sphereGeometry args={[0.018, 10, 8]} />
        <meshBasicMaterial color="#ED9C74" />
      </mesh>
    </group>
  );
}

/* ---------------- swaying plant ---------------- */
function Plant() {
  const leaves = useRef<THREE.Group>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (leaves.current) leaves.current.rotation.z = Math.sin(t * 0.85) * 0.045;
  });
  return (
    <group position={[-2.3, 0, -1.4]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.13, 0.32, 16]} />
        <Toon color="#ED9C74" />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <group ref={leaves} position={[0, 0.32, 0]}>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0.12]} castShadow>
          <coneGeometry args={[0.2, 0.75, 10]} />
          <Toon color="#7FC295" />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
        <mesh position={[-0.18, 0.18, 0.05]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.14, 0.5, 8]} />
          <Toon color="#AEDAB9" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
        <mesh position={[0.18, 0.16, -0.04]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.14, 0.46, 8]} />
          <Toon color="#AEDAB9" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
      </group>
    </group>
  );
}

/* ---------------- a little bird crossing the sunset, now and then ----------- */
function Bird() {
  const g = useRef<THREE.Group>(null);
  const wL = useRef<THREE.Mesh>(null);
  const wR = useRef<THREE.Mesh>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const phase = (t % 16) / 3.2; // crosses for ~3.2s every 16s
    if (!g.current) return;
    if (phase < 1) {
      g.current.visible = true;
      g.current.position.x = -0.55 + phase * 1.1;
      g.current.position.y = 0.28 + Math.sin(phase * Math.PI * 2) * 0.05;
      const flap = Math.sin(t * 16) * 0.6;
      if (wL.current) wL.current.rotation.z = 0.5 + flap;
      if (wR.current) wR.current.rotation.z = -0.5 - flap;
    } else {
      g.current.visible = false;
    }
  });
  return (
    <group ref={g} position={[0, 0.28, 0.062]} scale={0.55}>
      <mesh ref={wL} position={[-0.025, 0, 0]}>
        <boxGeometry args={[0.05, 0.012, 0.004]} />
        <meshBasicMaterial color="#6B5440" />
      </mesh>
      <mesh ref={wR} position={[0.025, 0, 0]}>
        <boxGeometry args={[0.05, 0.012, 0.004]} />
        <meshBasicMaterial color="#6B5440" />
      </mesh>
    </group>
  );
}

/* ---------------- floor lamp — click to switch on/off ---------------- */
function Lamp() {
  const { gl } = useThree();
  const on = useRef(true);
  const light = useRef<THREE.PointLight>(null);
  const bulb = useRef<THREE.Mesh>(null);
  const chain = useRef<THREE.Group>(null);
  const pullT = useRef(-10);
  const litColor = useMemo(() => new THREE.Color('#FFF3D0'), []);
  const offColor = useMemo(() => new THREE.Color('#CDBFA8'), []);
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    if (light.current) light.current.intensity = damp(light.current.intensity, on.current ? 3.2 : 0, 8, dt);
    if (bulb.current) (bulb.current.material as THREE.MeshBasicMaterial).color.lerp(on.current ? litColor : offColor, Math.min(1, dt * 8));
    // the pull-chain swings after a tug, then settles
    if (chain.current) {
      const e = t - pullT.current;
      const amp = e > 0 && e < 2.4 ? Math.exp(-e * 2.2) * 0.5 : 0;
      chain.current.rotation.z = Math.sin(e * 14) * amp;
      chain.current.rotation.x = Math.cos(e * 11) * amp * 0.4;
    }
  });
  return (
    <group position={[1.95, 0, -1.55]}
      onClick={(e) => { e.stopPropagation(); on.current = !on.current; pullT.current = performance.now() / 1000; }}
      onPointerOver={() => { gl.domElement.style.cursor = 'pointer'; }}
      onPointerOut={() => { gl.domElement.style.cursor = 'grab'; }}>
      {/* pull chain — give it a tug */}
      <group ref={chain} position={[0.16, 1.42, 0]}>
        <mesh position={[0, -0.07, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.14, 6]} />
          <Toon color="#B5A188" />
        </mesh>
        <mesh position={[0, -0.16, 0]}>
          <sphereGeometry args={[0.018, 8, 6]} />
          <Toon color="#F5CE74" />
          <Outlines thickness={0.006} color={INK} />
        </mesh>
      </group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.17, 0.2, 0.06, 18]} />
        <Toon color="#CBBCEE" />
        <Outlines thickness={0.015} color={INK} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 1.4, 8]} />
        <Toon color={INK} />
      </mesh>
      <mesh position={[0, 1.56, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 0.34, 22, 1, true]} />
        <Toon color="#FBF1E0" side={THREE.DoubleSide} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <mesh ref={bulb} position={[0, 1.45, 0]}>
        <sphereGeometry args={[0.07, 12, 10]} />
        <meshBasicMaterial color="#FFF3D0" toneMapped={false} />
      </mesh>
      <pointLight ref={light} position={[0, 1.5, 0]} intensity={3.2} distance={5.5} color="#FFD9A0" />
    </group>
  );
}

/* ---------------- string lights — a soft garland above the couch ---------------- */
function StringLights() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const pts = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      const x = -1.9 + u * 3.8;
      const y = 2.78 - Math.sin(u * Math.PI) * 0.42; // hanging swag
      arr.push([x, y, -3.05]);
    }
    return arr;
  }, []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.65 + Math.sin(t * 1.6 + i * 1.1) * 0.3;
    });
  });
  return (
    <group>
      {pts.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={p}>
          <sphereGeometry args={[i % 2 ? 0.035 : 0.028, 10, 8]} />
          <meshBasicMaterial color={i % 3 === 0 ? '#FFE9A8' : i % 3 === 1 ? '#F8CDB4' : '#D8CCF2'} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------- ambience: floating light motes + mug steam ---------------- */
const MOTES = [
  // a few dance in the window light shaft, a couple drift in the room
  [-1.78, 1.5, -2.7], [-1.7, 0.9, -2.4],
  [0.5, 1.8, -1.8], [1.6, 1.3, -0.8], [-0.6, 2.1, -0.6],
] as const;

function Motes() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = MOTES[i][1] + Math.sin(t * (0.5 + i * 0.11) + i * 1.7) * 0.16;
      m.position.x = MOTES[i][0] + Math.cos(t * 0.3 + i * 2.1) * 0.06;
    });
  });
  return (
    <group>
      {MOTES.map((p, i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[p[0], p[1], p[2]]}>
          <sphereGeometry args={[0.022, 8, 6]} />
          <meshBasicMaterial color="#FFE9A8" transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}


/* ---------------- wall sticky note ---------------- */
function WallNote({ x, y, color, tilt = 0 }: { x: number; y: number; color: string; tilt?: number }) {
  return (
    <group position={[x, y, -3.17]} rotation={[0, 0, tilt]}>
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.36, 0.3]} />
        <meshBasicMaterial color={INK} />
      </mesh>
      <mesh>
        <planeGeometry args={[0.31, 0.25]} />
        <Toon color={color} />
      </mesh>
      <mesh position={[0, 0.14, 0.01]}>
        <sphereGeometry args={[0.024, 10, 8]} />
        <Toon color="#EB8197" />
        <Outlines thickness={0.007} color={INK} />
      </mesh>
    </group>
  );
}

/* ---------------- the room ---------------- */
function RoomScene({ state }: { state: OrbState }) {
  // tiny generated canvas textures (no asset downloads): the window sky
  // gradient and soft wooden floor planks.
  const sky = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 8; c.height = 64;
    const g = c.getContext('2d')!;
    const grad = g.createLinearGradient(0, 0, 0, 64);
    grad.addColorStop(0, '#F7CBA4'); grad.addColorStop(0.55, '#E7C0DE'); grad.addColorStop(1, '#CBD8F0');
    g.fillStyle = grad; g.fillRect(0, 0, 8, 64);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    return tx;
  }, []);
  const ceilPlanks = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#F7EBD6'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#EBD9BC'; g.lineWidth = 2.5;
    for (let y = 0; y <= 128; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(128, y); g.stroke(); }
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(4, 4);
    return tx;
  }, []);
  const planks = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 128; c.height = 128;
    const g = c.getContext('2d')!;
    g.fillStyle = '#F4E3C8'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#E6D0AC'; g.lineWidth = 3;
    for (let x = 0; x <= 128; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
    // staggered plank ends
    g.lineWidth = 2.5;
    for (let x = 16; x <= 128; x += 32) {
      const y = ((x * 37) % 128);
      g.beginPath(); g.moveTo(x - 16, y); g.lineTo(x + 16, y); g.stroke();
    }
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
    tx.repeat.set(5, 5);
    return tx;
  }, []);

  return (
    <group>
      {/* slightly deeper dusk so the warm lights actually pool */}
      {/* atmosphere — dusk base, warm pools of light */}
      <ambientLight intensity={0.58} color="#FFE9DC" />
      <hemisphereLight intensity={0.4} color="#F4E6FF" groundColor="#E8CFAE" />
      <directionalLight position={[-2.6, 3.1, -0.6]} intensity={1.5} color="#FFD9B0" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} />
      <pointLight position={[0, 2.25, -0.2]} intensity={1.9} distance={5.5} color="#FFE9B8" />

      {/* floor · rug · walls · ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <Toon map={planks} color="#FFFFFF" />
      </mesh>
      {/* warm sun patch spilling in from the window */}
      <mesh rotation={[-Math.PI / 2, 0, 0.4]} position={[-1.7, 0.008, -2.15]} scale={[1, 1.7, 1]}>
        <circleGeometry args={[0.62, 24]} />
        <meshBasicMaterial color="#FFE9C9" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* soft light shaft from the window down to the sun patch */}
      <mesh position={[-1.73, 1.05, -2.62]} rotation={[0.5, 0, 0]}>
        <planeGeometry args={[1.35, 2.4]} />
        <meshBasicMaterial color="#FFE3B8" transparent opacity={0.1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -0.5]}>
        <circleGeometry args={[1.95, 40]} />
        <Toon color="#D8CCF2" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, -0.5]}>
        <ringGeometry args={[1.88, 1.95, 40]} />
        <meshBasicMaterial color={INK} transparent opacity={0.35} />
      </mesh>
      {/* grounded: soft contact shadows under everything */}
      <ContactShadows position={[0, 0.026, -0.5]} opacity={0.3} scale={9} blur={2.6} far={2.5} resolution={512} frames={1} color="#4A3826" />
      <mesh position={[0, 1.7, -3.25]}>
        <planeGeometry args={[12, 3.6]} />
        <Toon color="#ECE4F6" />
      </mesh>
      <mesh position={[-3.45, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3.6]} />
        <Toon color="#F0E6EE" />
      </mesh>
      <mesh position={[3.45, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3.6]} />
        <Toon color="#F0E6EE" />
      </mesh>
      <mesh position={[0, 3.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <Toon map={ceilPlanks} color="#FFFFFF" />
      </mesh>
      {/* wainscot line on the back wall */}
      <mesh position={[0, 1.06, -3.24]}>
        <planeGeometry args={[12, 0.025]} />
        <meshBasicMaterial color={INK} transparent opacity={0.16} />
      </mesh>

      {/* ── architecture: beams, crown molding, baseboards ── */}
      {/* warm wooden ceiling beams */}
      {[-2.3, -0.8, 0.9].map((bz, i) => (
        <mesh key={'beam' + i} position={[0, 3.3, bz]} castShadow>
          <boxGeometry args={[12, 0.16, 0.24]} />
          <Toon color="#C89B6E" />
          <Outlines thickness={0.03} color={INK} />
        </mesh>
      ))}
      {/* crown molding where the walls meet the ceiling */}
      <mesh position={[0, 3.26, -3.2]}><boxGeometry args={[12, 0.09, 0.1]} /><Toon color="#E8D4B8" /></mesh>
      <mesh position={[-3.41, 3.26, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 0.09, 0.1]} /><Toon color="#E8D4B8" /></mesh>
      <mesh position={[3.41, 3.26, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 0.09, 0.1]} /><Toon color="#E8D4B8" /></mesh>
      {/* baseboards along the floor */}
      <mesh position={[0, 0.07, -3.2]}><boxGeometry args={[12, 0.14, 0.06]} /><Toon color="#EFDCC0" /></mesh>
      <mesh position={[-3.42, 0.07, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 0.14, 0.06]} /><Toon color="#EFDCC0" /></mesh>
      <mesh position={[3.42, 0.07, 0]} rotation={[0, Math.PI / 2, 0]}><boxGeometry args={[12, 0.14, 0.06]} /><Toon color="#EFDCC0" /></mesh>

      {/* round mirror on the left wall */}
      <group position={[-3.4, 1.95, 0.55]} rotation={[0, Math.PI / 2, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.34, 0.05, 28]} />
          <Toon color="#C89B6E" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
        <mesh position={[0, 0, 0.029]}>
          <circleGeometry args={[0.27, 28]} />
          <meshBasicMaterial color="#D7E4EE" />
        </mesh>
        <mesh position={[-0.08, 0.09, 0.032]} rotation={[0, 0, 0.7]} scale={[1, 0.35, 1]}>
          <circleGeometry args={[0.1, 16]} />
          <meshBasicMaterial color="#F2F8FC" />
        </mesh>
      </group>


      {/* window with sunset (back wall, left) */}
      <group position={[-1.75, 1.92, -3.2]}>
        <RoundedBox args={[1.5, 1.66, 0.1]} radius={0.05}>
          <Toon color="#E3C397" />
          <Outlines thickness={0.025} color={INK} />
        </RoundedBox>
        <mesh position={[0, 0, 0.052]}>
          <planeGeometry args={[1.24, 1.4]} />
          <meshBasicMaterial map={sky} toneMapped={false} />
        </mesh>
        <mesh position={[0.3, 0.34, 0.06]}>
          <circleGeometry args={[0.15, 24]} />
          <meshBasicMaterial color="#F5CE74" toneMapped={false} />
        </mesh>
        <Clouds />
        <Bird />
        <mesh position={[0, 0, 0.055]}><boxGeometry args={[0.045, 1.4, 0.012]} /><meshBasicMaterial color={INK} /></mesh>
        <mesh position={[0, 0.02, 0.055]}><boxGeometry args={[1.24, 0.045, 0.012]} /><meshBasicMaterial color={INK} /></mesh>
        <mesh position={[0, -0.9, 0.08]}><boxGeometry args={[1.62, 0.09, 0.16]} /><Toon color="#E3C397" /><Outlines thickness={0.015} color={INK} /></mesh>
        {/* curtain rod + soft drapes */}
        <mesh position={[0, 0.95, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 2.1, 8]} />
          <Toon color="#B58B5C" />
        </mesh>
        {/* proper curtains: gathered drapes hugging the frame + a soft valance */}
        {[-1, 1].map(side => (
          <group key={side} position={[side * 0.86, 0, 0.1]}>
            <mesh position={[0, 0.05, 0]} rotation={[0, 0, side * -0.04]} castShadow>
              <capsuleGeometry args={[0.105, 1.55, 8, 14]} />
              <Toon color="#F4D9BF" />
              <Outlines thickness={0.018} color={INK} />
            </mesh>
            <mesh position={[side * 0.1, 0.1, -0.02]} rotation={[0, 0, side * -0.08]}>
              <capsuleGeometry args={[0.075, 1.35, 8, 14]} />
              <Toon color="#EFC9A8" />
            </mesh>
            {/* tieback gathers the drape at the waist */}
            <mesh position={[0, -0.32, 0.05]} rotation={[Math.PI / 2.2, 0, 0]}>
              <torusGeometry args={[0.11, 0.02, 8, 14]} />
              <Toon color="#ED9C74" />
              <Outlines thickness={0.008} color={INK} />
            </mesh>
          </group>
        ))}
        {/* valance across the top */}
        <RoundedBox args={[1.95, 0.2, 0.12]} radius={0.05} position={[0, 0.88, 0.1]} castShadow>
          <Toon color="#F4D9BF" />
          <Outlines thickness={0.016} color={INK} />
        </RoundedBox>
        {[-0.6, -0.2, 0.2, 0.6].map((sx, i) => (
          <mesh key={'v' + i} position={[sx, 0.88, 0.165]}>
            <boxGeometry args={[0.018, 0.18, 0.01]} />
            <Toon color="#EFC9A8" />
          </mesh>
        ))}
      </group>

      <WallClock />

      {/* memory notes pinned to the wall */}
      <WallNote x={0.55} y={2.15} color="#F5CE74" tilt={-0.09} />
      <WallNote x={1.05} y={1.92} color="#C2E6D2" tilt={0.07} />
      <WallNote x={0.62} y={1.6} color="#A9C9E9" tilt={-0.04} />

      {/* art on the left wall — a reward for looking around */}
      <group position={[-3.42, 1.72, -0.7]} rotation={[0, Math.PI / 2, 0]} scale={1.35}>
        <RoundedBox args={[0.72, 0.58, 0.05]} radius={0.02}>
          <Toon color="#FFFDF8" />
          <Outlines thickness={0.012} color={INK} />
        </RoundedBox>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.58, 0.44]} />
          <meshBasicMaterial map={paintingTextures().sunsetHills} />
        </mesh>
      </group>

      {/* shelf with a tiny frame + plant (back wall, right) */}
      <group position={[2.25, 1.78, -3.12]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.06, 0.24]} />
          <Toon color="#E3C397" />
          <Outlines thickness={0.018} color={INK} />
        </mesh>
        <RoundedBox args={[0.3, 0.26, 0.04]} radius={0.015} position={[-0.24, 0.165, 0]}>
          <Toon color="#FFFDF8" />
          <Outlines thickness={0.01} color={INK} />
        </RoundedBox>
        <mesh position={[-0.24, 0.16, 0.022]}>
          <planeGeometry args={[0.22, 0.16]} />
          <meshBasicMaterial map={paintingTextures().tinyHouse} />
        </mesh>
        <mesh position={[0.22, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.055, 0.14, 14]} />
          <Toon color="#F4B89A" />
          <Outlines thickness={0.01} color={INK} />
        </mesh>
        <mesh position={[0.22, 0.24, 0]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <Toon color="#7FC295" />
          <Outlines thickness={0.01} color={INK} />
        </mesh>
        {/* a few well-loved books */}
        {[['#F3A8B6', -0.02, 0.1], ['#A9C9E9', 0.035, 0.115], ['#F5CE74', 0.09, 0.105]].map(([col, x, h], i) => (
          <mesh key={i} position={[Number(x), 0.03 + Number(h) / 2, 0.02]} rotation={[0, 0, i === 2 ? -0.12 : 0]}>
            <boxGeometry args={[0.045, Number(h) * 2, 0.16]} />
            <Toon color={String(col)} />
            <Outlines thickness={0.008} color={INK} />
          </mesh>
        ))}
      </group>

      {/* the couch across the table */}
      <group position={[0, 0, -1.45]}>
        <RoundedBox args={[2.5, 0.46, 0.95]} radius={0.12} position={[0, 0.3, 0]} castShadow>
          <Toon color="#ED9C74" />
          <Outlines thickness={0.03} color={INK} />
        </RoundedBox>
        <RoundedBox args={[2.5, 0.85, 0.26]} radius={0.1} position={[0, 0.82, -0.38]} castShadow>
          <Toon color="#F4B89A" />
          <Outlines thickness={0.03} color={INK} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.66, 0.95]} radius={0.1} position={[-1.36, 0.55, 0]}>
          <Toon color="#F4B89A" />
          <Outlines thickness={0.025} color={INK} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.66, 0.95]} radius={0.1} position={[1.36, 0.55, 0]}>
          <Toon color="#F4B89A" />
          <Outlines thickness={0.025} color={INK} />
        </RoundedBox>
        {/* the empty sunny cushion — your seat across, kept warm */}
        <RoundedBox args={[0.9, 0.14, 0.72]} radius={0.06} position={[0.62, 0.58, 0.02]}>
          <Toon color="#F5CE74" />
          <Outlines thickness={0.02} color={INK} />
        </RoundedBox>
      </group>

      {/* the companion, across the table */}
      <Suspense fallback={null}>
        <CompanionModel state={state} />
      </Suspense>

      {/* you, seated — knees, hands, feet, cushion */}
      <YourPresence />

      {/* garland of soft lights above the couch */}
      <StringLights />

      {/* the hearth — flicker + warmth from the right */}
      <Fireplace />

      {/* a sleeping companion-of-the-companion */}
      <Cat />

      {/* small cozy table in front of you, with two mugs */}
      <group position={[0, 0, 0.45]}>
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.56, 0.07, 36]} />
          <Toon color="#F0D9B4" />
          <Outlines thickness={0.025} color={INK} />
        </mesh>
        <mesh position={[0, 0.36, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.32, 12]} />
          <Toon color="#E3C397" />
          <Outlines thickness={0.012} color={INK} />
        </mesh>
        <mesh position={[0, 0.18, 0]}>
          <sphereGeometry args={[0.085, 12, 10]} />
          <Toon color="#D9B583" />
          <Outlines thickness={0.01} color={INK} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <cylinderGeometry args={[0.05, 0.07, 0.12, 12]} />
          <Toon color="#E3C397" />
        </mesh>
        {/* coasters under the mugs */}
        <mesh position={[-0.2, 0.6, 0.08]}>
          <cylinderGeometry args={[0.095, 0.095, 0.014, 18]} />
          <Toon color="#D8CCF2" />
          <Outlines thickness={0.008} color={INK} />
        </mesh>
        <mesh position={[0.21, 0.6, -0.05]}>
          <cylinderGeometry args={[0.095, 0.095, 0.014, 18]} />
          <Toon color="#D8CCF2" />
          <Outlines thickness={0.008} color={INK} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.24, 0.28, 0.06, 24]} />
          <Toon color="#E3C397" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
        {/* mugs — click one to pick it up and take a sip */}
        <SipMug x={-0.2} z={0.08} color="#AEDAB9" />
        <SipMug x={0.21} z={-0.05} color="#A9C9E9" flip />
      </group>

      {/* warm floor lamp (right) — click to switch it on/off */}
      <Lamp />

      {/* leafy plant (left) — leaves sway gently */}
      <Plant />

      {/* pendant light above the table */}
      <group position={[0, 0, -0.2]}>
        <mesh position={[0, 3.0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
          <Toon color={INK} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.26, 0.24, 20, 1, true]} />
          <Toon color="#F5CE74" side={THREE.DoubleSide} />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
        {/* warm glowing inner shade — no dark hollow when seen from below */}
        <mesh position={[0, 2.49, 0]}>
          <coneGeometry args={[0.24, 0.22, 20, 1, true]} />
          <meshBasicMaterial color="#FFE9B8" side={THREE.BackSide} toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.42, 0]}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshBasicMaterial color="#FFF3D0" toneMapped={false} />
        </mesh>
      </group>

      <Motes />
    </group>
  );
}

/* ---------------- exported room ---------------- */
export default function ImmersiveRoom3D({ state, apiRef, onFail }: {
  state: OrbState;
  apiRef: React.MutableRefObject<Room3DApi | null>;
  onFail?: () => void;
}) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 2 }} aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        shadows
        flat
        camera={{ fov: 60, near: 0.1, far: 30, position: [0, 1.22, 2.9] }}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail?.(); });
        }}
      >
        {/* scene-level atmosphere — must attach to the scene root, not a group */}
        <color attach="background" args={['#ECE0F0']} />
        <fog attach="fog" args={['#ECE0F0', 8, 16]} />
        <LookControls apiRef={apiRef} />
        <RoomScene state={state} />
      </Canvas>
      {/* soft fade-in as the camera settles into your seat */}
      <div className="scene-enter" />
    </div>
  );
}
