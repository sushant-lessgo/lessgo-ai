 Missing Items

  1. CSS Pattern - Add:
  Use colorTokens for section content
  Keep theme-based before/after colors (warm/cool/neutral)
  2. key={} usage - Add explicitly:
  {transformations.map(t => <TransformationCard key={t.id} />)}
  3. data-element-key pattern:
  transformations.${t.id}.before_situation
  transformations.${t.id}.after_outcome
  transformations.${t.id}.testimonial_quote
  transformations.${t.id}.customer_name
  transformations.${t.id}.customer_title
  transformations.${t.id}.customer_company
  4. Handler functions - Show explicitly:
  const handleTransformationUpdate = (id: string, field: keyof Transformation, value: string) => {
    const updated = transformations.map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    handleContentUpdate('transformations', JSON.stringify(updated));
  };

  const handleAddTransformation = () => {
    if (transformations.length >= 4) return;
    const newT = { id: `t-${Date.now()}`, ... };
    handleContentUpdate('transformations', JSON.stringify([...transformations, newT]));
  };

  const handleRemoveTransformation = (id: string) => {
    if (transformations.length <= 1) return;
    handleContentUpdate('transformations', JSON.stringify(transformations.filter(t => t.id !== id)));
  };
  5. Constraints enforcement - Note min: 1, max: 4 checks in handlers
  6. mockDataGenerator.ts - Add entry for BeforeAfterQuote
  7. CONTENT_SCHEMA defaults - Show array structure:
  transformations: {
    type: 'array' as const,
    default: [
      { id: 't-1', before_situation: '...', after_outcome: '...', ... },
      { id: 't-2', ... }
    ]
  }
