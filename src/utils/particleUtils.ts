export const rnd = (a: number, b: number) => Math.random() * (b - a) + a;

export interface ParticleData {
  position: [number, number, number];
  oz: number;
  vz: number;
  size: number;
  color: string;
  emissive: string;
  emissiveIntensity: number;
}

export function generateParticles(count1 = 1400, count2 = 350): ParticleData[] {
  const particles: ParticleData[] = [];

  const pickLevel = () => {
    const r = Math.random();
    if (r < 0.12) {
      return {
        size: 0.13,
        color: '#00ff55',
        emissive: '#00ff55',
        emissiveIntensity: 5.0,
      };
    }
    if (r < 0.45) {
      return {
        size: 0.085,
        color: '#00cc44',
        emissive: '#00cc44',
        emissiveIntensity: 2.5,
      };
    }
    return {
      size: 0.05,
      color: '#006622',
      emissive: '#004411',
      emissiveIntensity: 1.2,
    };
  };

  // Inner Ring
  for (let i = 0; i < count1; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = rnd(7.5, 13.5);
    const z = rnd(-1.2, 1.2);
    const level = pickLevel();
    particles.push({
      position: [Math.cos(angle) * r, Math.sin(angle) * r, z],
      oz: z,
      vz: rnd(0.5, 2.5),
      ...level,
    });
  }

  // Outer Ring
  for (let i = 0; i < count2; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = rnd(14, 22);
    const z = rnd(-5, 5);
    const level = pickLevel();
    particles.push({
      position: [Math.cos(angle) * r, Math.sin(angle) * r, z],
      oz: z,
      vz: rnd(0.3, 1.8),
      ...level,
    });
  }

  return particles;
}
