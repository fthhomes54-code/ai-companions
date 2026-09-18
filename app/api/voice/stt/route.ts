import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI, getWhisperModel } from '@/lib/openai';
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

    const form = await req.formData();
    const file = form.get('audio');
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing audio file' }, { status: 400 });
    }

    const openai = getOpenAI();
    const filename = (file as File).name || 'audio.webm';
    const transcription = await openai.audio.transcriptions.create({
      file: new File([file], filename, { type: file.type || 'audio/webm' }),
      model: getWhisperModel(),
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'STT failed' }, { status: 500 });
  }
}
