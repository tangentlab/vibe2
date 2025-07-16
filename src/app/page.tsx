import React from "react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Three.js Portfolio Demos</h1>
      <ul className="space-y-4 flex flex-col items-center">
        <li>
          <Link href="/rotating-cube" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 inline-block text-center">
            Rotating 3D Cube Demo
          </Link>
        </li>
        <li>
          <Link href="/particle-mouse" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 inline-block text-center">
            Particle Mouse Effect Demo
          </Link>
        </li>
        <li>
          <Link href="/landscape-trees" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 inline-block text-center">
            3D Landscape with Trees Demo
          </Link>
        </li>
        <li>
          <Link href="/audio-analyzer" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 inline-block text-center">
            Audio Analyzer Demo
          </Link>
        </li>

      </ul>
    </main>
  );
}