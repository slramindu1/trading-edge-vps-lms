import { adminGetChapter } from "@/app/data/admin-get-chapter";
import { ChapterEditForm } from "./_components/ChapterForm";

interface Params {
  courseId: string;
  chapterId: string;
}

export default async function ChapterIdPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { courseId, chapterId } = await params;

  const chapter = await adminGetChapter(chapterId);

  return (
    <ChapterEditForm
      data={chapter}
      chapterId={chapterId}
      courseId={courseId}
    />
  );
}
