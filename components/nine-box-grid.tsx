'use client'

interface Employee {
  id: string
  name: string
  position: string
  performance: number
  potential: number
}

interface NineBoxGridProps {
  data: Employee[]
}

const boxConfig = [
  { key: 'high-high', label: 'Stars', color: 'bg-green-500', row: 0, col: 2 },
  { key: 'high-medium', label: 'High Performers', color: 'bg-green-400', row: 0, col: 1 },
  { key: 'high-low', label: 'Workhorses', color: 'bg-green-300', row: 0, col: 0 },
  { key: 'medium-high', label: 'High Potentials', color: 'bg-blue-400', row: 1, col: 2 },
  { key: 'medium-medium', label: 'Core Players', color: 'bg-blue-300', row: 1, col: 1 },
  { key: 'medium-low', label: 'Inconsistent', color: 'bg-amber-300', row: 1, col: 0 },
  { key: 'low-high', label: 'Enigmas', color: 'bg-purple-300', row: 2, col: 2 },
  { key: 'low-medium', label: 'Grinders', color: 'bg-amber-400', row: 2, col: 1 },
  { key: 'low-low', label: 'Underperformers', color: 'bg-red-300', row: 2, col: 0 },
]

function getBox(performance: number, potential: number): string {
  const perfLevel = performance >= 4 ? 'high' : performance >= 2.5 ? 'medium' : 'low'
  const potLevel = potential >= 4 ? 'high' : potential >= 2.5 ? 'medium' : 'low'
  return `${perfLevel}-${potLevel}`
}

export function NineBoxGrid({ data }: NineBoxGridProps) {
  const boxEmployees = boxConfig.reduce((acc, box) => {
    acc[box.key] = data.filter(e => getBox(e.performance, e.potential) === box.key)
    return acc
  }, {} as Record<string, Employee[]>)

  return (
    <div className="relative">
      {/* Y-axis label */}
      <div className="absolute -left-12 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground whitespace-nowrap">
        Performance
      </div>

      {/* X-axis label */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-muted-foreground">
        Potential
      </div>

      {/* Y-axis indicators */}
      <div className="absolute -left-6 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
        <span>High</span>
        <span>Med</span>
        <span>Low</span>
      </div>

      {/* X-axis indicators */}
      <div className="absolute -bottom-5 left-0 w-full flex justify-between px-8 text-xs text-muted-foreground">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2 ml-4">
        {boxConfig.map((box) => {
          const employees = boxEmployees[box.key] || []
          return (
            <div
              key={box.key}
              className={`${box.color} bg-opacity-20 border border-border rounded-lg p-3 min-h-[120px] transition-all hover:bg-opacity-30`}
              style={{ order: box.row * 3 + box.col }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-foreground">{box.label}</span>
                <span className={`${box.color} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>
                  {employees.length}
                </span>
              </div>
              <div className="space-y-1 max-h-[80px] overflow-y-auto">
                {employees.slice(0, 3).map((emp) => (
                  <div
                    key={emp.id}
                    className="text-xs bg-white/50 rounded px-2 py-1 truncate"
                    title={`${emp.name} - ${emp.position}`}
                  >
                    {emp.name}
                  </div>
                ))}
                {employees.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{employees.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
