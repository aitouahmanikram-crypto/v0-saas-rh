import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'

export async function GET() {
  const supabase = await createClient()
  
  const { data: interviews, error } = await supabase
    .from('interviews')
    .select(`
      *,
      candidate:candidates(id, first_name, last_name, email, organization_id),
      interviewer:profiles(id, full_name, email),
      position:positions(id, title, department)
    `)
    .order('scheduled_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(interviews)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: interview, error } = await supabase
    .from('interviews')
    .insert(body)
    .select(`
      *,
      candidate:candidates(organization_id)
    `)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit interview_scheduled event
  const organizationId = (interview.candidate as { organization_id: string })?.organization_id
  await emitEvent(
    'interview_scheduled',
    'interview',
    interview.id,
    { interview },
    organizationId
  )
  
  return NextResponse.json(interview)
}
