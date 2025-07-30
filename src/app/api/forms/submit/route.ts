import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ConvertKitIntegration, mapFormDataToSubscriber } from '@/lib/integrations/convertkit';

interface FormSubmissionRequest {
  formId: string;
  data: Record<string, any>;
  userId?: string;
  publishedPageId?: string;
}


export async function POST(request: NextRequest) {
  try {
    const body: FormSubmissionRequest = await request.json();
    const { formId, data, userId, publishedPageId } = body;

    if (!formId || !data) {
      return NextResponse.json(
        { error: 'Form ID and data are required' },
        { status: 400 }
      );
    }

    // Get client info
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Log the form submission
    console.log('📝 Form Submission Received:', {
      formId,
      data,
      userId,
      publishedPageId,
      timestamp: new Date().toISOString(),
    });

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
                console.error(`Integration error (${integration.type}):`, integrationError);
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
            data,
            ipAddress,
            userAgent,
          },
        });

        console.log('✅ Form submission stored:', submission.id);

        // Log integration results
        if (integrationResults.length > 0) {
          console.log('🔗 Integration results:', integrationResults);
        }

        return NextResponse.json({
          success: true,
          message: 'Form submitted successfully',
          submissionId: submission.id,
          integrations: integrationResults,
        });

      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue without database storage
      }
    }

    // Fallback: just log the submission if no userId or database error
    return NextResponse.json({
      success: true,
      message: 'Form submitted successfully',
      submissionId: `sub_${Date.now()}`,
      integrations: integrationResults,
    });

  } catch (error) {
    console.error('Form submission error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to retrieve form configuration
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const formId = searchParams.get('formId');

  if (!formId) {
    return NextResponse.json(
      { error: 'Form ID is required' },
      { status: 400 }
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

  return NextResponse.json(formConfig);
}