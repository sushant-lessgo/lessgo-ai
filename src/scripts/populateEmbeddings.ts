// scripts/populateEmbeddings.ts
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { generateEmbedding } from '@/lib/embeddings';
import { taxonomy } from '@/modules/inference/taxonomy';

// Load environment variables (try multiple files)
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.development' });

const prisma = new PrismaClient();

interface EmbeddingItem {
  fieldType: string;
  value: string;
  metadata?: any;
}

async function populateEmbeddings() {
  // Embedding population started
  
  const items: EmbeddingItem[] = [];
  
  // Market Categories
  taxonomy.marketCategories.forEach(category => {
    items.push({
      fieldType: 'marketCategory',
      value: category,
    });
  });
  
  // Market Subcategories
  Object.entries(taxonomy.marketSubcategories).forEach(([category, subcategories]) => {
    subcategories.forEach(subcategory => {
      items.push({
        fieldType: 'marketSubcategory',
        value: subcategory,
        metadata: { parentCategory: category },
      });
    });
  });
  
  // Target Audiences
  taxonomy.targetAudienceGroups.forEach(group => {
    group.audiences.forEach(audience => {
      items.push({
        fieldType: 'targetAudience',
        value: audience.label,
        metadata: { 
          id: audience.id,
          group: group.label,
          tags: audience.tags 
        },
      });
    });
  });
  
  // Startup Stages
  taxonomy.startupStageGroups.forEach(group => {
    group.stages.forEach(stage => {
      items.push({
        fieldType: 'startupStage',
        value: stage.label,
        metadata: { 
          id: stage.id,
          group: group.label 
        },
      });
    });
  });
  
  // Landing Goals
  taxonomy.landingGoalTypes.forEach(goal => {
    items.push({
      fieldType: 'landingGoal',
      value: goal.label,
      metadata: { 
        id: goal.id,
        ctaType: goal.ctaType 
      },
    });
  });
  
  // Pricing Models
  taxonomy.pricingModels.forEach(model => {
    items.push({
      fieldType: 'pricingModel',
      value: model.label,
      metadata: { 
        id: model.id,
        friction: model.friction 
      },
    });
  });
  
  // Processing taxonomy items
  
  // Process in batches to avoid rate limits
  const batchSize = 50;
  let processed = 0;
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (item) => {
        try {
          // Check if embedding already exists
          const existing = await prisma.taxonomyEmbedding.findUnique({
            where: {
              fieldType_value: {
                fieldType: item.fieldType,
                value: item.value,
              },
            },
          });
          
          if (existing) {
            // Skipping existing item
            return;
          }
          
          // Generate embedding
          const embedding = await generateEmbedding(item.value);
          
          // Store in database
          await prisma.taxonomyEmbedding.create({
            data: {
              fieldType: item.fieldType,
              value: item.value,
              embedding,
              metadata: item.metadata || {},
            },
          });
          
          processed++;
          // Item processed successfully
          
        } catch (error) {
          // Error processing item - preserved for debugging
        }
      })
    );
    
    // Rate limiting delay
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Embedding population completed
}

// Run the script
populateEmbeddings()
  .catch(error => {
    // Script error handling preserved
  })
  .finally(() => prisma.$disconnect());

// Export for use in other contexts
export { populateEmbeddings };