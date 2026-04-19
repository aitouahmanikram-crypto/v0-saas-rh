"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Video, MapPin, User, Plus } from "lucide-react"
import Link from "next/link"

interface Interview {
  id: string
  candidate_id: string
  interviewer_id: string
  scheduled_at: string
  duration_minutes: number
  location: string
  meeting_url: string
  interview_type: string
  status: string
  notes: string
  candidate?: {
    first_name: string
    last_name: string
    email: string
  }
  position?: {
    title: string
  }
}

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated data for demo
    setInterviews([
      {
        id: "1",
        candidate_id: "c1",
        interviewer_id: "i1",
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 60,
        location: "Conference Room A",
        meeting_url: "https://meet.google.com/abc-defg-hij",
        interview_type: "technical",
        status: "scheduled",
        notes: "",
        candidate: { first_name: "Alice", last_name: "Johnson", email: "alice@email.com" },
        position: { title: "Senior Software Engineer" }
      },
      {
        id: "2",
        candidate_id: "c2",
        interviewer_id: "i1",
        scheduled_at: new Date(Date.now() + 172800000).toISOString(),
        duration_minutes: 45,
        location: "",
        meeting_url: "https://zoom.us/j/123456789",
        interview_type: "behavioral",
        status: "scheduled",
        notes: "",
        candidate: { first_name: "Bob", last_name: "Smith", email: "bob@email.com" },
        position: { title: "Product Manager" }
      },
      {
        id: "3",
        candidate_id: "c3",
        interviewer_id: "i2",
        scheduled_at: new Date(Date.now() - 86400000).toISOString(),
        duration_minutes: 60,
        location: "Virtual",
        meeting_url: "",
        interview_type: "final",
        status: "completed",
        notes: "Great candidate, moving to approval",
        candidate: { first_name: "Carol", last_name: "Williams", email: "carol@email.com" },
        position: { title: "UX Designer" }
      }
    ])
    setLoading(false)
  }, [])

  const statusColors: Record<string, string> = {
    scheduled: "bg-primary/10 text-primary",
    in_progress: "bg-warning/10 text-warning-foreground",
    completed: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
    no_show: "bg-muted text-muted-foreground"
  }

  const typeLabels: Record<string, string> = {
    phone: "Phone Screen",
    technical: "Technical",
    behavioral: "Behavioral",
    final: "Final Round",
    hr: "HR Interview"
  }

  const upcomingInterviews = interviews.filter(i => new Date(i.scheduled_at) > new Date() && i.status === "scheduled")
  const pastInterviews = interviews.filter(i => new Date(i.scheduled_at) <= new Date() || i.status !== "scheduled")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Interviews</h1>
          <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
        </div>
        <Link href="/dashboard/interviews/schedule">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Interview
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming ({upcomingInterviews.length})
          </h2>
          {loading ? (
            <Card className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-muted rounded" />
              </CardContent>
            </Card>
          ) : upcomingInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No upcoming interviews</p>
              </CardContent>
            </Card>
          ) : (
            upcomingInterviews.map((interview) => (
              <Card key={interview.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">
                        {interview.candidate?.first_name} {interview.candidate?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{interview.position?.title}</p>
                    </div>
                    <Badge className={statusColors[interview.status]}>
                      {interview.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {new Date(interview.scheduled_at).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{interview.duration_minutes} minutes</span>
                    </div>
                    {interview.meeting_url && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Video className="h-4 w-4" />
                        <a href={interview.meeting_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          Join Meeting
                        </a>
                      </div>
                    )}
                    {interview.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{interview.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t flex items-center justify-between">
                    <Badge variant="outline">{typeLabels[interview.interview_type]}</Badge>
                    <div className="flex gap-2">
                      <Link href={`/dashboard/evaluations/new?interviewId=${interview.id}`}>
                        <Button size="sm" variant="outline">Add Evaluation</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Past Interviews ({pastInterviews.length})
          </h2>
          {pastInterviews.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No past interviews</p>
              </CardContent>
            </Card>
          ) : (
            pastInterviews.map((interview) => (
              <Card key={interview.id} className="opacity-80">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">
                        {interview.candidate?.first_name} {interview.candidate?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{interview.position?.title}</p>
                    </div>
                    <Badge className={statusColors[interview.status]}>
                      {interview.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(interview.scheduled_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                    <Badge variant="outline" className="ml-auto">{typeLabels[interview.interview_type]}</Badge>
                  </div>

                  {interview.notes && (
                    <p className="mt-2 text-sm text-muted-foreground italic">{interview.notes}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
