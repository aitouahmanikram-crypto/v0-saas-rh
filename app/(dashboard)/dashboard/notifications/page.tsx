"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, CheckCheck, Info, AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  created_at: string
  entity_type?: string
  entity_id?: string
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulated notifications for demo
    setNotifications([
      {
        id: "1",
        title: "New Candidate Applied",
        message: "Alice Johnson has applied for the Senior Software Engineer position",
        type: "info",
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        entity_type: "candidate",
        entity_id: "c1"
      },
      {
        id: "2",
        title: "Evaluation Submitted",
        message: "Bob Smith's technical interview evaluation has been submitted",
        type: "success",
        read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        entity_type: "evaluation",
        entity_id: "e1"
      },
      {
        id: "3",
        title: "Approval Required",
        message: "David Brown's hiring approval is waiting for your decision",
        type: "warning",
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        entity_type: "approval",
        entity_id: "a1"
      },
      {
        id: "4",
        title: "High Turnover Risk Detected",
        message: "Employee John Doe has been flagged as high turnover risk",
        type: "error",
        read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        entity_type: "employee",
        entity_id: "emp1"
      }
    ])
    setLoading(false)
  }, [])

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const typeIcons: Record<string, React.ReactNode> = {
    info: <Info className="h-5 w-5 text-primary" />,
    success: <CheckCircle className="h-5 w-5 text-success" />,
    warning: <AlertTriangle className="h-5 w-5 text-warning-foreground" />,
    error: <AlertCircle className="h-5 w-5 text-destructive" />
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {loading ? (
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`transition-all ${!notification.read ? "border-l-4 border-l-primary bg-primary/5" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    {typeIcons[notification.type]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{notification.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      </div>
                      {!notification.read && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
