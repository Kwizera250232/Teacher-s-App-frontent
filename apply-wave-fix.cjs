const fs = require('fs');
const file = 'C:\\STUDENT APP\\frontend\\src\\components\\LiveCoachingPanel.jsx';
let c = fs.readFileSync(file, 'utf8');
const usesCRLF = c.includes('\r\n');
const nl = usesCRLF ? '\r\n' : '\n';
console.log('Line ending:', usesCRLF ? 'CRLF' : 'LF');

// Replace the SoundWave component — remove Math.random() which causes
// infinite re-render loop when state updates every frame
const old = [
  '// ── Sound Wave Visualizer ────────────────────────────────────────────────────',
  'function SoundWave({ level, color = \'#10b981\', label, size = \'normal\' }) {',
  '  const bars = size === \'small\' ? 5 : 8;',
  '  const h = size === \'small\' ? 16 : 28;',
  '  return (',
  '    <div style={{ display: \'inline-flex\', alignItems: \'center\', gap: 6 }}>',
  '      <div style={{ display: \'flex\', alignItems: \'center\', gap: 2, height: h }}>',
  '        {Array.from({ length: bars }).map((_, i) => {',
  '          const baseHeight = 3;',
  '          const activeHeight = level > 0.01 ? Math.max(baseHeight, level * h * (0.5 + Math.random() * 0.5)) : baseHeight;',
  '          return (',
  '            <div',
  '              key={i}',
  '              style={{',
  '                width: size === \'small\' ? 2 : 3,',
  '                height: activeHeight,',
  '                background: color,',
  '                borderRadius: 2,',
  '                transition: \'height 0.08s ease\',',
  '                opacity: level > 0.01 ? 1 : 0.3,',
  '              }}',
  '            />',
  '          );',
  '        })}',
  '      </div>',
  '      {label && <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>}',
  '    </div>',
  '  );',
  '}'
].join(nl);

const nw = [
  '// ── Sound Wave Visualizer ────────────────────────────────────────────────────',
  '// Uses deterministic bar heights based on bar index — NO Math.random()',
  '// which would cause infinite re-render loops with frequent state updates.',
  'const WAVE_BAR_HEIGHTS = [0.4, 0.7, 1.0, 0.85, 0.6, 0.95, 0.75, 0.5];',
  'function SoundWave({ level, color = \'#10b981\', label, size = \'normal\' }) {',
  '  const bars = size === \'small\' ? 5 : 8;',
  '  const h = size === \'small\' ? 16 : 28;',
  '  const active = level > 0.02;',
  '  return (',
  '    <div style={{ display: \'inline-flex\', alignItems: \'center\', gap: 6 }}>',
  '      <div style={{ display: \'flex\', alignItems: \'center\', gap: 2, height: h }}>',
  '        {Array.from({ length: bars }).map((_, i) => {',
  '          const barFactor = WAVE_BAR_HEIGHTS[i % WAVE_BAR_HEIGHTS.length];',
  '          const baseHeight = 3;',
  '          const activeHeight = active ? Math.max(baseHeight, level * h * barFactor) : baseHeight;',
  '          return (',
  '            <div',
  '              key={i}',
  '              style={{',
  '                width: size === \'small\' ? 2 : 3,',
  '                height: activeHeight,',
  '                background: color,',
  '                borderRadius: 2,',
  '                transition: \'height 0.1s ease\',',
  '                opacity: active ? 1 : 0.25,',
  '              }}',
  '            />',
  '          );',
  '        })}',
  '      </div>',
  '      {label && <span style={{ fontSize: 11, color, fontWeight: 600 }}>{label}</span>}',
  '    </div>',
  '  );',
  '}'
].join(nl);

if (c.includes(old)) {
  c = c.replace(old, nw);
  console.log('OK: SoundWave fixed');
} else {
  console.log('FAIL: SoundWave not found');
}

fs.writeFileSync(file, c, 'utf8');
console.log('DONE');
