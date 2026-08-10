import { EmptyState } from "@/components/general/EmptyState";
import { getSectionBySlug } from "@/app/data/user/get-assigned-chapters";
import { ChapterProgressCard } from "@/app/dashboard/_components/ChapterProgressCard";
import { SectionType, ChapterType } from "@/app/dashboard/_components/types";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSession } from "@/lib/getSession";
import { redirect } from "next/navigation";
import { getUserLockedContent, isLocked } from "@/app/data/user/check-access";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getSession();
  
  if (!session) {
    redirect("/login");
  }

  const [sectionData, userLocks] = await Promise.all([
    getSectionBySlug(slug),
    getUserLockedContent(session.user.id)
  ]);

  if (!sectionData || isLocked(userLocks, sectionData.id, "SECTION")) {
    return (
      <EmptyState
        title="Access Denied"
        description="You do not have access to this course."
        buttonText="Back to Dashboard"
        href="/dashboard"
      />
    );
  }

  // Filter out locked chapters
  const availableChapters = sectionData.chapters?.filter(
    (chapter: ChapterType) => !isLocked(userLocks, chapter.id, "CHAPTER")
  ) || [];

  if (availableChapters.length === 0) {
    return (
      <EmptyState
        title="No Chapters Available"
        description="There are no unlocked chapters in this course right now."
        buttonText="Contact Admin"
        href="https://wa.me/94776768597"
      />
    );
  }

  sectionData.chapters = availableChapters;

  return (
    <>
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "absolute top-4 left-4 mt-16"
        )}
      >
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Link>
      
      <div className="flex flex-col gap-2 mb-6 mt-20">
        <h1 className="text-3xl font-bold">{sectionData.title}</h1>
        {sectionData.smallDescription && (
          <p className="text-muted-foreground">
            {sectionData.smallDescription}
          </p>
        )}
      </div>

      {/* Chapters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {sectionData.chapters.map((chapter: ChapterType) => (
          <ChapterProgressCard
            key={chapter.id}
            section={sectionData} // pass full section
            chapter={chapter} // current chapter
          />
        ))}
      </div>
    </>
  );
}
