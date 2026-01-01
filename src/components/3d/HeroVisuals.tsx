import { Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

function GradientSphere() {
    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
            <Sphere args={[1, 64, 64]} scale={2.5}>
                <MeshDistortMaterial
                    color="#6366f1"
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Sphere>
        </Float>
    );
}

function AccentSphere() {
    return (
        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
            <Sphere args={[1, 32, 32]} scale={1.5} position={[2, -1, -2]}>
                <MeshDistortMaterial
                    color="#a855f7"
                    attach="material"
                    distort={0.3}
                    speed={3}
                    roughness={0.3}
                    metalness={0.7}
                    transparent
                    opacity={0.6}
                />
            </Sphere>
        </Float>
    );
}

interface HeroVisualsProps {
    className?: string;
}

export function HeroVisuals({ className = '' }: HeroVisualsProps) {
    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            <Canvas
                camera={{ position: [0, 0, 8], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
                dpr={[1, 1.5]}
            >
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <pointLight position={[-10, -10, -10]} color="#a855f7" intensity={0.5} />

                <Suspense fallback={null}>
                    <GradientSphere />
                    <AccentSphere />
                </Suspense>
            </Canvas>
        </div>
    );
}

// Lazy loaded version for performance
export const LazyHeroVisuals = lazy(() =>
    Promise.resolve({ default: HeroVisuals })
);
