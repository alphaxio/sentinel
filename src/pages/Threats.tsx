import { useState } from "react";
import { mockThreats } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Plus, Filter, AlertTriangle, ArrowUpDown } from "lucide-react";

const getRiskBadgeClass = (riskScore: number) => {
  if (riskScore >= 80) return "risk-critical";
  if (riskScore >= 60) return "risk-high";
  if (riskScore >= 40) return "risk-medium";
  return "risk-low";
};

const getRiskLabel = (riskScore: number) => {
  if (riskScore >= 80) return "Critical";
  if (riskScore >= 60) return "High";
  if (riskScore >= 40) return "Medium";
  return "Low";
};

export default function Threats() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"risk" | "date">("risk");

  const filteredThreats = mockThreats
    .filter((threat) => {
      const matchesSearch = threat.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || threat.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "risk") return b.riskScore - a.riskScore;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Threat Register</h1>
          <p className="text-muted-foreground">Track and manage identified threats</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Threat
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Identified", count: 8, color: "text-info" },
          { label: "Analyzing", count: 5, color: "text-warning" },
          { label: "Mitigating", count: 7, color: "text-primary" },
          { label: "Monitoring", count: 3, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="p-4 rounded-xl bg-card border border-border">
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className={cn("text-2xl font-bold", stat.color)}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search threats..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Identified">Identified</SelectItem>
            <SelectItem value="Analyzing">Analyzing</SelectItem>
            <SelectItem value="Mitigating">Mitigating</SelectItem>
            <SelectItem value="Monitoring">Monitoring</SelectItem>
            <SelectItem value="Closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as "risk" | "date")}>
          <SelectTrigger className="w-40">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="risk">Risk Score</SelectItem>
            <SelectItem value="date">Last Updated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Threats Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Threat</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Likelihood</TableHead>
              <TableHead>Impact</TableHead>
              <TableHead>Risk Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredThreats.map((threat) => (
              <TableRow key={threat.id} className="cursor-pointer hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{threat.title}</p>
                      <p className="text-xs text-muted-foreground">{threat.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{threat.assetName}</span>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {threat.category}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "w-2 h-4 rounded-sm",
                          level <= threat.likelihood ? "bg-warning" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "w-2 h-4 rounded-sm",
                          level <= threat.impact ? "bg-destructive" : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className={cn("px-2 py-1 rounded text-xs font-bold border", getRiskBadgeClass(threat.riskScore))}>
                      {threat.riskScore}
                    </div>
                    <span className="text-xs text-muted-foreground">{getRiskLabel(threat.riskScore)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={threat.status} variant="threat" />
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{threat.owner}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
