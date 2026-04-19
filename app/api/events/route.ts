import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '50')
  const unprocessedOnly = searchParams.get('unprocessed') === 'true'
  
  let query = supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (unprocessedOnly) {
    query = query.eq('processed', false)
  }
  
  const { data: events, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(events)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: event, error } = await supabase
    .from('events')
    .insert(body)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(event)
}

// Process events
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { eventIds } = await request.json()
  
  const { data: events, error } = await supabase
    .from('events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .in('id', eventIds)
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(events)
}
