import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'
import { createClient } from '@/lib/supabase/server'
import { getAIModel } from '@/lib/ai/config'

const cvSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  skills: z.array(z.string()).nullable(),
  experience: z.array(z.object({
    company: z.string(),
    role: z.string(),
    duration: z.string().nullable(),
    description: z.string().nullable(),
  })).nullable(),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    year: z.string().nullable(),
  })).nullable(),
  summary: z.string().nullable(),
})

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const candidateId = formData.get('candidateId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read file content (for demo, we'll use text extraction)
    const text = await file.text()

    const result = await generateText({
      model: getAIModel('fast'),
      output: Output.object({ schema: cvSchema }),
      prompt: `Extract the following information from this CV/resume text. If information is not found, return null for that field.

CV Text:
${text}

Extract: first name, last name, email, phone, skills list, work experience, education, and a brief summary.`,
    })

    const parsedData = result.object || {}

    // If candidateId provided, update candidate and emit event
    if (candidateId) {
      const supabase = await createClient()
      
      const { data: candidate } = await supabase
        .from('candidates')
        .update({ cv_parsed: parsedData })
        .eq('id', candidateId)
        .select('organization_id')
        .single()

      // Emit parsing completed event
      await emitEvent(
        'ai_parsing_completed',
        'candidate',
        candidateId,
        { parsed_data: parsedData },
        candidate?.organization_id
      )
    }

    return NextResponse.json(parsedData)
  } catch (error) {
    console.error('CV parsing error:', error)
    return NextResponse.json({ error: 'Failed to parse CV' }, { status: 500 })
  }
}
