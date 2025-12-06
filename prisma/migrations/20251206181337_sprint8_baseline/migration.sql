-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "tokenId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Project',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "content" JSONB,
    "themeValues" JSONB,
    "computedDesign" JSONB,
    "inputText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishedPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "htmlContent" TEXT NOT NULL,
    "content" JSONB,
    "themeValues" JSONB,
    "computedDesign" JSONB,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "previewImage" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PublishedPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxonomyEmbedding" (
    "id" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaxonomyEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publishedPageId" TEXT,
    "formId" TEXT NOT NULL,
    "formName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserIntegration" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageAnalytics" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "uniqueVisitors" INTEGER NOT NULL DEFAULT 0,
    "formSubmissions" INTEGER NOT NULL DEFAULT 0,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgTimeOnPage" INTEGER,
    "medianTimeOnPage" INTEGER,
    "bounceRate" DOUBLE PRECISION,
    "ctaClicks" INTEGER NOT NULL DEFAULT 0,
    "topReferrers" JSONB,
    "topUtmSources" JSONB,
    "desktopViews" INTEGER NOT NULL DEFAULT 0,
    "mobileViews" INTEGER NOT NULL DEFAULT 0,
    "tabletViews" INTEGER NOT NULL DEFAULT 0,
    "desktopConversions" INTEGER NOT NULL DEFAULT 0,
    "mobileConversions" INTEGER NOT NULL DEFAULT 0,
    "tabletConversions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "trialStart" TIMESTAMP(3),
    "trialEnd" TIMESTAMP(3),
    "isTrialing" BOOLEAN NOT NULL DEFAULT false,
    "creditsLimit" INTEGER NOT NULL DEFAULT 30,
    "publishedPagesLimit" INTEGER NOT NULL DEFAULT 1,
    "draftProjectsLimit" INTEGER NOT NULL DEFAULT 3,
    "customDomainsLimit" INTEGER NOT NULL DEFAULT 0,
    "formSubmissionsLimit" INTEGER NOT NULL DEFAULT 100,
    "teamMembersLimit" INTEGER NOT NULL DEFAULT 1,
    "removeBranding" BOOLEAN NOT NULL DEFAULT false,
    "customDomains" BOOLEAN NOT NULL DEFAULT false,
    "formIntegrations" BOOLEAN NOT NULL DEFAULT false,
    "exportHTML" BOOLEAN NOT NULL DEFAULT false,
    "whiteLabel" BOOLEAN NOT NULL DEFAULT false,
    "analytics" TEXT NOT NULL DEFAULT 'none',
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "fullPageGens" INTEGER NOT NULL DEFAULT 0,
    "sectionRegens" INTEGER NOT NULL DEFAULT 0,
    "elementRegens" INTEGER NOT NULL DEFAULT 0,
    "fieldInference" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "creditsLimit" INTEGER NOT NULL DEFAULT 30,
    "creditsRemaining" INTEGER NOT NULL DEFAULT 30,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "publishedPages" INTEGER NOT NULL DEFAULT 0,
    "draftProjects" INTEGER NOT NULL DEFAULT 0,
    "formSubmissions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL,
    "tokensUsed" INTEGER,
    "estimatedCost" DOUBLE PRECISION,
    "projectId" TEXT,
    "sectionId" TEXT,
    "elementKey" TEXT,
    "metadata" JSONB,
    "endpoint" TEXT,
    "duration" INTEGER,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_tokenId_key" ON "Project"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_value_key" ON "Token"("value");

-- CreateIndex
CREATE UNIQUE INDEX "PublishedPage_slug_key" ON "PublishedPage"("slug");

-- CreateIndex
CREATE INDEX "PublishedPage_userId_idx" ON "PublishedPage"("userId");

-- CreateIndex
CREATE INDEX "TaxonomyEmbedding_fieldType_idx" ON "TaxonomyEmbedding"("fieldType");

-- CreateIndex
CREATE UNIQUE INDEX "TaxonomyEmbedding_fieldType_value_key" ON "TaxonomyEmbedding"("fieldType", "value");

-- CreateIndex
CREATE INDEX "FormSubmission_userId_idx" ON "FormSubmission"("userId");

-- CreateIndex
CREATE INDEX "FormSubmission_formId_idx" ON "FormSubmission"("formId");

-- CreateIndex
CREATE INDEX "FormSubmission_publishedPageId_idx" ON "FormSubmission"("publishedPageId");

-- CreateIndex
CREATE INDEX "UserIntegration_userId_idx" ON "UserIntegration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserIntegration_userId_type_name_key" ON "UserIntegration"("userId", "type", "name");

-- CreateIndex
CREATE INDEX "PageAnalytics_slug_date_idx" ON "PageAnalytics"("slug", "date");

-- CreateIndex
CREATE INDEX "PageAnalytics_date_idx" ON "PageAnalytics"("date");

-- CreateIndex
CREATE INDEX "PageAnalytics_slug_idx" ON "PageAnalytics"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageAnalytics_slug_date_key" ON "PageAnalytics"("slug", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_userId_key" ON "UserPlan"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripeCustomerId_key" ON "UserPlan"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripeSubscriptionId_key" ON "UserPlan"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "UserPlan_userId_idx" ON "UserPlan"("userId");

-- CreateIndex
CREATE INDEX "UserPlan_stripeCustomerId_idx" ON "UserPlan"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "UserPlan_tier_idx" ON "UserPlan"("tier");

-- CreateIndex
CREATE INDEX "UserPlan_status_idx" ON "UserPlan"("status");

-- CreateIndex
CREATE INDEX "UserUsage_userId_idx" ON "UserUsage"("userId");

-- CreateIndex
CREATE INDEX "UserUsage_period_idx" ON "UserUsage"("period");

-- CreateIndex
CREATE UNIQUE INDEX "UserUsage_userId_period_key" ON "UserUsage"("userId", "period");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_createdAt_idx" ON "UsageEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_eventType_idx" ON "UsageEvent"("eventType");

-- CreateIndex
CREATE INDEX "UsageEvent_createdAt_idx" ON "UsageEvent"("createdAt");

-- CreateIndex
CREATE INDEX "UsageEvent_userId_idx" ON "UsageEvent"("userId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "Token"("value") ON DELETE RESTRICT ON UPDATE CASCADE;

