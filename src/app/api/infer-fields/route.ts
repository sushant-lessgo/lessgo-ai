import { NextRequest } from 'next/server';
import { z } from 'zod';
import { inferFields } from '@/modules/inference/inferFields';

const RequestSchema = z.object({
  input: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { input } = RequestSchema.parse(body);

    const result = await inferFields(input);

    return Response.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[API] infer-fields error:', err);
    return Response.json(
      { success: false, error: err.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
