import { mockPolicies } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FileCode, CheckCircle, AlertTriangle, XCircle, Play } from "lucide-react";
import { format } from "date-fns";

const getPassRateColor = (rate: number) => {
  if (rate >= 90) return "text-success";
  if (rate >= 70) return "text-warning";
  return "text-destructive";
};

const getPassRateProgressColor = (rate: number) => {
  if (rate >= 90) return "bg-success";
  if (rate >= 70) return "bg-warning";
  return "bg-destructive";
};

export default function Policies() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Policy Engine</h1>
          <p className="text-muted-foreground">Define and enforce security policies with OPA</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Create Policy
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <FileCode className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">Total Policies</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{mockPolicies.length}</p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Passing</span>
          </div>
          <p className="text-2xl font-bold text-success">
            {mockPolicies.filter((p) => p.passRate === 100).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <span className="text-sm text-muted-foreground">With Violations</span>
          </div>
          <p className="text-2xl font-bold text-warning">
            {mockPolicies.filter((p) => p.violations > 0).length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Total Violations</span>
          </div>
          <p className="text-2xl font-bold text-destructive">
            {mockPolicies.reduce((acc, p) => acc + p.violations, 0)}
          </p>
        </div>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockPolicies.map((policy) => (
          <div
            key={policy.id}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCode className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{policy.name}</h3>
                  <p className="text-xs text-muted-foreground">{policy.id}</p>
                </div>
              </div>
              <StatusBadge status={policy.status} variant="policy" />
            </div>

            <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>

            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline" className="text-xs">
                {policy.framework}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {policy.controlsMapped} controls mapped
              </Badge>
            </div>

            {/* Pass Rate */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pass Rate</span>
                <span className={cn("font-bold", getPassRateColor(policy.passRate))}>
                  {policy.passRate}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getPassRateProgressColor(policy.passRate))}
                  style={{ width: `${policy.passRate}%` }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Last evaluated: {format(new Date(policy.lastEvaluated), "MMM d, HH:mm")}
                </span>
                {policy.violations > 0 && (
                  <span className="text-destructive font-medium">
                    {policy.violations} violation{policy.violations > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Play className="w-3 h-3 mr-1" />
                Test
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
