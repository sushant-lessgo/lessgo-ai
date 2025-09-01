import React from 'react';
import { useLayoutComponent } from '@/hooks/useLayoutComponent';
import { useTypography } from '@/hooks/useTypography';
import { 
  EditableAdaptiveHeadline, 
  EditableAdaptiveText 
} from '@/components/layout/EditableContent';
import IconEditableText from '@/components/ui/IconEditableText';
import { LayoutComponentProps } from '@/types/storeTypes';

interface QuoteWithMetricProps extends LayoutComponentProps {}

// Quote with metric structure
interface QuoteMetric {
  quote: string;
  author: string;
  company: string;
  role: string;
  metric_label: string;
  metric_value: string;
  avatar?: string;
  id: string;
}

// Content interface for QuoteWithMetric layout
interface QuoteWithMetricContent {
  headline: string;
  quotes: string;
  authors: string;
  companies: string;
  roles: string;
  metric_labels: string;
  metric_values: string;
  subheadline?: string;
  footer_text?: string;
  quote_icon?: string;
  credibility_icon?: string;
}

// Content schema for QuoteWithMetric layout
const CONTENT_SCHEMA = {
  headline: { type: 'string' as const, default: 'What Industry Leaders Say About Our Impact' },
  quotes: { type: 'string' as const, default: 'This solution transformed our entire operation. We went from manual processes to fully automated workflows, and the results speak for themselves.|The ROI was immediate and substantial. Within 3 months, we had not only recovered our investment but were seeing significant growth.|Game-changing technology that actually delivers on its promises. Our team efficiency has never been higher.' },
  authors: { type: 'string' as const, default: 'Sarah Chen|Michael Rodriguez|David Park' },
  companies: { type: 'string' as const, default: 'TechCorp Inc|Growth Dynamics|Scale Ventures' },
  roles: { type: 'string' as const, default: 'Chief Technology Officer|VP of Operations|Head of Product' },
  metric_labels: { type: 'string' as const, default: 'Cost Reduction|Revenue Increase|Time Saved' },
  metric_values: { type: 'string' as const, default: '67%|$2.4M|25 hrs/week' },
  subheadline: { type: 'string' as const, default: 'Real customer testimonials with quantified business impact' },
  footer_text: { type: 'string' as const, default: 'Verified customer results and testimonials' },
  quote_icon: { type: 'string' as const, default: '💬' },
  credibility_icon: { type: 'string' as const, default: '🔒' }
};

// Parse quote data from pipe-separated strings
const parseQuoteData = (
  quotes: string, 
  authors: string, 
  companies: string, 
  roles: string,
  metric_labels: string,
  metric_values: string
): QuoteMetric[] => {
  const quoteList = quotes.split('|').map(q => q.trim()).filter(q => q);
  const authorList = authors.split('|').map(a => a.trim()).filter(a => a);
  const companyList = companies.split('|').map(c => c.trim()).filter(c => c);
  const roleList = roles.split('|').map(r => r.trim()).filter(r => r);
  const metricLabelList = metric_labels.split('|').map(m => m.trim()).filter(m => m);
  const metricValueList = metric_values.split('|').map(m => m.trim()).filter(m => m);
  
  return quoteList.map((quote, index) => ({
    id: `quote-${index}`,
    quote,
    author: authorList[index] || 'Anonymous',
    company: companyList[index] || 'Company',
    role: roleList[index] || 'Team Member',
    metric_label: metricLabelList[index] || 'Result',
    metric_value: metricValueList[index] || '0%'
  }));
};

// Generate avatar initials
const getAvatarInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Generate avatar colors based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-emerald-400 to-emerald-600', 
    'from-violet-400 to-violet-600',
    'from-orange-400 to-orange-600',
    'from-pink-400 to-pink-600',
    'from-indigo-400 to-indigo-600'
  ];
  const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

// Individual Quote Card Component
const QuoteCard = ({ 
  quote, 
  index, 
  mode, 
  sectionId,
  onQuoteEdit,
  onAuthorEdit,
  onCompanyEdit,
  onRoleEdit,
  onMetricLabelEdit,
  onMetricValueEdit
}: {
  quote: QuoteMetric;
  index: number;
  mode: 'edit' | 'preview';
  sectionId: string;
  onQuoteEdit: (index: number, value: string) => void;
  onAuthorEdit: (index: number, value: string) => void;
  onCompanyEdit: (index: number, value: string) => void;
  onRoleEdit: (index: number, value: string) => void;
  onMetricLabelEdit: (index: number, value: string) => void;
  onMetricValueEdit: (index: number, value: string) => void;
}) => {
  const { getTextStyle } = useTypography();
  
  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 overflow-hidden">
      
      {/* Quote Section */}
      <div className="p-8 pb-6">
        {/* Quote Icon */}
        <div className="mb-6">
          <IconEditableText
            mode={mode}
            value={blockContent.quote_icon || '💬'}
            onEdit={(value) => handleContentUpdate('quote_icon', value)}
            backgroundType="neutral"
            colorTokens={{}}
            iconSize="lg"
            className="text-blue-500 text-4xl opacity-20"
            sectionId={sectionId}
            elementKey="quote_icon"
          />
        </div>

        {/* Quote Text */}
        {mode !== 'preview' ? (
          <div 
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onQuoteEdit(index, e.currentTarget.textContent || '')}
            className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 min-h-[80px] cursor-text hover:bg-gray-50 text-gray-900 leading-relaxed mb-6"
          >
            {quote.quote}
          </div>
        ) : (
          <blockquote 
            className="text-gray-900 leading-relaxed mb-6"
          >
            "{quote.quote}"
          </blockquote>
        )}

        {/* Author Info */}
        <div className="flex items-center space-x-4 mb-6">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getAvatarColor(quote.author)} flex items-center justify-center text-white font-semibold text-sm`}>
            {getAvatarInitials(quote.author)}
          </div>
          
          {/* Author Details */}
          <div>
            {mode !== 'preview' ? (
              <>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onAuthorEdit(index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-semibold text-gray-900"
                >
                  {quote.author}
                </div>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onRoleEdit(index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[18px] cursor-text hover:bg-gray-50 text-gray-600"
                >
                  {quote.role}
                </div>
                <div 
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onCompanyEdit(index, e.currentTarget.textContent || '')}
                  className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[18px] cursor-text hover:bg-gray-50 text-gray-500"
                >
                  {quote.company}
                </div>
              </>
            ) : (
              <>
                <div 
                  className="font-semibold text-gray-900"
                >
                  {quote.author}
                </div>
                <div 
                  className="text-gray-600"
                >
                  {quote.role}
                </div>
                <div 
                  className="text-gray-500"
                >
                  {quote.company}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Metric Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-t border-gray-100">
        <div className="text-center">
          {/* Metric Value */}
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onMetricValueEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[40px] cursor-text hover:bg-gray-50 font-bold text-blue-900 mb-2"
            >
              {quote.metric_value}
            </div>
          ) : (
            <div 
              className="font-bold text-blue-900 mb-2 text-3xl"
            >
              {quote.metric_value}
            </div>
          )}

          {/* Metric Label */}
          {mode !== 'preview' ? (
            <div 
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onMetricLabelEdit(index, e.currentTarget.textContent || '')}
              className="outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-1 min-h-[20px] cursor-text hover:bg-gray-50 font-medium text-blue-700"
            >
              {quote.metric_label}
            </div>
          ) : (
            <div 
              className="font-medium text-blue-700"
            >
              {quote.metric_label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function QuoteWithMetric(props: QuoteWithMetricProps) {
  const {
    sectionId,
    mode,
    blockContent,
    colorTokens,
    dynamicTextColors,
    getTextStyle,
    sectionBackground,
    backgroundType,
    handleContentUpdate
  } = useLayoutComponent<QuoteWithMetricContent>({
    ...props,
    contentSchema: CONTENT_SCHEMA
  });

  // Parse quote data
  const quotes = parseQuoteData(
    blockContent.quotes,
    blockContent.authors,
    blockContent.companies,
    blockContent.roles,
    blockContent.metric_labels,
    blockContent.metric_values
  );

  // Handle individual editing
  const handleQuoteEdit = (index: number, value: string) => {
    const quoteList = blockContent.quotes.split('|');
    quoteList[index] = value;
    handleContentUpdate('quotes', quoteList.join('|'));
  };

  const handleAuthorEdit = (index: number, value: string) => {
    const authorList = blockContent.authors.split('|');
    authorList[index] = value;
    handleContentUpdate('authors', authorList.join('|'));
  };

  const handleCompanyEdit = (index: number, value: string) => {
    const companyList = blockContent.companies.split('|');
    companyList[index] = value;
    handleContentUpdate('companies', companyList.join('|'));
  };

  const handleRoleEdit = (index: number, value: string) => {
    const roleList = blockContent.roles.split('|');
    roleList[index] = value;
    handleContentUpdate('roles', roleList.join('|'));
  };

  const handleMetricLabelEdit = (index: number, value: string) => {
    const labelList = blockContent.metric_labels.split('|');
    labelList[index] = value;
    handleContentUpdate('metric_labels', labelList.join('|'));
  };

  const handleMetricValueEdit = (index: number, value: string) => {
    const valueList = blockContent.metric_values.split('|');
    valueList[index] = value;
    handleContentUpdate('metric_values', valueList.join('|'));
  };

  return (
    <section 
      className={`py-16 px-4`}
      style={{ backgroundColor: sectionBackground }}
      data-section-id={sectionId}
      data-section-type="QuoteWithMetric"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <EditableAdaptiveHeadline
            mode={mode}
            value={blockContent.headline || ''}
            onEdit={(value) => handleContentUpdate('headline', value)}
            level="h2"
            backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
            colorTokens={colorTokens}
            className="mb-4"
            sectionId={sectionId}
            elementKey="headline"
            sectionBackground={sectionBackground}
          />

          {/* Optional Subheadline */}
          {(blockContent.subheadline || mode !== 'preview') && (
            <EditableAdaptiveText
              mode={mode}
              value={blockContent.subheadline || ''}
              onEdit={(value) => handleContentUpdate('subheadline', value)}
              backgroundType={backgroundType === 'custom' ? 'secondary' : backgroundType}
              colorTokens={colorTokens}
              className="mb-6 max-w-3xl mx-auto"
              placeholder="Add optional subheadline describing customer success stories..."
              sectionId={sectionId}
              elementKey="subheadline"
              sectionBackground={sectionBackground}
            />
          )}
        </div>

        {/* Quotes Grid */}
        <div className={`grid gap-8 ${
          quotes.length === 1 ? 'max-w-2xl mx-auto' :
          quotes.length === 2 ? 'md:grid-cols-2 max-w-5xl mx-auto' :
          quotes.length === 3 ? 'md:grid-cols-1 lg:grid-cols-3' :
          'md:grid-cols-2 lg:grid-cols-3'
        }`}>
          {quotes.map((quote, index) => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              index={index}
              mode={mode}
              sectionId={sectionId}
              onQuoteEdit={handleQuoteEdit}
              onAuthorEdit={handleAuthorEdit}
              onCompanyEdit={handleCompanyEdit}
              onRoleEdit={handleRoleEdit}
              onMetricLabelEdit={handleMetricLabelEdit}
              onMetricValueEdit={handleMetricValueEdit}
            />
          ))}
        </div>

        {/* Credibility Footer */}
        {(blockContent.footer_text || mode !== 'preview') && (
          <div className="mt-16 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-full text-emerald-800">
              <IconEditableText
                mode={mode}
                value={blockContent.credibility_icon || '🔒'}
                onEdit={(value) => handleContentUpdate('credibility_icon', value)}
                backgroundType="neutral"
                colorTokens={{}}
                iconSize="sm"
                className="text-emerald-600 text-lg mr-2"
                sectionId={sectionId}
                elementKey="credibility_icon"
              />
              <EditableAdaptiveText
                mode={mode}
                value={blockContent.footer_text || ''}
                onEdit={(value) => handleContentUpdate('footer_text', value)}
                backgroundType={backgroundType}
                colorTokens={colorTokens}
                variant="body"
                className="font-medium"
                placeholder="Add credibility footer text..."
                sectionBackground={sectionBackground}
                data-section-id={sectionId}
                data-element-key="footer_text"
              />
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

export const componentMeta = {
  name: 'QuoteWithMetric',
  category: 'Results',
  description: 'Customer testimonials paired with quantified business metrics for maximum credibility',
  tags: ['testimonials', 'quotes', 'metrics', 'social-proof', 'credibility'],
  features: [
    'Customer quotes with quantified business results',
    'Author information with avatars and credentials',
    'Prominent metric display with labels',
    'Flexible grid layout for multiple testimonials',
    'Individual editing for all quote elements',
    'Credibility indicators and verification badges'
  ],
  props: {
    sectionId: 'string - Required section identifier',
    backgroundType: '"primary" | "secondary" | "neutral" | "divider" - Controls text color adaptation',
    className: 'string - Additional CSS classes'
  },
  contentSchema: {
    headline: 'Main heading text',
    quotes: 'Pipe-separated list of customer quotes',
    authors: 'Pipe-separated list of author names',
    companies: 'Pipe-separated list of company names',
    roles: 'Pipe-separated list of author roles/titles',
    metric_labels: 'Pipe-separated list of metric descriptions',
    metric_values: 'Pipe-separated list of metric values/percentages',
    subheadline: 'Optional subheading for context'
  },
  examples: [
    'Enterprise customer success stories',
    'ROI testimonials with specific metrics',
    'Industry leader endorsements',
    'Customer transformation stories'
  ]
};