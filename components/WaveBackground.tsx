"use client";

import { useEffect, useRef } from "react";

export function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let mouse = { x: -9999, y: -9999 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const spacing = 28, maxDist = 300;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.002;
      const cols = Math.ceil(canvas.width / spacing) + 1;
      const rows = Math.ceil(canvas.height / spacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < cols; col++) {
          const bx = col * spacing, by = r * spacing;
          const wave = Math.sin(bx * 0.015 + time) * Math.cos(by * 0.015 + time * 0.7) * 8;
          const wave2 = Math.cos(bx * 0.01 - time * 0.5) * Math.sin(by * 0.02 + time) * 5;
          const x = bx, y = by + wave + wave2;
          const dist = Math.hypot(mouse.x - x, mouse.y - y);
          const influence = Math.max(0, 1 - dist / maxDist);
          const ripple = influence > 0 ? Math.sin(dist * 0.05 - time * 3) * influence * 6 : 0;
          const fy = y + ripple;
          
          // Increased base brightness and multipliers for a stronger glow
          const brightness = 0.35 + (Math.abs(wave + wave2) * 0.05) + (influence * 0.8);
          const radius = 1 + influence * 2.5 + Math.abs(wave) * 0.05;
          
          ctx.beginPath();
          ctx.arc(x, fy, radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(214, 188, 117, ${brightness})`; 
          ctx.fill();
          
          if (influence > 0.2) {
            ctx.beginPath();
            ctx.arc(x, fy, radius + 5, 0, Math.PI * 2);
            // Increased halo brightness mapping
            ctx.fillStyle = `rgba(214, 188, 117, ${influence * 0.35})`;
            ctx.fill();
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "#ffffff", overflow: "hidden", zIndex: -1 }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.3) 100%)", pointerEvents: "none" }} />
    </div>
  );
}
