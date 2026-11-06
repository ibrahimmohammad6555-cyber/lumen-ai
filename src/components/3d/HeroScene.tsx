'use client';

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float, Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useApp } from '@/context/AppContext';

// ─── Core luminous orb ────────────────────────────────────────────────
function LumenCore({ isDark }: { isDark: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x = state.clock.elapsedTime * 0.08;
    meshRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    // Subtle pointer parallax
    const px = state.pointer?.x ?? 0;
    const py = state.pointer?.y ?? 0;
    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      px * 0.4,
      0.04
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      py * 0.3,
      0.04
    );
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.1, 4]} />
      <MeshDistortMaterial
        color={isDark ? '#4f8ef7' : '#3b82f6'}
        emissive={isDark ? '#1e40af' : '#1d4ed8'}
        emissiveIntensity={isDark ? 0.6 : 0.3}
        metalness={0.3}
        roughness={0.1}
        distort={0.25}
        speed={1.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ─── Orbiting data nodes ──────────────────────────────────────────────
function DataNode({ angle, radius, speed, size, color }: {
  angle: number; radius: number; speed: number; size: number; color: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime * speed + angle;
    meshRef.current.position.x = Math.cos(t) * radius;
    meshRef.current.position.y = Math.sin(t * 0.7) * (radius * 0.4);
    meshRef.current.position.z = Math.sin(t) * radius;
    meshRef.current.rotation.x += 0.01;
    meshRef.current.rotation.y += 0.015;
  });

  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.5}
        metalness={0.6}
        roughness={0.2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Ring / orbit path ────────────────────────────────────────────────
function OrbitRing({ radius, rotation }: { radius: number; rotation: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.z += 0.001;
  });

  return (
    <mesh ref={ref} rotation={rotation}>
      <torusGeometry args={[radius, 0.012, 8, 80]} />
      <meshStandardMaterial
        color="#4f8ef7"
        emissive="#4f8ef7"
        emissiveIntensity={0.3}
        transparent
        opacity={0.3}
      />
    </mesh>
  );
}

// ─── Inner scene ─────────────────────────────────────────────────────
function Scene({ isDark, reducedMotion }: { isDark: boolean; reducedMotion: boolean }) {
  const nodes = useMemo(
    () =>
      reducedMotion
        ? []
        : [
            { angle: 0, radius: 2.4, speed: 0.3, size: 0.12, color: '#22d3ee' },
            { angle: 2.1, radius: 2.8, speed: 0.22, size: 0.09, color: '#6366f1' },
            { angle: 4.2, radius: 2.2, speed: 0.38, size: 0.14, color: '#f59e0b' },
            { angle: 1.1, radius: 3.0, speed: 0.18, size: 0.08, color: '#10b981' },
            { angle: 3.5, radius: 2.6, speed: 0.28, size: 0.11, color: '#ec4899' },
          ],
    [reducedMotion]
  );

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={isDark ? 0.3 : 0.6} />
      <pointLight position={[4, 4, 4]} intensity={isDark ? 1.5 : 1.2} color="#4f8ef7" />
      <pointLight position={[-4, -2, -4]} intensity={isDark ? 0.8 : 0.4} color="#22d3ee" />
      <pointLight position={[0, 6, 0]} intensity={isDark ? 0.5 : 0.3} color="#ffffff" />

      {/* Stars background (dark only) */}
      {isDark && !reducedMotion && (
        <Stars radius={50} depth={50} count={800} factor={3} saturation={0.5} fade speed={0.5} />
      )}

      {/* Core orb */}
      <Float speed={reducedMotion ? 0 : 1.5} rotationIntensity={0} floatIntensity={0.4}>
        <LumenCore isDark={isDark} />
      </Float>

      {/* Orbit rings */}
      {!reducedMotion && (
        <>
          <OrbitRing radius={2.4} rotation={[Math.PI / 4, 0, 0]} />
          <OrbitRing radius={2.8} rotation={[Math.PI / 6, Math.PI / 4, 0]} />
          <OrbitRing radius={3.1} rotation={[-Math.PI / 5, Math.PI / 3, 0.2]} />
        </>
      )}

      {/* Data nodes */}
      {nodes.map((n, i) => (
        <DataNode key={i} {...n} />
      ))}
    </>
  );
}

// ─── WebGL fallback ───────────────────────────────────────────────────
function StaticFallback({ isDark }: { isDark: boolean }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center rounded-2xl"
      style={{
        background: isDark
          ? 'radial-gradient(ellipse at center, #0e1e35 0%, #050d1a 100%)'
          : 'radial-gradient(ellipse at center, #dbeafe 0%, #f0f4ff 100%)',
      }}
    >
      <div className="text-center space-y-3">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #4f8ef7, #22d3ee)',
            boxShadow: '0 0 40px rgba(79,142,247,0.5)',
          }}
        >
          <span className="text-white text-3xl font-bold">L</span>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          3D unavailable — running in 2D mode
        </p>
      </div>
    </div>
  );
}

// ─── Error boundary ───────────────────────────────────────────────────
class WebGLErrorBoundary extends React.Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: React.ReactNode; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

// ─── Loading skeleton ─────────────────────────────────────────────────
function CanvasLoading() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="space-y-3 text-center">
        <div
          className="w-12 h-12 rounded-full mx-auto animate-pulse"
          style={{ background: 'linear-gradient(135deg, #4f8ef7, #22d3ee)' }}
        />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Loading 3D scene…
        </p>
      </div>
    </div>
  );
}

// ─── Public export ────────────────────────────────────────────────────
export default function HeroScene() {
  const { theme, reducedMotion } = useApp();
  const isDark = theme === 'dark';

  const fallback = <StaticFallback isDark={isDark} />;

  return (
    <div
      className="canvas-container w-full"
      style={{ height: '340px' }}
      role="img"
      aria-label="Animated 3D business performance visualisation"
    >
      <WebGLErrorBoundary fallback={fallback}>
        <Suspense fallback={<CanvasLoading />}>
          <Canvas
            dpr={[1, reducedMotion ? 1 : 2]}
            camera={{ position: [0, 0, 5.5], fov: 55 }}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'transparent' }}
          >
            <Scene isDark={isDark} reducedMotion={reducedMotion} />
            {!reducedMotion && (
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate
                autoRotateSpeed={0.4}
                maxPolarAngle={Math.PI * 0.65}
                minPolarAngle={Math.PI * 0.35}
              />
            )}
          </Canvas>
        </Suspense>
      </WebGLErrorBoundary>

      {/* Overlay label */}
      <div
        className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs font-medium px-3 py-1 rounded-full"
        style={{
          background: 'var(--surface-glass)',
          color: 'var(--text-muted)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border-color)',
        }}
      >
        LUMEN.AI · Business Performance Core
      </div>
    </div>
  );
}
