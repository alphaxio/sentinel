import { mockComplianceFrameworks, complianceTrendData } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, XCircle, Download, ExternalLink } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Compliant":
      return <CheckCircle className="w-5 h-5 text-success" />;
    case "Partial":
      return <AlertCircle className="w-5 h-5 text-warning" />;
    case "Non-Compliant":
      return <XCircle className="w-5 h-5 text-destructive" />;
    default:
      return null;
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Compliant":
      return "bg-success/20 text-success border-success/30";
    case "Partial":
      return "bg-warning/20 text-warning border-warning/30";
    case "Non-Compliant":
      return "bg-destructive/20 text-destructive border-destructive/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getCoverageColor = (coverage: number) => {
  if (coverage >= 90) return "bg-success";
  if (coverage >= 70) return "bg-warning";
  return "bg-destructive";
};

export default function Compliance() {
  const overallCompliance = Math.round(
    mockComplianceFrameworks.reduce((acc, f) => acc + f.coverage, 0) / mockComplianceFrameworks.length
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance Dashboard</h1>
          <p className="text-muted-foreground">Framework coverage and control mapping</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overall Score */}
      <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Overall Compliance Score</p>
            <p className="text-5xl font-bold text-gradient">{overallCompliance}%</p>
            <p className="text-sm text-muted-foreground mt-2">
              Across {mockComplianceFrameworks.length} frameworks
            </p>
          </div>
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${(overallCompliance / 100) * 352} 352`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Trend */}
      <div className="p-6 rounded-xl bg-card border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Compliance Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={complianceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" />
              <XAxis
                dataKey="month"
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="hsl(215, 20%, 55%)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[60, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 8%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="nist"
                stroke="hsl(187, 85%, 53%)"
                strokeWidth={2}
                dot={false}
                name="NIST CSF"
              />
              <Line
                type="monotone"
                dataKey="iso"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={2}
                dot={false}
                name="ISO 27001"
              />
              <Line
                type="monotone"
                dataKey="pci"
                stroke="hsl(38, 92%, 50%)"
                strokeWidth={2}
                dot={false}
                name="PCI-DSS"
              />
              <Line
                type="monotone"
                dataKey="hipaa"
                stroke="hsl(262, 83%, 58%)"
                strokeWidth={2}
                dot={false}
                name="HIPAA"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Frameworks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockComplianceFrameworks.map((framework) => (
          <div
            key={framework.id}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(framework.status)}
                <div>
                  <h3 className="font-semibold text-foreground">{framework.shortName}</h3>
                  <p className="text-xs text-muted-foreground">{framework.name}</p>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Coverage Bar */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Coverage</span>
                <span className="font-bold text-foreground">{framework.coverage}%</span>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", getCoverageColor(framework.coverage))}
                  style={{ width: `${framework.coverage}%` }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm">
                <span className="font-medium text-foreground">{framework.mappedControls}</span>
                <span className="text-muted-foreground"> / {framework.totalControls} controls</span>
              </div>
              <Badge variant="outline" className={cn("text-xs border", getStatusBadgeClass(framework.status))}>
                {framework.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
