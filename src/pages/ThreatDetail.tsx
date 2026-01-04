import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchThreatById, updateThreat, deleteThreat, transitionThreat } from "@/store/slices/threatsSlice";
import { fetchAssetById } from "@/store/slices/assetsSlice";
import { fetchFindings } from "@/store/slices/findingsSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Edit, Trash2, Shield, AlertTriangle, Link as LinkIcon } from "lucide-react";
import { ThreatForm } from "@/components/threats/ThreatForm";
import { ThreatHistoryTimeline } from "@/components/threats/ThreatHistoryTimeline";
import { ThreatModelingCanvas } from "@/components/threats/ThreatModelingCanvas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";

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

const getStrideColor = (category?: string) => {
  const colors: Record<string, string> = {
    Spoofing: "bg-red-500/20 text-red-400 border-red-500/30",
    Tampering: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    Repudiation: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Info_Disclosure: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    DoS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    Elevation: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };
  return colors[category || ""] || "bg-muted text-muted-foreground";
};

export default function ThreatDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedThreat, loading, error } = useAppSelector((state) => state.threats);
  const { selectedAsset } = useAppSelector((state) => state.assets);
  const { items: findings } = useAppSelector((state) => state.findings);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTransitionDialogOpen, setIsTransitionDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [transitionComment, setTransitionComment] = useState<string>("");

  useEffect(() => {
    if (id) {
      dispatch(fetchThreatById(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedThreat?.assetId) {
      dispatch(fetchAssetById(selectedThreat.assetId));
    }
  }, [dispatch, selectedThreat?.assetId]);

  useEffect(() => {
    if (selectedThreat?.id) {
      dispatch(fetchFindings({ threatId: selectedThreat.id, page: 1, pageSize: 50 }));
    }
  }, [dispatch, selectedThreat?.id]);

  const handleDelete = async () => {
    if (!id || !selectedThreat) return;
    
    try {
      await dispatch(deleteThreat(id)).unwrap();
      toast.success("Threat deleted successfully");
      navigate("/threats");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete threat");
    }
  };

  const handleTransition = async () => {
    if (!id || !newStatus) return;

    try {
      await dispatch(transitionThreat({ id, toState: newStatus as any, comment: transitionComment || undefined })).unwrap();
      toast.success("Threat status updated successfully");
      setIsTransitionDialogOpen(false);
      setNewStatus("");
      setTransitionComment("");
      dispatch(fetchThreatById(id));
    } catch (error: any) {
      toast.error(error.message || "Failed to transition threat");
    }
  };

  const getNextValidStates = (currentStatus: string) => {
    const stateMachine: Record<string, string[]> = {
      Identified: ["Assessed", "Verified"],
      Assessed: ["Verified", "Evaluated"],
      Verified: ["Evaluated", "Planning"],
      Evaluated: ["Planning", "Mitigated", "Accepted"],
      Planning: ["Mitigated"],
      Mitigated: ["Monitoring"],
      Accepted: ["Monitoring"],
      Monitoring: ["Closed"],
    };
    return stateMachine[currentStatus] || [];
  };

  if (loading && !selectedThreat) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !selectedThreat) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate("/threats")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Threats
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Threat not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const nextStates = getNextValidStates(selectedThreat.status);
  const relatedFindings = findings.filter((f) => f.threatId === selectedThreat.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/threats")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedThreat.title}</h1>
              <p className="text-sm text-muted-foreground">ID: {selectedThreat.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStates.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setIsTransitionDialogOpen(true)}
            >
              <Shield className="w-4 h-4 mr-2" />
              Change Status
            </Button>
          )}
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
          <TabsTrigger value="findings">Findings ({relatedFindings.length})</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="modeling">Threat Modeling</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">Threat Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedThreat.status} variant="threat" className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Asset</p>
                  {selectedAsset ? (
                    <Link to={`/assets/${selectedAsset.id}`} className="text-primary hover:underline flex items-center gap-1 mt-1">
                      <LinkIcon className="w-3 h-3" />
                      {selectedAsset.name}
                    </Link>
                  ) : (
                    <p className="font-medium mt-1">{selectedThreat.assetName}</p>
                  )}
                </div>
                {selectedThreat.strideCategory && (
                  <div>
                    <p className="text-sm text-muted-foreground">STRIDE Category</p>
                    <Badge variant="outline" className={cn("mt-1", getStrideColor(selectedThreat.strideCategory))}>
                      {selectedThreat.strideCategory.replace("_", " ")}
                    </Badge>
                  </div>
                )}
                {selectedThreat.mitreAttackId && (
                  <div>
                    <p className="text-sm text-muted-foreground">MITRE ATT&CK ID</p>
                    <p className="font-medium font-mono mt-1">{selectedThreat.mitreAttackId}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium mt-1">
                    {new Date(selectedThreat.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">Risk Assessment</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Likelihood</span>
                    <span className="text-sm font-bold">{selectedThreat.likelihood}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-warning h-2 rounded-full"
                      style={{ width: `${(selectedThreat.likelihood / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Impact</span>
                    <span className="text-sm font-bold">{selectedThreat.impact}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full"
                      style={{ width: `${(selectedThreat.impact / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Score</span>
                    <div className="flex items-center gap-2">
                      <div className={cn("px-3 py-1 rounded text-sm font-bold border", getRiskBadgeClass(selectedThreat.riskScore))}>
                        {selectedThreat.riskScore.toFixed(1)}
                      </div>
                      <span className="text-sm text-muted-foreground">{getRiskLabel(selectedThreat.riskScore)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold">Related Findings</h2>
            </div>
            {relatedFindings.length > 0 ? (
              <div className="space-y-3">
                {relatedFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => navigate(`/findings?findingId=${finding.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{finding.title}</p>
                        <p className="text-sm text-muted-foreground">{finding.severity} • {finding.source}</p>
                      </div>
                      <StatusBadge status={finding.status} variant="finding" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No findings associated with this threat yet.</p>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold">State History</h2>
            </div>
            {id && <ThreatHistoryTimeline threatId={id} />}
          </div>
        </TabsContent>

        {/* Threat Modeling Tab */}
        <TabsContent value="modeling">
          <div className="rounded-xl border border-border overflow-hidden bg-card" style={{ height: '600px' }}>
            <ThreatModelingCanvas assetId={selectedThreat?.assetId} threatId={id} />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedThreat && (
        <ThreatForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          threat={selectedThreat}
          mode="edit"
          onSuccess={() => {
            setIsEditDialogOpen(false);
            if (id) {
              dispatch(fetchThreatById(id));
            }
          }}
        />
      )}

      {/* Status Transition Dialog */}
      <Dialog open={isTransitionDialogOpen} onOpenChange={setIsTransitionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Threat Status</DialogTitle>
            <DialogDescription>
              Transition this threat to a new status
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {nextStates.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment (Optional)</Label>
              <Textarea
                id="comment"
                placeholder="Add a comment about this status change..."
                value={transitionComment}
                onChange={(e) => setTransitionComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransitionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleTransition} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Threat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedThreat.title}"? This action cannot be undone.
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


