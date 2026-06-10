'use client';

/* eslint-disable react-hooks/immutability -- R3F is an imperative renderer:
   mutating the camera / three objects inside useEffect & useFrame is the
   idiomatic (and only performant) way to animate; these are not React state. */

import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Outlines, RoundedBox } from '@react-three/drei';
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

/* ---------------- seated look-around camera ---------------- */
function LookControls({ apiRef }: { apiRef: React.MutableRefObject<Room3DApi | null> }) {
  const { camera, gl } = useThree();
  const v = useRef({ yaw: 0, pitch: 0, tyaw: 0, tpitch: 0, drag: false, lx: 0, ly: 0, basePitch: 0 });

  useEffect(() => {
    camera.position.set(0, 1.22, 2.9);
    camera.lookAt(0, 1.0, -1.2);
    v.current.basePitch = camera.rotation.x;
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
      s.tyaw = clamp(s.tyaw + (e.clientX - s.lx) * 0.0032, -0.62, 0.62);
      s.tpitch = clamp(s.tpitch + (e.clientY - s.ly) * 0.0022, -0.30, 0.26);
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
    s.yaw = damp(s.yaw, s.tyaw, 6, dt);
    s.pitch = damp(s.pitch, s.tpitch, 6, dt);
    const t = st.clock.elapsedTime;
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

/* ---------------- the 3D doodle companion ---------------- */
function Companion3D({ state }: { state: OrbState }) {
  const lean = useRef<THREE.Group>(null);
  const breath = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);
  const mouth = useRef<THREE.Mesh>(null);
  const think = useRef<THREE.Group>(null);

  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    // breathing — whole figure, from the seat up
    if (breath.current) {
      const s = 1 + Math.sin(t * 1.35) * 0.016;
      breath.current.scale.set(1, s, 1);
    }
    // head bob + tilt
    if (head.current) {
      head.current.rotation.z = damp(head.current.rotation.z,
        Math.sin(t * 0.8) * 0.045 + (state === 'thinking' || state === 'saving' ? 0.09 : 0), 4, dt);
      head.current.position.y = 1.52 + Math.sin(t * 1.35) * 0.012;
    }
    // blink every ~4.4s
    const blink = (t % 4.4) < 0.13 ? 0.12 : 1;
    if (eyeL.current) eyeL.current.scale.y = damp(eyeL.current.scale.y, blink, 30, dt);
    if (eyeR.current) eyeR.current.scale.y = damp(eyeR.current.scale.y, blink, 30, dt);
    // mouth talks while Echo speaks
    if (mouth.current) {
      const speak = state === 'speaking' ? 0.55 + Math.abs(Math.sin(t * 8.5)) * 1.5 : 1;
      mouth.current.scale.y = damp(mouth.current.scale.y, speak, 14, dt);
    }
    // thought dots while reflecting / saving
    if (think.current) {
      const on = state === 'thinking' || state === 'saving' ? 1 : 0;
      const sc = damp(think.current.scale.x, on, 8, dt);
      think.current.scale.setScalar(Math.max(0.0001, sc));
      think.current.position.y = 2.0 + Math.sin(t * 2.2) * 0.03;
    }
    // lean toward you when listening, settle back otherwise
    if (lean.current) {
      lean.current.rotation.x = damp(lean.current.rotation.x, state === 'listening' ? 0.09 : 0, 5, dt);
      lean.current.position.z = damp(lean.current.position.z, state === 'listening' ? 0.1 : 0, 5, dt);
    }
  });

  const skin = '#F8E4D2';
  return (
    <group position={[-0.52, 0, -1.18]}>
      <group ref={lean}>
        <group ref={breath}>
          {/* body — cozy lavender sweater */}
          <mesh position={[0, 0.93, 0]} scale={[1, 1.06, 0.86]} castShadow>
            <sphereGeometry args={[0.42, 28, 22]} />
            <meshToonMaterial color="#CBBCEE" />
            <Outlines thickness={0.025} color={INK} />
          </mesh>
          {/* arms */}
          <mesh position={[-0.38, 0.86, 0.1]} rotation={[0.2, 0, 0.5]} castShadow>
            <capsuleGeometry args={[0.09, 0.3, 6, 12]} />
            <meshToonMaterial color="#CBBCEE" />
            <Outlines thickness={0.018} color={INK} />
          </mesh>
          <mesh position={[0.38, 0.86, 0.1]} rotation={[0.2, 0, -0.5]}>
            <capsuleGeometry args={[0.09, 0.3, 6, 12]} />
            <meshToonMaterial color="#CBBCEE" />
            <Outlines thickness={0.018} color={INK} />
          </mesh>
          {/* hands resting */}
          <mesh position={[-0.2, 0.62, 0.3]}>
            <sphereGeometry args={[0.085, 16, 12]} />
            <meshToonMaterial color={skin} />
            <Outlines thickness={0.015} color={INK} />
          </mesh>
          <mesh position={[0.2, 0.62, 0.3]}>
            <sphereGeometry args={[0.085, 16, 12]} />
            <meshToonMaterial color={skin} />
            <Outlines thickness={0.015} color={INK} />
          </mesh>
          {/* little feet */}
          <mesh position={[-0.16, 0.42, 0.4]} scale={[1, 0.7, 1.3]}>
            <sphereGeometry args={[0.09, 16, 12]} />
            <meshToonMaterial color={skin} />
            <Outlines thickness={0.015} color={INK} />
          </mesh>
          <mesh position={[0.16, 0.42, 0.4]} scale={[1, 0.7, 1.3]}>
            <sphereGeometry args={[0.09, 16, 12]} />
            <meshToonMaterial color={skin} />
            <Outlines thickness={0.015} color={INK} />
          </mesh>

          {/* head */}
          <group ref={head} position={[0, 1.52, 0]}>
            <mesh castShadow>
              <sphereGeometry args={[0.34, 30, 24]} />
              <meshToonMaterial color={skin} />
              <Outlines thickness={0.025} color={INK} />
            </mesh>
            {/* soft hair cap */}
            <mesh position={[0, 0.07, -0.05]} rotation={[-0.35, 0, 0]}>
              <sphereGeometry args={[0.355, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
              <meshToonMaterial color="#7A6A58" />
              <Outlines thickness={0.02} color={INK} />
            </mesh>
            {/* eyes */}
            <mesh ref={eyeL} position={[-0.115, 0.015, 0.305]}>
              <sphereGeometry args={[0.038, 12, 10]} />
              <meshBasicMaterial color={INK} />
            </mesh>
            <mesh ref={eyeR} position={[0.115, 0.015, 0.305]}>
              <sphereGeometry args={[0.038, 12, 10]} />
              <meshBasicMaterial color={INK} />
            </mesh>
            {/* blush */}
            <mesh position={[-0.18, -0.08, 0.27]} scale={[1, 0.7, 0.5]}>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshBasicMaterial color="#F3A8B6" transparent opacity={0.75} />
            </mesh>
            <mesh position={[0.18, -0.08, 0.27]} scale={[1, 0.7, 0.5]}>
              <sphereGeometry args={[0.055, 12, 10]} />
              <meshBasicMaterial color="#F3A8B6" transparent opacity={0.75} />
            </mesh>
            {/* smile (animates while speaking) */}
            <mesh ref={mouth} position={[0, -0.1, 0.31]} rotation={[0.15, 0, Math.PI]}>
              <torusGeometry args={[0.075, 0.016, 8, 20, Math.PI]} />
              <meshBasicMaterial color={INK} />
            </mesh>
          </group>

          {/* thought dots (shown while reflecting) */}
          <group ref={think} position={[0.42, 2.0, 0]} scale={0.0001}>
            <mesh position={[0, 0, 0]}><sphereGeometry args={[0.028, 10, 8]} /><meshBasicMaterial color="#A98FE0" /></mesh>
            <mesh position={[0.1, 0.12, 0]}><sphereGeometry args={[0.04, 10, 8]} /><meshBasicMaterial color="#A98FE0" /></mesh>
            <mesh position={[0.22, 0.27, 0]}><sphereGeometry args={[0.055, 10, 8]} /><meshBasicMaterial color="#A98FE0" /></mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/* ---------------- ambience: floating light motes + mug steam ---------------- */
const MOTES = [
  [-1.9, 1.2, -1.6], [-0.9, 1.9, -2.4], [0.3, 1.5, -2.0], [1.4, 2.1, -1.2],
  [2.0, 1.1, -0.4], [-1.2, 0.9, 0.4], [0.9, 1.7, 0.6], [-0.2, 2.3, -1.0], [1.7, 1.5, -2.6],
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
          <meshBasicMaterial color="#FFE9A8" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function Steam({ x, z }: { x: number; z: number }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const p = (t * 0.35 + i * 0.33) % 1;
      m.position.y = 0.72 + p * 0.26;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.5 * (1 - p);
      m.position.x = x + Math.sin(p * 6 + i) * 0.02;
    });
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => { refs.current[i] = el; }} position={[x, 0.74, z]}>
          <sphereGeometry args={[0.016, 8, 6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.4} />
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
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.14, 0.01]}>
        <sphereGeometry args={[0.024, 10, 8]} />
        <meshToonMaterial color="#EB8197" />
        <Outlines thickness={0.007} color={INK} />
      </mesh>
    </group>
  );
}

/* ---------------- the room ---------------- */
function RoomScene({ state }: { state: OrbState }) {
  // tiny canvas gradient for the window sky — the only "texture", made locally
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

  return (
    <group>
      {/* atmosphere */}
      <ambientLight intensity={0.85} color="#FFF4EC" />
      <hemisphereLight intensity={0.5} color="#FFF4EC" groundColor="#F3DEBC" />
      <directionalLight position={[-2.6, 3.1, -0.6]} intensity={1.1} color="#FFE2C0" castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={4} shadow-camera-bottom={-4} shadow-bias={-0.0004} />
      <pointLight position={[1.95, 1.5, -1.55]} intensity={2.2} distance={5} color="#FFD9A0" />
      <pointLight position={[0, 2.25, -0.2]} intensity={1.1} distance={5} color="#FFE9B8" />

      {/* floor · rug · walls · ceiling */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshToonMaterial color="#F4E3C8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, -0.5]}>
        <circleGeometry args={[1.95, 40]} />
        <meshToonMaterial color="#D8CCF2" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, -0.5]}>
        <ringGeometry args={[1.88, 1.95, 40]} />
        <meshBasicMaterial color={INK} transparent opacity={0.35} />
      </mesh>
      <mesh position={[0, 1.7, -3.25]}>
        <planeGeometry args={[12, 3.6]} />
        <meshToonMaterial color="#ECE4F6" />
      </mesh>
      <mesh position={[-3.45, 1.7, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3.6]} />
        <meshToonMaterial color="#F0E6EE" />
      </mesh>
      <mesh position={[3.45, 1.7, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[12, 3.6]} />
        <meshToonMaterial color="#F0E6EE" />
      </mesh>
      <mesh position={[0, 3.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshToonMaterial color="#FBF1E0" />
      </mesh>
      {/* wainscot line on the back wall */}
      <mesh position={[0, 1.06, -3.24]}>
        <planeGeometry args={[12, 0.025]} />
        <meshBasicMaterial color={INK} transparent opacity={0.16} />
      </mesh>

      {/* window with sunset (back wall, left) */}
      <group position={[-1.75, 1.92, -3.2]}>
        <RoundedBox args={[1.5, 1.66, 0.1]} radius={0.05}>
          <meshToonMaterial color="#E3C397" />
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
        {[[-0.12, -0.18], [0.06, -0.14], [-0.3, -0.14]].map(([cx, cy], i) => (
          <mesh key={i} position={[cx, cy, 0.058]} scale={[1.6, 0.7, 1]}>
            <circleGeometry args={[0.09, 16]} />
            <meshBasicMaterial color="#FFFFFF" transparent opacity={0.85} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0, 0.055]}><boxGeometry args={[0.045, 1.4, 0.012]} /><meshBasicMaterial color={INK} /></mesh>
        <mesh position={[0, 0.02, 0.055]}><boxGeometry args={[1.24, 0.045, 0.012]} /><meshBasicMaterial color={INK} /></mesh>
        <mesh position={[0, -0.9, 0.08]}><boxGeometry args={[1.62, 0.09, 0.16]} /><meshToonMaterial color="#E3C397" /><Outlines thickness={0.015} color={INK} /></mesh>
      </group>

      {/* memory notes pinned to the wall */}
      <WallNote x={0.55} y={2.15} color="#F5CE74" tilt={-0.09} />
      <WallNote x={1.05} y={1.92} color="#C2E6D2" tilt={0.07} />
      <WallNote x={0.62} y={1.6} color="#A9C9E9" tilt={-0.04} />

      {/* art on the left wall — a reward for looking around */}
      <group position={[-3.42, 1.85, -0.7]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[0.72, 0.58, 0.05]} radius={0.02}>
          <meshToonMaterial color="#FFFDF8" />
          <Outlines thickness={0.012} color={INK} />
        </RoundedBox>
        <mesh position={[0, 0, 0.028]}>
          <planeGeometry args={[0.58, 0.44]} />
          <meshBasicMaterial color="#CBBCEE" />
        </mesh>
        {/* doodle hills + sun inside the frame */}
        <mesh position={[0.14, 0.08, 0.032]}>
          <circleGeometry args={[0.07, 18]} />
          <meshBasicMaterial color="#F5CE74" />
        </mesh>
        <mesh position={[-0.1, -0.12, 0.032]} scale={[1.8, 0.7, 1]}>
          <circleGeometry args={[0.12, 18]} />
          <meshBasicMaterial color="#AEDAB9" />
        </mesh>
        <mesh position={[0.16, -0.15, 0.033]} scale={[1.6, 0.6, 1]}>
          <circleGeometry args={[0.1, 18]} />
          <meshBasicMaterial color="#7FC295" />
        </mesh>
      </group>

      {/* shelf with a tiny frame + plant (back wall, right) */}
      <group position={[2.25, 1.78, -3.12]}>
        <mesh castShadow>
          <boxGeometry args={[1.0, 0.06, 0.24]} />
          <meshToonMaterial color="#E3C397" />
          <Outlines thickness={0.018} color={INK} />
        </mesh>
        <RoundedBox args={[0.3, 0.26, 0.04]} radius={0.015} position={[-0.24, 0.165, 0]}>
          <meshToonMaterial color="#FFFDF8" />
          <Outlines thickness={0.01} color={INK} />
        </RoundedBox>
        <mesh position={[-0.24, 0.16, 0.022]}>
          <planeGeometry args={[0.22, 0.16]} />
          <meshBasicMaterial color="#A9C9E9" />
        </mesh>
        <mesh position={[0.22, 0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.055, 0.14, 14]} />
          <meshToonMaterial color="#F4B89A" />
          <Outlines thickness={0.01} color={INK} />
        </mesh>
        <mesh position={[0.22, 0.24, 0]}>
          <sphereGeometry args={[0.09, 14, 10]} />
          <meshToonMaterial color="#7FC295" />
          <Outlines thickness={0.01} color={INK} />
        </mesh>
      </group>

      {/* the couch across the table */}
      <group position={[0, 0, -1.45]}>
        <RoundedBox args={[2.5, 0.46, 0.95]} radius={0.12} position={[0, 0.3, 0]} castShadow>
          <meshToonMaterial color="#ED9C74" />
          <Outlines thickness={0.03} color={INK} />
        </RoundedBox>
        <RoundedBox args={[2.5, 0.85, 0.26]} radius={0.1} position={[0, 0.82, -0.38]} castShadow>
          <meshToonMaterial color="#F4B89A" />
          <Outlines thickness={0.03} color={INK} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.66, 0.95]} radius={0.1} position={[-1.36, 0.55, 0]}>
          <meshToonMaterial color="#F4B89A" />
          <Outlines thickness={0.025} color={INK} />
        </RoundedBox>
        <RoundedBox args={[0.3, 0.66, 0.95]} radius={0.1} position={[1.36, 0.55, 0]}>
          <meshToonMaterial color="#F4B89A" />
          <Outlines thickness={0.025} color={INK} />
        </RoundedBox>
        {/* the empty sunny cushion — your seat across, kept warm */}
        <RoundedBox args={[0.9, 0.14, 0.72]} radius={0.06} position={[0.62, 0.58, 0.02]}>
          <meshToonMaterial color="#F5CE74" />
          <Outlines thickness={0.02} color={INK} />
        </RoundedBox>
      </group>

      {/* the companion, across the table */}
      <Companion3D state={state} />

      {/* small cozy table in front of you, with two mugs */}
      <group position={[0, 0, 0.45]}>
        <mesh position={[0, 0.56, 0]} castShadow>
          <cylinderGeometry args={[0.56, 0.56, 0.07, 36]} />
          <meshToonMaterial color="#F0D9B4" />
          <Outlines thickness={0.025} color={INK} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.5, 12]} />
          <meshToonMaterial color="#E3C397" />
          <Outlines thickness={0.012} color={INK} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.24, 0.28, 0.06, 24]} />
          <meshToonMaterial color="#E3C397" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
        {/* mugs */}
        <group position={[-0.2, 0.66, 0.08]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.062, 0.13, 18]} />
            <meshToonMaterial color="#AEDAB9" />
            <Outlines thickness={0.012} color={INK} />
          </mesh>
          <mesh position={[-0.085, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.014, 8, 16]} />
            <meshToonMaterial color="#AEDAB9" />
          </mesh>
        </group>
        <group position={[0.21, 0.66, -0.05]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.062, 0.13, 18]} />
            <meshToonMaterial color="#A9C9E9" />
            <Outlines thickness={0.012} color={INK} />
          </mesh>
          <mesh position={[0.085, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.045, 0.014, 8, 16]} />
            <meshToonMaterial color="#A9C9E9" />
          </mesh>
        </group>
      </group>
      <Steam x={-0.2} z={0.53} />
      <Steam x={0.21} z={0.4} />

      {/* warm floor lamp (right) */}
      <group position={[1.95, 0, -1.55]}>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.17, 0.2, 0.06, 18]} />
          <meshToonMaterial color="#CBBCEE" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 1.4, 8]} />
          <meshToonMaterial color={INK} />
        </mesh>
        <mesh position={[0, 1.56, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.3, 0.34, 22, 1, true]} />
          <meshToonMaterial color="#FBF1E0" side={THREE.DoubleSide} />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <sphereGeometry args={[0.07, 12, 10]} />
          <meshBasicMaterial color="#FFF3D0" toneMapped={false} />
        </mesh>
      </group>

      {/* leafy plant (left) */}
      <group position={[-2.3, 0, -1.4]}>
        <mesh position={[0, 0.16, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.13, 0.32, 16]} />
          <meshToonMaterial color="#ED9C74" />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
        <mesh position={[0, 0.62, 0]} rotation={[0, 0, 0.12]} castShadow>
          <coneGeometry args={[0.2, 0.75, 10]} />
          <meshToonMaterial color="#7FC295" />
          <Outlines thickness={0.02} color={INK} />
        </mesh>
        <mesh position={[-0.18, 0.5, 0.05]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.14, 0.5, 8]} />
          <meshToonMaterial color="#AEDAB9" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
        <mesh position={[0.18, 0.48, -0.04]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.14, 0.46, 8]} />
          <meshToonMaterial color="#AEDAB9" />
          <Outlines thickness={0.015} color={INK} />
        </mesh>
      </group>

      {/* pendant light above the table */}
      <group position={[0, 0, -0.2]}>
        <mesh position={[0, 3.0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.8, 6]} />
          <meshToonMaterial color={INK} />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <coneGeometry args={[0.26, 0.24, 20, 1, true]} />
          <meshToonMaterial color="#F5CE74" side={THREE.DoubleSide} />
          <Outlines thickness={0.02} color={INK} />
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
        camera={{ fov: 56, near: 0.1, far: 30, position: [0, 1.22, 2.9] }}
        gl={{ antialias: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); onFail?.(); });
        }}
      >
        {/* scene-level atmosphere — must attach to the scene root, not a group */}
        <color attach="background" args={['#F3EBF6']} />
        <fog attach="fog" args={['#F3EBF6', 8, 16]} />
        <LookControls apiRef={apiRef} />
        <RoomScene state={state} />
      </Canvas>
    </div>
  );
}
