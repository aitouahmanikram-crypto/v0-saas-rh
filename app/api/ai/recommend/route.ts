import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModel } from '@/lib/ai/config'

const recommendationSchema = z.object({
  decision: z.enum(['approve', 'reject', 'needs_more_info']),
  confidence: z.number().min(0).max(100),
  summary: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  suggestedSalary: z.number().nullable(),
  suggestedStartDate: z.string().nullable(),
  additionalNotes: z.string().nullable(),
})

export async function POST(request: Request) {
  try {
    const { candidateId } = await request.json()
    
    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch all candidate data
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*, positions(title, department, salary_min, salary_max, requirements)')
      .eq('id', candidateId)
      .single()

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    // Fetch evaluations
    const { data: evaluations } = await supabase
      .from('evaluations')
      .select('*, profiles(full_name)')
      .eq('candidate_id', candidateId)
      .eq('status', 'submitted')

    // Fetch chatbot session
    const { data: chatbotSession } = await supabase
      .from('chatbot_sessions')
      .select('*')
      .eq('candidate_id', candidateId)
      .eq('status', 'completed')
      .single()

    const context = `
Candidate: ${candidate.first_name} ${candidate.last_name}
Position: ${candidate.positions?.title || 'Not specified'}
Department: ${candidate.positions?.department || 'Not specified'}
Salary Range: $${candidate.positions?.salary_min?.toLocaleString() || 'N/A'} - $${candidate.positions?.salary_max?.toLocaleString() || 'N/A'}

AI Score: ${candidate.ai_score || 'Not scored'}
AI Analysis: ${candidate.ai_analysis ? JSON.stringify(candidate.ai_analysis) : 'Not available'}

Evaluations (${evaluations?.length || 0}):
${evaluations?.map(e => `
- ${e.profiles?.full_name}: Overall ${e.overall_score}/5, Recommendation: ${e.recommendation}
  Technical: ${e.technical_score}/5, Communication: ${e.communication_score}/5, Culture Fit: ${e.culture_fit_score}/5
  Strengths: ${e.strengths}
  Concerns: ${e.weaknesses}
`).join('\n') || 'No evaluations'}

Chatbot Pre-qualification Score: ${chatbotSession?.qualification_score || 'Not completed'}
`

    const result = await generateText({
      model: getAIModel('fast'),
      output: Output.object({ schema: recommendationSchema }),
      prompt: `You are an expert HR decision advisor. Review all available data for this candidate and provide a hiring recommendation.

${context}

Provide:
1. Your decision (approve, reject, or needs_more_info)
2. Confidence level (0-100)
3. Executive summary
4. Key pros (3-5 points)
5. Key cons (2-4 points)
6. Suggested salary within the range (if approving)
7. Suggested start date
8. Any additional notes or conditions`,
    })

    return NextResponse.json(result.object || {})
  } catch (error) {
    console.error('Recommendation error:', error)
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 })
  }
}
