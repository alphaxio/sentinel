import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Eye, Plus, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";

const mockReports = [
  {
    id: "RPT-001",
    name: "Q4 2023 Compliance Report",
    type: "Compliance",
    framework: "NIST CSF",
    generatedAt: "2024-01-10T09:00:00Z",
    generatedBy: "Admin User",
    size: "2.4 MB",
    status: "Ready",
  },
  {
    id: "RPT-002",
    name: "January Risk Assessment",
    type: "Risk",
    framework: "ISO 27001",
    generatedAt: "2024-01-12T14:30:00Z",
    generatedBy: "Security Team",
    size: "1.8 MB",
    status: "Ready",
  },
  {
    id: "RPT-003",
    name: "PCI-DSS Quarterly Audit",
    type: "Audit",
    framework: "PCI-DSS",
    generatedAt: "2024-01-15T11:00:00Z",
    generatedBy: "Compliance Team",
    size: "3.2 MB",
    status: "Ready",
  },
  {
    id: "RPT-004",
    name: "Vulnerability Summary - Week 2",
    type: "Vulnerability",
    framework: "Internal",
    generatedAt: "2024-01-14T08:00:00Z",
    generatedBy: "System",
    size: "956 KB",
    status: "Ready",
  },
  {
    id: "RPT-005",
    name: "Executive Risk Dashboard",
    type: "Executive",
    framework: "All",
    generatedAt: "2024-01-15T16:00:00Z",
    generatedBy: "Admin User",
    size: "1.1 MB",
    status: "Generating",
  },
];

const getTypeBadgeClass = (type: string) => {
  const colors: Record<string, string> = {
    Compliance: "bg-primary/20 text-primary border-primary/30",
    Risk: "bg-warning/20 text-warning border-warning/30",
    Audit: "bg-info/20 text-info border-info/30",
    Vulnerability: "bg-destructive/20 text-destructive border-destructive/30",
    Executive: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };
  return colors[type] || "bg-muted text-muted-foreground";
};

export default function Reports() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Generate and download compliance reports</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: "Compliance Report",
            description: "Comprehensive compliance status across all frameworks",
            icon: FileText,
          },
          {
            title: "Risk Assessment",
            description: "Detailed risk analysis with recommendations",
            icon: FileText,
          },
          {
            title: "Executive Summary",
            description: "High-level overview for leadership",
            icon: FileText,
          },
        ].map((template) => (
          <div
            key={template.title}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <template.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{template.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
            <Button variant="outline" size="sm" className="w-full">
              Generate
            </Button>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="p-4 bg-muted/30 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Reports</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Report</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Framework</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockReports.map((report) => (
              <TableRow key={report.id} className="hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getTypeBadgeClass(report.type)}>
                    {report.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{report.framework}</span>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(report.generatedAt), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {format(new Date(report.generatedAt), "HH:mm")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{report.size}</span>
                </TableCell>
                <TableCell>
                  {report.status === "Ready" ? (
                    <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                      Ready
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
                      Generating...
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button variant="ghost" size="sm" disabled={report.status !== "Ready"}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" disabled={report.status !== "Ready"}>
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
