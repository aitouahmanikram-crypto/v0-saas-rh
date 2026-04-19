'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Sparkles, RefreshCw } from 'lucide-react'

export function TurnoverAnalysis() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  const runAnalysis = async () => {
    setLoading(true)
    setProgress(0)

    try {
      // Get all active employees
      const { data: employees } = await supabase
        .from('employees')
        .select('id')
        .eq('status', 'active')

      if (!employees || employees.length === 0) {
        alert('No active employees to analyze')
        setLoading(false)
        return
      }

      const total = employees.length
      let completed = 0

      // Analyze each employee
      for (const employee of employees) {
        await fetch('/api/ai/predict-turnover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: employee.id }),
        })
        completed++
        setProgress(Math.round((completed / total) * 100))
      }

      router.refresh()
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <button
      onClick={runAnalysis}
      disabled={loading}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Analyzing... {progress}%
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Run AI Analysis
        </>
      )}
    </button>
  )
}
