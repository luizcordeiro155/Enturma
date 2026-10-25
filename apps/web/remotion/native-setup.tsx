import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import { BookOpen, GraduationCap, MessageCircle, Sparkles } from 'lucide-react';
import { BrandBook } from '../src/components/motion/brand-book';

/** Offline installer films: a seamless six-second loop; no simulated progress. */
export function NativeSetup({ mode = 'install' }: { mode?: 'install' | 'update' | 'uninstall' }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = frame / durationInFrames;
  const phase = t * Math.PI * 2;
  const removal = mode === 'uninstall';
  const update = mode === 'update';
  const icons = [GraduationCap, MessageCircle, BookOpen, Sparkles];
  return <AbsoluteFill style={{ background: '#0c1c19', overflow: 'hidden', perspective: 1000 }}>
    <div style={{ position: 'absolute', inset: '-45%', background: 'radial-gradient(ellipse,#2f735746,transparent 55%)', transform: `translate(${Math.sin(phase) * 45}px,${Math.cos(phase) * 25}px)` }} />
    <svg viewBox="0 0 600 300" style={{ position: 'absolute', inset: 0, width: '100%' }}>
      <defs><linearGradient id="orbit"><stop stopColor="#d6ed7a" stopOpacity="0"/><stop offset=".5" stopColor="#d6ed7a" stopOpacity=".5"/><stop offset="1" stopColor="#70d5a6" stopOpacity="0"/></linearGradient></defs>
      {[0, 1, 2].map(i => <ellipse key={i} cx="300" cy="169" rx={188 + i * 25} ry={61 + i * 10} fill="none" stroke="url(#orbit)" strokeWidth={i === 0 ? 1.5 : .6} transform={`rotate(${-16 + i * 9} 300 169)`} opacity={.45 + .25 * Math.sin(phase + i)} />)}
      {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={28 + (i * 83) % 548} cy={20 + (i * 59) % 260} r={i % 3 === 0 ? 1.5 : .7} fill="#bce9a4" opacity={.12 + .12 * (1 + Math.sin(phase + i))} />)}
    </svg>
    {icons.map((Icon, i) => {
      const a = phase + i * Math.PI / 2;
      const flow = (t + i / 4) % 1;
      const direction = removal ? 1 - flow : flow;
      const x = update ? 276 + Math.cos(a) * 177 : 85 + direction * 380;
      const y = update ? 132 + Math.sin(a) * 66 : 150 - Math.sin(flow * Math.PI) * 75;
      return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 44, height: 53, border: '1px solid #bddb8a60', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#e4f3b0', background: 'linear-gradient(145deg,#397858,#16382d)', boxShadow: '0 12px 18px #0003', opacity: update ? .65 + .25 * Math.sin(a) : Math.sin(flow * Math.PI), transform: `rotate(${Math.sin(a) * 14}deg) scale(${.8 + .15 * Math.sin(a)})`, zIndex: update && Math.sin(a) > .5 ? 4 : 1 }}><Icon size={22} strokeWidth={1.5} /></div>;
    })}
    <div style={{ position: 'absolute', left: 189, top: 88 + Math.sin(phase) * 6, zIndex: 3, transform: `rotateY(${-12 + Math.sin(phase) * 9}deg) rotateZ(${-7 + Math.cos(phase) * 2}deg) scale(${removal ? .92 : 1})`, filter: 'drop-shadow(0 28px 18px #0005)' }}>
      <BrandBook size={224} frame={(1 - Math.cos(phase)) * (removal ? 16 : 30)} color={removal ? '#a8cf9b' : '#d9ef7d'} />
    </div>
    <div style={{ position: 'absolute', bottom: 19, width: '100%', textAlign: 'center', color: '#a2c4ad', letterSpacing: 5, fontFamily: 'sans-serif', fontSize: 11, opacity: .8 }}>ENTURMA</div>
  </AbsoluteFill>;
}
