import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: candidate, error } = await supabase
    .from('candidates')
    .select(`
      *,
      position:positions(*),
      chatbot_sessions(*),
      interviews(*, interviewer:profiles(id, full_name, email)),
      evaluations(*, evaluator:profiles(id, full_name, email))
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(candidate)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: candidate, error } = await supabase
    .from('candidates')
    .update(body)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit status_changed event if status was updated
  if (body.status) {
    await supabase.from('events').insert({
      organization_id: candidate.organization_id,
      event_type: 'candidate_status_changed',
      entity_type: 'candidate',
      entity_id: candidate.id,
      payload: { candidate, new_status: body.status }
    })
  }
  
  return NextResponse.json(candidate)
}
