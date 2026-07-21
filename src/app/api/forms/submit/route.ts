import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConvertKitIntegration, mapFormDataToSubscriber } from '@/lib/integrations/convertkit';
import { sendLeadNotification } from '@/lib/email/sendLeadNotification';
import { resolveOwnerEmail } from '@/lib/email/resolveOwnerEmail';
import { BLOG_SUBSCRIBE_FORM_ID } from '@/lib/blog/buildBlogPages';
import { FormSubmissionSchema, sanitizeForLogging } from '@/lib/validation';
import { isServingPublishState } from '@/lib/publishState';
import { createSecureResponse } from '@/lib/security';
import { withFormRateLimit } from '@/lib/rateLimit';
import { checkLimit } from '@/lib/planManager';
import { z } from 'zod';

// Force dynamic rendering - prevent caching to avoid 405 errors
export const dynamic = 'force-dynamic';
export const revalidate = 0;  // Prevent any caching at any layer
export const runtime = 'nodejs';

interface FormSubmissionRequest {
  formId: string;
  data: Record<string, any>;
  /**
   * @deprecated IGNORED by the server. Kept only so old published blobs (immutable,
   * shipping the frozen form.v1.js which still sends it) keep validating. The owner
   * is derived server-side from `publishedPageId` → `PublishedPage.userId`.
   */
  userId?: string;
  /** REQUIRED in practice — the identity input the owner is derived from. */
  publishedPageId?: string;
}

// Diagnostic logging to identify failing request types
function logRequestDetails(request: NextRequest): string {
  const requestId = crypto.randomUUID();
  console.log('🔍 Form Submit Handler REACHED:', {
    requestId,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    contentType: request.headers.get('content-type'),
    timestamp: new Date().toISOString(),
  });
  return requestId;
}

async function formSubmitHandler(request: NextRequest) {
  // Log all request details first for diagnosis
  const requestId = logRequestDetails(request);
  console.log(`[${requestId}] Handler executing...`);

  try {
    const body = await request.json();
    
    // A03: Injection Prevention - Validate input
    const validationResult = FormSubmissionSchema.safeParse(body);
    if (!validationResult.success) {
      return createSecureResponse(
        { error: 'Invalid request format', details: validationResult.error.issues },
        400
      );
    }
    
    // NOTE: `userId` is deliberately NOT destructured. The body may still carry one
    // (old published blobs ship the frozen form.v1.js, which sends it forever), but
    // it is attacker-controlled — `data-owner-id` was printed into public page HTML.
    // The field stays in FormSubmissionSchema for back-compat; the route never reads it.
    const { formId, data, publishedPageId } = validationResult.data;

    // Derive the owner from the page identity, not from the client body.
    if (!publishedPageId) {
      console.warn('Form submission missing publishedPageId:', {
        formId,
        timestamp: new Date().toISOString(),
      });
      return createSecureResponse(
        { error: 'missing_page_id', message: 'Form configuration error. Please contact support.' },
        400
      );
    }

    const page = await prisma.publishedPage.findUnique({
      where: { id: publishedPageId },
      // `title` feeds the lead-email From display name (business name).
      select: { userId: true, projectId: true, publishState: true, title: true },
    });

    // Unknown page, or a page that must not serve (`draft` / `unpublishing` — see
    // isServingPublishState). Same body either way: don't distinguish existence.
    // Known edge: a blog post still CDN-cached while its parent PublishedPage is
    // non-serving will have subscribes rejected — correct per spec (unpublished →
    // rejected). `publishing`/`failed`/legacy-null fail OPEN: those pages are live.
    if (!page || !isServingPublishState(page.publishState)) {
      console.warn('Form submission for unknown/non-serving page:', {
        formId,
        publishState: page?.publishState ?? null,
        timestamp: new Date().toISOString(),
      });
      return createSecureResponse(
        { error: 'unknown_page', message: 'This form is no longer available. Please contact support.' },
        404
      );
    }

    const ownerUserId = page.userId;

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // A09: Security Logging - Log safely without sensitive data
    if (process.env.NODE_ENV !== 'production') {
      // Only log in development
    }

    // Fetch the form configuration and process integrations. There is no
    // no-owner path any more: the derivation gate above either returned or gave
    // us a real owner.
    let formName = 'Unknown Form';
    let integrationResults: any[] = [];

    try {
      // pricing-v2 (phase 2): monthly form-submission cap. FormSubmission.userId
      // is the page OWNER, so counting this owner's rows in the current calendar
      // month (UTC) covers every page they own; gate that count against their
      // plan's formSubmissions limit (FREE 25 / PRO 1000 / AGENCY+ENT -1 = never
      // trips). Over limit → 429 with a stable error code the embedded form
      // handler surfaces to the visitor (never silently dropped). This is the
      // per-owner monthly cap; the existing per-IP rate-limit (withFormRateLimit)
      // is orthogonal and still applies.
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const monthlySubmissionCount = await prisma.formSubmission.count({
        where: { userId: ownerUserId, createdAt: { gte: monthStart } },
      });
      const submissionLimit = await checkLimit(ownerUserId, 'formSubmissions', monthlySubmissionCount);
      if (!submissionLimit.allowed) {
        console.warn('[forms/submit] monthly submission cap reached:', {
          userId: ownerUserId.substring(0, 8) + '...',
          current: submissionLimit.current,
          limit: submissionLimit.limit,
        });
        return createSecureResponse(
          {
            error: 'form_submission_limit_reached',
            message: 'This form is temporarily unavailable. Please try again later.',
          },
          429
        );
      }

      // Form config lives in project content. Look it up ONLY in the page's OWN
      // project (not an all-projects scan of the owner): a forged submit against
      // page X carrying a formId from project Y must never fire Y's integration
      // key. A formId that lives in a DIFFERENT project of the same owner no
      // longer resolves — forms are authored in the project that publishes them,
      // so cross-project resolution was accidental. `PublishedPage.projectId` is
      // NULLABLE (publish writes `project?.id || null`), so a legacy/orphaned page
      // skips the lookup entirely rather than 500ing. Either way, "no config found"
      // → the submission is still stored with formName 'Unknown Form', and no
      // integrations fire.
      let formConfig: any = null;
      let projectTitle: string | null = null;
      if (page.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: page.projectId },
          // Only `content` + `title` are read below. The other JSON columns
          // (themeValues/computedDesign/brief/aiBaseline) are pure wire cost on
          // every submission. `title` is the business-name fallback for the
          // lead-email From display name.
          select: { content: true, title: true },
        });
        projectTitle = project?.title ?? null;
        const content = project?.content;
        if (content && typeof content === 'object') {
          const forms = (content as any).forms;
          if (forms && forms[formId]) {
            formConfig = forms[formId];
          }
        }
      }

      if (formConfig) {
        formName = formConfig.name || 'Unnamed Form';

        // Process integrations
        if (formConfig.integrations && Array.isArray(formConfig.integrations)) {
          for (const integration of formConfig.integrations) {
            if (!integration.enabled) continue;

            try {
              if (integration.type === 'convertkit') {
                const { apiKey, formId: ckFormId } = integration.settings || {};
                
                if (apiKey) {
                  const convertKit = new ConvertKitIntegration({
                    apiKey,
                    formId: ckFormId,
                  });

                  const subscriber = mapFormDataToSubscriber(data);
                  if (subscriber.email) {
                    const result = await convertKit.addSubscriber(subscriber);
                    integrationResults.push({
                      type: 'convertkit',
                      name: integration.name,
                      success: result.success,
                      error: result.error,
                    });
                  } else {
                    integrationResults.push({
                      type: 'convertkit',
                      name: integration.name,
                      success: false,
                      error: 'No email address found in form data',
                    });
                  }
                }
              } else if (integration.type === 'dashboard') {
                // Dashboard integration is always successful (we're storing in DB)
                integrationResults.push({
                  type: 'dashboard',
                  name: integration.name,
                  success: true,
                });
              }
            } catch (integrationError) {
              // A09: Security Logging - Safe error logging
              if (process.env.NODE_ENV !== 'production') {
                // Log integration errors only in development
              }
              integrationResults.push({
                type: integration.type,
                name: integration.name,
                success: false,
                error: integrationError instanceof Error ? integrationError.message : 'Unknown error',
              });
            }
          }
        }
      }

      // Store submission in database
      const submission = await prisma.formSubmission.create({
        data: {
          userId: ownerUserId,
          publishedPageId,
          formId,
          formName,
          data: data as any, // Cast to any for JSON field
          ipAddress,
          userAgent,
        },
      });

      // Log successful saves for debugging (production-safe)
      console.log('FormSubmission saved:', {
        submissionId: submission.id,
        formId,
        userId: ownerUserId.substring(0, 8) + '...', // Anonymized (server-derived owner)
        timestamp: new Date().toISOString()
      });

      // Blog (P2): the blog-subscribe CTA feeds the native subscriber list —
      // upsert so a resubmit after unsubscribing re-subscribes. Never throws
      // (a subscribe is still a saved FormSubmission even if this fails).
      if (formId === BLOG_SUBSCRIBE_FORM_ID && typeof publishedPageId === 'string' && publishedPageId) {
        try {
          const email = typeof (data as any)?.email === 'string' ? (data as any).email.trim().toLowerCase() : '';
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            await prisma.blogSubscriber.upsert({
              where: { publishedPageId_email: { publishedPageId, email } },
              create: { publishedPageId, email },
              update: { status: 'subscribed' },
            });
          }
        } catch (subErr) {
          console.error('[blog] subscriber upsert failed (non-fatal):', subErr);
        }
      }

      // Email notification to the PAGE OWNER (env-gated on RESEND_API_KEY; no-op +
      // never throws when unset). Double-guarded so a send failure can't 500 a saved
      // lead. Await-then-flag: record the notify outcome on the row so a
      // silently-failing inbox is visible in the dashboard (F30). The send never
      // affects form success.
      try {
        // Business name for the From display name: page title → project title →
        // generic. Prisma's `"Untitled Project"` default is a non-name — fall through.
        const pageTitle = (page.title || '').trim();
        const projTitle = (projectTitle || '').trim();
        const businessName =
          pageTitle ||
          (projTitle && projTitle !== 'Untitled Project' ? projTitle : '') ||
          'Your website';

        // Owner's Clerk email is the recipient. A lookup failure is an outcome,
        // never an exception — the lead row is already saved either way.
        const ownerEmail = await resolveOwnerEmail(ownerUserId);
        const outcome = 'error' in ownerEmail
          ? { status: 'failed' as const, error: ownerEmail.error }
          : await sendLeadNotification({
              formName,
              data: data as Record<string, string>,
              fields: formConfig?.fields,
              replyTo: (data as any)?.email,
              pageId: publishedPageId,
              to: ownerEmail.email,
              businessName,
            });
        if ('error' in ownerEmail) {
          console.warn('[forms/submit] owner email unresolved; notification skipped:', {
            userId: ownerUserId.substring(0, 8) + '...',
            reason: ownerEmail.error,
          });
        }
        if (outcome.status === 'sent') {
          await prisma.formSubmission.update({
            where: { id: submission.id },
            data: { notifiedAt: new Date() },
          });
        } else if (outcome.status === 'failed') {
          await prisma.formSubmission.update({
            where: { id: submission.id },
            data: { notifyError: outcome.error.slice(0, 300) },
          });
        }
        // 'skipped' → leave notifiedAt/notifyError null (feature unconfigured)
      } catch (notifyErr) {
        // Helper never throws; a failed status-write must not 500 a saved lead.
        console.warn('[forms/submit] notify outcome write failed (non-fatal):', notifyErr);
      }

      // A09: Security Logging - Safe success logging
      if (process.env.NODE_ENV !== 'production') {
        // Log success only in development
      }

      return createSecureResponse({
        success: true,
        message: 'Form submitted successfully',
        submissionId: submission.id,
        integrations: integrationResults,
      });

    } catch (dbError) {
      // Production-safe error logging with details
      console.error('FormSubmission DB Error:', {
        errorType: dbError instanceof Error ? dbError.constructor.name : 'Unknown',
        errorMsg: dbError instanceof Error ? dbError.message : 'Unknown error',
        ownerUserId: ownerUserId.substring(0, 8) + '...',
        hasPublishedPageId: !!publishedPageId,
        formId,
        timestamp: new Date().toISOString()
      });

      // Return actual error instead of fake success
      return createSecureResponse(
        {
          error: 'Failed to save form submission',
          message: 'Please try again. If the problem persists, contact support.'
        },
        500
      );
    }
  } catch (error) {
    // A09: Security Logging - Safe error handling
    if (process.env.NODE_ENV !== 'production') {
      // Log errors only in development
    }
    return createSecureResponse(
      { error: 'Internal server error' },
      500
    );
  }
}

// Optional: GET endpoint to retrieve form configuration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('formId');

  if (!formId || !/^[a-zA-Z0-9_-]+$/.test(formId)) {
    return createSecureResponse(
      { error: 'Valid form ID is required' },
      400
    );
  }

  // TODO: Fetch form configuration from database
  // For now, return a sample configuration
  const formConfig = {
    id: formId,
    name: 'Sample Form',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true },
      { id: 'email', type: 'email', label: 'Email', required: true },
      { id: 'message', type: 'textarea', label: 'Message', required: false },
    ],
    submitButtonText: 'Submit',
    successMessage: 'Thank you for your submission!',
  };

  return createSecureResponse(formConfig);
}

// Apply rate limiting to the POST handler
export const POST = withFormRateLimit(formSubmitHandler);