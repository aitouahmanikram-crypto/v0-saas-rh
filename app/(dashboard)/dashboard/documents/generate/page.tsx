'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Download } from 'lucide-react'
import { InterviewReportPDF } from '@/components/pdf/interview-report'
import { ApprovalRequestPDF } from '@/components/pdf/approval-request'
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer'

interface Evaluation {
  id: string
  overall_score: number
  technical_score: number
  communication_score: number
  culture_fit_score: number
  recommendation: string
  strengths: string
  weaknesses: string
  comments: string
  candidates: {
    first_name: string
    last_name: string
    email: string
    positions?: { title: string }
  }
  profiles: { full_name: string }
}

interface Approval {
  id: string
  proposed_salary: number
  proposed_start_date: string
  justification: string
  candidates: {
    first_name: string
    last_name: string
    email: string
    ai_score: number
  }
  positions: { title: string; department: string }
}

function DocumentGeneratorContent() {
  const searchParams = useSearchParams()
  const docType = searchParams.get('type') || 'interview_report'
  const evaluationId = searchParams.get('evaluation')
  const approvalId = searchParams.get('approval')
  
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [selectedEval, setSelectedEval] = useState<Evaluation | null>(null)
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      if (docType === 'interview_report') {
        const { data } = await supabase
          .from('evaluations')
          .select('*, candidates(first_name, last_name, email, positions(title)), profiles(full_name)')
          .eq('status', 'submitted')
        if (data) {
          setEvaluations(data)
          if (evaluationId) {
            const found = data.find(e => e.id === evaluationId)
            if (found) setSelectedEval(found)
          }
        }
      } else if (docType === 'approval_request') {
        const { data } = await supabase
          .from('approval_requests')
          .select('*, candidates(first_name, last_name, email, ai_score), positions(title, department)')
        if (data) {
          setApprovals(data)
          if (approvalId) {
            const found = data.find(a => a.id === approvalId)
            if (found) setSelectedApproval(found)
          }
        }
      }
    }
    loadData()
  }, [docType, evaluationId, approvalId, supabase])

  const saveDocument = async (title: string, content: Record<string, unknown>) => {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from('documents').insert({
      document_type: docType,
      title,
      entity_type: docType === 'interview_report' ? 'evaluation' : 'approval_request',
      entity_id: selectedEval?.id || selectedApproval?.id,
      content,
      generated_by: user?.id,
      status: 'final',
    })

    router.push('/dashboard/documents')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/documents"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generate Document</h1>
          <p className="text-muted-foreground mt-1">
            {docType === 'interview_report' ? 'Interview Report' : 'Approval Request Document'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selection Panel */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Select {docType === 'interview_report' ? 'Evaluation' : 'Approval Request'}
          </h2>

          {docType === 'interview_report' && (
            <div className="space-y-2">
              {evaluations.map((eval_) => (
                <button
                  key={eval_.id}
                  onClick={() => {
                    setSelectedEval(eval_)
                    setShowPreview(true)
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedEval?.id === eval_.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <p className="font-medium text-foreground">
                    {eval_.candidates?.first_name} {eval_.candidates?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {eval_.candidates?.positions?.title} - Score: {eval_.overall_score}/5
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Evaluated by {eval_.profiles?.full_name}
                  </p>
                </button>
              ))}
              {evaluations.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No submitted evaluations available
                </p>
              )}
            </div>
          )}

          {docType === 'approval_request' && (
            <div className="space-y-2">
              {approvals.map((approval) => (
                <button
                  key={approval.id}
                  onClick={() => {
                    setSelectedApproval(approval)
                    setShowPreview(true)
                  }}
                  className={`w-full p-4 rounded-lg border text-left transition-colors ${
                    selectedApproval?.id === approval.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <p className="font-medium text-foreground">
                    {approval.candidates?.first_name} {approval.candidates?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {approval.positions?.title} - ${approval.proposed_salary?.toLocaleString()}
                  </p>
                </button>
              ))}
              {approvals.length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No approval requests available
                </p>
              )}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Preview</h2>
            {(selectedEval || selectedApproval) && (
              <div className="flex items-center gap-2">
                {docType === 'interview_report' && selectedEval && (
                  <PDFDownloadLink
                    document={<InterviewReportPDF evaluation={selectedEval} />}
                    fileName={`interview-report-${selectedEval.candidates?.last_name}.pdf`}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    {({ loading }) => (
                      <>
                        <Download className="w-4 h-4" />
                        {loading ? 'Generating...' : 'Download PDF'}
                      </>
                    )}
                  </PDFDownloadLink>
                )}
                {docType === 'approval_request' && selectedApproval && (
                  <PDFDownloadLink
                    document={<ApprovalRequestPDF approval={selectedApproval} />}
                    fileName={`approval-request-${selectedApproval.candidates?.last_name}.pdf`}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    {({ loading }) => (
                      <>
                        <Download className="w-4 h-4" />
                        {loading ? 'Generating...' : 'Download PDF'}
                      </>
                    )}
                  </PDFDownloadLink>
                )}
              </div>
            )}
          </div>

          {showPreview && (selectedEval || selectedApproval) ? (
            <div className="h-[600px] border border-border rounded-lg overflow-hidden">
              {docType === 'interview_report' && selectedEval && (
                <PDFViewer width="100%" height="100%" showToolbar={false}>
                  <InterviewReportPDF evaluation={selectedEval} />
                </PDFViewer>
              )}
              {docType === 'approval_request' && selectedApproval && (
                <PDFViewer width="100%" height="100%" showToolbar={false}>
                  <ApprovalRequestPDF approval={selectedApproval} />
                </PDFViewer>
              )}
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center bg-muted/50 rounded-lg">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Select an item to preview the document
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DocumentGeneratorPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <DocumentGeneratorContent />
    </Suspense>
  )
}
