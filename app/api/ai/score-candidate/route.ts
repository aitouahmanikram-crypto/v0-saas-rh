import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emitEvent } from '@/lib/workflow/engine'
import { getAIModel } from '@/lib/ai/config'

const scoreSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string(),
  strengths: z.array(z.string()),
  concerns: z.array(z.string()),
  recommendation: z.enum(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
  suggestedQuestions: z.array(z.string()),
})

export async function POST(request: Request) {
  try {
    const { candidateId } = await request.json()
    
    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch candidate with position
    const { data: candidate } = await supabase
      .from('candidates')
      .select('*, positions(title, description, requirements)')
      .eq('id', candidateId)
      .single()

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
    }

    const positionContext = candidate.positions 
      ? `Position: ${candidate.positions.title}\nDescription: ${candidate.positions.description}\nRequirements: ${JSON.stringify(candidate.positions.requirements)}`
      : 'No specific position assigned'

    const candidateContext = candidate.cv_parsed 
      ? JSON.stringify(candidate.cv_parsed)
      : `Name: ${candidate.first_name} ${candidate.last_name}\nEmail: ${candidate.email}`

    const result = await generateText({
      model: getAIModel('fast'),
      output: Output.object({ schema: scoreSchema }),
      prompt: `You are an expert HR recruiter. Evaluate this candidate for the position and provide a comprehensive assessment.

${positionContext}

Candidate Information:
${candidateContext}

Provide:
1. A match score from 0-100
2. A brief summary of the candidate
3. Key strengths (3-5 points)
4. Areas of concern (2-4 points)
5. Your hiring recommendation
6. 3-5 suggested interview questions`,
    })

    if (result.object) {
      // Update candidate with AI analysis
      await supabase
        .from('candidates')
        .update({
          ai_score: result.object.score,
          ai_analysis: result.object,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidateId)

      // Emit scoring completed event through workflow engine
      await emitEvent(
        'ai_scoring_completed',
        'candidate',
        candidateId,
        { 
          score: result.object.score, 
          recommendation: result.object.recommendation,
          analysis: result.object 
        },
        candidate.organization_id
      )
    }

    return NextResponse.json(result.object || {})
  } catch (error) {
    console.error('Scoring error:', error)
    return NextResponse.json({ error: 'Failed to score candidate' }, { status: 500 })
  }
}
