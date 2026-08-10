import { adminGetLesson } from "@/app/data/admin-get-lesson";
import { LessonForm } from "./_components/LessonForm";

interface Params {
  courseId: string;
  chapterId: string;
  lessonId: string;
}

export default async function LessonIdPage(props: { params: Promise<Params> }) {
  const { courseId, chapterId, lessonId } = await props.params;

  if (!lessonId) {
    throw new Error("Lesson ID missing in route params");
  }

  const lesson = await adminGetLesson(lessonId);

  return <LessonForm data={lesson} chapterId={chapterId} courseId={courseId} />;
}
