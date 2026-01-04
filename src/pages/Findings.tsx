import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFindings } from "@/store/slices/findingsSlice";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, AlertCircle, ExternalLink, Calendar, Loader2, Plus } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FindingForm } from "@/components/findings/FindingForm";

const getSourceBadge = (source: string) => {
  const colors: Record<string, string> = {
    SonarQube: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "OWASP ZAP": "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Snyk: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    Terraform: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    Manual: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };
  return colors[source] || "bg-muted text-muted-foreground";
};

export default function Findings() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items: findings, loading, error } = useAppSelector((state) => state.findings);
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    dispatch(
      fetchFindings({
        search: debouncedSearch || undefined,
        severity: severityFilter !== "all" ? severityFilter : undefined,
        page: 1,
        pageSize: 50,
      })
    );
  }, [dispatch, debouncedSearch, severityFilter]);

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      const matchesSource = sourceFilter === "all" || finding.source === sourceFilter;
      return matchesSource;
    });
  }, [findings, sourceFilter]);

  const severityCounts = useMemo(() => {
    return {
      Critical: findings.filter((f) => f.severity === "Critical").length,
      High: findings.filter((f) => f.severity === "High").length,
      Medium: findings.filter((f) => f.severity === "Medium").length,
      Low: findings.filter((f) => f.severity === "Low").length,
    };
  }, [findings]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Security Findings</h1>
          <p className="text-muted-foreground">Vulnerabilities and issues from security scans</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Finding
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(severityCounts).map(([severity, count]) => (
          <div
            key={severity}
            className={cn(
              "p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
              severity === "Critical" && "bg-critical/10 border-critical/30",
              severity === "High" && "bg-high/10 border-high/30",
              severity === "Medium" && "bg-medium/10 border-medium/30",
              severity === "Low" && "bg-low/10 border-low/30"
            )}
            onClick={() => setSeverityFilter(severity)}
          >
            <p className="text-sm text-muted-foreground mb-1">{severity}</p>
            <p
              className={cn(
                "text-2xl font-bold",
                severity === "Critical" && "text-critical",
                severity === "High" && "text-high",
                severity === "Medium" && "text-medium",
                severity === "Low" && "text-low"
              )}
            >
              {count}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search findings..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Info">Info</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="SonarQube">SonarQube</SelectItem>
            <SelectItem value="OWASP ZAP">OWASP ZAP</SelectItem>
            <SelectItem value="Snyk">Snyk</SelectItem>
            <SelectItem value="Terraform">Terraform</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredFindings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No findings found</p>
        </div>
      )}

      {/* Findings Table */}
      {!loading && !error && filteredFindings.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Finding</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>CVE</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFindings.map((finding) => (
              <TableRow
                key={finding.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => navigate(`/findings/${finding.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    </div>
                    <div className="max-w-md">
                      <p className="font-medium text-foreground">{finding.title}</p>
                      <p className="text-xs text-muted-foreground">{finding.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <SeverityBadge severity={finding.severity} />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{finding.assetName}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("text-xs border", getSourceBadge(finding.source))}>
                    {finding.source}
                  </Badge>
                </TableCell>
                <TableCell>
                  {finding.cveId ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-mono text-primary">{finding.cveId}</span>
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={finding.status} variant="finding" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(finding.dueDate), "MMM d, yyyy")}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Add Finding Dialog */}
      <FindingForm
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          setIsAddDialogOpen(false);
          dispatch(fetchFindings({ page: 1, pageSize: 50 }));
        }}
      />
    </div>
  );
}
