import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'

export async function GET() {
  const supabase = await createClient()
  
  const { data: evaluations, error } = await supabase
    .from('evaluations')
    .select(`
      *,
      interview:interviews(*),
      candidate:candidates(id, first_name, last_name, email, organization_id),
      evaluator:profiles(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(evaluations)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  // Calculate overall score
  const scores = [body.technical_score, body.communication_score, body.culture_fit_score].filter(Boolean)
  const overall_score = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : null
  
  const { data: evaluation, error } = await supabase
    .from('evaluations')
    .insert({ ...body, overall_score })
    .select(`
      *,
      candidate:candidates(id, first_name, last_name, organization_id)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // If submitted, emit event through workflow engine
  if (body.status === 'submitted') {
    const organizationId = (evaluation.candidate as { organization_id: string })?.organization_id
    
    await emitEvent(
      'evaluation_submitted',
      'evaluation',
      evaluation.id,
      { evaluation },
      organizationId
    )
  }
  
  return NextResponse.json(evaluation)
}
