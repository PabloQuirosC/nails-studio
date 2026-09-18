import { useState, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { Link } from 'react-router';
import { ArrowRight, Share2, RotateCcw } from 'lucide-react';
import { NAIL_COLORS, NAIL_SHAPES, NAIL_DESIGNS_3D } from '../../data';
import { Toast } from '../../components/ui/Modal';

// ─── Nail plate geometry ──────────────────────────────────────────────────────
function buildNailGeo(shapeId: string, nW: number, nH: number): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const w = nW, h = nH;

  switch (shapeId) {
    case 'square':
      s.moveTo(-w / 2, 0);
      s.lineTo(-w / 2, h);
      s.lineTo(w / 2, h);
      s.lineTo(w / 2, 0);
      s.quadraticCurveTo(0, -0.012, -w / 2, 0);
      break;
    case 'round':
      s.moveTo(-w / 2, 0);
      s.lineTo(-w / 2, h * 0.5);
      s.quadraticCurveTo(-w / 2, h * 1.06, 0, h * 1.06);
      s.quadraticCurveTo(w / 2, h * 1.06, w / 2, h * 0.5);
      s.lineTo(w / 2, 0);
      s.quadraticCurveTo(0, -0.012, -w / 2, 0);
      break;
    case 'oval':
      s.absellipse(0, h * 0.5, w * 0.5, h * 0.56, 0, Math.PI * 2, false, 0);
      break;
    case 'almond':
      s.moveTo(0, h + 0.08);
      s.bezierCurveTo(w * 0.54, h * 0.76, w / 2, h * 0.3, w / 2, 0);
      s.quadraticCurveTo(0, -0.012, -w / 2, 0);
      s.bezierCurveTo(-w / 2, h * 0.3, -w * 0.54, h * 0.76, 0, h + 0.08);
      break;
    case 'coffin':
      s.moveTo(-w / 2, 0);
      s.lineTo(-w * 0.46, h * 0.56);
      s.lineTo(-w * 0.35, h);
      s.lineTo(w * 0.35, h);
      s.lineTo(w * 0.46, h * 0.56);
      s.lineTo(w / 2, 0);
      s.quadraticCurveTo(0, -0.012, -w / 2, 0);
      break;
    case 'stiletto':
      s.moveTo(0, h + 0.18);
      s.bezierCurveTo(w * 0.64, h * 0.66, w * 0.5, h * 0.24, w / 2, 0);
      s.quadraticCurveTo(0, -0.012, -w / 2, 0);
      s.bezierCurveTo(-w * 0.5, h * 0.24, -w * 0.64, h * 0.66, 0, h + 0.18);
      break;
    default:
      s.absellipse(0, h * 0.5, w * 0.5, h * 0.56, 0, Math.PI * 2, false, 0);
  }

  const geo = new THREE.ShapeGeometry(s, 32);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const nx = x / (w / 2);
    const ny = Math.max(0, Math.min(1, y / h));
    // Convex gel dome: curves in both axes
    const dome = (1 - nx * nx) * 0.026 + ny * (1 - ny) * 0.01;
    pos.setZ(i, dome);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// French tip geometry
function buildFrenchGeo(nW: number, nH: number, tipFrac = 0.28): THREE.BufferGeometry {
  const s = new THREE.Shape();
  const w = nW, h = nH, ty = h * (1 - tipFrac);
  s.moveTo(-w / 2, ty);
  s.lineTo(-w / 2, h * 1.02);
  s.lineTo(w / 2, h * 1.02);
  s.lineTo(w / 2, ty);
  s.quadraticCurveTo(0, ty - 0.06, -w / 2, ty);
  const geo = new THREE.ShapeGeometry(s, 12);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i);
    const nx = x / (w / 2), ny = Math.max(0, Math.min(1, y / h));
    pos.setZ(i, (1 - nx * nx) * 0.027 + ny * (1 - ny) * 0.011);
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// ─── Material factory ─────────────────────────────────────────────────────────
function nailMat(hex: string, design: string): THREE.MeshPhysicalMaterial {
  const isChrome = design === 'chrome';
  const isGlitter = design === 'glitter';
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex),
    roughness: isChrome ? 0.03 : isGlitter ? 0.20 : 0.06,
    metalness: isChrome ? 0.92 : isGlitter ? 0.20 : 0.0,
    clearcoat: 1.0,
    clearcoatRoughness: isChrome ? 0.03 : 0.04,
    reflectivity: 0.95,
    envMapIntensity: isChrome ? 3.0 : 2.2,
  });
}

// ─── Nail dimensions per finger slot ─────────────────────────────────────────
// 5 nails arranged side by side with slight arc (thumb slightly smaller + rotated)
const NAIL_SLOTS = [
  { label: 'Pulgar',  nW: 0.36, nH: 0.62, scale: 0.90 },
  { label: 'Índice',  nW: 0.40, nH: 0.74, scale: 1.00 },
  { label: 'Medio',   nW: 0.44, nH: 0.82, scale: 1.00 },
  { label: 'Anular',  nW: 0.40, nH: 0.74, scale: 1.00 },
  { label: 'Meñique', nW: 0.32, nH: 0.58, scale: 0.88 },
];

// Horizontal spacing between nails
const NAIL_SPACING = 0.58;
// Arc: slight rotation around Y and small Z offset per nail for depth
const NAIL_ARC = [0.14, 0.05, 0.0, -0.05, -0.14]; // Y rotation (radians)
const NAIL_Z   = [0.08, 0.02, 0.0,  0.02,  0.08]; // Z offset for depth arc

interface NailProps {
  idx: number;
  color: string;
  shape: string;
  design: string;
}

function NailPlate({ idx, color, shape, design }: NailProps) {
  const slot = NAIL_SLOTS[idx];
  const { nW, nH } = slot;

  const nailGeo    = useMemo(() => buildNailGeo(shape, nW, nH), [shape, nW, nH]);
  const frenchGeo  = useMemo(() => buildFrenchGeo(nW, nH), [nW, nH]);

  const mainMat = useMemo(() => nailMat(color, design), [color, design]);
  const frenchMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#f8f5f2'),
    roughness: 0.05, metalness: 0, clearcoat: 1.0,
    clearcoatRoughness: 0.04, envMapIntensity: 2.0,
  }), []);

  const ombreColor = useMemo(() => {
    if (design !== 'ombre') return color;
    const c = new THREE.Color(color);
    c.r = Math.min(c.r * 1.6, 1);
    c.g = Math.min(c.g * 1.6, 1);
    c.b = Math.min(c.b * 1.6, 1);
    return '#' + c.getHexString();
  }, [color, design]);
  const ombreMat = useMemo(() => design === 'ombre' ? nailMat(ombreColor, 'solid') : null, [ombreColor, design]);

  // Center offset: make middle nail (idx=2) at x=0
  const cx = (idx - 2) * NAIL_SPACING;
  const ry = NAIL_ARC[idx];
  const cz = NAIL_Z[idx];

  return (
    <group position={[cx, 0, cz]} rotation={[0, ry, 0]}>
      {/* Nail base plate — ShapeGeometry in XY, lay flat in XZ by rotating -PI/2 on X */}
      <mesh geometry={nailGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} castShadow receiveShadow>
        <primitive object={mainMat} attach="material" />
      </mesh>

      {design === 'french' && (
        <mesh geometry={frenchGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <primitive object={frenchMat} attach="material" />
        </mesh>
      )}

      {design === 'ombre' && ombreMat && (
        <mesh geometry={buildFrenchGeo(nW, nH, 0.52)} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
          <primitive object={ombreMat} attach="material" />
        </mesh>
      )}

      {/* Thin cuticle base band */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.003, 0]}>
        <planeGeometry args={[nW * 0.88, 0.045]} />
        <meshStandardMaterial color="#d4b898" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Scene ───────────────────────────────────────────────────────────────────
function Scene({ colors, shape, design }: { colors: string[]; shape: string; design: string }) {
  return (
    <>
      <color attach="background" args={['#0d0b0a']} />

      {/* Studio lighting */}
      <ambientLight intensity={0.65} color="#fff8f0" />
      <directionalLight position={[0, 5, 3]} intensity={2.2} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={0.1} shadow-camera-far={12}
        shadow-camera-left={-4} shadow-camera-right={4}
        shadow-camera-top={3} shadow-camera-bottom={-3}
      />
      <directionalLight position={[-2, 3, 2]} intensity={0.7} color="#ffeedd" />
      <directionalLight position={[2, 2, -2]} intensity={0.3} color="#c8d4ff" />
      <pointLight position={[0, 1.5, 4]} intensity={0.8} color="#fff5e8" />

      <Environment preset="studio" />

      <ContactShadows
        position={[0, -0.04, 0]}
        opacity={0.6} scale={5} blur={2.5} far={0.5}
        color="#000000"
      />

      {NAIL_SLOTS.map((_, i) => (
        <NailPlate key={i} idx={i} color={colors[i]} shape={shape} design={design} />
      ))}

      <OrbitControls
        enablePan={false}
        target={[0, 0.2, 0]}
        minPolarAngle={Math.PI * 0.05}
        maxPolarAngle={Math.PI * 0.52}
        minDistance={1.8}
        maxDistance={5.0}
      />
    </>
  );
}

function LoadingNails() {
  return (
    <div className="w-full h-full flex items-center justify-center text-[#8a7d6e] text-sm font-mono">
      <div className="text-center">
        <div className="w-10 h-10 border border-[#c9a96e]/40 border-t-[#c9a96e] rounded-full animate-spin mx-auto mb-3" />
        Cargando modelo…
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
type FingerColors = Record<number, string>;

export function Visualizer() {
  const [selectedColor, setSelectedColor] = useState(NAIL_COLORS[5]);
  const [selectedShape, setSelectedShape] = useState(NAIL_SHAPES[4]); // coffin
  const [selectedDesign, setSelectedDesign] = useState(NAIL_DESIGNS_3D[0]);
  const [fingerColors, setFingerColors] = useState<FingerColors>({});
  const [toast, setToast] = useState({ msg: '', visible: false });

  const showToast = (msg: string) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2200);
  };

  const colors = NAIL_SLOTS.map((_, i) => fingerColors[i] ?? selectedColor.hex);

  const applyAll = () => {
    const all: FingerColors = {};
    NAIL_SLOTS.forEach((_, i) => { all[i] = selectedColor.hex; });
    setFingerColors(all);
    showToast('Color aplicado a todas las uñas');
  };

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 pb-16">
      <Toast message={toast.msg} visible={toast.visible} />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-4">
          <p className="font-mono text-[#c9a96e] text-xs tracking-[0.3em] uppercase mb-3">Visualizador 3D ✦</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-[#f0ebe4] mb-3">Modelado de uñas</h1>
          <p className="text-[#8a7d6e] max-w-md mx-auto text-sm leading-relaxed">
            Modelo 3D interactivo — arrastra para rotar, scroll para zoom. Elige forma, acabado y color por uña.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">

          {/* ── 3D Canvas ── */}
          <div className="bg-[#0a0908] border border-[#2e2518] rounded-2xl overflow-hidden" style={{ minHeight: '500px' }}>
            <Canvas
              camera={{ position: [0, 2.2, 2.8], fov: 42 }}
              shadows
              style={{ width: '100%', height: '500px' }}
              gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
            >
              <Suspense fallback={null}>
                <Scene colors={colors} shape={selectedShape.id} design={selectedDesign.id} />
              </Suspense>
            </Canvas>

            {/* Canvas footer */}
            <div className="px-5 py-3 border-t border-[#2e2518] flex items-center justify-between flex-wrap gap-3">
              <p className="text-[#8a7d6e] text-xs font-mono">
                <span className="text-[#c9a96e]">{selectedShape.name}</span>{' · '}
                <span className="text-[#c9a96e]">{selectedDesign.name}</span>{' · '}
                <span style={{ color: selectedColor.hex }}>■</span>{' '}{selectedColor.name}
              </p>
              <div className="flex gap-2">
                <button onClick={applyAll}
                  className="text-xs px-3 py-1.5 border border-[#2e2518] text-[#8a7d6e] hover:border-[#c9a96e] hover:text-[#c9a96e] rounded transition-colors">
                  Todas
                </button>
                <button onClick={() => { setFingerColors({}); showToast('Restablecido'); }}
                  className="w-8 h-8 border border-[#2e2518] rounded flex items-center justify-center text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]">
                  <RotateCcw size={12} />
                </button>
                <button onClick={() => navigator.clipboard?.writeText(window.location.href).then(() => showToast('Enlace copiado'))}
                  className="w-8 h-8 border border-[#2e2518] rounded flex items-center justify-center text-[#8a7d6e] hover:text-[#c9a96e] hover:border-[#c9a96e]">
                  <Share2 size={12} />
                </button>
              </div>
            </div>
            <p className="px-5 pb-4 text-[#8a7d6e] text-xs">💡 Arrastra para rotar · Scroll para zoom</p>
          </div>

          {/* ── Controls ── */}
          <div className="flex flex-col gap-4">

            {/* Shape */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
              <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest mb-4">Forma</p>
              <div className="grid grid-cols-3 gap-2">
                {NAIL_SHAPES.map(sh => (
                  <button key={sh.id} onClick={() => setSelectedShape(sh)}
                    className={`py-2.5 text-xs rounded border transition-colors ${selectedShape.id === sh.id ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e] hover:text-[#f0ebe4]'}`}>
                    {sh.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Design */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
              <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest mb-4">Acabado</p>
              <div className="grid grid-cols-3 gap-2">
                {NAIL_DESIGNS_3D.map(d => (
                  <button key={d.id} onClick={() => setSelectedDesign(d)}
                    className={`py-2.5 text-xs rounded border transition-colors ${selectedDesign.id === d.id ? 'border-[#c9a96e] text-[#c9a96e] bg-[#c9a96e]/10' : 'border-[#2e2518] text-[#8a7d6e] hover:border-[#8a7d6e] hover:text-[#f0ebe4]'}`}>
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color palette */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest">Color</p>
                <span className="text-xs font-medium" style={{ color: selectedColor.hex }}>{selectedColor.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2.5">
                {NAIL_COLORS.map(c => (
                  <button key={c.id} onClick={() => setSelectedColor(c)} title={c.name}
                    className={`aspect-square rounded-lg border-2 transition-all hover:scale-105 active:scale-95 ${selectedColor.id === c.id ? 'border-[#c9a96e] scale-110' : 'border-transparent'}`}
                    style={{ background: c.hex, boxShadow: selectedColor.id === c.id ? `0 0 12px ${c.hex}60` : undefined }} />
                ))}
              </div>
            </div>

            {/* Per-nail color */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
              <p className="text-[#8a7d6e] text-xs font-mono uppercase tracking-widest mb-3">Color por uña</p>
              <div className="flex gap-3 flex-wrap">
                {NAIL_SLOTS.map((f, i) => (
                  <button key={i}
                    onClick={() => {
                      setFingerColors(p => ({ ...p, [i]: selectedColor.hex }));
                      showToast(`${selectedColor.name} → ${f.label}`);
                    }}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <div
                      className="w-9 h-9 rounded-full border-2 border-[#2e2518] group-hover:border-[#c9a96e] transition-all"
                      style={{ background: colors[i] }}
                    />
                    <span className="text-[#8a7d6e] text-[9px] font-mono group-hover:text-[#c9a96e]">{f.label.slice(0, 3)}</span>
                  </button>
                ))}
              </div>
              <p className="text-[#8a7d6e] text-xs mt-3 leading-relaxed">
                Elige un color arriba → toca cada uña para asignarlo individualmente
              </p>
            </div>

            {/* CTA */}
            <div className="bg-[#181310] border border-[#2e2518] rounded-xl p-5">
              <p className="font-serif text-lg text-[#f0ebe4] mb-1">¿Te gusta este look?</p>
              <p className="text-[#8a7d6e] text-sm mb-4">Tu artista lo recreará exactamente en tu cita.</p>
              <button
                onClick={() => { showToast('Redirigiendo a reservas…'); setTimeout(() => { window.location.href = '/reservas'; }, 1200); }}
                className="w-full py-3 bg-[#c9a96e] text-[#0d0b0a] font-medium rounded flex items-center justify-center gap-2 hover:bg-[#d4b87e] transition-colors"
              >
                Reservar este look <ArrowRight size={16} />
              </button>
              <Link to="/catalogo"
                className="w-full mt-2 py-2.5 border border-[#2e2518] text-[#8a7d6e] text-sm rounded flex items-center justify-center hover:border-[#8a7d6e] hover:text-[#f0ebe4] transition-colors">
                Ver catálogo de diseños
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
