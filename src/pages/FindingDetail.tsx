import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchFindingById, updateFinding, deleteFinding } from "@/store/slices/findingsSlice";
import { fetchAssetById } from "@/store/slices/assetsSlice";
import { fetchThreatById } from "@/store/slices/threatsSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/ui/severity-badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Edit, Trash2, ExternalLink, Calendar, Shield, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { FindingForm } from "@/components/findings/FindingForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";

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

export default function FindingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedFinding, loading, error } = useAppSelector((state) => state.findings);
  const { selectedAsset } = useAppSelector((state) => state.assets);
  const { selectedThreat } = useAppSelector((state) => state.threats);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");

  useEffect(() => {
    if (id) {
      dispatch(fetchFindingById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedFinding?.assetId) {
      dispatch(fetchAssetById(selectedFinding.assetId));
    }
  }, [dispatch, selectedFinding?.assetId]);

  useEffect(() => {
    if (selectedFinding?.threatId) {
      dispatch(fetchThreatById(selectedFinding.threatId));
    }
  }, [dispatch, selectedFinding?.threatId]);

  const handleDelete = async () => {
    if (!id || !selectedFinding) return;
    
    try {
      await dispatch(deleteFinding(id)).unwrap();
      toast.success("Finding deleted successfully");
      navigate("/findings");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete finding");
    }
  };

  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;

    try {
      await dispatch(updateFinding({ id, data: { status: newStatus as any } })).unwrap();
      toast.success("Finding status updated successfully");
      setIsStatusDialogOpen(false);
      setNewStatus("");
      dispatch(fetchFindingById(id));
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  if (loading && !selectedFinding) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !selectedFinding) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate("/findings")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Findings
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Finding not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const statusOptions: Array<{ value: string; label: string }> = [
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Resolved", label: "Resolved" },
    { value: "False Positive", label: "False Positive" },
    { value: "Accepted", label: "Accepted" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/findings")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              selectedFinding.severity === "Critical" && "bg-critical/10 text-critical",
              selectedFinding.severity === "High" && "bg-high/10 text-high",
              selectedFinding.severity === "Medium" && "bg-medium/10 text-medium",
              selectedFinding.severity === "Low" && "bg-low/10 text-low",
              selectedFinding.severity === "Info" && "bg-muted text-muted-foreground",
            )}>
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedFinding.title}</h1>
              <p className="text-sm text-muted-foreground">ID: {selectedFinding.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setNewStatus(selectedFinding.status);
              setIsStatusDialogOpen(true);
            }}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Update Status
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="remediation">Remediation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">Finding Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <SeverityBadge severity={selectedFinding.severity} className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedFinding.status} variant="finding" className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asset</p>
                  {selectedAsset ? (
                    <Link to={`/assets/${selectedAsset.id}`} className="text-primary hover:underline flex items-center gap-1 mt-1">
                      <LinkIcon className="w-3 h-3" />
                      {selectedAsset.name}
                    </Link>
                  ) : (
                    <p className="font-medium mt-1">{selectedFinding.assetName}</p>
                  )}
                </div>
                {selectedFinding.threatId && (
                  <div>
                    <p className="text-sm text-muted-foreground">Linked Threat</p>
                    {selectedThreat ? (
                      <Link to={`/threats/${selectedThreat.id}`} className="text-primary hover:underline flex items-center gap-1 mt-1">
                        <Shield className="w-3 h-3" />
                        {selectedThreat.title}
                      </Link>
                    ) : (
                      <p className="font-medium mt-1">Threat ID: {selectedFinding.threatId}</p>
                    )}
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Source</p>
                  <Badge variant="outline" className={cn("mt-1 border", getSourceBadge(selectedFinding.source))}>
                    {selectedFinding.source}
                  </Badge>
                </div>
                {selectedFinding.location && (
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-mono text-sm mt-1">{selectedFinding.location}</p>
                  </div>
                )}
                {selectedFinding.cveId && (
                  <div>
                    <p className="text-sm text-muted-foreground">CVE ID</p>
                    <div className="flex items-center gap-2 mt-1">
                      <a
                        href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${selectedFinding.cveId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        {selectedFinding.cveId}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Discovered</p>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    {format(new Date(selectedFinding.discoveredAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
                {selectedFinding.remediatedAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Remediated</p>
                    <div className="flex items-center gap-1 text-sm mt-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {format(new Date(selectedFinding.remediatedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Description & Details */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Vulnerability Type</p>
                  <p className="text-sm">{selectedFinding.vulnerabilityType || selectedFinding.title}</p>
                </div>
                {selectedFinding.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Details</p>
                    <p className="text-sm whitespace-pre-wrap">{selectedFinding.description}</p>
                  </div>
                )}
                {selectedFinding.scannerSources && selectedFinding.scannerSources.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Scanner Sources</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFinding.scannerSources.map((source, idx) => (
                        <Badge key={idx} variant="outline" className={cn("border", getSourceBadge(source))}>
                          {source}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedFinding.cvssScore && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">CVSS Score</p>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold">{selectedFinding.cvssScore}</span>
                      <span className="text-xs text-muted-foreground">/ 10.0</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Remediation Tab */}
        <TabsContent value="remediation">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h2 className="text-lg font-semibold mb-4">Remediation</h2>
            {selectedFinding.remediation ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Remediation Steps</p>
                  <p className="text-sm whitespace-pre-wrap">{selectedFinding.remediation}</p>
                </div>
                {selectedFinding.dueDate && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Due Date</p>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      {format(new Date(selectedFinding.dueDate), "MMM d, yyyy")}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No remediation information available yet.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedFinding && (
        <FindingForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          finding={selectedFinding}
          mode="edit"
          onSuccess={() => {
            setIsEditDialogOpen(false);
            if (id) {
              dispatch(fetchFindingById(id));
            }
          }}
        />
      )}

      {/* Status Update Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Finding Status</DialogTitle>
            <DialogDescription>
              Change the status of this finding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Finding</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedFinding.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


