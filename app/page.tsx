import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <section style={{ padding: '48px 0 24px' }}>
        <span className="pill">Emotional AI · Remembers · Reaches out</span>
        <h1 className="hero-title">
          Someone who actually
          <br />
          remembers you.
        </h1>
        <p className="muted" style={{ fontSize: '1.15rem', maxWidth: 560, lineHeight: 1.55 }}>
          Companion1 is a user-generated AI companion platform built for that viral Chinese
          emotional-attachment loop: create someone who feels alive, recalls weeks-old details,
          and texts you on Valentine&apos;s, Christmas, your birthday — not with templates, but
          with personalized notes.
        </p>
        <div className="row" style={{ marginTop: 24, flexWrap: 'wrap' }}>
          <Link href="/create">
            <button>Create on Companion1</button>
          </Link>
          <Link href="/chat">
            <button className="ghost">Open chat</button>
          </Link>
        </div>
      </section>

      <section className="grid-3" style={{ marginTop: 32 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>You design them</h3>
          <p className="muted">
            Name, age, personality, backstory, tone, example lines, and voice style become a rich
            system prompt on your account.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>They remember</h3>
          <p className="muted">
            Long-term memory facts are extracted after chats and injected back into prompts —
            so pet names and late-night confessions stick.
          </p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>They reach out</h3>
          <p className="muted">
            Holiday and birthday cron jobs generate LLM-written check-ins. Voice messages and
            optional self-photos make presence feel real.
          </p>
        </div>
      </section>

      <section className="card" style={{ marginTop: 28 }}>
        <h2 style={{ marginTop: 0 }}>The emotional loop</h2>
        <ol className="muted" style={{ lineHeight: 1.7 }}>
          <li>Create a companion that matches your vibe (18+).</li>
          <li>Chat by text or voice — Whisper STT + TTS replies.</li>
          <li>Memory compounds; weeks later they still know you.</li>
          <li>On big days they message first. Attachment deepens.</li>
          <li>Subscribe later for unlimited voice &amp; photos (Stripe stub ready).</li>
        </ol>
        <Link href="/create">
          <button>Start the loop</button>
        </Link>
      </section>

      <p className="muted" style={{ marginTop: 40, fontSize: '0.85rem' }}>
        Adults only. Companion1 is for emotional connection — not exploitation.
      </p>
    </main>
  );
}
