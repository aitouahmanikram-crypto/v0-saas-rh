import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { AlertTriangle, TrendingDown, RefreshCw, Sparkles } from 'lucide-react'
import { TurnoverAnalysis } from '@/components/turnover-analysis'

export default async function TurnoverPage() {
  const supabase = await createClient()

  const { data: predictions } = await supabase
    .from('turnover_predictions')
    .select('*, employees(first_name, last_name, position, department, hire_date, salary)')
    .order('risk_score', { ascending: false })

  // Get latest prediction per employee
  const latestPredictions = predictions?.reduce((acc, pred) => {
    if (!acc[pred.employee_id] || 
        new Date(pred.created_at) > new Date(acc[pred.employee_id].created_at)) {
      acc[pred.employee_id] = pred
    }
    return acc
  }, {} as Record<string, typeof predictions[0]>)

  const predictionsList = Object.values(latestPredictions || {})

  const criticalCount = predictionsList.filter(p => p.risk_level === 'critical').length
  const highCount = predictionsList.filter(p => p.risk_level === 'high').length
  const mediumCount = predictionsList.filter(p => p.risk_level === 'medium').length
  const lowCount = predictionsList.filter(p => p.risk_level === 'low').length

  const riskColors: Record<string, { bg: string; text: string; icon: string }> = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', icon: 'text-red-500' },
    high: { bg: 'bg-orange-100', text: 'text-orange-700', icon: 'text-orange-500' },
    medium: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-500' },
    low: { bg: 'bg-green-100', text: 'text-green-700', icon: 'text-green-500' },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turnover Risk Analysis</h1>
          <p className="text-muted-foreground mt-1">AI-powered attrition prediction and prevention</p>
        </div>
        <TurnoverAnalysis />
      </div>

      {/* Risk Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-muted-foreground">Critical Risk</p>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-orange-500" />
            <p className="text-sm text-muted-foreground">High Risk</p>
          </div>
          <p className="text-2xl font-bold text-orange-600 mt-1">{highCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 border-l-4 border-l-amber-500">
          <p className="text-sm text-muted-foreground">Medium Risk</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{mediumCount}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 border-l-4 border-l-green-500">
          <p className="text-sm text-muted-foreground">Low Risk</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{lowCount}</p>
        </div>
      </div>

      {/* High Risk Employees */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">AI Risk Predictions</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {predictionsList.length} employees analyzed
          </span>
        </div>
        <div className="divide-y divide-border">
          {predictionsList.length > 0 ? (
            predictionsList.map((prediction) => {
              const colors = riskColors[prediction.risk_level] || riskColors.low
              return (
                <div key={prediction.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center`}>
                        <AlertTriangle className={`w-6 h-6 ${colors.icon}`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {prediction.employees?.first_name} {prediction.employees?.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {prediction.employees?.position} - {prediction.employees?.department}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">
                            Tenure: {prediction.employees?.hire_date 
                              ? Math.floor((Date.now() - new Date(prediction.employees.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                              : 0} years
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Salary: ${prediction.employees?.salary?.toLocaleString() || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                          {prediction.risk_level}
                        </span>
                        <span className="text-2xl font-bold text-foreground">
                          {prediction.risk_score}%
                        </span>
                      </div>
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden mt-2">
                        <div 
                          className={`h-full rounded-full ${
                            prediction.risk_score >= 75 ? 'bg-red-500' :
                            prediction.risk_score >= 50 ? 'bg-orange-500' :
                            prediction.risk_score >= 25 ? 'bg-amber-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${prediction.risk_score}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {prediction.risk_factors && prediction.risk_factors.length > 0 && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-2">Risk Factors:</p>
                      <div className="flex flex-wrap gap-2">
                        {prediction.risk_factors.map((factor: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-background rounded text-xs text-muted-foreground">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {prediction.recommendations && prediction.recommendations.length > 0 && (
                    <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <p className="text-sm font-medium text-primary mb-2">Recommendations:</p>
                      <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                        {prediction.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="p-12 text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No turnover predictions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Run an AI analysis to predict employee turnover risk
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
