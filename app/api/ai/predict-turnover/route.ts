import { generateText, Output } from 'ai'
import { z } from 'zod'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { emitEvent } from '@/lib/workflow/engine'
import { getAIModel } from '@/lib/ai/config'

const turnoverSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']),
  riskFactors: z.array(z.string()),
  recommendations: z.array(z.string()),
  predictedTimeframe: z.string().nullable(),
})

export async function POST(request: Request) {
  try {
    const { employeeId } = await request.json()
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch employee with related data
    const { data: employee } = await supabase
      .from('employees')
      .select('*, talent_assessments(*)')
      .eq('id', employeeId)
      .single()

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const employeeContext = `
Employee: ${employee.first_name} ${employee.last_name}
Position: ${employee.position}
Department: ${employee.department}
Hire Date: ${employee.hire_date}
Employment Type: ${employee.employment_type}
Status: ${employee.status}
Salary: ${employee.salary ? `$${employee.salary.toLocaleString()}` : 'Not specified'}
Tenure: ${employee.hire_date ? Math.floor((Date.now() - new Date(employee.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 'Unknown'} years

Recent Assessments: ${employee.talent_assessments?.length > 0 
  ? employee.talent_assessments.map((a: { period: string; performance_score: number; potential_score: number }) => 
      `${a.period}: Performance ${a.performance_score}/5, Potential ${a.potential_score}/5`
    ).join('; ')
  : 'No recent assessments'
}`

    const result = await generateText({
      model: getAIModel('fast'),
      output: Output.object({ schema: turnoverSchema }),
      prompt: `You are an HR analytics expert. Analyze this employee's data and predict their turnover risk.

${employeeContext}

Consider factors like:
- Tenure and career progression
- Performance trends
- Market conditions for their role
- Engagement indicators
- Compensation competitiveness

Provide:
1. A risk score from 0-100
2. Risk level classification
3. Key risk factors (3-5 points)
4. Actionable recommendations to reduce risk
5. Predicted timeframe if they might leave`,
    })

    if (result.object) {
      // Store prediction
      await supabase
        .from('turnover_predictions')
        .insert({
          employee_id: employeeId,
          risk_score: result.object.riskScore,
          risk_level: result.object.riskLevel,
          risk_factors: result.object.riskFactors,
          recommendations: result.object.recommendations,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        })

      // Emit turnover prediction event
      await emitEvent(
        'turnover_prediction_generated',
        'employee',
        employeeId,
        { 
          riskScore: result.object.riskScore, 
          riskLevel: result.object.riskLevel,
          riskFactors: result.object.riskFactors,
          recommendations: result.object.recommendations
        },
        employee.organization_id
      )
    }

    return NextResponse.json(result.object || {})
  } catch (error) {
    console.error('Turnover prediction error:', error)
    return NextResponse.json({ error: 'Failed to predict turnover' }, { status: 500 })
  }
}
