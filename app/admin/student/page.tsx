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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  return (
    <div className=" bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-sm">
        <div className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Users
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage and monitor all users in your system
              </p>
            </div>
            <Link href={"student/create"}>
              <Button className="gap-2 hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto px-4 py-8 sm:px-6  space-y-6">
        {/* Stats */}
        <UserStats />

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", "active", "inactive", "pending"].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize hover:scale-105 transition-transform"
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* User List */}
        <UserList searchQuery={searchQuery} statusFilter={statusFilter} />
      </div>
    </div>
  );
}
