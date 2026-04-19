import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Eye, FileText } from 'lucide-react'

export default async function EvaluationsPage() {
  const supabase = await createClient()

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*, candidates(first_name, last_name), profiles(full_name), interviews(interview_type)')
    .order('created_at', { ascending: false })

  const pendingCount = evaluations?.filter(e => e.status === 'draft').length || 0
  const submittedCount = evaluations?.filter(e => e.status === 'submitted').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Evaluations</h1>
          <p className="text-muted-foreground mt-1">Interview feedback and candidate assessments</p>
        </div>
        <Link
          href="/dashboard/evaluations/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Evaluation
        </Link>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
          {pendingCount} Draft
        </div>
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {submittedCount} Submitted
        </div>
      </div>

      {/* Evaluations List */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Candidate</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Evaluator</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Score</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Recommendation</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {evaluations && evaluations.length > 0 ? (
              evaluations.map((evaluation) => (
                <tr key={evaluation.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {evaluation.candidates?.first_name} {evaluation.candidates?.last_name}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {evaluation.profiles?.full_name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground capitalize">
                    {evaluation.interviews?.interview_type || 'General'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{evaluation.overall_score || '-'}</span>
                      <span className="text-muted-foreground">/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {evaluation.recommendation && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        evaluation.recommendation === 'strong_hire' ? 'bg-green-100 text-green-700' :
                        evaluation.recommendation === 'hire' ? 'bg-emerald-100 text-emerald-700' :
                        evaluation.recommendation === 'no_hire' ? 'bg-red-100 text-red-700' :
                        'bg-red-200 text-red-800'
                      }`}>
                        {evaluation.recommendation.replace('_', ' ')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      evaluation.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {evaluation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/evaluations/${evaluation.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <Link
                        href={`/dashboard/documents/generate?type=interview_report&evaluation=${evaluation.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Generate Report"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No evaluations yet</p>
                  <Link 
                    href="/dashboard/evaluations/new" 
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Create your first evaluation
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
