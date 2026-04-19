import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: documents, error } = await supabase
    .from('documents')
    .select(`
      *,
      generated_by_user:profiles!generated_by(id, full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(documents)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: document, error } = await supabase
    .from('documents')
    .insert(body)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit document_generated event
  if (body.organization_id) {
    await supabase.from('events').insert({
      organization_id: body.organization_id,
      event_type: 'document_generated',
      entity_type: 'document',
      entity_id: document.id,
      payload: { document }
    })
  }
  
  return NextResponse.json(document)
}
