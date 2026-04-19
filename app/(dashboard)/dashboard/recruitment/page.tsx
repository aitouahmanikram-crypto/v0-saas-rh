import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search, Filter, MoreHorizontal, Eye, MessageSquare, ClipboardCheck } from 'lucide-react'
import { CandidateStatusBadge } from '@/components/candidate-status-badge'

export default async function RecruitmentPage() {
  const supabase = await createClient()

  const { data: candidates } = await supabase
    .from('candidates')
    .select('*, positions(title)')
    .order('created_at', { ascending: false })

  const { data: positions } = await supabase
    .from('positions')
    .select('*')
    .eq('status', 'open')

  const statusCounts = {
    all: candidates?.length || 0,
    new: candidates?.filter(c => c.status === 'new').length || 0,
    screening: candidates?.filter(c => c.status === 'screening').length || 0,
    interview: candidates?.filter(c => c.status === 'interview').length || 0,
    evaluation: candidates?.filter(c => c.status === 'evaluation').length || 0,
    approval: candidates?.filter(c => c.status === 'approval').length || 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recruitment</h1>
          <p className="text-muted-foreground mt-1">Manage candidates and hiring pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/recruitment/positions"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Manage Positions ({positions?.length || 0})
          </Link>
          <Link
            href="/dashboard/recruitment/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </Link>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              status === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search candidates..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Candidates Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Candidate</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Position</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">AI Score</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Applied</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {candidates && candidates.length > 0 ? (
              candidates.map((candidate) => (
                <tr key={candidate.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {candidate.first_name[0]}{candidate.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {candidate.first_name} {candidate.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    {candidate.positions?.title || 'Not assigned'}
                  </td>
                  <td className="px-4 py-3">
                    <CandidateStatusBadge status={candidate.status} />
                  </td>
                  <td className="px-4 py-3">
                    {candidate.ai_score ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${candidate.ai_score}%` }}
                          />
                        </div>
                        <span className="text-sm text-foreground">{candidate.ai_score}%</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Pending</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(candidate.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/dashboard/recruitment/${candidate.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <Link
                        href={`/dashboard/chatbot/${candidate.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Start Chatbot"
                      >
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <Link
                        href={`/dashboard/evaluations/new?candidate=${candidate.id}`}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Evaluate"
                      >
                        <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
                      </Link>
                      <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No candidates yet</p>
                  <Link 
                    href="/dashboard/recruitment/new" 
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Add your first candidate
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
