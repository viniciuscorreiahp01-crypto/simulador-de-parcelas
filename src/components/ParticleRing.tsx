import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { generateParticles } from '../utils/particleUtils';
import { motion, AnimatePresence } from 'motion/react';

interface ParticleProps {
  tunnelActive: boolean;
  onTunnelComplete: () => void;
  onProgress: (p: number) => void;
}

const Particles = ({ tunnelActive, onTunnelComplete, onProgress }: ParticleProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const particles = useMemo(() => generateParticles(), []);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  
  const [tunnelProgress, setTunnelProgress] = useState(0);
  const tunnelFinished = useRef(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.1;

    if (!tunnelActive) {
      if (groupRef.current) {
        groupRef.current.rotation.z = t;
      }
    } else {
      const nextProgress = Math.min(tunnelProgress + 0.022, 1);
      setTunnelProgress(nextProgress);
      onProgress(nextProgress);

      const ease = nextProgress < 0.5 
        ? 4 * nextProgress * nextProgress * nextProgress 
        : 1 - Math.pow(-2 * nextProgress + 2, 3) / 2;

      // Update camera FOV and position
      const pCamera = camera as THREE.PerspectiveCamera;
      pCamera.fov = 55 + ease * 80;
      pCamera.updateProjectionMatrix();
      pCamera.position.z = 28 - ease * 60;
      pCamera.lookAt(0, 0, 0);

      // Update particle positions
      meshRefs.current.forEach((mesh, i) => {
        if (mesh) {
          const p = particles[i];
          mesh.position.z = p.oz + ease * p.vz * 60;
        }
      });

      if (groupRef.current) {
        groupRef.current.rotation.z = t + ease * 8;
      }

      if (nextProgress >= 0.92 && !tunnelFinished.current) {
        tunnelFinished.current = true;
        onTunnelComplete();
      }
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh 
          key={i} 
          position={new THREE.Vector3(...p.position)} 
          ref={(el) => { meshRefs.current[i] = el; }}
        >
          <sphereGeometry args={[p.size, 8, 8]} />
          <meshStandardMaterial 
            color={p.color} 
            emissive={p.emissive} 
            emissiveIntensity={p.emissiveIntensity} 
            roughness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
};

const GlowOverlay = ({ opacity }: { opacity: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    let animationFrameId: number;
    let startTime = Date.now();

    const render = () => {
      const W = parent.clientWidth;
      const H = parent.clientHeight;

      // Only resize when necessary - this was the main lag cause on mobile
      if (sizeRef.current.w !== W || sizeRef.current.h !== H) {
        canvas.width = W;
        canvas.height = H;
        sizeRef.current = { w: W, h: H };
      }

      ctx.clearRect(0, 0, W, H);
      
      if (opacity > 0) {
        const time = (Date.now() - startTime) * 0.001;
        // Subtle pulse to make it feel "alive"
        const pulse = 1 + Math.sin(time * 1.5) * 0.05;

        ctx.save();
        ctx.globalAlpha = opacity;
        const cx = W / 2;
        const cy = H / 2;

        // Optimized Layer 1
        const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.30 * pulse);
        g1.addColorStop(0, 'rgba(0, 230, 80, 0.45)');
        g1.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g1;
        ctx.beginPath();
        ctx.arc(cx, cy, W * 0.30 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Optimized Layer 2
        const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.18 * pulse);
        g2.addColorStop(0, 'rgba(0, 255, 90, 0.35)');
        g2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(cx, cy, W * 0.18 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Optimized Layer 3
        const g3 = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.09 * pulse);
        g3.addColorStop(0, 'rgba(180, 255, 190, 0.25)');
        g3.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g3;
        ctx.beginPath();
        ctx.arc(cx, cy, W * 0.09 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
      
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [opacity]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-[5]" />;
};

export const ParticleRing = ({ tunnelActive, onTunnelActive, onTunnelComplete }: { 
  tunnelActive: boolean, 
  onTunnelActive: () => void,
  onTunnelComplete: () => void 
}) => {
  const [progress, setProgress] = useState(0);
  const easeGlow = progress < 0.5 
    ? 4 * progress * progress * progress 
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
      <Canvas
        gl={{ antialias: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#000']} />
        <PerspectiveCamera makeDefault position={[0, 0, 28]} fov={55} />
        <ambientLight intensity={0.6} color="#00ff44" />
        <pointLight position={[0, 0, 10]} intensity={3.0} color="#00ff44" />
        
        <Particles 
          tunnelActive={tunnelActive} 
          onTunnelComplete={onTunnelComplete} 
          onProgress={setProgress}
        />
        
        {!tunnelActive && <OrbitControls enablePan={false} enableZoom={true} minDistance={10} maxDistance={50} />}
      </Canvas>

      <GlowOverlay opacity={tunnelActive ? (1 - easeGlow) : 1} />

      <AnimatePresence>
        {!tunnelActive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }} // Added transition duration
            className="absolute z-10 text-center pointer-events-none select-none"
          >
            <div className="font-mono text-[clamp(0.55rem,1.3vw,0.78rem)] tracking-[0.45em] uppercase mb-1.5 text-white/80 drop-shadow-[0_0_6px_rgba(255,255,255,0.5)]">
              — sistema de —
            </div>
            <h1 className="font-mono text-[clamp(1.5rem,4.5vw,2.6rem)] font-bold tracking-[0.12em] uppercase leading-none text-white drop-shadow-[0_0_12px_rgba(0,255,136,0.6)]">
              PARCELAS
            </h1>
            
            <div className="mt-2.5 flex items-center justify-center gap-2 opacity-50">
              <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff,0_0_20px_#00ff88]" />
              <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-white" />
            </div>

            <button 
              onClick={onTunnelActive}
              className="mt-6 pointer-events-auto font-mono text-[clamp(0.7rem,1.6vw,0.9rem)] font-bold tracking-[0.35em] uppercase text-[#00ff88] bg-black border-none rounded-[3px] py-3 px-9 cursor-pointer outline-none transition-all hover:text-white hover:shadow-[0_0_18px_rgba(0,255,136,0.5),0_0_40px_rgba(0,255,136,0.2)] relative group"
            >
              <div className="absolute inset-0 rounded-[3px] border-[1.5px] border-transparent p-[1.5px] animated-border" />
              ENTRAR
            </button>

            <div className="absolute top-[120%] left-1/2 -translate-x-1/2 text-[#00ff6633] font-mono text-[11px] whitespace-nowrap">
              arraste para rotacionar · role para zoom
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Black Fade Overlay at the very end */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: tunnelActive ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.85 }}
        className="absolute inset-0 bg-black pointer-events-none z-20"
      />

      <style>{`
        .animated-border {
          background: linear-gradient(90deg, transparent 0%, #00ff88 25%, #00ffcc 50%, #00ff88 75%, transparent 100%) border-box;
          background-size: 200% 100%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: moveBorder 2s linear infinite;
        }
        @keyframes moveBorder {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};
