'use client'
import type React from "react"
import { isRecommendedTabHidden } from "@/utils/helpers";
import { useRouter } from "next/navigation";
export default function RecommendedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter();
  if (isRecommendedTabHidden()) {
    router.push("/home");
    return
  }
  return <>{children}</>
}
