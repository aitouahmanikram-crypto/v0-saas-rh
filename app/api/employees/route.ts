import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { emitEvent } from '@/lib/workflow/engine'

export async function GET() {
  const supabase = await createClient()
  
  const { data: employees, error } = await supabase
    .from('employees')
    .select(`
      *,
      talent_assessments(id, period, performance_score, potential_score, nine_box_position),
      turnover_predictions(id, risk_score, risk_level, risk_factors, created_at)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(employees)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data: employee, error } = await supabase
    .from('employees')
    .insert(body)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Emit employee_created event through workflow engine
  await emitEvent(
    'employee_created',
    'employee',
    employee.id,
    { employee },
    body.organization_id
  )
  
  return NextResponse.json(employee)
}
