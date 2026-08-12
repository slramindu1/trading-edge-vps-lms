import { useCallback, useEffect, useState } from "react";
import { 
  MoreVertical, 
  Trash2, 
  Lock, 
  Unlock, 
  UserCheck, 
  UserX 
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { StudentAccessTree } from "./student-access-tree";
import { checkChapterLockingFeature } from "../actions";

interface User {
  id: string;
  fname: string | null;
  lname: string | null;
  email: string;
  status_id: number;
  user_type_id: number;
  joined_date: string;
  avatar?: string;
}

interface UserListProps {
  searchQuery: string;
  statusFilter: string;
}

export default function UserList({ searchQuery, statusFilter }: UserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, current: 1, limit: 15 });
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToBlock, setUserToBlock] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [isLimitedAccessOpen, setIsLimitedAccessOpen] = useState(false);
  const [userForAccess, setUserForAccess] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isChapterLockingEnabled, setIsChapterLockingEnabled] = useState(false);

  useEffect(() => {
    checkChapterLockingFeature().then(setIsChapterLockingEnabled);
  }, []);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append("searchQuery", searchQuery);
    if (statusFilter) params.append("statusFilter", statusFilter);
    params.append("page", currentPage.toString());
    params.append("limit", "15");

    const res = await fetch(`/api/users?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
      setPagination(data.pagination || { total: 0, pages: 1, current: 1, limit: 15 });
    }
  }, [searchQuery, statusFilter, currentPage]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleBlockClick = (user: User) => {
    setUserToBlock(user);
    setIsBlockDialogOpen(true);
  };

  const handleAccessClick = (user: User) => {
    setUserForAccess(user);
    setIsLimitedAccessOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      const responseData = await response.json();

      console.log("Delete response:", response.status, responseData);

      if (response.ok) {
        toast.success("User deleted successfully");
        setUsers(users.filter((user) => user.id !== userToDelete.id));
      } else {
        console.error("Delete failed:", responseData);
        toast.error(responseData.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Network error deleting user:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleBlockConfirm = async () => {
    if (!userToBlock) return;

    setIsBlocking(true);
    try {
      // Determine new status: if active (1), block to inactive (2), if inactive (2), unblock to active (1)
      const newStatusId = userToBlock.status_id === 1 ? 2 : 1;
      const action = newStatusId === 2 ? "block" : "unblock";
      
      const response = await fetch(`/api/users/${userToBlock.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status_id: newStatusId }),
      });

      const responseData = await response.json();

      console.log("Block/Unblock response:", response.status, responseData);

      if (response.ok) {
        const actionText = newStatusId === 2 ? "blocked" : "unblocked";
        toast.success(`User ${actionText} successfully`);
        
        // Update user in local state
        setUsers(users.map(user => 
          user.id === userToBlock.id 
            ? { ...user, status_id: newStatusId }
            : user
        ));
      } else {
        console.error(`${action} failed:`, responseData);
        toast.error(responseData.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error("Network error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsBlocking(false);
      setIsBlockDialogOpen(false);
      setUserToBlock(null);
    }
  };

  const statusIdToString = (id: number) =>
    id === 1
      ? "active"
      : id === 2
      ? "inactive"
      : id === 3
      ? "pending"
      : "unknown";
  
  const userTypeIdToRole = (id: number) =>
    id === 1 ? "Admin" : id === 2 ? "User" : id === 3 ? "Unknown" : "Not-Set";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-200";
      case "User":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusIcon = (statusId: number) => {
    return statusId === 1 ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />;
  };

  const getStatusActionText = (statusId: number) => {
    return statusId === 1 ? "Block User" : "Unblock User";
  };

  const getStatusDialogTitle = (statusId: number) => {
    return statusId === 1 ? "Block User" : "Unblock User";
  };

  const getStatusDialogDescription = (user: User | null, statusId: number) => {
    const action = statusId === 1 ? "block" : "unblock";
    const oppositeStatus = statusId === 1 ? "inactive" : "active";
    
    return user ? (
      <div className="text-sm text-muted-foreground space-y-2">
        <p>
          Are you sure you want to {action} user{" "}
          <span className="font-semibold">
            {user.fname} {user.lname}
          </span>{" "}
          ({user.email})?
        </p>
        <p>
          This will change their status to <span className="font-semibold">{oppositeStatus}</span>.
          {action === "block" && " They will not be able to access their account."}
          {action === "unblock" && " They will regain access to their account."}
        </p>
      </div>
    ) : null;
  };

  return (
    <>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Join Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => {
                  const status = statusIdToString(user.status_id);
                  const role = userTypeIdToRole(user.user_type_id);
                  const name = `${user.fname || ""} ${user.lname || ""}`.trim();
                  const isBlocked = user.status_id === 2;
                  
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-muted/50 transition-colors ${
                        isBlocked ? "opacity-70" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={user.avatar || "/placeholder.svg"}
                              alt={name}
                            />
                            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {name}
                              {isBlocked && (
                                <span className="ml-2 text-xs text-red-500">
                                  (Blocked)
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getRoleColor(role)}>{role}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={getStatusColor(status)}>
                          {status}
                          {isBlocked && (
                            <span className="ml-1">🔒</span>
                          )}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(user.joined_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant={isBlocked ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleBlockClick(user)}
                            className={isBlocked 
                              ? "bg-green-600 hover:bg-green-700" 
                              : "bg-red-600 hover:bg-red-700 text-white"
                            }
                          >
                            {isBlocked ? (
                              <>
                                <UserCheck className="mr-1 h-3 w-3" />
                                Unblock
                              </>
                            ) : (
                              <>
                                <UserX className="mr-1 h-3 w-3" />
                                Block
                              </>
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleBlockClick(user)}
                                className={isBlocked 
                                  ? "text-green-600 focus:text-green-600" 
                                  : "text-red-600 focus:text-red-600"
                                }
                              >
                                {getStatusIcon(user.status_id)}
                                {getStatusActionText(user.status_id)}
                              </DropdownMenuItem>
                              {isChapterLockingEnabled && (
                                <DropdownMenuItem
                                  onClick={() => handleAccessClick(user)}
                                >
                                  <Lock className="mr-2 h-4 w-4" />
                                  Limited Access
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeleteClick(user)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">
              No users found matching your criteria.
            </p>
          </div>
        )}
        
        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.current - 1) * pagination.limit) + 1} to {Math.min(pagination.current * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {pagination.pages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(pagination.pages, prev + 1))}
                disabled={currentPage === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground" asChild>
              <div>
                This action cannot be undone. This will permanently delete the
                user{" "}
                <span className="font-semibold">
                  {userToDelete?.fname} {userToDelete?.lname}
                </span>{" "}
                ({userToDelete?.email}) and all associated data including:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>All enrollments in courses</li>
                  <li>All lesson progress records</li>
                  <li>User profile information</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Confirmation Dialog */}
      <AlertDialog
        open={isBlockDialogOpen}
        onOpenChange={setIsBlockDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userToBlock && getStatusDialogTitle(userToBlock.status_id)}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground" asChild>
              <div>
                {getStatusDialogDescription(userToBlock, userToBlock?.status_id || 1)}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockConfirm}
              disabled={isBlocking}
              className={
                userToBlock?.status_id === 1
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-green-600 text-white hover:bg-green-700"
              }
            >
              {isBlocking 
                ? "Processing..." 
                : userToBlock?.status_id === 1 
                  ? "Block User" 
                  : "Unblock User"
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limited Access Dialog */}
      <Dialog open={isLimitedAccessOpen} onOpenChange={setIsLimitedAccessOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {userForAccess && <StudentAccessTree studentId={userForAccess.id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}