import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { NineBoxGrid } from '@/components/nine-box-grid'

export default async function TalentPage() {
  const supabase = await createClient()

  const { data: assessments } = await supabase
    .from('talent_assessments')
    .select('*, employees(first_name, last_name, position, department)')
    .order('created_at', { ascending: false })

  // Get latest assessment per employee
  const latestAssessments = assessments?.reduce((acc, assessment) => {
    if (!acc[assessment.employee_id] || 
        new Date(assessment.created_at) > new Date(acc[assessment.employee_id].created_at)) {
      acc[assessment.employee_id] = assessment
    }
    return acc
  }, {} as Record<string, typeof assessments[0]>)

  const assessmentsList = Object.values(latestAssessments || {})

  // Calculate 9-box distribution
  const nineBoxData = assessmentsList.map(a => ({
    id: a.employee_id,
    name: `${a.employees?.first_name} ${a.employees?.last_name}`,
    position: a.employees?.position || '',
    department: a.employees?.department || '',
    performance: a.performance_score || 3,
    potential: a.potential_score || 3,
  }))

  const boxCounts = {
    'high-high': nineBoxData.filter(e => e.performance >= 4 && e.potential >= 4).length,
    'high-medium': nineBoxData.filter(e => e.performance >= 4 && e.potential >= 2.5 && e.potential < 4).length,
    'high-low': nineBoxData.filter(e => e.performance >= 4 && e.potential < 2.5).length,
    'medium-high': nineBoxData.filter(e => e.performance >= 2.5 && e.performance < 4 && e.potential >= 4).length,
    'medium-medium': nineBoxData.filter(e => e.performance >= 2.5 && e.performance < 4 && e.potential >= 2.5 && e.potential < 4).length,
    'medium-low': nineBoxData.filter(e => e.performance >= 2.5 && e.performance < 4 && e.potential < 2.5).length,
    'low-high': nineBoxData.filter(e => e.performance < 2.5 && e.potential >= 4).length,
    'low-medium': nineBoxData.filter(e => e.performance < 2.5 && e.potential >= 2.5 && e.potential < 4).length,
    'low-low': nineBoxData.filter(e => e.performance < 2.5 && e.potential < 2.5).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Talent Management (9-Box)</h1>
          <p className="text-muted-foreground mt-1">Performance vs Potential matrix</p>
        </div>
        <Link
          href="/dashboard/talent/new"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Assessment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Assessed</p>
          <p className="text-2xl font-bold text-foreground">{assessmentsList.length}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">High Performers</p>
          <p className="text-2xl font-bold text-green-600">
            {boxCounts['high-high'] + boxCounts['high-medium'] + boxCounts['high-low']}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">High Potentials</p>
          <p className="text-2xl font-bold text-blue-600">
            {boxCounts['high-high'] + boxCounts['medium-high'] + boxCounts['low-high']}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Stars (High/High)</p>
          <p className="text-2xl font-bold text-primary">{boxCounts['high-high']}</p>
        </div>
      </div>

      {/* 9-Box Grid */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-6">9-Box Matrix</h2>
        <NineBoxGrid data={nineBoxData} />
      </div>

      {/* Recent Assessments */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Assessments</h3>
        </div>
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Employee</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Performance</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Potential</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">9-Box Position</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Period</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {assessmentsList.length > 0 ? (
              assessmentsList.slice(0, 10).map((assessment) => (
                <tr key={assessment.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">
                      {assessment.employees?.first_name} {assessment.employees?.last_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {assessment.employees?.position}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(assessment.performance_score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{assessment.performance_score}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(assessment.potential_score / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-foreground">{assessment.potential_score}/5</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {assessment.nine_box_position || 'Core Player'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {assessment.period}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-muted-foreground">No assessments yet</p>
                  <Link 
                    href="/dashboard/talent/new" 
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Create your first assessment
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
