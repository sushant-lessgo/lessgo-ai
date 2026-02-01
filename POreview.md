1. Add constraint enforcement code:
  // min:3 enforcement
  canRemove={value_items.length > 3}

  // max:8 enforcement
  {mode === 'edit' && value_items.length < 8 && ( <AddButton /> )}

  2. Add mock data block:
  ValueStackCTA: {
    headline: "Everything You Get With Your Account",
    subheadline: "One subscription, unlimited value",
    cta_text: "Start Free Trial",
    secondary_cta_text: "Compare Plans",
    final_cta_headline: "Ready to Transform Your Workflow?",
    final_cta_description: "Join 10,000+ teams already saving time every day",
    guarantee_text: "30-day money-back guarantee",
    value_items: [
      { id: "v1", text: "Save 20+ hours per week on repetitive tasks" },
      { id: "v2", text: "Increase team productivity by 40%" },
      { id: "v3", text: "Real-time analytics and reporting" },
      { id: "v4", text: "Unlimited team members included" },
      { id: "v5", text: "Priority 24/7 customer support" },
    ],
  }

  3. Add UIBlockTheme for CTA box:
  // Theme detection
  const uiBlockTheme = React.useMemo(() => {
    if (props.manualThemeOverride) return props.manualThemeOverride;
    if (props.userContext) return selectUIBlockTheme(props.userContext);
    return 'neutral';
  }, [props.manualThemeOverride, props.userContext]);

  // CTA box gradient based on theme