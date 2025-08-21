"use client";
import React, { useRef, useState } from "react";
import Link from "next/link";

type AudioDetails = {
  name: string;
  type: string;
  size: number;
  duration: number;
  sampleRate: number;
  numberOfChannels: number;
  length: number;
};

export default function AudioAnalyzerPage() {
  const [audioDetails, setAudioDetails] = useState<AudioDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [waveform, setWaveform] = useState<Float32Array | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setAudioDetails(null);
    setFeedback([]);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Please upload a valid audio file.");
      return;
    }
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new ((window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext))();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setAudioDetails({
        name: file.name,
        type: file.type,
        size: file.size,
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        numberOfChannels: audioBuffer.numberOfChannels,
        length: audioBuffer.length,
      });
      // For waveform: use first channel
      setWaveform(audioBuffer.getChannelData(0).slice(0));
      // --- Feedback analysis ---
      const feedbacks: string[] = [];
      // 1. Duration
      if (audioBuffer.duration < 10) feedbacks.push("Track is very short. Consider making it longer for a fuller experience.");
      if (audioBuffer.duration > 600) feedbacks.push("Track is very long. Consider splitting into sections or shortening.");
      // 2. Mono/Stereo
      if (audioBuffer.numberOfChannels === 1) feedbacks.push("Track is mono. Consider using stereo for a richer sound.");
      // 3. Sample Rate
      if (audioBuffer.sampleRate < 22050) feedbacks.push("Sample rate is low. Consider exporting at 44100 Hz or higher for better quality.");
      // 4. Clipping detection (any sample >= 0.99 or <= -0.99)
      let isClipping = false;
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        const data = audioBuffer.getChannelData(c);
        for (let i = 0; i < data.length; i++) {
          if (data[i] >= 0.99 || data[i] <= -0.99) {
            isClipping = true;
            break;
          }
        }
        if (isClipping) break;
      }
      if (isClipping) feedbacks.push("Track is clipping. Lower the output volume or use a limiter to avoid distortion.");
      // 5. Silence detection (if >10% of samples are near zero)
      let silentSamples = 0;
      let totalSamples = 0;
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        const data = audioBuffer.getChannelData(c);
        totalSamples += data.length;
        for (let i = 0; i < data.length; i++) {
          if (Math.abs(data[i]) < 0.001) silentSamples++;
        }
      }
      if (silentSamples / totalSamples > 0.1) feedbacks.push("Track contains a lot of silence. Consider trimming or editing out silent sections.");
      // 6. Dynamic range (difference between max and min sample)
      let min = 1, max = -1;
      for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
        const data = audioBuffer.getChannelData(c);
        for (let i = 0; i < data.length; i++) {
          if (data[i] < min) min = data[i];
          if (data[i] > max) max = data[i];
        }
      }
      const dynamicRange = max - min;
      if (dynamicRange < 0.2) feedbacks.push("Track has low dynamic range. Consider adding more variation in volume for a more engaging sound.");
      if (feedbacks.length === 0) feedbacks.push("No major issues detected. Your track looks good!");
      setFeedback(feedbacks);
    } catch {
      setError("Failed to analyze audio file.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-50 relative" style={{ color: '#000' }}>
      <div className="absolute top-4 right-4 z-10">
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-200 inline-block"
        >
          ← Back to Home
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-6">Audio File Analyzer</h1>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      {error && <div className="text-red-600 mb-4">{error}</div>}
      {audioDetails && (
        <div className="bg-white rounded shadow p-6 w-full max-w-md" style={{ color: '#000' }}>
          <h2 className="text-xl font-semibold mb-4">Audio Details Report</h2>
          <ul className="space-y-2 mb-4">
            <li><strong>File Name:</strong> {audioDetails.name}</li>
            <li><strong>Type:</strong> {audioDetails.type}</li>
            <li><strong>Size:</strong> {(audioDetails.size / 1024).toFixed(2)} KB</li>
            <li><strong>Duration:</strong> {audioDetails.duration.toFixed(2)} seconds</li>
            <li><strong>Sample Rate:</strong> {audioDetails.sampleRate} Hz</li>
            <li><strong>Channels:</strong> {audioDetails.numberOfChannels}</li>
            <li><strong>Length (samples):</strong> {audioDetails.length}</li>
          </ul>
          <h3 className="text-lg font-semibold mb-2">Feedback & Suggestions</h3>
          <ul className="list-disc pl-5 mb-6">
            {feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          {waveform && <WaveformCanvas waveform={waveform} />}
        </div>
      )}
    </main>
  );
}

// Waveform rendering component
function WaveformCanvas({ waveform }: { waveform: Float32Array }) {
  // Downsample for performance
  const width = 400;
  const height = 80;
  const samples = waveform.length;
  const step = Math.ceil(samples / width);
  const points = new Array(width).fill(0).map((_, i) => {
    let min = 1, max = -1;
    for (let j = 0; j < step; j++) {
      const idx = i * step + j;
      if (idx >= samples) break;
      const v = waveform[idx];
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { min, max };
  });
  return (
    <div style={{ marginTop: 24 }}>
      <h4 className="font-semibold mb-2">Waveform</h4>
      <canvas
        width={width}
        height={height}
        style={{ width: width, height: height, background: '#f4f4f4', borderRadius: 4, display: 'block' }}
        ref={canvas => {
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.clearRect(0, 0, width, height);
          ctx.strokeStyle = '#0070f3';
          ctx.beginPath();
          for (let i = 0; i < width; i++) {
            const y1 = ((1 - points[i].max) / 2) * height;
            const y2 = ((1 - points[i].min) / 2) * height;
            ctx.moveTo(i, y1);
            ctx.lineTo(i, y2);
          }
          ctx.stroke();
        }}
      />
    </div>
  );
}