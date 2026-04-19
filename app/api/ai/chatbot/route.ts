import { streamText, convertToModelMessages } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getAIModel } from '@/lib/ai/config'

export async function POST(request: Request) {
  try {
    const { messages, candidateId, sessionId } = await request.json()
    
    const supabase = await createClient()

    // Fetch candidate and position info
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*, positions(title, description, requirements)')
      .eq('id', candidateId)
      .single()

    const positionContext = candidate?.positions
      ? `Position: ${candidate.positions.title}\nDescription: ${candidate.positions.description}`
      : 'General screening interview'

    const systemPrompt = `You are an AI interviewer conducting a pre-qualification screening for a job candidate.

${positionContext}

Candidate: ${candidate?.first_name} ${candidate?.last_name}

Your goals:
1. Ask relevant questions to assess the candidate's fit for the position
2. Evaluate their communication skills, experience, and motivation
3. Be professional, friendly, and encouraging
4. Ask follow-up questions based on their responses
5. Keep responses concise (2-3 sentences max unless explaining something)

Start by introducing yourself and asking about their background. Ask 4-6 screening questions total, then summarize your assessment.

Important: Track the conversation progress. After gathering enough information, provide a summary and end the interview professionally.`

    const result = streamText({
      model: getAIModel('chat'),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
    })

    // Update session with latest messages
    if (sessionId) {
      await supabase
        .from('chatbot_sessions')
        .update({
          messages: messages,
          status: 'in_progress',
        })
        .eq('id', sessionId)
    }

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Chatbot error:', error)
    return new Response('Error', { status: 500 })
  }
}
