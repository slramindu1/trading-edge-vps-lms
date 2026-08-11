import { getLessonContent } from "@/app/data/course/get-lesson-content";
import { CourseContent } from "./_components/CourseContent";
import { requireUser } from "@/app/data/user/require-user";
import { getUserLockedContent, isLocked } from "@/app/data/user/check-access";

type Params = Promise<{lessonId:string}>;

export default async function LessonContentPage({params}:{params:Params}){
    const {lessonId} = await params;
    const session = await requireUser();

    const data = await getLessonContent(lessonId);
    const userLocks = await getUserLockedContent(session.user.id);

    const isSectionLocked = isLocked(userLocks, data.lesson.chapter.sectionId, "SECTION");
    const isChapterLocked = isLocked(userLocks, data.lesson.chapterId, "CHAPTER");
    const isTopicLocked = data.lesson.topicId ? isLocked(userLocks, data.lesson.topicId, "TOPIC") : false;
    const isLessonLocked = isLocked(userLocks, data.lesson.id, "LESSON");

    const isLockedState = isSectionLocked || isChapterLocked || isTopicLocked || isLessonLocked;

    return (
        <CourseContent data={data} isLocked={isLockedState} />
    );
}