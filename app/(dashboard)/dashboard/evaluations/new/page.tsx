'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star } from 'lucide-react'

interface Candidate {
  id: string
  first_name: string
  last_name: string
  positions?: { title: string }
}

function NewEvaluationForm() {
  const searchParams = useSearchParams()
  const candidateIdParam = searchParams.get('candidate')
  
  const [candidateId, setCandidateId] = useState(candidateIdParam || '')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [technicalScore, setTechnicalScore] = useState(3)
  const [communicationScore, setCommunicationScore] = useState(3)
  const [cultureFitScore, setCultureFitScore] = useState(3)
  const [strengths, setStrengths] = useState('')
  const [weaknesses, setWeaknesses] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [comments, setComments] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadCandidates() {
      const { data } = await supabase
        .from('candidates')
        .select('id, first_name, last_name, positions(title)')
        .in('status', ['interview', 'chatbot', 'screening', 'evaluation'])
      if (data) setCandidates(data)
    }
    loadCandidates()
  }, [supabase])

  const overallScore = ((technicalScore + communicationScore + cultureFitScore) / 3).toFixed(1)

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // First, create an interview record if needed
      const { data: interview } = await supabase
        .from('interviews')
        .insert({
          candidate_id: candidateId,
          interviewer_id: user.id,
          interview_type: 'technical',
          status: 'completed',
          scheduled_at: new Date().toISOString(),
        })
        .select()
        .single()

      // Create evaluation
      const { error: evalError } = await supabase
        .from('evaluations')
        .insert({
          interview_id: interview?.id,
          evaluator_id: user.id,
          candidate_id: candidateId,
          technical_score: technicalScore,
          communication_score: communicationScore,
          culture_fit_score: cultureFitScore,
          overall_score: parseFloat(overallScore),
          strengths,
          weaknesses,
          recommendation,
          comments,
          status: isDraft ? 'draft' : 'submitted',
          submitted_at: isDraft ? null : new Date().toISOString(),
        })

      if (evalError) throw evalError

      if (!isDraft) {
        // Update candidate status
        await supabase
          .from('candidates')
          .update({ status: 'evaluation' })
          .eq('id', candidateId)
      }

      router.push('/dashboard/evaluations')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(false)
    }
  }

  const ScoreInput = ({ 
    label, 
    value, 
    onChange 
  }: { 
    label: string
    value: number
    onChange: (v: number) => void 
  }) => (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">{label}</label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`p-2 rounded-lg transition-colors ${
              value >= score ? 'text-amber-500' : 'text-muted'
            }`}
          >
            <Star className={`w-6 h-6 ${value >= score ? 'fill-current' : ''}`} />
          </button>
        ))}
        <span className="ml-2 text-lg font-bold text-foreground">{value}/5</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/evaluations"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Evaluation</h1>
          <p className="text-muted-foreground mt-1">Submit interview feedback</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="bg-card rounded-xl border border-border p-6 space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Candidate Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Candidate *
          </label>
          <select
            value={candidateId}
            onChange={(e) => setCandidateId(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          >
            <option value="">Select a candidate</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.first_name} {candidate.last_name} - {candidate.positions?.title || 'No position'}
              </option>
            ))}
          </select>
        </div>

        {/* Scores */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
          <h3 className="font-semibold text-foreground">Evaluation Scores</h3>
          <ScoreInput label="Technical Skills" value={technicalScore} onChange={setTechnicalScore} />
          <ScoreInput label="Communication" value={communicationScore} onChange={setCommunicationScore} />
          <ScoreInput label="Culture Fit" value={cultureFitScore} onChange={setCultureFitScore} />
          
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <p className="text-3xl font-bold text-foreground">{overallScore}/5</p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Strengths
          </label>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Key strengths observed during the interview..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Areas for Improvement
          </label>
          <textarea
            value={weaknesses}
            onChange={(e) => setWeaknesses(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Areas where the candidate could improve..."
          />
        </div>

        {/* Recommendation */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Recommendation *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'strong_hire', label: 'Strong Hire', color: 'bg-green-100 border-green-500 text-green-700' },
              { value: 'hire', label: 'Hire', color: 'bg-emerald-100 border-emerald-500 text-emerald-700' },
              { value: 'no_hire', label: 'No Hire', color: 'bg-red-100 border-red-500 text-red-700' },
              { value: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-200 border-red-600 text-red-800' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecommendation(opt.value)}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                  recommendation === opt.value 
                    ? opt.color + ' border-current' 
                    : 'bg-background border-border text-foreground hover:bg-muted'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Additional Comments
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Any other observations or comments..."
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !candidateId || !recommendation}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !candidateId}
            className="px-6 py-2 bg-secondary text-secondary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Save as Draft
          </button>
          <Link
            href="/dashboard/evaluations"
            className="px-6 py-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

export default function NewEvaluationPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <NewEvaluationForm />
    </Suspense>
  )
}
