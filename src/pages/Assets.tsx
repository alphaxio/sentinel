import { useState } from "react";
import { mockAssets, Asset } from "@/data/mockData";
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
import {
  Search,
  Plus,
  Filter,
  Server,
  Database,
  Cloud,
  Box,
  Network,
  LayoutGrid,
  List,
} from "lucide-react";

const getTypeIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    Application: <Server className="w-4 h-4" />,
    Database: <Database className="w-4 h-4" />,
    Cloud: <Cloud className="w-4 h-4" />,
    Container: <Box className="w-4 h-4" />,
    Network: <Network className="w-4 h-4" />,
    Server: <Server className="w-4 h-4" />,
  };
  return icons[type] || <Server className="w-4 h-4" />;
};

const getClassificationColor = (classification: string) => {
  switch (classification) {
    case "Restricted":
      return "bg-critical/20 text-critical border-critical/30";
    case "Confidential":
      return "bg-high/20 text-high border-high/30";
    case "Internal":
      return "bg-medium/20 text-medium border-medium/30";
    case "Public":
      return "bg-low/20 text-low border-low/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getSensitivityColor = (score: number) => {
  if (score >= 4.5) return "text-critical";
  if (score >= 3.5) return "text-high";
  if (score >= 2.5) return "text-medium";
  return "text-low";
};

export default function Assets() {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Asset Inventory</h1>
          <p className="text-muted-foreground">Manage and monitor your organizational assets</p>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="Application">Application</SelectItem>
            <SelectItem value="Database">Database</SelectItem>
            <SelectItem value="Cloud">Cloud</SelectItem>
            <SelectItem value="Container">Container</SelectItem>
            <SelectItem value="Network">Network</SelectItem>
            <SelectItem value="Server">Server</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("table")}
            className={cn(viewMode === "table" && "bg-background")}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("grid")}
            className={cn(viewMode === "grid" && "bg-background")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>CIA Score</TableHead>
                <TableHead>Sensitivity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Threats</TableHead>
                <TableHead>Findings</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => (
                <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {getTypeIcon(asset.type)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{asset.type}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs", getClassificationColor(asset.classification))}>
                      {asset.classification}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs font-mono">
                      <span className="text-muted-foreground">C:</span>
                      <span className="text-foreground">{asset.confidentiality}</span>
                      <span className="text-muted-foreground ml-1">I:</span>
                      <span className="text-foreground">{asset.integrity}</span>
                      <span className="text-muted-foreground ml-1">A:</span>
                      <span className="text-foreground">{asset.availability}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-sm font-bold", getSensitivityColor(asset.sensitivityScore))}>
                      {asset.sensitivityScore.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={asset.status} variant="asset" />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{asset.threatCount}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{asset.findingsCount}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {getTypeIcon(asset.type)}
                </div>
                <StatusBadge status={asset.status} variant="asset" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{asset.name}</h3>
              <p className="text-xs text-muted-foreground mb-3">{asset.id} • {asset.type}</p>
              
              <div className="flex items-center justify-between mb-3">
                <Badge variant="outline" className={cn("text-xs", getClassificationColor(asset.classification))}>
                  {asset.classification}
                </Badge>
                <span className={cn("text-sm font-bold", getSensitivityColor(asset.sensitivityScore))}>
                  Score: {asset.sensitivityScore.toFixed(1)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border">
                <span>{asset.threatCount} threats</span>
                <span>{asset.findingsCount} findings</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
