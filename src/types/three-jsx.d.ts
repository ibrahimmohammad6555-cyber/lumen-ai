// src/types/three-jsx.d.ts
// Augments global JSX to include React Three Fiber / Three.js elements.
// Required because R3F injects custom JSX elements (mesh, geometry, etc.)

import type { ThreeElements } from '@react-three/fiber';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
