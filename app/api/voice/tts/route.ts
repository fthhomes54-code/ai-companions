import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, getTtsModel, getTtsVoice } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, voice } = (await req.json()) as { text?: string; voice?: string };
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const openai = getOpenAI();
    const speech = await openai.audio.speech.create({
      model: getTtsModel(),
      voice: (voice as 'nova' | 'alloy' | 'echo' | 'fable' | 'onyx' | 'shimmer') || (getTtsVoice() as 'nova'),
      input: text.slice(0, 4096),
      response_format: 'mp3',
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'TTS failed' }, { status: 500 });
  }
}
