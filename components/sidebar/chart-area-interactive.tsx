"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  Card,

  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "An interactive area chart";

// const dummyEntrollmentsData = [
//   { date: "2025-11-01", enrollments: 12 },
//   { date: "2025-11-02", enrollments: 9 },
//   { date: "2025-11-03", enrollments: 14 },
//   { date: "2025-11-04", enrollments: 23 },
//   { date: "2025-11-05", enrollments: 13 },
//   { date: "2025-11-06", enrollments: 43 },
//   { date: "2025-11-07", enrollments: 43 },
//   { date: "2025-11-08", enrollments: 53 },
//   { date: "2025-11-09", enrollments: 63 },
//   { date: "2025-11-10", enrollments: 29 },
//   { date: "2025-11-11", enrollments: 37 },
//   { date: "2025-11-12", enrollments: 21 },
//   { date: "2025-11-13", enrollments: 18 },
//   { date: "2025-11-14", enrollments: 34 },
//   { date: "2025-11-15", enrollments: 25 },
//   { date: "2025-11-16", enrollments: 41 },
//   { date: "2025-11-17", enrollments: 28 },
//   { date: "2025-11-18", enrollments: 32 },
//   { date: "2025-11-19", enrollments: 12 },
//   { date: "2025-11-20", enrollments: 9 },
//   { date: "2025-11-21", enrollments: 14 },
//   { date: "2025-11-22", enrollments: 23 },
//   { date: "2025-11-23", enrollments: 13 },
//   { date: "2025-11-24", enrollments: 43 },
//   { date: "2025-11-25", enrollments: 43 },
//   { date: "2025-11-26", enrollments: 53 },
//   { date: "2025-11-27", enrollments: 63 },
//   { date: "2025-11-28", enrollments: 47 },
//   { date: "2025-11-29", enrollments: 36 },
//   { date: "2025-11-30", enrollments: 52 },
// ];

const chartConfig = {
  enrollments: {
    label: "Enrollments",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface ChartAreaInteractiveProps{
  data: {date:string; enrollments:number}[];
}

export function ChartAreaInteractive({data}:ChartAreaInteractiveProps) {
const totalEnrollementsNumber = React.useMemo(
  ()=> data.reduce((acc,curr)=> acc + curr.enrollments, 0),[data]
);
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Enrollments</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 30 days: {totalEnrollementsNumber}
          </span>
          <span className="@[540px]/card:hidden">Last 30 days: {totalEnrollementsNumber}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full"
        >
          <BarChart
            data={data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={"preserveStartEnd"}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
              }
            />
            <Bar dataKey={"enrollments"} fill="#004be0"   radius={[4, 4, 0, 0]}/>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
