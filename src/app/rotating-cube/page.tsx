"use client";
import React, { useRef, useEffect } from "react";
import Link from "next/link";
import * as THREE from "three";

const RotatingCube: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    // Geometry list for shape transformation
    const geometries = [
      () => new THREE.BoxGeometry(),
      () => new THREE.SphereGeometry(0.8, 32, 32),
      () => new THREE.ConeGeometry(0.8, 1.2, 32),
      () => new THREE.CylinderGeometry(0.7, 0.7, 1.2, 32),
      () => new THREE.TorusGeometry(0.6, 0.2, 16, 100),
      () => new THREE.TetrahedronGeometry(0.9),
    ];
    let currentGeometryIndex = 0;

    const geometry = geometries[currentGeometryIndex]();
    const material = new THREE.MeshNormalMaterial();
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 3;

    let reqId: number;
    let isDragging = false;
    let previousX = 0;
    let previousY = 0;
    let autoRotate = true;

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      if (autoRotate) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    // Mouse events
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      autoRotate = false;
      if (e instanceof MouseEvent) {
        previousX = e.clientX;
        previousY = e.clientY;
      } else if (e.touches && e.touches.length === 1) {
        previousX = e.touches[0].clientX;
        previousY = e.touches[0].clientY;
      }
    };
    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      let clientX, clientY;
      if (e instanceof MouseEvent) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.touches && e.touches.length === 1) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        return;
      }
      const deltaX = clientX - previousX;
      const deltaY = clientY - previousY;
      previousX = clientX;
      previousY = clientY;
      // Adjust sensitivity as needed
      cube.rotation.y += deltaX * 0.01;
      cube.rotation.x += deltaY * 0.01;
    };
    const onPointerUp = () => {
      isDragging = false;
      autoRotate = true;
    };

    // Shape transformation on click
    const onShapeClick = () => {
      currentGeometryIndex = (currentGeometryIndex + 1) % geometries.length;
      const newGeometry = geometries[currentGeometryIndex]();
      cube.geometry.dispose();
      cube.geometry = newGeometry;
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousedown", onPointerDown);
    dom.addEventListener("mousemove", onPointerMove);
    dom.addEventListener("mouseup", onPointerUp);
    dom.addEventListener("mouseleave", onPointerUp);
    dom.addEventListener("touchstart", onPointerDown);
    dom.addEventListener("touchmove", onPointerMove);
    dom.addEventListener("touchend", onPointerUp);
    dom.addEventListener("touchcancel", onPointerUp);
    dom.addEventListener("click", onShapeClick);

    return () => {
      cancelAnimationFrame(reqId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
      dom.removeEventListener("mousedown", onPointerDown);
      dom.removeEventListener("mousemove", onPointerMove);
      dom.removeEventListener("mouseup", onPointerUp);
      dom.removeEventListener("mouseleave", onPointerUp);
      dom.removeEventListener("touchstart", onPointerDown);
      dom.removeEventListener("touchmove", onPointerMove);
      dom.removeEventListener("touchend", onPointerUp);
      dom.removeEventListener("touchcancel", onPointerUp);
      dom.removeEventListener("click", onShapeClick);
    };
  }, []);

  return (
    <div ref={mountRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />
  );
};

export default function Page() {
  return (
    <div className="relative w-full h-full">
      <RotatingCube />
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