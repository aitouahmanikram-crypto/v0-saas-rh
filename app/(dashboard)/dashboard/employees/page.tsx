import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Eye, MoreHorizontal, TrendingUp, AlertTriangle } from 'lucide-react'

export default async function EmployeesPage() {
  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('*, turnover_predictions(risk_level, risk_score)')
    .order('created_at', { ascending: false })

  const activeCount = employees?.filter(e => e.status === 'active').length || 0
  const onLeaveCount = employees?.filter(e => e.status === 'on_leave').length || 0

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    on_leave: 'bg-amber-100 text-amber-700',
    terminated: 'bg-red-100 text-red-700',
    resigned: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Employees</h1>
          <p className="text-muted-foreground mt-1">Manage your workforce</p>
        </div>
        <Link
          href="/dashboard/employees/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <p className="text-2xl font-bold text-foreground">{employees?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">On Leave</p>
          <p className="text-2xl font-bold text-amber-600">{onLeaveCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">High Turnover Risk</p>
          <p className="text-2xl font-bold text-red-600">
            {employees?.filter(e => 
              e.turnover_predictions?.some((p: { risk_level: string }) => p.risk_level === 'high' || p.risk_level === 'critical')
            ).length || 0}
          </p>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Employee</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Position</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Department</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Risk</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Hire Date</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {employees && employees.length > 0 ? (
              employees.map((employee) => {
                const latestRisk = employee.turnover_predictions?.[0]
                return (
                  <tr key={employee.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">
                            {employee.first_name[0]}{employee.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {employee.position || 'Not specified'}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {employee.department || 'Not specified'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[employee.status] || 'bg-gray-100 text-gray-700'}`}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {latestRisk ? (
                        <div className="flex items-center gap-2">
                          {(latestRisk.risk_level === 'high' || latestRisk.risk_level === 'critical') && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            latestRisk.risk_level === 'critical' ? 'bg-red-100 text-red-700' :
                            latestRisk.risk_level === 'high' ? 'bg-orange-100 text-orange-700' :
                            latestRisk.risk_level === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {latestRisk.risk_level}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Not assessed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {employee.hire_date 
                        ? new Date(employee.hire_date).toLocaleDateString()
                        : 'Not specified'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/employees/${employee.id}`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        <Link
                          href={`/dashboard/talent?employee=${employee.id}`}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                          title="Talent Assessment"
                        >
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                        </Link>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No employees yet</p>
                  <Link 
                    href="/dashboard/employees/new" 
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Add your first employee
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
