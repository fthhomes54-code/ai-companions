'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateCompanion() {
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [tone, setTone] = useState('friendly');
  const [exampleLines, setExampleLines] = useState('');

  const router = useRouter();

  function handleCreate() {
    // TODO: save to DB + auth. For now stash in localStorage and go chat.
    const companion = { name, personality, backstory, tone, exampleLines };
    localStorage.setItem('currentCompanion', JSON.stringify(companion));
    router.push('/chat');
  }

  return (
    <main style={{ fontFamily: 'system-ui', maxWidth: 560, margin: '0 auto', padding: 24 }}>
      <h1>Create your companion</h1>
      <label>Name<br/><input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', marginBottom: 12 }} /></label>
      <label>Personality<br/><textarea value={personality} onChange={e => setPersonality(e.target.value)} style={{ width: '100%', marginBottom: 12 }} /></label>
      <label>Backstory<br/><textarea value={backstory} onChange={e => setBackstory(e.target.value)} style={{ width: '100%', marginBottom: 12 }} /></label>
      <label>Tone<br/>
        <select value={tone} onChange={e => setTone(e.target.value)} style={{ width: '100%', marginBottom: 12 }}>
          <option>friendly</option>
          <option>flirty</option>
          <option>calm</option>
          <option>playful</option>
          <option>mysterious</option>
        </select>
      </label>
      <label>Example lines they might say<br/><textarea value={exampleLines} onChange={e => setExampleLines(e.target.value)} style={{ width: '100%', marginBottom: 12 }} /></label>
      <button onClick={handleCreate} style={{ padding: '10px 16px', background: '#111', color: '#fff', borderRadius: 8 }}>
        Create & chat
      </button>
    </main>
  );
}