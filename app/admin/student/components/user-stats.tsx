"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Users, UserCheck, UserX, AlertCircle } from "lucide-react";

interface Stats {
  total: number;
  active: number;
  pending: number;
  inactive?: number; // Add inactive/blocked users
}

export default function UserStats() {
  const [stats, setStats] = useState<Stats>({ 
    total: 0, 
    active: 0, 
    pending: 0, 
    inactive: 0 
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/users/stats", { 
          cache: "no-store" 
        });
        if (!res.ok) throw new Error("Failed to fetch stats");
        const data: Stats = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const statsConfig = [
    { 
      label: "Total Users", 
      value: stats.total, 
      icon: Users, 
      color: "text-blue-500", 
      bgColor: "bg-blue-50 dark:bg-blue-950",
      description: "All registered users"
    },
    { 
      label: "Active Users", 
      value: stats.active, 
      icon: UserCheck, 
      color: "text-green-500", 
      bgColor: "bg-green-50 dark:bg-green-950",
      description: "Users with access"
    },
    { 
      label: "Blocked Users", 
      value: stats.inactive || 0, 
      icon: UserX, 
      color: "text-red-500", 
      bgColor: "bg-red-50 dark:bg-red-950",
      description: "Users who are blocked"
    },
    { 
      label: "Pending Approval", 
      value: stats.pending, 
      icon: AlertCircle, 
      color: "text-amber-500", 
      bgColor: "bg-amber-50 dark:bg-amber-950",
      description: "Awaiting approval"
    },
  ];

  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statsConfig.map(stat => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`${stat.bgColor} rounded-xl p-3`}>
                <Icon className={`h-7 w-7 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}