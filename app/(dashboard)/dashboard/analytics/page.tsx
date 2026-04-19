import { createClient } from '@/lib/supabase/server'
import { 
  Users, 
  UserPlus, 
  Clock, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Target
} from 'lucide-react'
import { AnalyticsCharts } from '@/components/analytics-charts'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  // Fetch all metrics
  const [
    { count: totalCandidates },
    { count: totalEmployees },
    { count: openPositions },
    { count: pendingApprovals },
    { count: completedInterviews },
    { count: hiredThisMonth },
    { data: candidates },
    { data: evaluations },
    { data: events },
  ] = await Promise.all([
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('employees').select('*', { count: 'exact', head: true }),
    supabase.from('positions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('candidates').select('*', { count: 'exact', head: true })
      .eq('status', 'hired')
      .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('candidates').select('status, created_at'),
    supabase.from('evaluations').select('overall_score, recommendation, created_at').eq('status', 'submitted'),
    supabase.from('events').select('event_type, created_at').order('created_at', { ascending: false }).limit(100),
  ])

  // Calculate conversion rates
  const approvedCandidates = candidates?.filter(c => c.status === 'approved' || c.status === 'hired').length || 0
  const conversionRate = totalCandidates ? Math.round((approvedCandidates / totalCandidates) * 100) : 0

  // Average evaluation score
  const avgScore = evaluations?.length 
    ? (evaluations.reduce((sum, e) => sum + (e.overall_score || 0), 0) / evaluations.length).toFixed(1)
    : 'N/A'

  // Pipeline distribution
  const pipelineData = [
    { status: 'New', count: candidates?.filter(c => c.status === 'new').length || 0, color: '#3b82f6' },
    { status: 'Screening', count: candidates?.filter(c => c.status === 'screening').length || 0, color: '#8b5cf6' },
    { status: 'Interview', count: candidates?.filter(c => c.status === 'interview').length || 0, color: '#f59e0b' },
    { status: 'Evaluation', count: candidates?.filter(c => c.status === 'evaluation').length || 0, color: '#f97316' },
    { status: 'Approval', count: candidates?.filter(c => c.status === 'approval').length || 0, color: '#06b6d4' },
    { status: 'Hired', count: candidates?.filter(c => c.status === 'hired').length || 0, color: '#22c55e' },
    { status: 'Rejected', count: candidates?.filter(c => c.status === 'rejected').length || 0, color: '#ef4444' },
  ]

  // Event activity (last 7 days)
  const eventsByDay = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayEvents = events?.filter(e => {
      const eventDate = new Date(e.created_at)
      return eventDate.toDateString() === date.toDateString()
    })
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayEvents?.length || 0,
    }
  })

  const metrics = [
    { name: 'Total Candidates', value: totalCandidates || 0, icon: UserPlus, trend: '+12%', trendUp: true },
    { name: 'Total Employees', value: totalEmployees || 0, icon: Users, trend: '+3%', trendUp: true },
    { name: 'Open Positions', value: openPositions || 0, icon: Target, trend: '-2', trendUp: false },
    { name: 'Pending Approvals', value: pendingApprovals || 0, icon: Clock, trend: '+5', trendUp: false },
    { name: 'Completed Interviews', value: completedInterviews || 0, icon: CheckCircle, trend: '+18%', trendUp: true },
    { name: 'Hired This Month', value: hiredThisMonth || 0, icon: TrendingUp, trend: '+2', trendUp: true },
    { name: 'Conversion Rate', value: `${conversionRate}%`, icon: BarChart3, trend: '+5%', trendUp: true },
    { name: 'Avg. Eval Score', value: avgScore, icon: Target, trend: '0.2', trendUp: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">HR metrics and performance insights</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.name} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <metric.icon className="w-5 h-5 text-muted-foreground" />
              <div className={`flex items-center gap-1 text-xs font-medium ${
                metric.trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {metric.trend}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{metric.value}</p>
            <p className="text-sm text-muted-foreground">{metric.name}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts pipelineData={pipelineData} eventsByDay={eventsByDay} />

      {/* Recent Events */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Activity</h3>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {events && events.length > 0 ? (
            events.slice(0, 20).map((event, index) => {
              const eventConfig: Record<string, { label: string; color: string }> = {
                candidate_created: { label: 'New Candidate', color: 'bg-blue-500' },
                candidate_scored: { label: 'AI Scored', color: 'bg-purple-500' },
                chatbot_completed: { label: 'Chatbot Completed', color: 'bg-indigo-500' },
                evaluation_submitted: { label: 'Evaluation Submitted', color: 'bg-amber-500' },
                candidate_approved: { label: 'Candidate Approved', color: 'bg-green-500' },
                candidate_rejected: { label: 'Candidate Rejected', color: 'bg-red-500' },
                employee_created: { label: 'Employee Created', color: 'bg-emerald-500' },
                high_turnover_risk_detected: { label: 'High Turnover Risk', color: 'bg-red-600' },
              }
              const config = eventConfig[event.event_type] || { label: event.event_type, color: 'bg-gray-500' }
              
              return (
                <div key={index} className="p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${config.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{config.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
