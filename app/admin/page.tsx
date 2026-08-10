import { ChartAreaInteractive } from "@/components/sidebar/chart-area-interactive";
import { SectionCards } from "@/components/sidebar/section-cards";
import { adminGetEnrollmentStats } from "../data/admin-get-enrollment-state";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { adminGetRecentCourses } from "../data/admin-get-recent-courses";
import { EmptyState } from "@/components/general/EmptyState";
import {
  AdminCourseCard,
  AdminCourseCardSkeleton,
} from "./topics/_components/AdminCourseCard";
import { Suspense } from "react";
import { requireAdmin } from "@/app/data/require-admin";
import { Database } from "lucide-react";

// Define Section type returned by adminGetRecentCourses
type Lesson = {
  id: string;
  title: string;
  description: string | null;
  position: number;
  thumbnailUrl: string | null;
  videoUrl: string | null;
};

type Chapter = {
  id: string;
  title: string;
  position: number;
  lessons: Lesson[];
};

type Section = {
  id: string;
  title: string;
  description: string;
  fileKey: string;
  smallDescription: string;
  slug: string;
  status: "Draft" | "Published" | "Archived";
  chapters: Chapter[];
};

export default async function AdminIndexPage() {
  const enrollmentData = await adminGetEnrollmentStats();
  const adminUser = await requireAdmin();
  const user = adminUser;
  console.log("Admin User:", user);
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <a 
          href="/api/admin/backup" 
          download="backup.json"
          className={buttonVariants({ variant: "outline", className: "gap-2" })}
        >
          <Database className="w-4 h-4" />
          Download Database Backup 
        </a>
      </div>

      <SectionCards />
      <ChartAreaInteractive data={enrollmentData} />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent Sections</h2>

          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/topics"
          >
            View All Sections
          </Link>
        </div>

        <Suspense fallback={<RenderRecentCoursesSkeletonLayout />}>
          <RenderRecentCourses />
        </Suspense>
      </div>
    </div>
  );
}

async function RenderRecentCourses() {
  const result = await adminGetRecentCourses();

  // Map result to include description field to satisfy type
  const data: Section[] = Array.isArray(result)
    ? result.map((item) => ({
        ...item,
        description: item.smallDescription || "",
      }))
    : [];

  if (data.length === 0) {
    return (
      <EmptyState
        buttonText="Create New Course"
        description="You don't have any courses. Create some to see them here."
        title="You don't have any courses yet!"
        href="/admin/topics/create"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-4 gap-7">
      {data.map((section) => (
        <AdminCourseCard key={section.id} data={section} />
      ))}
    </div>
  );
}

function RenderRecentCoursesSkeletonLayout() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-4 gap-7">
      {Array.from({ length: 4 }).map((_, index) => (
        <AdminCourseCardSkeleton key={index} />
      ))}
    </div>
  );
}
