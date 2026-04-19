import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'

export async function GET() {
  const supabase = await createClient()
  
  const { data: candidates, error } = await supabase
    .from('candidates')
    .select(`
      *,
      position:positions(id, title, department),
      chatbot_sessions(id, status, qualification_score),
      interviews(id, status, scheduled_at),
      evaluations(id, status, overall_score, recommendation)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(candidates)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: candidate, error } = await supabase
    .from('candidates')
    .insert(body)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit candidate_created event through workflow engine
  await emitEvent(
    'candidate_created',
    'candidate',
    candidate.id,
    { candidate },
    body.organization_id
  )
  
  return NextResponse.json(candidate)
}
