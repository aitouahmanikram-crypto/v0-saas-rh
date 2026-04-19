"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, User } from 'lucide-react'
import Link from 'next/link'

interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
  department: string
}

export default function NewTalentAssessmentPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [formData, setFormData] = useState({
    employee_id: '',
    performance_score: 3,
    potential_score: 3,
    notes: '',
  })

  useEffect(() => {
    async function fetchEmployees() {
      const { data } = await supabase
        .from('employees')
        .select('id, first_name, last_name, position, department')
        .order('last_name')
      
      if (data) setEmployees(data)
    }
    fetchEmployees()
  }, [supabase])

  // Calculate 9-box position based on scores
  function get9BoxPosition(performance: number, potential: number): string {
    if (potential >= 4) {
      if (performance >= 4) return 'Star'
      if (performance >= 2) return 'High Potential'
      return 'Potential Gem'
    } else if (potential >= 2) {
      if (performance >= 4) return 'High Performer'
      if (performance >= 2) return 'Core Player'
      return 'Inconsistent'
    } else {
      if (performance >= 4) return 'Workhouse'
      if (performance >= 2) return 'Average Performer'
      return 'Risk'
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase
        .from('talent_assessments')
        .insert({
          employee_id: formData.employee_id,
          performance_score: formData.performance_score,
          potential_score: formData.potential_score,
          nine_box_position: get9BoxPosition(formData.performance_score, formData.potential_score),
          notes: formData.notes || null,
          assessed_by: user?.id,
        })

      if (error) throw error

      router.push('/dashboard/talent')
      router.refresh()
    } catch (error) {
      console.error('Error creating assessment:', error)
      alert('Failed to create assessment')
    } finally {
      setLoading(false)
    }
  }

  const selectedEmployee = employees.find(e => e.id === formData.employee_id)
  const currentPosition = get9BoxPosition(formData.performance_score, formData.potential_score)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/talent">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Talent Assessment</h1>
          <p className="text-muted-foreground">
            Evaluate employee performance and potential for the 9-Box matrix
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assessment Details</CardTitle>
            <CardDescription>
              Rate the employee on performance and potential
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employee">Employee</Label>
                <Select 
                  value={formData.employee_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, employee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Performance Score</Label>
                    <span className="text-sm font-medium">{formData.performance_score}/5</span>
                  </div>
                  <Slider
                    value={[formData.performance_score]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, performance_score: value }))}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Potential Score</Label>
                    <span className="text-sm font-medium">{formData.potential_score}/5</span>
                  </div>
                  <Slider
                    value={[formData.potential_score]}
                    onValueChange={([value]) => setFormData(prev => ({ ...prev, potential_score: value }))}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Assessment Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this assessment..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={loading || !formData.employee_id} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {loading ? 'Saving...' : 'Save Assessment'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>9-Box Preview</CardTitle>
            <CardDescription>
              Current position based on scores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedEmployee && (
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedEmployee.position} - {selectedEmployee.department}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-lg border p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">9-Box Position</p>
              <p className="text-2xl font-bold text-primary">{currentPosition}</p>
              <p className="text-sm text-muted-foreground mt-2">
                Performance: {formData.performance_score}/5 | Potential: {formData.potential_score}/5
              </p>
            </div>

            {/* 9-Box Grid Preview */}
            <div className="grid grid-cols-3 gap-1 text-xs">
              {['Potential Gem', 'High Potential', 'Star'].map((pos) => (
                <div 
                  key={pos}
                  className={`p-2 text-center rounded ${currentPosition === pos ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                  {pos}
                </div>
              ))}
              {['Inconsistent', 'Core Player', 'High Performer'].map((pos) => (
                <div 
                  key={pos}
                  className={`p-2 text-center rounded ${currentPosition === pos ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                  {pos}
                </div>
              ))}
              {['Risk', 'Average Performer', 'Workhouse'].map((pos) => (
                <div 
                  key={pos}
                  className={`p-2 text-center rounded ${currentPosition === pos ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                >
                  {pos}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Low Performance</span>
              <span>High Performance</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
