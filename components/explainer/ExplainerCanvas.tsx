'use client';

import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { ExplainerScene } from './ExplainerScene';

export default function ExplainerCanvas({ startMs, running }: { startMs: number; running: boolean }) {
  return (
    <Canvas camera={{ fov: 50, position: [0, 0, 9], near: 0.1, far: 60 }} dpr={[1, 2]}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ gl, scene }) => {
        gl.setClearColor('#191230', 1);
        scene.background = new THREE.Color('#191230');
        scene.fog = new THREE.Fog('#191230', 12, 26);
      }}>
      <ExplainerScene startMs={startMs} running={running} />
    </Canvas>
  );
}
