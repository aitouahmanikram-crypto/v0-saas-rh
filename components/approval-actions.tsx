'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Check, X, Sparkles } from 'lucide-react'

interface ApprovalActionsProps {
  approvalId: string
  candidateId: string
}

export function ApprovalActions({ approvalId, candidateId }: ApprovalActionsProps) {
  const [loading, setLoading] = useState(false)
  const [loadingAI, setLoadingAI] = useState(false)
  const [notes, setNotes] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleDecision = async (status: 'approved' | 'rejected') => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase
      .from('approval_requests')
      .update({
        status,
        decision_notes: notes,
        decided_at: new Date().toISOString(),
        approver_id: user?.id,
      })
      .eq('id', approvalId)

    // Update candidate status
    await supabase
      .from('candidates')
      .update({ status: status === 'approved' ? 'approved' : 'rejected' })
      .eq('id', candidateId)

    // Create event
    await supabase.from('events').insert({
      event_type: status === 'approved' ? 'candidate_approved' : 'candidate_rejected',
      entity_type: 'approval_request',
      entity_id: approvalId,
      payload: { candidateId, decision: status },
    })

    router.refresh()
  }

  const getAIRecommendation = async () => {
    setLoadingAI(true)
    try {
      const response = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      })
      
      if (response.ok) {
        const recommendation = await response.json()
        await supabase
          .from('approval_requests')
          .update({ ai_recommendation: recommendation })
          .eq('id', approvalId)
        router.refresh()
      }
    } catch (err) {
      console.error('AI recommendation error:', err)
    } finally {
      setLoadingAI(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add decision notes (optional)..."
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          rows={2}
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleDecision('approved')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={() => handleDecision('rejected')}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={getAIRecommendation}
          disabled={loadingAI}
          className="px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center gap-2 ml-auto"
        >
          <Sparkles className="w-4 h-4" />
          {loadingAI ? 'Analyzing...' : 'Get AI Recommendation'}
        </button>
      </div>
    </div>
  )
}
