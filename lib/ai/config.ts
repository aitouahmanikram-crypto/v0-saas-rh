import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

/**
 * Get the AI model based on environment configuration.
 * Supports:
 * - OpenAI (OPENAI_API_KEY)
 * - Google AI Studio (GOOGLE_GENERATIVE_AI_API_KEY) - FREE!
 * 
 * Priority: OpenAI > Google > Fallback to Vercel AI Gateway
 */
export function getAIModel(modelType: 'chat' | 'fast' = 'fast') {
  // Check for OpenAI API key
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    return modelType === 'chat' 
      ? openai('gpt-4o-mini') 
      : openai('gpt-4o-mini')
  }
  
  // Check for Google AI Studio API key (FREE!)
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })
    // Use models/gemini-2.0-flash which is the latest free model
    return modelType === 'chat'
      ? google('models/gemini-2.0-flash')
      : google('models/gemini-2.0-flash')
  }
  
  // Fallback to model string (uses Vercel AI Gateway)
  return modelType === 'chat' ? 'openai/gpt-4o-mini' : 'openai/gpt-4o-mini'
}

export function isAIConfigured(): boolean {
  return !!(process.env.OPENAI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
}
