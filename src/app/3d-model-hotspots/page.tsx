"use client";
import React, { useRef, useState, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Html, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import Link from "next/link";

// Hotspot component that appears as interactive points on the 3D model
function Hotspot({ position, title, description, onClick }: {
  position: [number, number, number];
  title: string;
  description: string;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(hovered ? 1.2 : 1);
      meshRef.current.rotation.z = state.clock.elapsedTime * 2;
    }
  });

  const handlePointerOver = () => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHovered(true);
  };

  const handlePointerOut = () => {
    // Set a delay before hiding the tooltip
    hoverTimeoutRef.current = setTimeout(() => {
      setHovered(false);
      hoverTimeoutRef.current = null;
    }, 300); // 300ms delay
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          setClicked(!clicked);
          onClick();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={hovered ? "#ff6b6b" : "#4ecdc4"}
          emissive={hovered ? "#ff6b6b" : "#4ecdc4"}
          emissiveIntensity={0.3}
        />
      </mesh>

      {hovered && (
        <Html distanceFactor={10}>
          <div
            className="bg-black bg-opacity-80 text-white p-2 rounded-lg max-w-xs"
            onMouseEnter={handlePointerOver}
            onMouseLeave={handlePointerOut}
          >
            <h3 className="font-bold text-sm">{title}</h3>
            <p className="text-xs mt-1">{description}</p>
          </div>
        </Html>
      )}

      {clicked && (
        <Text
          position={[0, 0.3, 0]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {title}
        </Text>
      )}
    </group>
  );
}

// Simple 3D model component (using a procedural model since we don't have an actual .gltf file)
function Model() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Main structure - a futuristic building/monument */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#606060" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Top section */}
      <mesh position={[0, 2, 0]}>
        <coneGeometry args={[1.2, 1.5, 8]} />
        <meshStandardMaterial color="#404040" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Side panels */}
      <mesh position={[-1.2, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <boxGeometry args={[0.3, 2, 1.8]} />
        <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.1} />
      </mesh>

      <mesh position={[1.2, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <boxGeometry args={[0.3, 2, 1.8]} />
        <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.1} />
      </mesh>

      {/* Base platform */}
      <mesh position={[0, -2, 0]}>
        <cylinderGeometry args={[2.5, 2.5, 0.3, 16]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

// Loading component
function Loader() {
  return (
    <Html center>
      <div className="text-white text-lg">Loading 3D Model...</div>
    </Html>
  );
}

// Main scene component
function Scene() {
  const [, setSelectedHotspot] = useState<string | null>(null);

  const hotspots = [
    {
      id: "top",
      position: [0, 2.8, 0] as [number, number, number],
      title: "Observatory Dome",
      description: "Advanced scanning equipment located at the peak of the structure.",
    },
    {
      id: "left-panel",
      position: [-1.5, 0.5, 0] as [number, number, number],
      title: "Energy Core",
      description: "Primary power source generating sustainable energy.",
    },
    {
      id: "right-panel",
      position: [1.5, 0.5, 0] as [number, number, number],
      title: "Communication Array",
      description: "Long-range communication and data transmission hub.",
    },
    {
      id: "base",
      position: [0, -1.8, 1.8] as [number, number, number],
      title: "Foundation Systems",
      description: "Structural support and underground facility access.",
    },
  ];

  return (
    <>
      <Environment preset="city" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4ecdc4" />

      <Suspense fallback={<Loader />}>
        <Model />
        {hotspots.map((hotspot) => (
          <Hotspot
            key={hotspot.id}
            position={hotspot.position}
            title={hotspot.title}
            description={hotspot.description}
            onClick={() => setSelectedHotspot(hotspot.id)}
          />
        ))}
        <ContactShadows opacity={0.4} scale={10} blur={1} far={10} resolution={256} color="#000000" />
      </Suspense>

      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  );
}

// Info panel component
function InfoPanel({ selectedHotspot }: { selectedHotspot: string | null }) {
  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-80 text-white p-4 rounded-lg max-w-sm z-10">
      <h2 className="text-xl font-bold mb-2">3D Model with Interactive Hotspots</h2>
      <p className="text-sm mb-2">
        Click and drag to rotate the view. Hover over the glowing spheres to see information tooltips.
        Click on hotspots to select them.
      </p>
      {selectedHotspot && (
        <div className="mt-2 p-2 bg-blue-600 bg-opacity-50 rounded">
          <p className="text-xs">Selected: {selectedHotspot}</p>
        </div>
      )}
    </div>
  );
}

// Main page component
export default function ModelHotspotsPage() {
  const [selectedHotspot] = useState<string | null>(null);

  return (
    <div className="w-screen h-screen relative bg-black">
      <InfoPanel selectedHotspot={selectedHotspot} />

      <Canvas
        camera={{ position: [5, 3, 5], fov: 60 }}
        gl={{ antialias: true }}
        shadows
      >
        <Scene />
      </Canvas>

      {/* Back to home button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
