import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ClipboardList, 
  UserPlus, 
  Laptop, 
  FileText, 
  Mail, 
  Building2,
  CheckCircle2,
  Clock
} from 'lucide-react'
import Link from 'next/link'

interface OnboardingTask {
  id: string
  title: string
  description: string
  category: 'hr' | 'it' | 'manager'
  completed: boolean
  icon: React.ReactNode
}

const defaultTasks: OnboardingTask[] = [
  { id: '1', title: 'Complete employment paperwork', description: 'Sign contracts and tax forms', category: 'hr', completed: false, icon: <FileText className="h-4 w-4" /> },
  { id: '2', title: 'Set up employee profile', description: 'Add photo and contact information', category: 'hr', completed: false, icon: <UserPlus className="h-4 w-4" /> },
  { id: '3', title: 'Issue employee ID badge', description: 'Create and distribute access badge', category: 'hr', completed: false, icon: <ClipboardList className="h-4 w-4" /> },
  { id: '4', title: 'Set up workstation', description: 'Configure computer and peripherals', category: 'it', completed: false, icon: <Laptop className="h-4 w-4" /> },
  { id: '5', title: 'Create email account', description: 'Set up corporate email and calendar', category: 'it', completed: false, icon: <Mail className="h-4 w-4" /> },
  { id: '6', title: 'Grant system access', description: 'Provide access to required systems', category: 'it', completed: false, icon: <Building2 className="h-4 w-4" /> },
  { id: '7', title: 'Schedule orientation meeting', description: 'Plan welcome meeting with team', category: 'manager', completed: false, icon: <Clock className="h-4 w-4" /> },
  { id: '8', title: 'Assign onboarding buddy', description: 'Designate a mentor for first weeks', category: 'manager', completed: false, icon: <UserPlus className="h-4 w-4" /> },
]

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Get recently hired employees (approved candidates converted to employees)
  const { data: newEmployees } = await supabase
    .from('employees')
    .select('*, candidates(first_name, last_name)')
    .order('hire_date', { ascending: false })
    .limit(10)

  // Get pending approvals that will become new hires
  const { data: pendingOnboarding } = await supabase
    .from('approval_requests')
    .select(`
      *,
      candidate:candidates(id, first_name, last_name, email),
      position:positions(title, department)
    `)
    .eq('status', 'approved')
    .order('decided_at', { ascending: false })
    .limit(5)

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'hr': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'it': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Onboarding</h1>
          <p className="text-muted-foreground">Manage new employee onboarding tasks and progress</p>
        </div>
        <Link href="/dashboard/employees/new">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee Manually
          </Button>
        </Link>
      </div>

      {/* Pending Onboarding */}
      {pendingOnboarding && pendingOnboarding.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Onboarding
            </CardTitle>
            <CardDescription>
              Approved candidates ready to be onboarded
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingOnboarding.map((approval: Record<string, unknown>) => (
                <div 
                  key={approval.id as string} 
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <UserPlus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {(approval.candidate as Record<string, unknown>)?.first_name as string}{' '}
                        {(approval.candidate as Record<string, unknown>)?.last_name as string}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(approval.position as Record<string, unknown>)?.title as string} - {(approval.position as Record<string, unknown>)?.department as string}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Approved
                    </Badge>
                    <Link href={`/dashboard/onboarding/${(approval.candidate as Record<string, unknown>)?.id}`}>
                      <Button size="sm">Start Onboarding</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Onboarding Checklist Template */}
      <div className="grid gap-6 lg:grid-cols-3">
        {['hr', 'it', 'manager'].map((category) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 capitalize">
                {category === 'hr' && <ClipboardList className="h-5 w-5" />}
                {category === 'it' && <Laptop className="h-5 w-5" />}
                {category === 'manager' && <Building2 className="h-5 w-5" />}
                {category === 'hr' ? 'HR Tasks' : category === 'it' ? 'IT Tasks' : 'Manager Tasks'}
              </CardTitle>
              <CardDescription>
                {defaultTasks.filter(t => t.category === category).length} tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {defaultTasks
                  .filter(task => task.category === category)
                  .map((task) => (
                    <div 
                      key={task.id}
                      className="flex items-start gap-3 rounded-lg border p-3"
                    >
                      <Checkbox id={task.id} />
                      <div className="flex-1 space-y-1">
                        <label 
                          htmlFor={task.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {task.title}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Employees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Recently Onboarded
          </CardTitle>
          <CardDescription>
            Employees who completed onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {newEmployees && newEmployees.length > 0 ? (
            <div className="space-y-4">
              {newEmployees.map((employee: Record<string, unknown>) => {
                const progress = Math.floor(Math.random() * 40) + 60 // Demo: 60-100%
                return (
                  <div 
                    key={employee.id as string}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {employee.first_name as string} {employee.last_name as string}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {employee.position as string} - {employee.department as string}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                      <Badge 
                        variant={progress === 100 ? 'default' : 'secondary'}
                        className={progress === 100 ? 'bg-green-500' : ''}
                      >
                        {progress === 100 ? 'Complete' : 'In Progress'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UserPlus className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No employees onboarded yet</p>
              <p className="text-sm text-muted-foreground">
                Approved candidates will appear here for onboarding
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
