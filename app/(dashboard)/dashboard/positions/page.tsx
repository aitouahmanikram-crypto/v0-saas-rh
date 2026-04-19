"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Search, Briefcase, Users, DollarSign, MapPin } from "lucide-react"
import Link from "next/link"

interface Position {
  id: string
  title: string
  department: string
  description: string
  requirements: string[]
  salary_min: number
  salary_max: number
  status: string
  created_at: string
  candidate_count?: number
}

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchPositions()
  }, [])

  async function fetchPositions() {
    try {
      const res = await fetch("/api/positions")
      if (res.ok) {
        const data = await res.json()
        setPositions(data)
      }
    } catch (error) {
      console.error("Failed to fetch positions:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPositions = positions.filter(pos =>
    pos.title.toLowerCase().includes(search.toLowerCase()) ||
    pos.department?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    open: "bg-success/10 text-success",
    closed: "bg-muted text-muted-foreground",
    on_hold: "bg-warning/10 text-warning-foreground",
    draft: "bg-secondary text-secondary-foreground"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Open Positions</h1>
          <p className="text-muted-foreground">Manage job openings and requirements</p>
        </div>
        <Link href="/dashboard/positions/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Position
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPositions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No positions found</h3>
            <p className="text-muted-foreground mb-4">Create your first job opening to start recruiting</p>
            <Link href="/dashboard/positions/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Position
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPositions.map((position) => (
            <Link key={position.id} href={`/dashboard/positions/${position.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{position.title}</CardTitle>
                      <CardDescription>{position.department}</CardDescription>
                    </div>
                    <Badge className={statusColors[position.status] || "bg-secondary"}>
                      {position.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {position.description || "No description provided"}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {position.salary_min && position.salary_max
                          ? `$${(position.salary_min / 1000).toFixed(0)}k - $${(position.salary_max / 1000).toFixed(0)}k`
                          : "Salary TBD"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{position.candidate_count || 0} candidates</span>
                    </div>
                  </div>

                  {position.requirements && position.requirements.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {position.requirements.slice(0, 3).map((req, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {typeof req === "string" ? req : ""}
                        </Badge>
                      ))}
                      {position.requirements.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{position.requirements.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
