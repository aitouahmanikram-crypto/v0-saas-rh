import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get candidate statistics
  const { data: candidates } = await supabase
    .from('candidates')
    .select('status, ai_score, created_at')
  
  // Get employee statistics
  const { data: employees } = await supabase
    .from('employees')
    .select('status, department, hire_date')
    .eq('status', 'active')
  
  // Get evaluation statistics
  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('overall_score, recommendation, created_at')
    .eq('status', 'submitted')
  
  // Get approval statistics
  const { data: approvals } = await supabase
    .from('approval_requests')
    .select('status, created_at, decided_at')
  
  // Get turnover predictions
  const { data: turnoverPredictions } = await supabase
    .from('turnover_predictions')
    .select('risk_level, risk_score')
  
  // Calculate metrics
  const candidatesByStatus = candidates?.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  const avgAiScore = candidates?.filter(c => c.ai_score)
    .reduce((sum, c, _, arr) => sum + (c.ai_score || 0) / arr.length, 0) || 0
  
  const avgEvaluationScore = evaluations?.length
    ? evaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evaluations.length
    : 0
  
  const approvalRate = approvals?.length
    ? (approvals.filter(a => a.status === 'approved').length / approvals.length) * 100
    : 0
  
  const turnoverRisk = turnoverPredictions?.reduce((acc, t) => {
    acc[t.risk_level || 'unknown'] = (acc[t.risk_level || 'unknown'] || 0) + 1
    return acc
  }, {} as Record<string, number>) || {}
  
  const avgDecisionTime = approvals?.filter(a => a.decided_at)
    .reduce((sum, a, _, arr) => {
      const created = new Date(a.created_at)
      const decided = new Date(a.decided_at)
      return sum + (decided.getTime() - created.getTime()) / (1000 * 60 * 60 * 24) / arr.length
    }, 0) || 0
  
  return NextResponse.json({
    recruitment: {
      totalCandidates: candidates?.length || 0,
      candidatesByStatus,
      avgAiScore: Math.round(avgAiScore * 10) / 10,
      conversionRate: candidatesByStatus.hired 
        ? (candidatesByStatus.hired / (candidates?.length || 1)) * 100 
        : 0
    },
    evaluation: {
      totalEvaluations: evaluations?.length || 0,
      avgScore: Math.round(avgEvaluationScore * 10) / 10,
      recommendations: evaluations?.reduce((acc, e) => {
        if (e.recommendation) acc[e.recommendation] = (acc[e.recommendation] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    },
    approval: {
      total: approvals?.length || 0,
      approvalRate: Math.round(approvalRate),
      avgDecisionTimeDays: Math.round(avgDecisionTime * 10) / 10,
      byStatus: approvals?.reduce((acc, a) => {
        acc[a.status] = (acc[a.status] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    },
    employees: {
      total: employees?.length || 0,
      byDepartment: employees?.reduce((acc, e) => {
        if (e.department) acc[e.department] = (acc[e.department] || 0) + 1
        return acc
      }, {} as Record<string, number>) || {}
    },
    turnover: {
      totalPredictions: turnoverPredictions?.length || 0,
      byRiskLevel: turnoverRisk,
      highRiskCount: (turnoverRisk.high || 0) + (turnoverRisk.critical || 0)
    }
  })
}
