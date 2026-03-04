"use client"

import { useState, useEffect } from "react"
import { CourseCard } from "./course-card"
import { CourseCardSkeleton } from "./course-card-skeleton"

export function RecommendedCourses() {
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<any[]>([])

  // Simulate loading data
  useEffect(() => {
    const loadCourses = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setCourses([
        {
          id: 1,
          title: "Managing Cybersecurity Incident Response",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/team-performance%201-cbfb1GNDSzzx7TjasjNcmNQyMvF4vW.png",
          duration: "45 minutes",
          completed: false,
        },
        {
          id: 2,
          title: "Going Cloud Native with Linux",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/shutterstock_796329814-red__1_%201-NpVzePIUoDYbsyZlS82QQrJFDtmgnb.png",
          duration: "60 minutes",
          completed: false,
        },
        {
          id: 3,
          title: "Data-Driven Leadership",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Your-First-Steps-Toward-Data-Driven-Decision-Making_01%201-o5dFisDfuMIiujJWl6N4dN85GgA3bv.png",
          duration: "30 minutes",
          completed: false,
        },
        {
          id: 4,
          title: "Advanced Leadership Techniques",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Leadership-Development%201-jtYw7dVdt4ad9zVtm7Vao9JfX81GVH.png",
          duration: "50 minutes",
          completed: false,
        },
        {
          id: 5,
          title: "Mastering Project Management",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Why-Do-All-Great-Leaders-Value-Strategic-Leadership-d%201-pMOZAbmNg8b0AxOaBpwHxoHDCMmQoD.png",
          duration: "40 minutes",
          completed: false,
        },
        {
          id: 6,
          title: "Building High-Performance Teams",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/team-performance%201-cbfb1GNDSzzx7TjasjNcmNQyMvF4vW.png",
          duration: "35 minutes",
          completed: false,
        },
        {
          id: 7,
          title: "Effective Communication Strategies",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Leadership-is-Language-One-Pager-Resource%201-3fCJjJwsimFN71eOxH1LPVcCTWXb4Y.png",
          duration: "25 minutes",
          completed: false,
        },
        {
          id: 8,
          title: "Employee Coaching Techniques",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Coaching-Culture%201-Ml3XMs6Tv2AiX0lFkJXplBuDgKSIyn.png",
          duration: "55 minutes",
          completed: false,
        },
        {
          id: 9,
          title: "Strategic Decision Making",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/shutterstock_796329814-red__1_%201-NpVzePIUoDYbsyZlS82QQrJFDtmgnb.png",
          duration: "45 minutes",
          completed: false,
        },
        {
          id: 10,
          title: "AI in Business Operations",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Why-Do-All-Great-Leaders-Value-Strategic-Leadership-d%201-pMOZAbmNg8b0AxOaBpwHxoHDCMmQoD.png",
          duration: "40 minutes",
          completed: false,
        },
        {
          id: 11,
          title: "Digital Transformation Essentials",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/shutterstock_796329814-red__1_%201-NpVzePIUoDYbsyZlS82QQrJFDtmgnb.png",
          duration: "50 minutes",
          completed: false,
        },
        {
          id: 12,
          title: "Agile Methodology Fundamentals",
          image:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/team-performance%201-cbfb1GNDSzzx7TjasjNcmNQyMvF4vW.png",
          duration: "35 minutes",
          completed: false,
        },
      ])
      setLoading(false)
    }

    loadCourses()
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5 gap-4 sm:gap-6 mt-6">
      {loading
        ? // Show skeletons while loading
          Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="w-full">
              <CourseCardSkeleton />
            </div>
          ))
        : // Show actual course cards when loaded
          courses.map((course) => (
            <div key={course.id} className="w-full">
              <CourseCard course={course} />
            </div>
          ))}
    </div>
  )
}
