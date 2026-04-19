import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Download, Eye, Plus } from 'lucide-react'

export default async function DocumentsPage() {
  const supabase = await createClient()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false })

  const documentTypes = {
    interview_report: { label: 'Interview Report', color: 'bg-blue-100 text-blue-700' },
    approval_request: { label: 'Approval Request', color: 'bg-purple-100 text-purple-700' },
    offer_letter: { label: 'Offer Letter', color: 'bg-green-100 text-green-700' },
    contract: { label: 'Contract', color: 'bg-amber-100 text-amber-700' },
    evaluation_summary: { label: 'Evaluation Summary', color: 'bg-cyan-100 text-cyan-700' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground mt-1">Generated HR documents and reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/documents/generate?type=interview_report"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Interview Report
          </Link>
          <Link
            href="/dashboard/documents/generate?type=approval_request"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Generate Document
          </Link>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents && documents.length > 0 ? (
          documents.map((doc) => {
            const typeConfig = documentTypes[doc.document_type as keyof typeof documentTypes] || 
              { label: doc.document_type, color: 'bg-gray-100 text-gray-700' }
            
            return (
              <div key={doc.id} className="bg-card rounded-xl border border-border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">{doc.title}</h3>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${typeConfig.color}`}>
                      {typeConfig.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-muted-foreground">
                  <p>Created by {doc.profiles?.full_name || 'System'}</p>
                  <p>{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Link
                    href={`/dashboard/documents/${doc.id}`}
                    className="flex-1 px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                  {doc.file_url && (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <div className="col-span-full bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No documents generated yet</p>
            <Link 
              href="/dashboard/documents/generate?type=interview_report" 
              className="text-primary text-sm hover:underline mt-2 inline-block"
            >
              Generate your first document
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
