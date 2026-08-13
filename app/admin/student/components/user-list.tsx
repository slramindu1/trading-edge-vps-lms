import { useCallback, useEffect, useRef, useState } from "react";
import {
  MoreVertical, Trash2, Lock, Unlock, UserCheck, UserX,
  CalendarClock, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
  student_type: string;
  is_paid: boolean;
  joined_date: string;
  lastLogin: string | null;
  expiry_disabled: boolean;
  expiry_date: string | null;
  payment_date: string | null;
  avatar?: string;
}

interface UserListProps {
  searchQuery: string;
  statusFilter: string;
  studentTypeFilter?: string;
}

const MONTHS_OPTIONS = [1, 3, 6, 12];

export default function UserList({ searchQuery, statusFilter, studentTypeFilter = "all" }: UserListProps) {
  const [users, setUsers]                     = useState<User[]>([]);
  const [total, setTotal]                     = useState(0);
  const [page, setPage]                       = useState(1);
  const [totalPages, setTotalPages]           = useState(1);
  const [userToDelete, setUserToDelete]       = useState<User | null>(null);
  const [userToBlock, setUserToBlock]         = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBlockDialogOpen, setIsBlockDialogOpen]   = useState(false);
  const [isLimitedAccessOpen, setIsLimitedAccessOpen] = useState(false);
  const [userForAccess, setUserForAccess]     = useState<User | null>(null);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [isBlocking, setIsBlocking]           = useState(false);
  const [isChapterLockingEnabled, setIsChapterLockingEnabled] = useState(false);

  // Extend subscription dialog
  const [extendUser, setExtendUser]           = useState<User | null>(null);
  const [extendMonths, setExtendMonths]       = useState(3);
  const [isExtending, setIsExtending]         = useState(false);

  // Debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    checkChapterLockingFeature().then(setIsChapterLockingEnabled);
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery, statusFilter, studentTypeFilter]);

  const fetchUsers = useCallback(async () => {
    const params = new URLSearchParams();
    if (searchQuery)        params.append("searchQuery",  searchQuery);
    if (statusFilter)       params.append("statusFilter", statusFilter);
    if (studentTypeFilter && studentTypeFilter !== "all")
                            params.append("studentType",  studentTypeFilter);
    params.append("page",   String(page));
    params.append("limit",  "20");

    const res  = await fetch(`/api/users?${params.toString()}`);
    const data = await res.json();
    setUsers(data.users ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  }, [searchQuery, statusFilter, studentTypeFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Handlers ─────────────────────────────────────────────────────────── */

  const handleDeleteClick  = (user: User) => { setUserToDelete(user);  setIsDeleteDialogOpen(true); };
  const handleBlockClick   = (user: User) => { setUserToBlock(user);   setIsBlockDialogOpen(true); };
  const handleAccessClick  = (user: User) => { setUserForAccess(user); setIsLimitedAccessOpen(true); };
  const handleExtendClick  = (user: User) => { setExtendUser(user);    setExtendMonths(3); };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Student deleted successfully");
        setUsers(users.filter((u) => u.id !== userToDelete.id));
      } else {
        toast.error(data.error || "Failed to delete student");
      }
    } catch {
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
    const newStatusId = userToBlock.status_id === 1 ? 2 : 1;
    try {
      const res = await fetch(`/api/users/${userToBlock.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_id: newStatusId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(newStatusId === 2 ? "User blocked" : "User unblocked");
        setUsers(users.map((u) => u.id === userToBlock.id ? { ...u, status_id: newStatusId } : u));
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsBlocking(false);
      setIsBlockDialogOpen(false);
      setUserToBlock(null);
    }
  };

  const handleExtendConfirm = async () => {
    if (!extendUser) return;
    setIsExtending(true);
    try {
      const res = await fetch(`/api/users/${extendUser.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ months: extendMonths }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Subscription extended by ${extendMonths} month(s)`);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to extend subscription");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setIsExtending(false);
      setExtendUser(null);
    }
  };

  const handleToggleExpiry = async (user: User) => {
    const newDisabled = !user.expiry_disabled;
    try {
      const res = await fetch(`/api/users/${user.id}/expiry`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled: newDisabled }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(newDisabled ? "Expiry disabled" : "Expiry re-enabled");
        setUsers(users.map((u) => u.id === user.id ? { ...u, expiry_disabled: newDisabled } : u));
      } else {
        toast.error(data.error || "Failed to update expiry setting");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  /* ── Helpers ───────────────────────────────────────────────────────────── */

  const formatLastLogin = (lastLogin: string | null): string => {
    if (!lastLogin) return "Never";
    const d = new Date(lastLogin);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)    return "Just now";
    if (diffMin < 60)   return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)    return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30)   return `${diffDay}d ago`;
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  const statusIdToString = (id: number) =>
    id === 1 ? "active" : id === 2 ? "inactive" : id === 3 ? "pending" : "unknown";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":   return "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200";
      case "inactive": return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
      case "pending":  return "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200";
      default:         return "bg-gray-100 text-gray-800";
    }
  };

  const getPlanColor = (type: string) =>
    type === "PAID"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200"
      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";

  /* ── Render ────────────────────────────────────────────────────────────── */

  const students = users.filter((u) => u.user_type_id !== 1);

  return (
    <>
      <Card className="overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Student</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Plan</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Last Login</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((user) => {
                const status  = statusIdToString(user.status_id);
                const name    = `${user.fname || ""} ${user.lname || ""}`.trim() || "—";
                const isBlocked = user.status_id === 2;

                return (
                  <tr key={user.id} className={`hover:bg-muted/50 transition-colors ${isBlocked ? "opacity-70" : ""}`}>
                    {/* Student */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={name} />
                          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground text-sm">
                            {name}
                            {isBlocked && <span className="ml-2 text-xs text-red-500">(Blocked)</span>}
                            {user.expiry_disabled && (
                              <span className="ml-1 text-xs text-blue-500">∞</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-5 py-4">
                      <Badge className={getPlanColor(user.student_type)}>
                        {user.student_type}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <Badge className={getStatusColor(status)}>
                        {status}{isBlocked && " 🔒"}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {new Date(user.joined_date).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </td>

                    {/* Last Login */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{formatLastLogin(user.lastLogin)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={isBlocked ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleBlockClick(user)}
                          className={isBlocked
                            ? "bg-green-600 hover:bg-green-700 h-8"
                            : "bg-red-600 hover:bg-red-700 text-white h-8"
                          }
                        >
                          {isBlocked
                            ? <><UserCheck className="mr-1 h-3 w-3" />Unblock</>
                            : <><UserX className="mr-1 h-3 w-3" />Block</>
                          }
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {/* Block/Unblock */}
                            <DropdownMenuItem
                              onClick={() => handleBlockClick(user)}
                              className={isBlocked
                                ? "text-green-600 focus:text-green-600"
                                : "text-red-600 focus:text-red-600"
                              }
                            >
                              {isBlocked
                                ? <><Unlock className="mr-2 h-4 w-4" />Unblock User</>
                                : <><Lock className="mr-2 h-4 w-4" />Block User</>
                              }
                            </DropdownMenuItem>

                            {/* Limited Access */}
                            {isChapterLockingEnabled && (
                              <DropdownMenuItem onClick={() => handleAccessClick(user)}>
                                <Lock className="mr-2 h-4 w-4" />
                                Limited Access
                              </DropdownMenuItem>
                            )}

                            {/* Extend Subscription */}
                            <DropdownMenuItem onClick={() => handleExtendClick(user)}>
                              <CalendarClock className="mr-2 h-4 w-4" />
                              Extend Subscription
                            </DropdownMenuItem>

                            {/* Disable / Enable Expiring */}
                            <DropdownMenuItem onClick={() => handleToggleExpiry(user)}>
                              {user.expiry_disabled ? (
                                <><Clock className="mr-2 h-4 w-4 text-amber-500" />Enable Expiring</>
                              ) : (
                                <><Clock className="mr-2 h-4 w-4 text-blue-500" />Disable Expiring</>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Delete */}
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Student
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

        {/* Empty state */}
        {students.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-muted-foreground">No students found matching your criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {total > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, total)} of <strong>{total}</strong> students
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium px-2">{page} / {totalPages}</span>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ── Delete Dialog ───────────────────────────────────────────────────── */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                This will permanently delete <strong>{userToDelete?.fname} {userToDelete?.lname}</strong> ({userToDelete?.email}) and all associated data.
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
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? "Deleting..." : "Delete Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Block/Unblock Dialog ────────────────────────────────────────────── */}
      <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{userToBlock?.status_id === 1 ? "Block User" : "Unblock User"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Are you sure you want to {userToBlock?.status_id === 1 ? "block" : "unblock"} <strong>{userToBlock?.fname} {userToBlock?.lname}</strong> ({userToBlock?.email})?</p>
                <p>{userToBlock?.status_id === 1 ? "They will not be able to access their account." : "They will regain access to their account."}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBlockConfirm}
              disabled={isBlocking}
              className={userToBlock?.status_id === 1 ? "bg-red-600 text-white hover:bg-red-700" : "bg-green-600 text-white hover:bg-green-700"}
            >
              {isBlocking ? "Processing..." : userToBlock?.status_id === 1 ? "Block User" : "Unblock User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Extend Subscription Dialog ─────────────────────────────────────── */}
      <Dialog open={!!extendUser} onOpenChange={(open) => { if (!open) setExtendUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Subscription</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Extend subscription for <strong>{extendUser?.fname} {extendUser?.lname}</strong>.
              {extendUser?.expiry_date
                ? ` Current expiry: ${new Date(extendUser.expiry_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                : " No custom expiry date set."}
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Extend by:</p>
              <div className="grid grid-cols-4 gap-2">
                {MONTHS_OPTIONS.map((m) => (
                  <Button
                    key={m}
                    variant={extendMonths === m ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExtendMonths(m)}
                    className="text-xs"
                  >
                    {m === 1 ? "1 Month" : m === 12 ? "1 Year" : `${m} Months`}
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExtendUser(null)}>Cancel</Button>
            <Button onClick={handleExtendConfirm} disabled={isExtending}>
              {isExtending ? "Extending..." : `Extend ${extendMonths === 12 ? "1 Year" : `${extendMonths} Month(s)`}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Limited Access Dialog ───────────────────────────────────────────── */}
      <Dialog open={isLimitedAccessOpen} onOpenChange={setIsLimitedAccessOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {userForAccess && <StudentAccessTree studentId={userForAccess.id} />}
        </DialogContent>
      </Dialog>
    </>
  );
}