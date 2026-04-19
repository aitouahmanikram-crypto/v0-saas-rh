import { createClient } from '@/lib/supabase/server'
import { 
  Users, 
  UserPlus, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  Clock
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch stats
  const [
    { count: candidatesCount },
    { count: employeesCount },
    { count: pendingApprovals },
    { count: openPositions }
  ] = await Promise.all([
    supabase.from('candidates').select('*', { count: 'exact', head: true }),
    supabase.from('employees').select('*', { count: 'exact', head: true }),
    supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('positions').select('*', { count: 'exact', head: true }).eq('status', 'open'),
  ])

  const stats = [
    { name: 'Active Candidates', value: candidatesCount || 0, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-100' },
    { name: 'Total Employees', value: employeesCount || 0, icon: Users, color: 'text-green-600', bg: 'bg-green-100' },
    { name: 'Pending Approvals', value: pendingApprovals || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100' },
    { name: 'Open Positions', value: openPositions || 0, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/10' },
  ]

  // Fetch recent candidates
  const { data: recentCandidates } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch turnover alerts
  const { data: turnoverAlerts } = await supabase
    .from('turnover_predictions')
    .select('*, employees(*)')
    .in('risk_level', ['high', 'critical'])
    .order('risk_score', { ascending: false })
    .limit(3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your HR operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.name}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Candidates</h3>
            <Link href="/dashboard/recruitment" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentCandidates && recentCandidates.length > 0 ? (
              recentCandidates.map((candidate) => (
                <div key={candidate.id} className="p-4 flex items-center justify-between">
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    candidate.status === 'approved' ? 'bg-green-100 text-green-700' :
                    candidate.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {candidate.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No candidates yet</p>
                <Link href="/dashboard/recruitment/new" className="text-primary text-sm hover:underline">
                  Add your first candidate
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Turnover Alerts */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Turnover Risk Alerts</h3>
            <Link href="/dashboard/turnover" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {turnoverAlerts && turnoverAlerts.length > 0 ? (
              turnoverAlerts.map((alert) => (
                <div key={alert.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      alert.risk_level === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                    }`}>
                      <AlertTriangle className={`w-5 h-5 ${
                        alert.risk_level === 'critical' ? 'text-red-600' : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {alert.employees?.first_name} {alert.employees?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Risk Score: {alert.risk_score}%
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alert.risk_level === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {alert.risk_level}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No high-risk alerts</p>
                <p className="text-sm">Your team retention looks healthy</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link 
            href="/dashboard/recruitment/new"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add Candidate
          </Link>
          <Link 
            href="/dashboard/employees/new"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Add Employee
          </Link>
          <Link 
            href="/dashboard/recruitment/positions/new"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Create Position
          </Link>
          <Link 
            href="/dashboard/documents"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Generate Report
          </Link>
        </div>
      </div>
    </div>
  )
}
