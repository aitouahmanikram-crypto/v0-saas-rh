import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Eye, Check, X, Sparkles } from 'lucide-react'
import { ApprovalActions } from '@/components/approval-actions'

export default async function ApprovalsPage() {
  const supabase = await createClient()

  const { data: approvals } = await supabase
    .from('approval_requests')
    .select('*, candidates(first_name, last_name, email, ai_score), positions(title, department), profiles!requested_by(full_name)')
    .order('created_at', { ascending: false })

  const pendingCount = approvals?.filter(a => a.status === 'pending').length || 0
  const approvedCount = approvals?.filter(a => a.status === 'approved').length || 0
  const rejectedCount = approvals?.filter(a => a.status === 'rejected').length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Approval Requests</h1>
          <p className="text-muted-foreground mt-1">Review and approve hiring decisions</p>
        </div>
        <Link
          href="/dashboard/approvals/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        <div className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
          {pendingCount} Pending
        </div>
        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
          {approvedCount} Approved
        </div>
        <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
          {rejectedCount} Rejected
        </div>
      </div>

      {/* Approvals List */}
      <div className="space-y-4">
        {approvals && approvals.length > 0 ? (
          approvals.map((approval) => (
            <div key={approval.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {approval.candidates?.first_name?.[0]}{approval.candidates?.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {approval.candidates?.first_name} {approval.candidates?.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {approval.positions?.title} - {approval.positions?.department}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Requested by {approval.profiles?.full_name}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  approval.status === 'approved' ? 'bg-green-100 text-green-700' :
                  approval.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {approval.status}
                </span>
              </div>

              {/* Details */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Proposed Salary</p>
                  <p className="font-medium text-foreground">
                    ${approval.proposed_salary?.toLocaleString() || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Start Date</p>
                  <p className="font-medium text-foreground">
                    {approval.proposed_start_date 
                      ? new Date(approval.proposed_start_date).toLocaleDateString()
                      : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">AI Score</p>
                  <p className="font-medium text-foreground">
                    {approval.candidates?.ai_score ? `${approval.candidates.ai_score}%` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Requested</p>
                  <p className="font-medium text-foreground">
                    {new Date(approval.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {approval.justification && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Justification</p>
                  <p className="text-sm text-foreground">{approval.justification}</p>
                </div>
              )}

              {/* AI Recommendation */}
              {approval.ai_recommendation && Object.keys(approval.ai_recommendation).length > 0 && (
                <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm font-medium text-primary">AI Recommendation</p>
                  </div>
                  <p className="text-sm text-foreground">{approval.ai_recommendation.summary}</p>
                </div>
              )}

              {/* Actions */}
              {approval.status === 'pending' && (
                <ApprovalActions approvalId={approval.id} candidateId={approval.candidate_id} />
              )}

              {approval.status !== 'pending' && approval.decision_notes && (
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Decision Notes</p>
                  <p className="text-sm text-foreground">{approval.decision_notes}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <p className="text-muted-foreground">No approval requests yet</p>
            <Link 
              href="/dashboard/approvals/new" 
              className="text-primary text-sm hover:underline mt-2 inline-block"
            >
              Create your first request
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
