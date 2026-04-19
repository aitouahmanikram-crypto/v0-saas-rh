import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, FileText, MessageSquare, ClipboardCheck, CheckCircle, Sparkles } from 'lucide-react'
import { CandidateStatusBadge } from '@/components/candidate-status-badge'
import { CandidateActions } from '@/components/candidate-actions'

export default async function CandidateDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: candidate } = await supabase
    .from('candidates')
    .select('*, positions(title, department, description)')
    .eq('id', id)
    .single()

  if (!candidate) notFound()

  const { data: chatbotSession } = await supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*, profiles(full_name, email)')
    .eq('candidate_id', id)
    .order('scheduled_at', { ascending: false })

  const { data: evaluations } = await supabase
    .from('evaluations')
    .select('*, profiles(full_name)')
    .eq('candidate_id', id)
    .order('created_at', { ascending: false })

  const timeline = [
    { date: candidate.created_at, event: 'Candidate created', type: 'create' },
    ...(chatbotSession ? [{ date: chatbotSession.created_at, event: 'Chatbot session started', type: 'chatbot' }] : []),
    ...(interviews?.map(i => ({ date: i.scheduled_at, event: `Interview scheduled with ${i.profiles?.full_name}`, type: 'interview' })) || []),
    ...(evaluations?.map(e => ({ date: e.created_at, event: `Evaluation submitted by ${e.profiles?.full_name}`, type: 'evaluation' })) || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/recruitment"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {candidate.first_name} {candidate.last_name}
          </h1>
          <p className="text-muted-foreground">
            {candidate.positions?.title || 'No position assigned'}
          </p>
        </div>
        <CandidateStatusBadge status={candidate.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{candidate.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium text-foreground">{candidate.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          {candidate.ai_analysis && Object.keys(candidate.ai_analysis).length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">AI Analysis</h2>
              </div>
              <div className="space-y-4">
                {candidate.ai_score && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Match Score</span>
                      <span className="font-bold text-foreground">{candidate.ai_score}%</span>
                    </div>
                    <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${candidate.ai_score}%` }}
                      />
                    </div>
                  </div>
                )}
                {candidate.ai_analysis.summary && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Summary</p>
                    <p className="text-foreground">{candidate.ai_analysis.summary}</p>
                  </div>
                )}
                {candidate.ai_analysis.strengths && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Strengths</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.ai_analysis.strengths.map((s: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {candidate.ai_analysis.concerns && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Areas of Concern</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.ai_analysis.concerns.map((c: string, i: number) => (
                        <span key={i} className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">Activity Timeline</h2>
            <div className="space-y-4">
              {timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    item.type === 'create' ? 'bg-blue-100' :
                    item.type === 'chatbot' ? 'bg-purple-100' :
                    item.type === 'interview' ? 'bg-amber-100' :
                    'bg-green-100'
                  }`}>
                    {item.type === 'create' && <FileText className="w-4 h-4 text-blue-600" />}
                    {item.type === 'chatbot' && <MessageSquare className="w-4 h-4 text-purple-600" />}
                    {item.type === 'interview' && <ClipboardCheck className="w-4 h-4 text-amber-600" />}
                    {item.type === 'evaluation' && <CheckCircle className="w-4 h-4 text-green-600" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.event}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <CandidateActions candidate={candidate} />

          {/* Position Details */}
          {candidate.positions && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Position Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{candidate.positions.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Department</p>
                  <p className="font-medium text-foreground">{candidate.positions.department}</p>
                </div>
              </div>
            </div>
          )}

          {/* Evaluations Summary */}
          {evaluations && evaluations.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="font-semibold text-foreground mb-4">Evaluations</h3>
              <div className="space-y-3">
                {evaluations.map((eval_) => (
                  <div key={eval_.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{eval_.profiles?.full_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{eval_.recommendation?.replace('_', ' ')}</p>
                    </div>
                    <span className="font-bold text-foreground">{eval_.overall_score}/5</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
