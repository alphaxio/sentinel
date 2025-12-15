import { mockComplianceFrameworks } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertCircle, XCircle } from "lucide-react";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Compliant":
      return <CheckCircle className="w-4 h-4 text-success" />;
    case "Partial":
      return <AlertCircle className="w-4 h-4 text-warning" />;
    case "Non-Compliant":
      return <XCircle className="w-4 h-4 text-destructive" />;
    default:
      return null;
  }
};

const getProgressColor = (coverage: number) => {
  if (coverage >= 90) return "bg-success";
  if (coverage >= 70) return "bg-warning";
  return "bg-destructive";
};

export function ComplianceOverview() {
  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Coverage</h3>
      
      <div className="space-y-4">
        {mockComplianceFrameworks.map((framework) => (
          <div key={framework.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(framework.status)}
                <span className="text-sm font-medium text-foreground">
                  {framework.shortName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {framework.mappedControls}/{framework.totalControls} controls
                </span>
                <span className="text-sm font-bold text-foreground">
                  {framework.coverage}%
                </span>
              </div>
            </div>
            <div className="relative h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
                  getProgressColor(framework.coverage)
                )}
                style={{ width: `${framework.coverage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
