// @/formatting/executor.ts - SINGLE EXPORT POINT for bulletproof formatting
// This is the ONLY way to import the executor - all other paths are forbidden

export { 
  executeTwoPhaseFormat, 
  type FormatExecutionConfig,
  type FormatOptions 
} from '../utils/bulletproofFormatExecution';

// Re-export constants and utilities needed by consumers
export { generateTxId } from '../utils/bulletproofSuppression';