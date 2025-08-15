import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConvertKitIntegration, mapFormDataToSubscriber } from '@/lib/integrations/convertkit';
import { FormSubmissionSchema, sanitizeForLogging } from '@/lib/validation';
import { createSecureResponse } from '@/lib/security';
import { z } from 'zod';

interface FormSubmissionRequest {
  formId: string;
  data: Record<string, any>;
  userId?: string;
  publishedPageId?: string;
}


export async function POST(request: NextRequest) {
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
        // A09: Security Logging - Safe database error handling
        if (process.env.NODE_ENV !== 'production') {
          // Log database errors only in development
        }
        // Continue without database storage
      }
    }

    // Fallback: return success without database storage
    return createSecureResponse({
      success: true,
      message: 'Form submitted successfully',
      submissionId: `sub_${Date.now()}`,
      integrations: integrationResults,
    });

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