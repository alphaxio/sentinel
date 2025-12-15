import { Server, Shield, AlertTriangle, CheckCircle, TrendingDown, Clock } from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap";
import { RiskTrendChart } from "@/components/dashboard/RiskTrendChart";
import { ComplianceOverview } from "@/components/dashboard/ComplianceOverview";
import { RecentThreats } from "@/components/dashboard/RecentThreats";
import { RecentFindings } from "@/components/dashboard/RecentFindings";

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Dashboard</h1>
          <p className="text-muted-foreground">Real-time overview of your security posture</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Assets"
          value={142}
          change="+8 this month"
          changeType="neutral"
          icon={Server}
          iconColor="text-primary"
          iconBgColor="bg-primary/10"
        />
        <MetricCard
          title="Active Threats"
          value={23}
          change="-5 from last week"
          changeType="positive"
          icon={Shield}
          iconColor="text-warning"
          iconBgColor="bg-warning/10"
        />
        <MetricCard
          title="Open Findings"
          value={56}
          change="12 critical"
          changeType="negative"
          icon={AlertTriangle}
          iconColor="text-destructive"
          iconBgColor="bg-destructive/10"
        />
        <MetricCard
          title="Compliance Score"
          value="87%"
          change="+3% improvement"
          changeType="positive"
          icon={CheckCircle}
          iconColor="text-success"
          iconBgColor="bg-success/10"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskHeatmap />
        <RiskTrendChart />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RecentThreats />
        <RecentFindings />
        <ComplianceOverview />
      </div>
    </div>
  );
}
