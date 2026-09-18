'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildSystemPrompt } from '@/lib/prompt';

export default function CreateCompanion() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [personality, setPersonality] = useState('');
  const [backstory, setBackstory] = useState('');
  const [tone, setTone] = useState('warm');
  const [exampleLines, setExampleLines] = useState('');
  const [voiceStyle, setVoiceStyle] = useState('soft and intimate');
  const [ageVerified, setAgeVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!ageVerified) {
      setError('You must confirm you are 18 or older.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }

    const payload = {
      name: name.trim(),
      age: age ? Number(age) : undefined,
      personality,
      backstory,
      tone,
      exampleLines,
      voiceStyle,
      ageVerified,
    };

    const systemPrompt = buildSystemPrompt({
      name: payload.name,
      age: payload.age,
      personality,
      backstory,
      tone,
      exampleLines,
      voiceStyle,
    });

    setLoading(true);
    try {
      const res = await fetch('/api/companions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        // Guest fallback: localStorage until they sign in
        localStorage.setItem(
          'currentCompanion',
          JSON.stringify({ ...payload, system_prompt: systemPrompt, id: 'local' })
        );
        router.push('/chat');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Create failed');

      localStorage.setItem('currentCompanionId', data.companion.id);
      localStorage.setItem(
        'currentCompanion',
        JSON.stringify({
          id: data.companion.id,
          name: data.companion.name,
          age: data.companion.age,
          personality: data.companion.personality,
          backstory: data.companion.backstory,
          tone: data.companion.tone,
          exampleLines: data.companion.example_lines,
          voiceStyle: data.companion.voice_style,
          system_prompt: data.companion.system_prompt,
        })
      );
      router.push(`/chat?id=${data.companion.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: 600 }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Create your Companion</h1>
        <p className="muted">
          Shape who they are. We turn this into a rich system prompt stored on your account.
        </p>
        <form onSubmit={handleCreate}>
          <label>
            Name *
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Luna" />
          </label>
          <label>
            Age (character)
            <input
              type="number"
              min={18}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="18+"
            />
          </label>
          <label>
            Personality
            <textarea
              rows={3}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="Playful, fiercely loyal, a little jealous in a cute way…"
            />
          </label>
          <label>
            Backstory
            <textarea
              rows={3}
              value={backstory}
              onChange={(e) => setBackstory(e.target.value)}
              placeholder="Where they come from, what they care about…"
            />
          </label>
          <label>
            Tone
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="warm">warm</option>
              <option value="flirty">flirty</option>
              <option value="calm">calm</option>
              <option value="playful">playful</option>
              <option value="mysterious">mysterious</option>
              <option value="protective">protective</option>
              <option value="witty">witty</option>
            </select>
          </label>
          <label>
            Example lines they might say
            <textarea
              rows={3}
              value={exampleLines}
              onChange={(e) => setExampleLines(e.target.value)}
              placeholder={'Missed you today.\nTell me one thing that made you smile.'}
            />
          </label>
          <label>
            Voice style
            <input
              value={voiceStyle}
              onChange={(e) => setVoiceStyle(e.target.value)}
              placeholder="soft and intimate / bright and bubbly / low and calm"
            />
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={ageVerified}
              onChange={(e) => setAgeVerified(e.target.checked)}
            />
            <span>
              I confirm I am <strong>18 or older</strong>. Companion is an adults-only emotional
              product.
            </span>
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create & chat'}
          </button>
          <p className="muted" style={{ fontSize: '0.85rem', marginTop: 12 }}>
            Not signed in? We&apos;ll keep a local draft so you can try chat, then save to your
            account after <a href="/login">sign in</a>.
          </p>
        </form>
      </div>
    </main>
  );
}
