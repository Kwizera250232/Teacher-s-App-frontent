const fs = require('fs');
const file = 'C:\\STUDENT APP\\frontend\\src\\components\\LiveCoachingPanel.jsx';
let c = fs.readFileSync(file, 'utf8');

const usesCRLF = c.includes('\r\n');
const nl = usesCRLF ? '\r\n' : '\n';
console.log('Line ending:', usesCRLF ? 'CRLF' : 'LF');

// Update student audio section
const old1 = [
  '      {/* Audio controls + timer */}',
  '      <div style={{ display: \'flex\', gap: 8, alignItems: \'center\', flexWrap: \'wrap\', marginBottom: 12, padding: 8, background: \'#fff\', borderRadius: 8, boxShadow: \'0 1px 2px rgba(0,0,0,0.05)\' }}>',
  '        <AudioControls',
  '          micOn={audio.micOn} volume={audio.volume} audioEnabled={audio.audioEnabled}',
  '          onToggleMic={audio.toggleMic} onVolume={audio.changeVolume} onToggleAudio={audio.toggleAudio}',
  '          canSpeak={hasSpeakPermission}',
  '        />',
  '        {!hasSpeakPermission && <span style={{ fontSize: 11, color: \'#94a3b8\' }}>Raise hand to speak</span>}',
  '        {hasSpeakPermission && <span style={{ fontSize: 11, color: \'#10b981\', fontWeight: 700 }}>🎙️ You can speak!</span>}'
].join(nl);

const new1 = [
  '      {/* Audio controls + timer */}',
  '      <div style={{ display: \'flex\', gap: 8, alignItems: \'center\', flexWrap: \'wrap\', marginBottom: 12, padding: 8, background: \'#fff\', borderRadius: 8, boxShadow: \'0 1px 2px rgba(0,0,0,0.05)\' }}>',
  '        <AudioControls',
  '          micOn={audio.micOn} volume={audio.volume} audioEnabled={audio.audioEnabled}',
  '          onToggleMic={audio.toggleMic} onVolume={audio.changeVolume} onToggleAudio={audio.toggleAudio}',
  '          canSpeak={hasSpeakPermission}',
  '        />',
  '        {audio.micOn && <SoundWave level={audio.speakingLevel} color="#10b981" label="You" />}',
  '        {Object.entries(audio.remoteSpeaking || {}).filter(([_, lvl]) => lvl > 0.05).map(([uid, lvl]) => {',
  '          const p = participants.find(pp => String(pp.student_id) === String(uid));',
  '          const isTeacher = !p;',
  '          return <SoundWave key={uid} level={lvl} color={isTeacher ? \'#ef4444\' : \'#3b82f6\'} label={isTeacher ? \'Teacher\' : (p?.name?.split(\' \')[0] || \'Student\')} size="small" />;',
  '        })}',
  '        {!hasSpeakPermission && <span style={{ fontSize: 11, color: \'#94a3b8\' }}>✋ Raise hand to ask for mic</span>}',
  '        {hasSpeakPermission && !audio.micOn && <span style={{ fontSize: 12, color: \'#10b981\', fontWeight: 700, animation: \'pulse 1.5s infinite\' }}>🎙️ Teacher gave you mic — tap "Speak" to talk!</span>}',
  '        {hasSpeakPermission && audio.micOn && <span style={{ fontSize: 12, color: \'#10b981\', fontWeight: 700 }}>🎙️ You are speaking — everyone can hear you</span>}'
].join(nl);

if (c.includes(old1)) { c = c.replace(old1, new1); console.log('OK: student audio section'); }
else console.log('FAIL: student audio section');

fs.writeFileSync(file, c, 'utf8');
console.log('DONE');
