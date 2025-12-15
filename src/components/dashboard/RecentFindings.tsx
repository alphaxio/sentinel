import { mockFindings } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const getSeverityClass = (severity: string) => {
  switch (severity) {
    case "Critical":
      return "risk-critical";
    case "High":
      return "risk-high";
    case "Medium":
      return "risk-medium";
    case "Low":
      return "risk-low";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const getSourceIcon = (source: string) => {
  const icons: Record<string, string> = {
    SonarQube: "SQ",
    "OWASP ZAP": "ZP",
    Snyk: "SK",
    Terraform: "TF",
    Manual: "MN",
  };
  return icons[source] || "??";
};

export function RecentFindings() {
  const recentFindings = mockFindings.slice(0, 5);

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Findings</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/findings" className="text-primary hover:text-primary/80">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <div className="space-y-3">
        {recentFindings.map((finding) => (
          <div
            key={finding.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-mono font-bold text-muted-foreground">
                {getSourceIcon(finding.source)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{finding.title}</p>
                <p className="text-xs text-muted-foreground">{finding.assetName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant="outline" className={cn("text-[10px] border", getSeverityClass(finding.severity))}>
                {finding.severity}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
