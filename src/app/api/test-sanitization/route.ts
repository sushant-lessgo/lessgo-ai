// app/api/test-sanitization/route.ts - Test endpoint for HTML sanitization
import { NextRequest, NextResponse } from 'next/server';
import { runSanitizationTests } from '@/lib/htmlSanitizer.test';
import { 
  sanitizePublishedContent, 
  sanitizeFormattingContent, 
  sanitizeEditorContent,
  validateHTMLSafety 
} from '@/lib/htmlSanitizer';

export async function POST(req: NextRequest) {
  try {
    const { html, profile = 'strict' } = await req.json();
    
    if (!html) {
      return NextResponse.json({ error: 'HTML content required' }, { status: 400 });
    }

    let sanitized: string;
    let profileUsed: string;

    // Apply appropriate sanitization profile
    switch (profile) {
      case 'editor':
        sanitized = sanitizeEditorContent(html);
        profileUsed = 'Editor (Permissive)';
        break;
      case 'formatting':
        sanitized = sanitizeFormattingContent(html);
        profileUsed = 'Formatting Only';
        break;
      case 'strict':
      default:
        sanitized = sanitizePublishedContent(html);
        profileUsed = 'Published Content (Strict)';
        break;
    }

    // Validate safety
    const safety = validateHTMLSafety(html);

    return NextResponse.json({
      success: true,
      input: html,
      output: sanitized,
      profile: profileUsed,
      safety: {
        isSafe: safety.isSafe,
        issues: safety.issues
      },
      stats: {
        inputLength: html.length,
        outputLength: sanitized.length,
        reductionPercent: Math.round((1 - sanitized.length / html.length) * 100)
      }
    });

  } catch (error) {
    console.error('Sanitization test error:', error);
    return NextResponse.json({ 
      error: 'Sanitization test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Run comprehensive test suite
    const results = runSanitizationTests();
    
    return NextResponse.json({
      success: true,
      message: 'HTML Sanitization Test Suite Complete',
      results: {
        passed: results.passed,
        failed: results.failed,
        success: results.failed === 0
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test suite error:', error);
    return NextResponse.json({ 
      error: 'Test suite failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}