import { prisma } from "@/lib/prisma";

// Fetch users with optional status filter and search
export async function AdminGetUsers({
  searchQuery,
  statusFilter,
}: {
  searchQuery?: string;
  statusFilter?: "all" | "active" | "inactive" | "pending";
}) {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        // Search by name or email
        searchQuery
          ? {
              OR: [
                { fname: { contains: searchQuery, mode: "insensitive" } },
                { lname: { contains: searchQuery, mode: "insensitive" } },
                { email: { contains: searchQuery, mode: "insensitive" } },
              ],
            }
          : {},
        // Filter by status
        statusFilter && statusFilter !== "all"
          ? { status_id: statusFilterToId(statusFilter) }
          : {},
      ],
    },
    select: {
      id: true,
      fname: true,
      lname: true,
      email: true,
      mobile: true,
      joined_date: true,
      status_id: true,
      user_type_id: true,
    },
    orderBy: { joined_date: "desc" },
  });

  return users;
}

// Helper: convert statusFilter string to your status_id (assuming you have a status table)
function statusFilterToId(status: string) {
  switch (status) {
    case "active":
      return 1;
    case "inactive":
      return 2;
    case "pending":
      return 3;
    default:
      return undefined;
  }
}

export type UserType = Awaited<ReturnType<typeof AdminGetUsers>>[number];
