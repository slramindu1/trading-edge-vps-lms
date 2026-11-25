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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Calendar,
  Loader2,
  Pencil,
  Percent,
  Tag,
  Trash2,
} from "lucide-react";

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
  return d.toLocaleDateString("en-CA");
}

function getDiscountStatus(item: DiscountItem): {
  label: string;
  className: string;
} {
  if (!item.isActive) {
    return {
      label: "Disabled",
      className:
        "bg-zinc-500/15 text-zinc-400 border-zinc-500/25",
    };
  }
  const now = new Date();
  if (item.startsAt && now < new Date(item.startsAt)) {
    return {
      label: "Scheduled",
      className:
        "bg-amber-500/15 text-amber-400 border-amber-500/25",
    };
  }
  if (item.expiresAt && now > new Date(item.expiresAt)) {
    return {
      label: "Expired",
      className:
        "bg-rose-500/15 text-rose-400 border-rose-500/25",
    };
  }
  return {
    label: "Active",
    className:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  };
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
    if (
      !Number.isFinite(numericDiscount) ||
      numericDiscount <= 0 ||
      numericDiscount > 100
    ) {
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
      const res = await fetch(
        `/api/admin/discounts?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
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

  const pillInputWrapper =
    "relative flex items-center rounded-full border border-border/80 dark:border-white/10 bg-muted/40 dark:bg-white/[0.03] px-4 h-11 transition-all focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col overflow-hidden rounded-3xl border border-border/80 dark:border-white/10 bg-background dark:bg-[#111318] p-6 sm:p-7 shadow-2xl [&>button]:cursor-pointer [&>button]:top-6 [&>button]:right-6">
        {/* Top Icon + Title + Description (matching reference design) */}
        <DialogHeader className="text-left space-y-3">
          <div className="w-11 h-11 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            {editingId ? (
              <Pencil className="w-5 h-5" />
            ) : (
              <Tag className="w-5 h-5" />
            )}
          </div>
          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold tracking-tight">
              {editingId ? "Edit Discount" : "Add Discount"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Create promo discounts with a valid date range, or edit existing
              discounts from the summary below.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label
                htmlFor="discount-code"
                className="text-xs font-medium text-foreground/90 pl-1"
              >
                Discount Name
              </Label>
              <div className={pillInputWrapper}>
                <Tag className="w-4 h-4 text-muted-foreground shrink-0 mr-2.5" />
                <input
                  id="discount-code"
                  type="text"
                  placeholder="e.g. BLACKFRIDAY30"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="discount-percent"
                className="text-xs font-medium text-foreground/90 pl-1"
              >
                Discount (%)
              </Label>
              <div className={pillInputWrapper}>
                <Percent className="w-4 h-4 text-muted-foreground shrink-0 mr-2.5" />
                <input
                  id="discount-percent"
                  type="number"
                  min={1}
                  max={100}
                  step="0.01"
                  placeholder="e.g. 30"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <Label
                htmlFor="discount-from"
                className="text-xs font-medium text-foreground/90 pl-1"
              >
                Valid From
              </Label>
              <div className={pillInputWrapper}>
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mr-2.5" />
                <input
                  id="discount-from"
                  type="date"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none cursor-pointer dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="discount-to"
                className="text-xs font-medium text-foreground/90 pl-1"
              >
                Valid To
              </Label>
              <div className={pillInputWrapper}>
                <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mr-2.5" />
                <input
                  id="discount-to"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none cursor-pointer dark:[color-scheme:dark]"
                />
              </div>
            </div>
          </div>

          {/* Active Switch + Pill Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5 pl-1">
              <Switch
                id="discount-active"
                checked={isActive}
                onCheckedChange={setIsActive}
                className="cursor-pointer"
              />
              <Label
                htmlFor="discount-active"
                className="text-sm font-medium cursor-pointer"
              >
                Active
              </Label>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <Button
                type="button"
                variant="outline"
                onClick={() => (editingId ? resetForm() : onOpenChange(false))}
                className="rounded-full px-5 h-10 border-border/80 dark:border-white/15 bg-transparent hover:bg-muted/50 cursor-pointer"
              >
                {editingId ? "Cancel Edit" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-full px-6 h-10 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-500/20 cursor-pointer"
              >
                {submitting && (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                )}
                {editingId ? "Update" : "Save Discount"}
              </Button>
            </div>
          </div>
        </form>

        {/* Summary List */}
        <div className="mt-4 pt-4 border-t border-border/70 dark:border-white/10 flex flex-col min-h-0 flex-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Added Discounts Summary
            </span>
            <div className="flex items-center gap-1.5">
              <Badge
                variant="outline"
                className="rounded-full text-[11px] font-medium px-2.5 py-0.5 dark:border-white/15"
              >
                Total: {discounts.length}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full text-[11px] font-medium px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
              >
                Active: {activeCount}
              </Badge>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-[140px] max-h-[220px]">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading discounts...
              </div>
            ) : discounts.length === 0 ? (
              <div className="text-center py-7 text-sm text-muted-foreground border border-dashed border-border/70 dark:border-white/10 rounded-2xl">
                No discounts added yet.
              </div>
            ) : (
              discounts.map((item) => {
                const status = getDiscountStatus(item);
                const isBeingEdited = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-sm transition-all ${
                      isBeingEdited
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-border/70 dark:border-white/10 bg-muted/30 dark:bg-white/[0.02] hover:bg-muted/50 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold tracking-wide truncate">
                          {item.code}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                          {item.discount}% OFF
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground flex-wrap">
                        <span>
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
                        className="h-8 w-8 rounded-full hover:bg-indigo-500/15 hover:text-indigo-400 cursor-pointer"
                        title="Edit discount"
                        onClick={() => handleEditClick(item)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full text-rose-400 hover:bg-rose-500/15 hover:text-rose-400 cursor-pointer"
                        title="Delete discount"
                        onClick={() => handleDelete(item.id, item.code)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
