import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
      const { email } = await req.json();
  
      const FORM_ID = "7879671";
      const API_KEY = process.env.KIT_API_KEY;
  
      const response = await fetch(
        `https://api.convertkit.com/v3/forms/${FORM_ID}/subscribe`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, api_key: API_KEY }),
        }
      );
  
      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error }, { status: 500 });
      }
  
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (err) {
      return NextResponse.json({ error: "Something went wrong." }, {
        status: 500,
      });
    }
  }
  