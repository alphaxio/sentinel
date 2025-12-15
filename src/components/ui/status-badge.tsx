import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "threat" | "finding" | "asset" | "policy";
  className?: string;
}

const threatStatusColors: Record<string, string> = {
  Identified: "bg-info/20 text-info border-info/30",
  Analyzing: "bg-warning/20 text-warning border-warning/30",
  Mitigating: "bg-primary/20 text-primary border-primary/30",
  Monitoring: "bg-success/20 text-success border-success/30",
  Closed: "bg-muted/50 text-muted-foreground border-muted",
};

const findingStatusColors: Record<string, string> = {
  Open: "bg-destructive/20 text-destructive border-destructive/30",
  "In Progress": "bg-warning/20 text-warning border-warning/30",
  Resolved: "bg-success/20 text-success border-success/30",
  "False Positive": "bg-muted/50 text-muted-foreground border-muted",
  Accepted: "bg-info/20 text-info border-info/30",
};

const assetStatusColors: Record<string, string> = {
  Active: "bg-success/20 text-success border-success/30",
  Inactive: "bg-muted/50 text-muted-foreground border-muted",
  Deprecated: "bg-destructive/20 text-destructive border-destructive/30",
};

const policyStatusColors: Record<string, string> = {
  Active: "bg-success/20 text-success border-success/30",
  Draft: "bg-warning/20 text-warning border-warning/30",
  Archived: "bg-muted/50 text-muted-foreground border-muted",
};

export function StatusBadge({ status, variant = "threat", className }: StatusBadgeProps) {
  const getStatusClass = () => {
    switch (variant) {
      case "threat":
        return threatStatusColors[status] || "bg-muted text-muted-foreground";
      case "finding":
        return findingStatusColors[status] || "bg-muted text-muted-foreground";
      case "asset":
        return assetStatusColors[status] || "bg-muted text-muted-foreground";
      case "policy":
        return policyStatusColors[status] || "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge variant="outline" className={cn("font-medium border", getStatusClass(), className)}>
      {status}
    </Badge>
  );
}
