import { useMemo } from "react";

interface LessonProgress {
  id: string;
  completed: boolean;
  LessonId: string;
}

interface LessonType {
  id: string;
  title: string;
  description: string | null;
  position: number;
  LessonProgress?: LessonProgress[];
}

interface ChapterType {
  id: string;
  title: string;
  position: number;
  lessons?: LessonType[];
}

interface SectionType {
  id: string;
  title: string;
  slug: string;
  fileKey: string | null; // This allows null
  smallDescription: string | null; // This allows null
  chapters?: ChapterType[];
}

export function useCourseProgress({ courseData }: { courseData: SectionType }) {
  const { totalLessons, completedLessons, progressPercentage } = useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;

    // Guard against undefined chapters
    const chapters = courseData.chapters || [];
    chapters.forEach((chapter) => {
      const lessons = chapter.lessons || [];
      lessons.forEach((lesson) => {
        totalLessons++;
        if (lesson.LessonProgress?.[0]?.completed) {
          completedLessons++;
        }
      });
    });

    const progressPercentage =
      totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return { totalLessons, completedLessons, progressPercentage };
  }, [courseData]);

  return { totalLessons, completedLessons, progressPercentage };
}
