'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  MessageSquare, 
  ClipboardCheck, 
  CheckCircle, 
  Briefcase,
  TrendingUp,
  AlertTriangle,
  FileText,
  BarChart3,
  Settings,
  Calendar,
  Bell,
  Activity,
  FolderOpen,
  UserCheck,
  Bot
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Recruitment', href: '/dashboard/recruitment', icon: UserPlus },
  { name: 'Positions', href: '/dashboard/positions', icon: FolderOpen },
  { name: 'AI Chatbot', href: '/dashboard/chatbot', icon: Bot },
  { name: 'Interviews', href: '/dashboard/interviews', icon: Calendar },
  { name: 'Evaluations', href: '/dashboard/evaluations', icon: ClipboardCheck },
  { name: 'Approvals', href: '/dashboard/approvals', icon: CheckCircle },
  { name: 'Onboarding', href: '/dashboard/onboarding', icon: UserCheck },
  { name: 'Employees', href: '/dashboard/employees', icon: Briefcase },
  { name: 'Talent (9-Box)', href: '/dashboard/talent', icon: TrendingUp },
  { name: 'Turnover Risk', href: '/dashboard/turnover', icon: AlertTriangle },
  { name: 'Documents', href: '/dashboard/documents', icon: FileText },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Events', href: '/dashboard/events', icon: Activity },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">HR Platform</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-3 py-2 text-xs text-muted-foreground">
          HR Platform v1.0
        </div>
      </div>
    </aside>
  )
}
