"use client";
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";

const LandscapeTrees: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const width = mountRef.current?.clientWidth || window.innerWidth;
    const height = mountRef.current?.clientHeight || window.innerHeight;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // sky blue

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 30, 60);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    mountRef.current?.appendChild(renderer.domElement);

    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 50, 10);
    scene.add(dirLight);

    // Add rocks
    const rockCount = 18;
    for (let i = 0; i < rockCount; i++) {
      const x = (Math.random() - 0.5) * 75;
      const z = (Math.random() - 0.5) * 75;
      const y = 0.5 + Math.random() * 0.5; // slightly above ground
      const size = 0.7 + Math.random() * 1.5;
      const rockGeometry = new THREE.IcosahedronGeometry(size, 0);
      const gray = Math.floor(120 + Math.random() * 80);
      const rockMaterial = new THREE.MeshLambertMaterial({ color: (gray << 16) | (gray << 8) | gray });
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(x, y, z);
      rock.rotation.y = Math.random() * Math.PI;
      scene.add(rock);
    }

    // --- Tree game logic ---
    const trees: THREE.Group[] = [];
    const logsMaterial = new THREE.MeshLambertMaterial({ color: 0xdeb887 });
    const logEndMaterial = new THREE.MeshLambertMaterial({ color: 0xf5deb3 });
    const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
    const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
    const treeCount = 20;
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() - 0.5) * 70;
      const z = (Math.random() - 0.5) * 70;
      // Trunk
      const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.5, 4, 8);
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(x, 2, z);
      // Foliage
      const foliageGeometry = new THREE.ConeGeometry(2, 6, 8);
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
      foliage.position.set(x, 6, z);
      // Group
      const treeGroup = new THREE.Group();
      treeGroup.add(trunk);
      treeGroup.add(foliage);
      treeGroup.position.set(x, 0, z);
      scene.add(treeGroup);
      trees.push(treeGroup);
    }

    // Add a visible grid overlay
    const grid = new THREE.GridHelper(160, 32, 0x444444, 0x888888);
    grid.position.y = 0.05; // slightly above ground to avoid z-fighting
    scene.add(grid);

    // Controls (optional: simple orbit)
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onMouseUp = () => { isDragging = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevX;
      const deltaY = e.clientY - prevY;
      camera.position.x -= deltaX * 0.2;
      camera.position.z -= deltaY * 0.2;
      camera.lookAt(0, 0, 0);
      prevX = e.clientX;
      prevY = e.clientY;
    };
    renderer.domElement.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    // Raycaster for tree clicks
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function handleTreeClick(event: MouseEvent) {
      // Get pointer position in normalized device coordinates
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      // Check intersection with all tree foliage
      for (let i = 0; i < trees.length; i++) {
        const tree = trees[i];
        // Only if foliage is present
        const foliage = tree.children.find(
          (child) => child instanceof THREE.Mesh && (child.geometry instanceof THREE.ConeGeometry)
        );
        if (!foliage) continue;
        const intersects = raycaster.intersectObject(foliage, false);
        if (intersects.length > 0) {
          // Remove foliage
          tree.remove(foliage);
          // Remove trunk
          const trunk = tree.children.find(
            (child) => child instanceof THREE.Mesh && (child.geometry instanceof THREE.CylinderGeometry)
          );
          if (trunk) tree.remove(trunk);
          // Add logs (stacked cylinders)
          // Center logs at y=2 (where trunk was)
          const logCount = 3;
          const logLength = 2.5;
          const logSpacing = 0.7;
          const totalHeight = (logCount - 1) * logSpacing;
          for (let j = 0; j < logCount; j++) {
            const log = new THREE.Mesh(
              new THREE.CylinderGeometry(0.5, 0.5, logLength, 12),
              [logsMaterial, logEndMaterial, logEndMaterial]
            );
            // Center logs vertically at y=2
            log.position.set(0, 2 - totalHeight / 2 + j * logSpacing, 0);
            log.rotation.z = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
            tree.add(log);
          }
          setScore((prev) => prev + 3);
          break;
        }
      }
    }
    renderer.domElement.addEventListener("click", handleTreeClick);

    let reqId: number;
    const animate = () => {
      reqId = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      renderer.domElement.removeEventListener("click", handleTreeClick);
      cancelAnimationFrame(reqId);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div ref={mountRef} style={{ width: "100vw", height: "100vh", overflow: "hidden" }} />
      <div style={{ position: "fixed", top: 20, left: 20, zIndex: 10, background: "rgba(255,255,255,0.8)", padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 20, color: "#333", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
        <label htmlFor="wood-score" style={{ display: 'block', marginBottom: 4 }}>Wood Collected:</label>
        <textarea
          id="wood-score"
          value={score}
          readOnly
          style={{ width: 80, height: 40, fontSize: 20, textAlign: 'center', resize: 'none', borderRadius: 4, border: '1px solid #bbb', background: '#f9f9f9' }}
        />
      </div>
    </>
  );
};

export default function Page() {
  return <LandscapeTrees />;
}