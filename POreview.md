⚠️ Missing Items

  1. CSS Pattern - Add:
  Use colorTokens for content text
  Theme-based card styling (getCardColors)
  2. data-element-key pattern:
  contact_cards.${card.id}.title
  contact_cards.${card.id}.description
  contact_cards.${card.id}.cta
  trust_items.${item.id}.text
  3. Handler functions - List explicitly:
  // Contact cards
  handleCardUpdate(cardId, field, value)
  handleAddCard()
  handleRemoveCard(cardId)

  // Trust items
  handleTrustItemUpdate(itemId, value)
  handleAddTrustItem()
  handleRemoveTrustItem(itemId)
  4. User can add remove cards
  5. mockDataGenerator.ts - Add entry for CallToQuotePlan
  6. Theme styling - Add note about warm/cool/neutral card colors