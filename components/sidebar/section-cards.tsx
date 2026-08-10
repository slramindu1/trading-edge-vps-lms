// "use client";

import {  
  IconTrendingDown, 
  IconTrendingUp,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { adminGetDashboardStats } from "@/app/data/adim-get-dashboard-stats"

export async function SectionCards() {
  const {totalSignups,PaidMentorshipStudents,totalLessons,totalSections} = await adminGetDashboardStats()
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">

      {/* Total Registered Students */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Registered Students</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
           {totalSignups}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong growth this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            All users registered on the platform (Free + Paid)
          </div>
        </CardFooter>
      </Card>


      {/* Paid Mentorship Enrollments */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Paid Mentorship Students</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {PaidMentorshipStudents}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Enrollment slowed this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Users currently subscribed to paid mentorship
          </div>
        </CardFooter>
      </Card>


      {/* Total Sections */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Training Sections</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalSections}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +5.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            High user engagement <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Structured sections in the Forex Mentorship Program
          </div>
        </CardFooter>
      </Card>


      {/* Total Lessons */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Lessons</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalLessons}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Content library expanding <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            All published lessons across all mentorship sections
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}
