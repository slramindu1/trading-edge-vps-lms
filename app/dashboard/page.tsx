// app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/lib/getSession";
import { EmptyState } from "@/components/general/EmptyState";
import { getEnrolledCourses } from "../data/user/get-enrolled-courses";
import { CourseProgressCard } from "@/app/dashboard/_components/CourseProgressCard";
import { DiscordCard } from "./_components/DiscordCard";

export default async function DashboardPage() {
  // Get user session
  const session = await getSession();

  // If no session, redirect to login
  if (!session) {
    redirect("/sign-in?redirect=/dashboard");
  }

  // If profile not completed, redirect to complete-profile
  if (!session.user.profile_completed) {
    redirect(`/complete-profile?redirect=${encodeURIComponent("/dashboard")}`);
  }

  // Now fetch courses since user is authenticated and profile is complete
  const [enrolledCourses] = await Promise.all([getEnrolledCourses()]);

  return (
    <>
      {/* Welcome message with user's name */}
      {/* <div className="flex flex-col gap-2 mb-6">
        <h1 className="text-3xl font-bold">
          Welcome back, {session.user.fname}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here you can see all the courses you have access to
        </p> */}

      {/* Profile completion status badge */}
      {/* <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm mt-2 w-fit">
          <span className="h-2 w-2 bg-green-500 rounded-full"></span>
          Profile Completed
        </div> */}
      {/* </div> */}

      {/* Courses Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Enrolled Courses</h2>

        {enrolledCourses.length === 0 ? (
          <EmptyState
            title="No Courses Enrolled"
            description="You have not enrolled in any courses yet"
            buttonText="Browse Courses"
            href="/courses" // Update with your actual courses page URL
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {enrolledCourses.flatMap((user) =>
              user.enrollments.map((enrollment) => (
                <CourseProgressCard
                  key={enrollment.section.id}
                  data={enrollment.section}
                />
              ))
            )}
            <DiscordCard />
          </div>
        )}
      </div>
    </>
  );
}
