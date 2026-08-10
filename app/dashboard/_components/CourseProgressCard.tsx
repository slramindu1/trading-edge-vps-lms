"use client";

import type { SectionType } from "@/app/data/user/get-enrolled-courses";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCourseProgress } from "@/hooks/use-course-progress";
import Image from "next/image";
import Link from "next/link";

interface iAppProps {
  data: SectionType; // <-- You are receiving only the SECTION
}

export function CourseProgressCard({ data }: iAppProps) {
  const section = data; // <-- FIX: This is already the section

  const { totalLessons, completedLessons, progressPercentage } =
    useCourseProgress({ courseData: section });

  return (
    <Card className="group relative py-0 gap-0">
      <Link href={`/dashboard/sections/${section.slug}/chapters`}>
        <Image
          src={section.fileKey}
          alt="Course Thumbnail"
          width={600}
          height={400}
          className="w-full rounded-t-lg aspect-video h-full object-cover"
          unoptimized
        />
      </Link>
      <CardContent className="p-4">
        <Link
          href={`/dashboard/${section.slug}`}
          className="font-medium text-lg line-clamp-2 hover:underline group-hover:text-primary transition-colors"
        >
          {section.title}
        </Link>

        <p className="line-clamp-2 text-sm text-muted-foreground leading-tight mt-2">
          {section.smallDescription}
        </p>

        {/* --- Progress UI --- */}
        <div className="mt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Your Progress</span>
            <span className="font-medium">{progressPercentage}%</span>
          </div>

          <div className="relative w-full bg-muted rounded-full h-2 mt-1 overflow-hidden">
            <div
              className="h-2 bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          <p className="text-sm mt-2 font-medium">
            {completedLessons}/{totalLessons} Lessons Completed
          </p>
        </div>

        <Link
          href={`/dashboard/sections/${section.slug}/chapters`}
          // href={`/dashboard/Chapters`}
          className={buttonVariants({
            className: "w-full flex items-center justify-center gap-2 mt-4",
          })}
        >
          Continue Learning
        </Link>
      </CardContent>
    </Card>
  );
}
