"use client"

import { CircleUser, FileText, LayoutGrid, Clock, Sparkles, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

export function AnalyticsSidebar() {
  const pathname = usePathname()

  // Determine which sections should be expanded based on the current path
  const initialExpanded = {
    users: pathname.includes("/analytics/users/"),
    content:
      pathname.includes("/analytics/courses") ||
      pathname.includes("/analytics/programs") ||
      pathname.includes("/analytics/pathways") ||
      pathname.includes("/analytics/resources"),
    engagement: pathname.includes("/analytics/engagement/"),
    agents: pathname.includes("/analytics/agents/"),
  }

  // State to track which sections are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>(initialExpanded)
  const isActive = (path: string) => pathname === path

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  return (
    <aside className="hidden md:block w-80 border border-gray-200 rounded-lg bg-white h-full overflow-y-auto m-4">
      <nav className="flex flex-col mt-4">
        <Link
          href="/analytics"
          className={`relative flex items-center px-6 py-3 border-b border-gray-100 ${
            isActive("/analytics")
              ? "bg-amber-50 before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
              : "hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center gap-3">
            <LayoutGrid className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-gray-700">Overview</span>
          </div>
        </Link>

        {/* Users section with dropdown */}
        <div>
          <button
            onClick={() => toggleSection("users")}
            className={`relative flex items-center justify-between w-full px-6 py-3 border-b border-gray-100 text-left hover:bg-gray-50`}
          >
            <div className="flex items-center gap-3">
              <CircleUser className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Users</span>
            </div>
            {expanded.users ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* User sub-items */}
          {expanded.users && (
            <div className="bg-white">
              <Link
                href="/analytics/users/registered"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/users/registered")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/users/registered") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Registered Users
                </span>
              </Link>
              <Link
                href="/analytics/users/active"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/users/active")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/users/active") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Active Users
                </span>
              </Link>
              <Link
                href="/analytics/users/at-risk"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/users/at-risk")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/users/at-risk") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  At-Risk Users
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Content section with dropdown */}
        <div>
          <button
            onClick={() => toggleSection("content")}
            className={`relative flex items-center justify-between w-full px-6 py-3 border-b border-gray-100 text-left hover:bg-gray-50`}
          >
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Content</span>
            </div>
            {expanded.content ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* Content sub-items */}
          {expanded.content && (
            <div className="bg-white">
              <Link
                href="/analytics/courses"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/courses")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/courses") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Courses
                </span>
              </Link>
              <Link
                href="/analytics/programs"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/programs")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/programs") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Programs
                </span>
              </Link>
              <Link
                href="/analytics/pathways"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/pathways")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/pathways") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Pathways
                </span>
              </Link>
              <Link
                href="/analytics/resources"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/resources")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/resources") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Resources
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Engagement section with dropdown */}
        <div>
          <button
            onClick={() => toggleSection("engagement")}
            className={`relative flex items-center justify-between w-full px-6 py-3 border-b border-gray-100 text-left hover:bg-gray-50`}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Engagement</span>
            </div>
            {expanded.engagement ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* Engagement sub-items */}
          {expanded.engagement && (
            <div className="bg-white">
              <Link
                href="/analytics/engagement/skills"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/engagement/skills")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/engagement/skills") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Skills
                </span>
              </Link>
              <Link
                href="/analytics/engagement/credentials"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/engagement/credentials")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/engagement/credentials") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Credentials
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Agents section with dropdown */}
        <div>
          <button
            onClick={() => toggleSection("agents")}
            className={`relative flex items-center justify-between w-full px-6 py-3 border-b border-gray-100 text-left hover:bg-gray-50`}
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span className="text-sm font-medium text-gray-700">Agents</span>
            </div>
            {expanded.agents ? (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* Agents sub-items */}
          {expanded.agents && (
            <div className="bg-white">
              <Link
                href="/analytics/agents"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/agents")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/agents") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  AI Agents
                </span>
              </Link>
              <Link
                href="/analytics/agents/topics"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/agents/topics")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/agents/topics") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Topics
                </span>
              </Link>
              <Link
                href="/analytics/agents/cost"
                className={`flex items-center px-6 py-2 pl-14 border-b border-gray-100 ${
                  isActive("/analytics/agents/cost")
                    ? "bg-amber-50 relative before:absolute before:right-0 before:top-0 before:h-full before:w-1 before:bg-amber-500"
                    : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-sm ${isActive("/analytics/agents/cost") ? "text-amber-600 font-medium" : "text-gray-600"}`}
                >
                  Cost
                </span>
              </Link>
            </div>
          )}
        </div>
      </nav>
    </aside>
  )
}
