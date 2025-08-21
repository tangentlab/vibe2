"use client";
import React, { useRef, useEffect } from "react";
import Link from "next/link";
import * as THREE from "three";

const ParticleMouse: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 100;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    // Create particles
    const particleCount = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * width;
      positions[i * 3 + 1] = (Math.random() - 0.5) * height;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 3 });
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // Mouse move handler
    const onMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.current.x = ((event.clientX - rect.left) / width) * 2 - 1;
      mouse.current.y = -((event.clientY - rect.top) / height) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      // Animate particles to follow mouse
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3] += (mouse.current.x * width * 0.5 - positions[i * 3]) * 0.02;
        positions[i * 3 + 1] += (mouse.current.y * height * 0.5 - positions[i * 3 + 1]) * 0.02;
      }
      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(reqId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />
  );
};

export default function Page() {
  return (
    <div className="relative w-full h-full">
      <ParticleMouse />
      <div className="absolute bottom-4 right-4 z-10">
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 inline-block"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}