import { mockThreats } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Identified":
      return "bg-info/20 text-info border-info/30";
    case "Analyzing":
      return "bg-warning/20 text-warning border-warning/30";
    case "Mitigating":
      return "bg-primary/20 text-primary border-primary/30";
    case "Monitoring":
      return "bg-success/20 text-success border-success/30";
    case "Closed":
      return "bg-muted text-muted-foreground border-muted";
    default:
      return "bg-muted text-muted-foreground border-muted";
  }
};

const getRiskBadgeClass = (riskScore: number) => {
  if (riskScore >= 80) return "risk-critical";
  if (riskScore >= 60) return "risk-high";
  if (riskScore >= 40) return "risk-medium";
  return "risk-low";
};

export function RecentThreats() {
  const recentThreats = mockThreats.slice(0, 5);

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Recent Threats</h3>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/threats" className="text-primary hover:text-primary/80">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <div className="space-y-3">
        {recentThreats.map((threat) => (
          <div
            key={threat.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{threat.id}</span>
                <Badge variant="outline" className={cn("text-[10px]", getStatusColor(threat.status))}>
                  {threat.status}
                </Badge>
              </div>
              <p className="text-sm font-medium text-foreground truncate">{threat.title}</p>
              <p className="text-xs text-muted-foreground">{threat.assetName}</p>
            </div>
            <div className="flex items-center gap-3 ml-4">
              <div className={cn("px-2 py-1 rounded text-xs font-bold border", getRiskBadgeClass(threat.riskScore))}>
                {threat.riskScore}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
