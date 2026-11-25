"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Calendar, Loader2, Pencil, Percent, Plus, Tag, Trash2, X } from "lucide-react";

interface DiscountItem {
  id: string;
  code: string;
  discount: number;
  usedCount: number;
  isActive: boolean;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface DiscountManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function getDiscountStatus(item: DiscountItem): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (!item.isActive) {
    return { label: "Disabled", variant: "secondary" };
  }
  const now = new Date();
  if (item.startsAt && now < new Date(item.startsAt)) {
    return { label: "Scheduled", variant: "outline" };
  }
  if (item.expiresAt && now > new Date(item.expiresAt)) {
    return { label: "Expired", variant: "destructive" };
  }
  return { label: "Active", variant: "default" };
}

export function DiscountManagerModal({
  open,
  onOpenChange,
}: DiscountManagerModalProps) {
  const [discounts, setDiscounts] = React.useState<DiscountItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // Form state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState("");
  const [startsAt, setStartsAt] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);

  const resetForm = React.useCallback(() => {
    setEditingId(null);
    setCode("");
    setDiscountPercent("");
    setStartsAt("");
    setExpiresAt("");
    setIsActive(true);
  }, []);

  const fetchDiscounts = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/discounts", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to load discounts");
        return;
      }
      setDiscounts(data.discounts || []);
    } catch {
      toast.error("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      fetchDiscounts();
    } else {
      resetForm();
    }
  }, [open, fetchDiscounts, resetForm]);

  const handleEditClick = (item: DiscountItem) => {
    setEditingId(item.id);
    setCode(item.code);
    setDiscountPercent(String(item.discount));
    setStartsAt(toDateInputValue(item.startsAt));
    setExpiresAt(toDateInputValue(item.expiresAt));
    setIsActive(item.isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const trimmedCode = code.trim();
    const numericDiscount = Number(discountPercent);

    if (!trimmedCode) {
      toast.error("Please enter a discount name / code");
      return;
    }
    if (!Number.isFinite(numericDiscount) || numericDiscount <= 0 || numericDiscount > 100) {
      toast.error("Discount percentage must be between 1 and 100");
      return;
    }
    if (startsAt && expiresAt && startsAt > expiresAt) {
      toast.error("From date cannot be after To date");
      return;
    }

    setSubmitting(true);
    try {
      const isEditing = Boolean(editingId);
      const res = await fetch("/api/admin/discounts", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isEditing ? { id: editingId } : {}),
          code: trimmedCode,
          discount: numericDiscount,
          startsAt: startsAt || null,
          expiresAt: expiresAt || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to save discount");
        return;
      }

      toast.success(isEditing ? "Discount updated!" : "Discount added!");
      resetForm();
      await fetchDiscounts();
    } catch {
      toast.error("Failed to save discount");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/discounts?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to delete discount");
        return;
      }
      toast.success(`Deleted "${name}"`);
      if (editingId === id) resetForm();
      await fetchDiscounts();
    } catch {
      toast.error("Failed to delete discount");
    }
  };

  const activeCount = discounts.filter(
    (d) => getDiscountStatus(d).label === "Active"
  ).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Tag className="w-5 h-5 text-primary" />
            {editingId ? "Edit Discount" : "Add Discount"}
          </DialogTitle>
          <DialogDescription>
            Create or manage discount codes and their valid date periods.
          </DialogDescription>
        </DialogHeader>

        {/* Add / Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discount-code">Discount Name / Code</Label>
              <Input
                id="discount-code"
                placeholder="e.g. BLACKFRIDAY30"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount-percent">Discount (%)</Label>
              <div className="relative">
                <Input
                  id="discount-percent"
                  type="number"
                  min={1}
                  max={100}
                  step="0.01"
                  placeholder="e.g. 30"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="pr-8"
                  required
                />
                <Percent className="w-4 h-4 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="discount-from" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Valid From
              </Label>
              <Input
                id="discount-from"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="discount-to" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                Valid To
              </Label>
              <Input
                id="discount-to"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id="discount-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="discount-active" className="cursor-pointer">
                Active
              </Label>
            </div>

            <div className="flex items-center gap-2">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel Edit
                </Button>
              )}
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : editingId ? (
                  <Pencil className="w-4 h-4 mr-1.5" />
                ) : (
                  <Plus className="w-4 h-4 mr-1.5" />
                )}
                {editingId ? "Update Discount" : "Add Discount"}
              </Button>
            </div>
          </div>
        </form>

        <Separator className="my-2" />

        {/* Summary Section */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Discount Summary</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">Total: {discounts.length}</Badge>
            <Badge variant="default">Active: {activeCount}</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[160px] max-h-[260px]">
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Loading discounts...
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-md">
              No discounts added yet.
            </div>
          ) : (
            discounts.map((item) => {
              const status = getDiscountStatus(item);
              const isBeingEdited = editingId === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-sm transition-colors ${
                    isBeingEdited
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card/50"
                  }`}
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold tracking-wide truncate">
                        {item.code}
                      </span>
                      <Badge variant="secondary" className="font-semibold">
                        {item.discount}% OFF
                      </Badge>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>
                        Period:{" "}
                        {item.startsAt || item.expiresAt
                          ? `${formatDisplayDate(item.startsAt)} → ${formatDisplayDate(item.expiresAt)}`
                          : "Always valid"}
                      </span>
                      <span>•</span>
                      <span>Used: {item.usedCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title="Edit discount"
                      onClick={() => handleEditClick(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title="Delete discount"
                      onClick={() => handleDelete(item.id, item.code)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
