// hooks/editStore/validationActions.ts - Validation and business logic actions
import type { EditStore } from '@/types/store';
import type { ValidationActions } from '@/types/store';
/**
 * ===== VALIDATION ACTIONS CREATOR =====
 */
export function createValidationActions(set: any, get: any): ValidationActions {
  return {
    /**
     * ===== SECTION VALIDATION =====
     */
    
    validateSection: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) {
        console.warn('⚠️ Section not found for validation:', sectionId);
        return false;
      }
      
      // Get layout-specific requirements
      const layout = section.layout;
      const requiredElements = getRequiredElementsForLayout(layout);
      
      const errors: string[] = [];
      const warnings: string[] = [];
      const missingRequired: string[] = [];
      
      // Check required elements
      requiredElements.forEach((elementKey: string) => {
        const element = section.elements[elementKey];
        
        if (!element || !element.content) {
          errors.push(`Missing required element: ${elementKey}`);
          missingRequired.push(elementKey);
        } else if (typeof element.content === 'string' && element.content.trim().length === 0) {
          errors.push(`Empty required element: ${elementKey}`);
          missingRequired.push(elementKey);
        } else if (Array.isArray(element.content) && element.content.length === 0) {
          errors.push(`Empty required list: ${elementKey}`);
          missingRequired.push(elementKey);
        }
      });
      
      // Content quality checks
      Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
        if (element.type === 'headline' && typeof element.content === 'string') {
          if (element.content.length > 80) {
            warnings.push(`Headline "${elementKey}" is too long (${element.content.length} chars)`);
          }
          if (element.content.length < 10) {
            warnings.push(`Headline "${elementKey}" might be too short`);
          }
        }
        
        if (element.type === 'button' && typeof element.content === 'string') {
          if (element.content.length > 25) {
            warnings.push(`Button text "${elementKey}" is too long`);
          }
          if (!element.content.toLowerCase().includes('get') && 
              !element.content.toLowerCase().includes('start') &&
              !element.content.toLowerCase().includes('try') &&
              !element.content.toLowerCase().includes('learn')) {
            warnings.push(`Button "${elementKey}" might benefit from action-oriented text`);
          }
        }
        
        if (element.type === 'image' && typeof element.content === 'string') {
          if (!element.content.startsWith('http') && !element.content.startsWith('data:')) {
            warnings.push(`Image "${elementKey}" may have invalid URL`);
          }
        }
      });
      
      const isValid = errors.length === 0;
      const completionPercentage = calculateCompletionPercentage(section, requiredElements);
      
      // Update section validation status
      set((state: EditStore) => {
        if (state.content[sectionId]) {
          // Initialize editMetadata if it doesn't exist
          if (!state.content[sectionId].editMetadata) {
            state.content[sectionId].editMetadata = {
              isSelected: false,
              isEditing: false,
              lastModified: Date.now(),
              isDeletable: true,
              isMovable: true,
              isDuplicable: true,
              completionPercentage: 0,
              validationStatus: {
                isValid: true,
                errors: [],
                warnings: [],
                missingRequired: [],
                lastValidated: Date.now(),
              },
            };
          }
          
          // Initialize validationStatus if it doesn't exist
          if (!state.content[sectionId].editMetadata.validationStatus) {
            state.content[sectionId].editMetadata.validationStatus = {
              isValid: true,
              errors: [],
              warnings: [],
              missingRequired: [],
              lastValidated: Date.now(),
            };
          }
          
          state.content[sectionId].editMetadata.validationStatus = {
            isValid,
            errors: errors.map((error: string) => ({
              elementKey: 'general',
              code: 'validation',
              message: error,
              severity: 'error' as const,
            })),
            warnings: warnings.map((warning: string) => ({
              elementKey: 'general',
              code: 'warning',
              message: warning,
              autoFixable: false,
            })),
            missingRequired,
            lastValidated: Date.now(),
          };
          
          state.content[sectionId].editMetadata.completionPercentage = completionPercentage;
        }
      });
      
      console.log(`🔍 Section validation for ${sectionId}:`, {
        isValid,
        errors: errors.length,
        warnings: warnings.length,
        completion: `${completionPercentage}%`,
      });
      
      return isValid;
    },
    
    getIncompleteElements: (sectionId: string) => {
      const state = get();
      const section = state.content[sectionId];
      
      if (!section) return [];
      
      const layout = section.layout;
      const requiredElements = getRequiredElementsForLayout(layout);
      
      return requiredElements.filter((elementKey: string) => {
        const element = section.elements[elementKey];
        return !element || 
               !element.content || 
               (typeof element.content === 'string' && element.content.trim().length === 0) ||
               (Array.isArray(element.content) && element.content.length === 0);
      });
    },

    /**
     * ===== PAGE-LEVEL VALIDATION =====
     */
    
    validateAllSections: () => {
      const state = get();
      const results: Record<string, boolean> = {};
      let overallValid = true;
      
      state.sections.forEach((sectionId: string) => {
        const isValid = get().validateSection(sectionId);
        results[sectionId] = isValid;
        if (!isValid) overallValid = false;
      });
      
      console.log('🔍 Page validation results:', {
        overall: overallValid,
        sections: Object.keys(results).length,
        valid: Object.values(results).filter(Boolean).length,
        invalid: Object.values(results).filter((v: boolean) => !v).length,
      });
      
      return {
        isValid: overallValid,
        sectionResults: results,
        summary: {
          total: Object.keys(results).length,
          valid: Object.values(results).filter(Boolean).length,
          invalid: Object.values(results).filter((v: boolean) => !v).length,
        },
      };
    },
    
    canPublish: () => {
      const state = get();
      
      // Basic requirements for publishing
      const requirements = {
        hasTitle: !!state.title && state.title.trim().length > 0,
        hasSections: state.sections.length > 0,
        sectionsValid: state.sections.every((sectionId: string) => get().validateSection(sectionId)),
        hasHero: state.sections.some((id: string) => id.includes('hero')),
        hasCTA: state.sections.some((id: string) => id.includes('cta')) || 
               Object.values(state.content).some((section: any) => 
                 Object.keys(section.elements).some((key: string) => key.includes('cta'))
               ),
      };
      
      const canPublish = Object.values(requirements).every(Boolean);
      
      console.log('📋 Publish readiness check:', {
        canPublish,
        requirements,
      });
      
      set((state: EditStore) => {
        state.publishing.isPublishReady = canPublish;
        
        if (!canPublish) {
          const missing = Object.entries(requirements)
            .filter(([_, met]: [string, boolean]) => !met)
            .map(([req]: [string, boolean]) => req);
          
          state.publishing.publishError = `Cannot publish: Missing ${missing.join(', ')}`;
        } else {
          state.publishing.publishError = undefined;
        }
      });
      
      return canPublish;
    },

    /**
     * ===== OPTIMIZATION SUGGESTIONS =====
     */
    
    getOptimizationSuggestions: () => {
      const state = get();
      const suggestions: Array<{
        type: 'seo' | 'content' | 'structure' | 'performance' | 'accessibility';
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        action?: string;
        sectionId?: string;
      }> = [];
      
      // SEO Suggestions
      if (!state.title || state.title.length < 30) {
        suggestions.push({
          type: 'seo',
          priority: 'high',
          title: 'Improve Page Title',
          description: 'Page title should be 30-60 characters for better SEO',
          action: 'Edit page title in settings',
        });
      }
      
      if (!state.description || state.description.length < 120) {
        suggestions.push({
          type: 'seo',
          priority: 'medium',
          title: 'Add Meta Description',
          description: 'Meta description should be 120-160 characters',
          action: 'Add page description in settings',
        });
      }
      
      // Content Suggestions
      if (state.sections.length < 4) {
        suggestions.push({
          type: 'structure',
          priority: 'medium',
          title: 'Add More Sections',
          description: 'Landing pages typically perform better with 4-7 sections',
          action: 'Add sections like features, testimonials, or FAQ',
        });
      }
      
      // Check for social proof
      const hasSocialProof = state.sections.some((id: string) => 
        id.includes('testimonial') || id.includes('social') || id.includes('logo')
      );
      
      if (!hasSocialProof) {
        suggestions.push({
          type: 'content',
          priority: 'high',
          title: 'Add Social Proof',
          description: 'Social proof increases conversion rates significantly',
          action: 'Add testimonials, logos, or social proof section',
        });
      }
      
      // Check CTAs
      const ctaCount = Object.values(state.content).reduce((count: number, section: any) => {
        return count + Object.keys(section.elements).filter((key: string) => 
          key.includes('cta')
        ).length;
      }, 0);
      
      if (ctaCount < 2) {
        suggestions.push({
          type: 'content',
          priority: 'medium',
          title: 'Add More CTAs',
          description: 'Multiple CTAs can improve conversion opportunities',
          action: 'Add CTA buttons in different sections',
        });
      }
      
      // Performance Suggestions
      const imageCount = Object.values(state.content).reduce((count: number, section: any) => {
        return count + Object.values(section.elements).filter((element: any) => 
          element.type === 'image'
        ).length;
      }, 0);
      
      if (imageCount > 10) {
        suggestions.push({
          type: 'performance',
          priority: 'medium',
          title: 'Optimize Images',
          description: 'Too many images can slow down page loading',
          action: 'Consider removing or optimizing some images',
        });
      }
      
      // Section-specific suggestions
      state.sections.forEach((sectionId: string) => {
        const section = state.content[sectionId];
        if (!section) return;
        
        const completionPercentage = section.editMetadata.completionPercentage;
        
        if (completionPercentage < 80) {
          suggestions.push({
            type: 'content',
            priority: 'high',
            title: `Complete ${sectionId} Section`,
            description: `Section is only ${completionPercentage}% complete`,
            action: 'Fill in missing required content',
            sectionId,
          });
        }
        
        // Check for placeholder content
        const hasPlaceholders = Object.values(section.elements).some((element: any) => 
          typeof element.content === 'string' && (
            element.content.includes('placeholder') ||
            element.content.includes('Lorem ipsum') ||
            element.content.includes('Sample text')
          )
        );
        
        if (hasPlaceholders) {
          suggestions.push({
            type: 'content',
            priority: 'high',
            title: `Replace Placeholder Content in ${sectionId}`,
            description: 'Placeholder content should be replaced with real content',
            action: 'Edit section content',
            sectionId,
          });
        }
      });
      
      // Accessibility suggestions
      const accessibilityIssues = get().auditAccessibility();
      if (accessibilityIssues.score < 80) {
        suggestions.push({
          type: 'accessibility',
          priority: 'medium',
          title: 'Improve Accessibility',
          description: `Accessibility score is ${accessibilityIssues.score}/100`,
          action: 'Review and fix accessibility issues',
        });
      }
      
      // Sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
      
      console.log('💡 Generated optimization suggestions:', suggestions.length);
      
      return suggestions;
    },

    /**
     * ===== ACCESSIBILITY AUDIT =====
     */
    
    auditAccessibility: () => {
      const state = get();
      let score = 100;
      const issues: string[] = [];
      const recommendations: string[] = [];
      
      // Check page-level accessibility
      if (!state.title) {
        issues.push('Page is missing a title');
        score -= 20;
      }
      
      // Check sections
      state.sections.forEach((sectionId: string) => {
        const section = state.content[sectionId];
        if (!section) return;
        
        // Check for proper heading hierarchy
        const hasHeadline = Object.keys(section.elements).some((key: string) => 
          key.includes('headline') || key.includes('title')
        );
        
        if (!hasHeadline) {
          issues.push(`Section ${sectionId} is missing a headline`);
          score -= 10;
        }
        
        // Check images for alt text
        Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
          if (element.type === 'image') {
            // In a real implementation, we'd check for alt text metadata
            recommendations.push(`Ensure image in ${sectionId}.${elementKey} has descriptive alt text`);
            score -= 5;
          }
          
          if (element.type === 'button' && typeof element.content === 'string') {
            if (element.content.length < 3) {
              issues.push(`Button in ${sectionId}.${elementKey} has unclear label`);
              score -= 5;
            }
          }
        });
      });
      
      // Check color contrast (simplified)
      const theme = state.theme;
      if (theme.colors.baseColor === theme.colors.accentColor) {
        issues.push('Base and accent colors are too similar');
        score -= 15;
      }
      
      score = Math.max(0, score);
      
      return {
        score,
        grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
        issues,
        recommendations,
        totalChecks: issues.length + recommendations.length + 10, // Base checks
      };
    },

    /**
     * ===== CONTENT QUALITY ANALYSIS =====
     */
    
    analyzeContentQuality: () => {
      const state = get();
      const analysis = {
        readability: 0,
        engagement: 0,
        clarity: 0,
        actionability: 0,
        overall: 0,
        details: {
          wordCount: 0,
          sentenceCount: 0,
          avgWordsPerSentence: 0,
          ctaCount: 0,
          headlineCount: 0,
          issues: [] as string[],
          strengths: [] as string[],
        },
      };
      
      let totalWordCount = 0;
      let totalSentenceCount = 0;
      let ctaCount = 0;
      let headlineCount = 0;
      
      // Analyze content across all sections
      state.sections.forEach((sectionId: string) => {
        const section = state.content[sectionId];
        if (!section) return;
        
        Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
          if (typeof element.content !== 'string') return;
          
          const text = element.content.trim();
          if (!text) return;
          
          const words = text.split(/\s+/).length;
          const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim()).length;
          
          totalWordCount += words;
          totalSentenceCount += sentences;
          
          if (element.type === 'headline') {
            headlineCount++;
            
            // Analyze headline quality
            if (words > 12) {
              analysis.details.issues.push(`Headline in ${sectionId} is too long (${words} words)`);
            } else if (words < 3) {
              analysis.details.issues.push(`Headline in ${sectionId} is too short`);
            } else {
              analysis.details.strengths.push(`Good headline length in ${sectionId}`);
            }
            
            // Check for power words
            const powerWords = ['free', 'new', 'proven', 'guaranteed', 'exclusive', 'limited', 'save', 'get', 'discover'];
            const hasPowerWord = powerWords.some((word: string) => text.toLowerCase().includes(word));
            if (hasPowerWord) {
              analysis.details.strengths.push(`Headline in ${sectionId} uses engaging language`);
            }
          }
          
          if (element.type === 'button') {
            ctaCount++;
            
            // Analyze CTA quality
            if (words > 5) {
              analysis.details.issues.push(`CTA text in ${sectionId} is too long`);
            } else if (words < 2) {
              analysis.details.issues.push(`CTA text in ${sectionId} is too vague`);
            }
            
            // Check for action words
            const actionWords = ['get', 'start', 'try', 'download', 'learn', 'discover', 'join', 'claim'];
            const hasActionWord = actionWords.some((word: string) => text.toLowerCase().includes(word));
            if (hasActionWord) {
              analysis.details.strengths.push(`CTA in ${sectionId} uses action-oriented language`);
            }
          }
          
          if (element.type === 'text' && sentences > 0) {
            const avgWordsPerSentence = words / sentences;
            if (avgWordsPerSentence > 25) {
              analysis.details.issues.push(`Text in ${sectionId}.${elementKey} has complex sentences`);
            }
          }
        });
      });
      
      // Calculate metrics
      analysis.details.wordCount = totalWordCount;
      analysis.details.sentenceCount = totalSentenceCount;
      analysis.details.avgWordsPerSentence = totalSentenceCount > 0 ? totalWordCount / totalSentenceCount : 0;
      analysis.details.ctaCount = ctaCount;
      analysis.details.headlineCount = headlineCount;
      
      // Calculate scores (0-100)
      
      // Readability (based on sentence length and word complexity)
      const avgSentenceLength = analysis.details.avgWordsPerSentence;
      if (avgSentenceLength <= 15) {
        analysis.readability = 100;
      } else if (avgSentenceLength <= 20) {
        analysis.readability = 80;
      } else if (avgSentenceLength <= 25) {
        analysis.readability = 60;
      } else {
        analysis.readability = 40;
      }
      
      // Engagement (based on CTAs, headlines, and power words)
      analysis.engagement = Math.min(100, (ctaCount * 20) + (headlineCount * 10) + (analysis.details.strengths.length * 5));
      
      // Clarity (based on word count and structure)
      if (totalWordCount >= 300 && totalWordCount <= 800) {
        analysis.clarity = 100;
      } else if (totalWordCount < 300) {
        analysis.clarity = 60; // Too little content
      } else {
        analysis.clarity = Math.max(40, 100 - ((totalWordCount - 800) / 20)); // Too much content
      }
      
      // Actionability (based on CTAs and action words)
      analysis.actionability = Math.min(100, ctaCount * 30 + (analysis.details.strengths.filter((s: string) => 
        s.includes('action-oriented') || s.includes('CTA')
      ).length * 15));
      
      // Overall score
      analysis.overall = Math.round(
        (analysis.readability + analysis.engagement + analysis.clarity + analysis.actionability) / 4
      );
      
      console.log('📊 Content quality analysis completed:', {
        overall: analysis.overall,
        wordCount: totalWordCount,
        issues: analysis.details.issues.length,
        strengths: analysis.details.strengths.length,
      });
      
      return analysis;
    },

    /**
     * ===== PERFORMANCE VALIDATION =====
     */
    
    validatePerformance: () => {
      const state = get();
      const metrics = {
        estimatedLoadTime: 0,
        imageCount: 0,
        totalElements: 0,
        complexityScore: 0,
        recommendations: [] as string[],
      };
      
      let totalElements = 0;
      let imageCount = 0;
      let complexityPoints = 0;
      
      // Analyze performance factors
      state.sections.forEach((sectionId: string) => {
        const section = state.content[sectionId];
        if (!section) return;
        
        const elementCount = Object.keys(section.elements).length;
        totalElements += elementCount;
        
        // Complexity based on number of elements per section
        if (elementCount > 10) {
          complexityPoints += 20;
          metrics.recommendations.push(`Section ${sectionId} has many elements (${elementCount})`);
        }
        
        Object.entries(section.elements).forEach(([elementKey, element]: [string, any]) => {
          if (element.type === 'image') {
            imageCount++;
          }
          
          if (element.type === 'video') {
            complexityPoints += 30;
            metrics.recommendations.push(`Video in ${sectionId} may impact loading time`);
          }
          
          if (element.type === 'form') {
            complexityPoints += 15;
          }
          
          // Check for large text content
          if (typeof element.content === 'string' && element.content.length > 1000) {
            complexityPoints += 10;
            metrics.recommendations.push(`Large text content in ${sectionId}.${elementKey}`);
          }
        });
      });
      
      metrics.imageCount = imageCount;
      metrics.totalElements = totalElements;
      metrics.complexityScore = Math.min(100, complexityPoints);
      
      // Estimate load time (simplified calculation)
      metrics.estimatedLoadTime = Math.round(
        0.5 + // Base time
        (imageCount * 0.3) + // Images
        (totalElements * 0.05) + // General elements
        (complexityPoints * 0.02) // Complexity factor
      );
      
      // Add recommendations based on metrics
      if (imageCount > 15) {
        metrics.recommendations.push('Consider reducing number of images for better performance');
      }
      
      if (totalElements > 50) {
        metrics.recommendations.push('Page has many elements - consider simplifying');
      }
      
      if (metrics.estimatedLoadTime > 3) {
        metrics.recommendations.push('Estimated load time is high - optimize images and content');
      }
      
      console.log('⚡ Performance validation:', {
        loadTime: `${metrics.estimatedLoadTime}s`,
        images: imageCount,
        elements: totalElements,
        complexity: metrics.complexityScore,
      });
      
      return metrics;
    },

    /**
     * ===== BUSINESS LOGIC VALIDATION =====
     */
    
    validateBusinessLogic: () => {
      const state = get();
      const validation = {
        conversionPath: false,
        valueProposition: false,
        socialProof: false,
        trustSignals: false,
        mobileOptimized: true, // Assumed for now
        score: 0,
        recommendations: [] as string[],
      };
      
      // Check conversion path
      const hasHero = state.sections.some((id: string) => id.includes('hero'));
      const hasCTA = state.sections.some((id: string) => id.includes('cta')) || 
                    Object.values(state.content).some((section: any) => 
                      Object.keys(section.elements).some((key: string) => key.includes('cta'))
                    );
      const hasContactInfo = Object.values(state.content).some((section: any) =>
        Object.keys(section.elements).some((key: string) => 
          key.includes('email') || key.includes('phone') || key.includes('contact')
        )
      );
      
      validation.conversionPath = hasHero && hasCTA;
      
      if (!validation.conversionPath) {
        if (!hasHero) validation.recommendations.push('Add a hero section to capture attention');
        if (!hasCTA) validation.recommendations.push('Add clear call-to-action buttons');
      }
      
      // Check value proposition
      const hasFeatures = state.sections.some((id: string) => id.includes('feature'));
      const hasBenefits = Object.values(state.content).some((section: any) =>
        Object.values(section.elements).some((element: any) =>
          typeof element.content === 'string' && 
          (element.content.includes('benefit') || element.content.includes('save') || 
           element.content.includes('improve') || element.content.includes('increase'))
        )
      );
      
      validation.valueProposition = hasFeatures || hasBenefits;
      
      if (!validation.valueProposition) {
        validation.recommendations.push('Add features or benefits section to communicate value');
      }
      
      // Check social proof
      const hasTestimonials = state.sections.some((id: string) => id.includes('testimonial'));
      const hasLogos = state.sections.some((id: string) => id.includes('logo') || id.includes('social'));
      const hasStats = Object.values(state.content).some((section: any) =>
        Object.values(section.elements).some((element: any) =>
          typeof element.content === 'string' && 
          /\d+[%+]/.test(element.content)
        )
      );
      
      validation.socialProof = hasTestimonials || hasLogos || hasStats;
      
      if (!validation.socialProof) {
        validation.recommendations.push('Add testimonials, logos, or statistics for credibility');
      }
      
      // Check trust signals
      const hasSecurity = state.sections.some((id: string) => id.includes('security'));
      const hasGuarantee = Object.values(state.content).some((section: any) =>
        Object.values(section.elements).some((element: any) =>
          typeof element.content === 'string' && 
          (element.content.toLowerCase().includes('guarantee') || 
           element.content.toLowerCase().includes('secure') ||
           element.content.toLowerCase().includes('privacy'))
        )
      );
      
      validation.trustSignals = hasSecurity || hasGuarantee || hasContactInfo;
      
      if (!validation.trustSignals) {
        validation.recommendations.push('Add security badges, guarantees, or contact information');
      }
      
      // Calculate overall score
      const factors = [
        validation.conversionPath,
        validation.valueProposition,
        validation.socialProof,
        validation.trustSignals,
        validation.mobileOptimized,
      ];
      
      validation.score = Math.round((factors.filter(Boolean).length / factors.length) * 100);
      
      console.log('🎯 Business logic validation:', {
        score: validation.score,
        conversionPath: validation.conversionPath,
        valueProposition: validation.valueProposition,
        socialProof: validation.socialProof,
        trustSignals: validation.trustSignals,
      });
      
      return validation;
    },

    /**
     * ===== BULK VALIDATION OPERATIONS =====
     */
    
    runFullAudit: () => {
      console.log('🔍 Running full page audit...');
      
      const results = {
        timestamp: Date.now(),
        sections: get().validateAllSections(),
        accessibility: get().auditAccessibility(),
        contentQuality: get().analyzeContentQuality(),
        performance: get().validatePerformance(),
        businessLogic: get().validateBusinessLogic(),
        publishReady: get().canPublish(),
        optimizations: get().getOptimizationSuggestions(),
      };
      
      // Calculate overall score
      const scores = [
        results.accessibility.score,
        results.contentQuality.overall,
        100 - results.performance.complexityScore, // Invert complexity to score
        results.businessLogic.score,
      ];
      
      const overallScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      
      console.log('📋 Full audit completed:', {
        overallScore,
        publishReady: results.publishReady,
        totalIssues: results.optimizations.length,
      });
      
      return {
        ...results,
        overallScore,
        grade: overallScore >= 90 ? 'A' : overallScore >= 80 ? 'B' : 
               overallScore >= 70 ? 'C' : overallScore >= 60 ? 'D' : 'F',
        summary: {
          totalChecks: 50, // Approximate number of checks performed
          passed: Math.round((overallScore / 100) * 50),
          issues: results.optimizations.filter((s: any) => s.priority === 'high').length,
          warnings: results.optimizations.filter((s: any) => s.priority === 'medium').length,
          suggestions: results.optimizations.filter((s: any) => s.priority === 'low').length,
        },
      };
    },
  };
}

/**
 * ===== HELPER FUNCTIONS =====
 */

function getRequiredElementsForLayout(layout: string): string[] {
  // This would typically come from a layout schema
  const layoutRequirements: Record<string, string[]> = {
    'hero-left-copy-right-image': ['headline', 'subheadline', 'cta_text'],
    'hero-center-stacked': ['headline', 'subheadline', 'cta_text'],
    'features-icon-grid': ['feature_titles', 'feature_descriptions'],
    'testimonials-quote-grid': ['testimonial_quotes', 'testimonial_names'],
    'pricing-tier-cards': ['tier_names', 'tier_prices'],
    'cta-centered-headline': ['headline', 'cta_text'],
    'default': ['headline'],
  };
  
  return layoutRequirements[layout] || layoutRequirements['default'];
}

function calculateCompletionPercentage(
  section: any, 
  requiredElements: string[]
): number {
  if (requiredElements.length === 0) return 100;
  
  const completedElements = requiredElements.filter((elementKey: string) => {
    const element = section.elements[elementKey];
    return element && 
           element.content && 
           (typeof element.content === 'string' ? element.content.trim().length > 0 : 
            Array.isArray(element.content) && element.content.length > 0);
  });
  
  return Math.round((completedElements.length / requiredElements.length) * 100);
}