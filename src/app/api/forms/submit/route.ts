import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConvertKitIntegration, mapFormDataToSubscriber } from '@/lib/integrations/convertkit';
import { FormSubmissionSchema, sanitizeForLogging } from '@/lib/validation';
import { createSecureResponse } from '@/lib/security';
import { withFormRateLimit } from '@/lib/rateLimit';
import { z } from 'zod';

// Force dynamic rendering - prevent caching to avoid 405 errors
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface FormSubmissionRequest {
  formId: string;
  data: Record<string, any>;
  userId?: string;
  publishedPageId?: string;
}

// Diagnostic logging to identify failing request types
function logRequestDetails(request: NextRequest) {
  console.log('🔍 Form Submit Request:', {
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    origin: request.headers.get('origin'),
    host: request.headers.get('host'),
    contentType: request.headers.get('content-type'),
    timestamp: new Date().toISOString(),
  });
}

async function formSubmitHandler(request: NextRequest) {
  // Log all request details first for diagnosis
  logRequestDetails(request);

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
    
    const { formId, data, userId, publishedPageId } = validationResult.data;

    // Validate required fields early
    if (!userId) {
      console.warn('Form submission missing userId:', {
        formId,
        timestamp: new Date().toISOString()
      });
      return createSecureResponse(
        { error: 'Configuration error: User ID required' },
        400
      );
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // A09: Security Logging - Log safely without sensitive data
    if (process.env.NODE_ENV !== 'production') {
      // Only log in development
    }

    // If we have userId, fetch the form configuration and process integrations
    let formName = 'Unknown Form';
    let integrationResults: any[] = [];

    if (userId) {
      try {
        // Get the form configuration from the user's forms
        // Since forms are stored in project content, we need to find the form
        const projects = await prisma.project.findMany({
          where: { userId },
          include: { token: true },
        });

        let formConfig: any = null;
        for (const project of projects) {
          if (project.content && typeof project.content === 'object') {
            const content = project.content as any;
            if (content.forms && content.forms[formId]) {
              formConfig = content.forms[formId];
              break;
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
            userId,
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
          userId: userId.substring(0, 8) + '...', // Anonymized
          timestamp: new Date().toISOString()
        });

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
          hasUserId: !!userId,
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
    }

    // Fallback: No userId provided, can't store in database
    console.warn('Form submission without userId - cannot store in database:', {
      formId,
      timestamp: new Date().toISOString()
    });
    return createSecureResponse(
      {
        error: 'Configuration error: Unable to save submission',
        message: 'Please contact support.'
      },
      500
    );

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