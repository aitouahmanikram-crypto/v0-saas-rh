'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ClipboardCheck, CheckCircle, XCircle, UserPlus } from 'lucide-react'

interface CandidateActionsProps {
  candidate: {
    id: string
    status: string
    first_name: string
    last_name: string
  }
}

export function CandidateActions({ candidate }: CandidateActionsProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const updateStatus = async (newStatus: string) => {
    setLoading(true)
    await supabase
      .from('candidates')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', candidate.id)
    router.refresh()
    setLoading(false)
  }

  const moveToNextStage = async () => {
    const stageOrder = ['new', 'screening', 'chatbot', 'interview', 'evaluation', 'approval']
    const currentIndex = stageOrder.indexOf(candidate.status)
    if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
      await updateStatus(stageOrder[currentIndex + 1])
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-semibold text-foreground mb-4">Actions</h3>
      <div className="space-y-2">
        {candidate.status !== 'approved' && candidate.status !== 'rejected' && candidate.status !== 'hired' && (
          <button
            onClick={moveToNextStage}
            disabled={loading}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Move to Next Stage
          </button>
        )}

        {candidate.status === 'new' && (
          <Link
            href={`/dashboard/chatbot/${candidate.id}`}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Start Chatbot Interview
          </Link>
        )}

        {(candidate.status === 'interview' || candidate.status === 'chatbot') && (
          <Link
            href={`/dashboard/evaluations/new?candidate=${candidate.id}`}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            Create Evaluation
          </Link>
        )}

        {candidate.status === 'evaluation' && (
          <Link
            href={`/dashboard/approvals/new?candidate=${candidate.id}`}
            className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Request Approval
          </Link>
        )}

        {candidate.status === 'approved' && (
          <Link
            href={`/dashboard/employees/new?candidate=${candidate.id}`}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Convert to Employee
          </Link>
        )}

        {candidate.status !== 'rejected' && candidate.status !== 'hired' && (
          <button
            onClick={() => updateStatus('rejected')}
            disabled={loading}
            className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-lg text-sm font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Reject Candidate
          </button>
        )}
      </div>
    </div>
  )
}
