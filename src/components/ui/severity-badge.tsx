import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SeverityBadgeProps {
  severity: "Critical" | "High" | "Medium" | "Low" | "Info";
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const getSeverityClass = () => {
    switch (severity) {
      case "Critical":
        return "bg-critical/20 text-critical border-critical/30 hover:bg-critical/30";
      case "High":
        return "bg-high/20 text-high border-high/30 hover:bg-high/30";
      case "Medium":
        return "bg-medium/20 text-medium border-medium/30 hover:bg-medium/30";
      case "Low":
        return "bg-low/20 text-low border-low/30 hover:bg-low/30";
      case "Info":
        return "bg-info/20 text-info border-info/30 hover:bg-info/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Badge variant="outline" className={cn("font-medium border", getSeverityClass(), className)}>
      {severity}
    </Badge>
  );
}
