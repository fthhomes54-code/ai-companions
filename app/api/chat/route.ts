import { NextRequest, NextResponse } from 'next/server';
import { chatWithCompanion, CompanionInput } from '@/lib/companion';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companion, history, message } = body as {
      companion: CompanionInput;
      history: { role: 'user' | 'assistant'; content: string }[];
      message: string;
    };

    if (!companion?.name || !message) {
      return NextResponse.json({ error: 'Missing name or message' }, { status: 400 });
    }

    const reply = await chatWithCompanion(companion, history || [], message);
    return NextResponse.json({ reply });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}