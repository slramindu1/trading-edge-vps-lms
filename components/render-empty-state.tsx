"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { Upload, FileIcon, AlertCircle, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRef } from "react"

interface RenderEmptyStateProps {
  isDragActive: boolean
  onFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void
  isUploading?: boolean
  hasFile?: boolean
  onRemoveFile?: () => void
}

export function RenderEmptyState({
  isDragActive,
  onFileSelect,
  isUploading,
  hasFile,
  onRemoveFile,
}: RenderEmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChooseFiles = () => {
    if (hasFile && onRemoveFile) {
      onRemoveFile()
      return
    }
    fileInputRef.current?.click()
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        onChange={onFileSelect}
        className="hidden"
        accept="image/jpeg,image/png,image/jpg,image/webp,image/svg+xml"
      />

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out",
          "bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02] shadow-lg"
            : "border-border hover:border-primary/50 hover:bg-muted/20",
        )}
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,theme(colors.primary)_1px,transparent_1px)] bg-[length:24px_24px]" />
        </div>

        <div className="relative p-12 text-center">
          <div
            className={cn(
              "mx-auto mb-6 flex size-20 items-center justify-center rounded-full transition-all duration-300",
              "bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/20",
              isDragActive && "scale-110 bg-gradient-to-br from-primary/20 to-primary/10 ring-primary/40",
            )}
          >
            {isUploading ? (
              <Loader2 className="size-8 text-primary animate-spin" />
            ) : hasFile ? (
              <X className="size-8 text-destructive" />
            ) : (
              <Upload
                className={cn(
                  "size-8 transition-all duration-300",
                  isDragActive ? "text-primary animate-bounce" : "text-primary/70 group-hover:text-primary",
                )}
              />
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">
              {isUploading
                ? "Uploading file..."
                : hasFile
                  ? "A file is uploaded"
                  : isDragActive
                    ? "Drop your file here"
                    : "Upload your file"}
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {isUploading
                ? "Please wait while we process your file"
                : hasFile
                  ? "You can remove it before uploading another"
                  : isDragActive
                    ? "Release to upload your file"
                    : "Drag and drop your file here, or click to browse"}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleChooseFiles}
            disabled={isUploading}
            className={cn(
              "mt-8 px-8 py-3 font-medium transition-all duration-200",
              hasFile
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground",
              "shadow-lg hover:shadow-xl hover:scale-105",
              "focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
            )}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Uploading...
              </>
            ) : hasFile ? (
              <>
                <X className="mr-2 size-4" />
                Remove File
              </>
            ) : (
              <>
                <FileIcon className="mr-2 size-4" />
                Choose File
              </>
            )}
          </Button>

          <p className="mt-4 text-xs text-muted-foreground">Supports: JPG, PNG, JPEG, WEBP, SVG</p>
        </div>
      </div>
    </div>
  )
}

export function RenderErrorState() {
  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-destructive/30 bg-gradient-to-br from-destructive/5 to-destructive/10">
        <div className="p-12 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 ring-1 ring-destructive/20">
            <AlertCircle className="size-8 text-destructive animate-pulse" />
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-foreground">Upload Failed</h3>
            <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Something went wrong while uploading your file. Please try again.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
