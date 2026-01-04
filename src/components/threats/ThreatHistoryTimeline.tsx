import { useEffect, useState } from "react";
import { threatsService, type ThreatHistoryItem } from "@/services/threats.service";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Clock, User } from "lucide-react";

interface ThreatHistoryTimelineProps {
  threatId: string;
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    Identified: "bg-blue-500",
    Assessed: "bg-yellow-500",
    Verified: "bg-orange-500",
    Evaluated: "bg-purple-500",
    Planning: "bg-indigo-500",
    Mitigated: "bg-green-500",
    Accepted: "bg-gray-500",
    Monitoring: "bg-teal-500",
  };
  return colors[status] || "bg-muted";
};

export function ThreatHistoryTimeline({ threatId }: ThreatHistoryTimelineProps) {
  const [history, setHistory] = useState<ThreatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await threatsService.getHistory(threatId);
        setHistory(data);
      } catch (err: any) {
        setError(err.message || "Failed to load threat history");
      } finally {
        setLoading(false);
      }
    };

    if (threatId) {
      fetchHistory();
    }
  }, [threatId]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No history available for this threat</p>
        <p className="text-sm mt-2">State changes will appear here</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

      <div className="space-y-6">
        {history.map((item, index) => (
          <div key={item.history_id} className="relative flex gap-4">
            {/* Timeline dot */}
            <div className="relative z-10 flex-shrink-0">
              <div
                className={cn(
                  "w-12 h-12 rounded-full border-4 border-background flex items-center justify-center",
                  getStatusColor(item.to_state)
                )}
              >
                <div className="w-3 h-3 rounded-full bg-background" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="p-4 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={item.from_state} variant="threat" className="text-xs" />
                    <span className="text-muted-foreground">→</span>
                    <StatusBadge status={item.to_state} variant="threat" className="text-xs" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(item.changed_at).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  <span>Changed by {item.changed_by_name}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

