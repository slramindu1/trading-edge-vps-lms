"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import UserList from "./components/user-list";
import UserStats from "./components/user-stats";
import { Search, Plus } from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
  const [searchQuery, setSearchQuery]       = useState("");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [studentTypeFilter, setStudentTypeFilter] = useState("all");

  return (
    <div className="bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-sm">
        <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Students</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage and monitor all students in your system
              </p>
            </div>
            <Link href={"student/create"}>
              <Button className="gap-2 hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-8 sm:px-6 space-y-6">
        {/* Stats */}
        <UserStats />

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter rows */}
            <div className="flex flex-wrap gap-4">
              {/* Status filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status:</span>
                <div className="flex gap-1">
                  {["all", "active", "inactive", "pending"].map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="capitalize text-xs h-7 px-2.5"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Student type filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plan:</span>
                <div className="flex gap-1">
                  {[
                    { label: "All", value: "all" },
                    { label: "Free", value: "FREE" },
                    { label: "Paid", value: "PAID" },
                  ].map(({ label, value }) => (
                    <Button
                      key={value}
                      variant={studentTypeFilter === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStudentTypeFilter(value)}
                      className="text-xs h-7 px-2.5"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* User List */}
        <UserList
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          studentTypeFilter={studentTypeFilter}
        />
      </div>
    </div>
  );
}
