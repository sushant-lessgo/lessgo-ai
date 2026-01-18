# Product Backlog

Items deferred from MVP for future development.

---

## V1.5 (Post-Beta)

### Email Continuation Pages
**Value Proposition:** Users with existing landing page can create dedicated pages for email campaigns in 1 minute.

**How it works:**
- User pastes email content
- System extracts: tone, offer, CTA, key message
- Generates continuation page matching email
- Reuses brand assets from account

**Why valuable:**
- High conversion (message continuity)
- Low effort (just paste email)
- Upsell existing users
- Differentiation from competitors

### Pre-built IVOC Database
**Current MVP:** Every generation does live Tavily search + stores result.

**V1.5 Enhancement:** Use accumulated database as primary lookup.

```
Audience + Category
    ↓
Lookup in database
    ↓
Found? → Use stored IVOC
Not found? → Tavily search → Store result
```

**Benefits:**
- Faster generation (no API call for known categories)
- Lower cost (~$0 for cached, ~$0.05 for new)
- Database grows organically from real usage
- Quality improves (can curate/edit stored entries)

**Database structure:**
```json
{
  "key": "freelancer_invoicing",
  "audience": "Freelancer/Solopreneur",
  "category": "Invoicing",
  "ivoc": {
    "pains": [...],
    "desires": [...],
    "objections": [...],
    "firmBeliefs": [...],
    "shakableBeliefs": [...],
    "commonPhrases": [...]
  },
  "source": "tavily",
  "createdAt": "2024-01-15",
  "usageCount": 47
}
```

---

## V2

### Landing Page Types
Support different page types optimized for traffic source:

| Type | Characteristics |
|------|-----------------|
| **Main/Generic** | Current MVP, comprehensive |
| **Ad (PPC)** | Tight focus, no nav, single CTA |
| **SEO** | Content-rich, keyword-optimized |
| **Social** | Platform-specific tone |

**Impact on system:**
- Section count varies by type
- Navigation optional for ad pages
- Content depth varies
- CTA intensity varies

### Multi-Page Website Support
- Separate pages: /features, /pricing, /about
- Navigation links to routes (not anchors)
- Shared header/footer across pages

### Competitor Research
Deep competitor research with real quotes:

**Output per competitor:**
- Idea, USP
- Pain-focus, Desire-focus
- Real praise quotes (from X, Reddit, G2)
- Real complaint quotes

**Sources:**
- G2/Capterra reviews
- Reddit threads
- X/Twitter
- YouTube comments

### Full Live + RAG Research System
Premium research layer (~$0.25-0.30/generation):

**Architecture:**
```
Live Research (every generation)
    ↓
Quote Corpus (RAG)
    ↓
Merge + Rank by profile similarity
    ↓
Rich IVOC with real quotes
```

**Components:**
- Tavily for search
- Firecrawl for scraping
- Pinecone/pgvector for quote corpus
- Profile-based matching

**Benefits:**
- Fresh + historical data
- Real quotes with sources
- Improves over time (corpus grows)
- Competitive moat

---

## Future Considerations

### A/B Testing
- Multiple variations of same page
- Performance tracking

### Analytics Integration
- Conversion tracking
- Heatmaps

### Custom Domain Publishing
- User's own domain
- SSL provisioning

### Team Collaboration
- Multiple users per account
- Roles and permissions

### Problem Section UIBlock Gaps
Currently only 2 UIBlocks (CollapsedCards, SideBySideSplit). Missing angles:
- **Simple bullet list** - Just pain points, no accordion
- **Statistics-driven** - "87% of founders struggle with X" format
- **Single emotional statement** - Bold, large text, one pain point
- **Cost of inaction** - What happens if you don't solve this
- **Industry-specific problems** - Tailored by category
