import { NextRequest, NextResponse } from 'next/server';
import { getImageModel, getOpenAI, isImageGenEnabled } from '@/lib/openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    if (!isImageGenEnabled()) {
      return NextResponse.json(
        { error: 'Image generation is disabled. Set ENABLE_IMAGE_GEN=true' },
        { status: 403 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, companionId } = (await req.json()) as {
      prompt?: string;
      companionId?: string;
    };

    if (!prompt?.trim()) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const openai = getOpenAI();
    const result = await openai.images.generate({
      model: getImageModel(),
      prompt: `Self-photo style portrait for an AI companion character. Soft lighting, intimate, tasteful, PG-13. ${prompt}`.slice(
        0,
        3900
      ),
      n: 1,
      size: '1024x1024',
    });

    const url = result.data?.[0]?.url;
    if (!url) {
      return NextResponse.json({ error: 'No image returned' }, { status: 500 });
    }

    if (companionId) {
      await supabase.from('messages').insert({
        companion_id: companionId,
        user_id: user.id,
        role: 'assistant',
        content: 'Sent you a photo ✨',
        modality: 'image',
        media_url: url,
      });
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 });
  }
}
