"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, AlertCircle, ServerCrash, WifiOff, RefreshCcw } from "lucide-react";
import { ErrorDetailsModal } from "./_components/ErrorDetailsModal";

export default function AdminErrorLogPage() {
  const [errors, setErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedError, setSelectedError] = useState<any | null>(null);

  const fetchErrors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/errors");
      const data = await res.json();
      if (data.errors) {
        setErrors(data.errors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErrors();
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "SYSTEM":
        return <ServerCrash className="w-4 h-4 text-rose-500" />;
      case "NETWORK":
        return <WifiOff className="w-4 h-4 text-orange-500" />;
      case "USER":
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "SYSTEM":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "NETWORK":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "USER":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Error Log</h1>
          <p className="text-muted-foreground mt-2">
            Monitor and debug client, server, and network issues in real-time.
          </p>
        </div>
        <Button onClick={fetchErrors} variant="outline" className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
          Refresh Logs
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
          <CardDescription>Click on any error to view full technical details.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No errors recorded</h3>
              <p className="text-sm text-muted-foreground">The system is running smoothly.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error) => (
                    <TableRow key={error.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedError(error)}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {new Date(error.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1.5 px-2 py-0.5 ${getCategoryColor(error.category)}`}>
                          {getCategoryIcon(error.category)}
                          {error.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate font-medium">
                        {error.message}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {error.url || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ErrorDetailsModal 
        error={selectedError} 
        isOpen={!!selectedError} 
        onClose={() => setSelectedError(null)} 
      />
    </div>
  );
}
