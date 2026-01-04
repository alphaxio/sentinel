import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAssetById, updateAsset, deleteAsset } from "@/store/slices/assetsSlice";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Edit, Trash2, Server, Database, Cloud, Box, Network, LayoutGrid, Shield, AlertTriangle, Plus, X, ArrowRight } from "lucide-react";
import { AssetForm } from "@/components/assets/AssetForm";
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
import { assetsService } from "@/services/assets.service";
import { fetchAssets } from "@/store/slices/assetsSlice";
import { DependencyGraph } from "@/components/assets/DependencyGraph";

const getTypeIcon = (type: string) => {
  const icons: Record<string, React.ReactNode> = {
    Application: <Server className="w-5 h-5" />,
    Database: <Database className="w-5 h-5" />,
    Cloud: <Cloud className="w-5 h-5" />,
    Container: <Box className="w-5 h-5" />,
    Network: <Network className="w-5 h-5" />,
    Server: <Server className="w-5 h-5" />,
    Microservice: <LayoutGrid className="w-5 h-5" />,
    Infrastructure: <Server className="w-5 h-5" />,
  };
  return icons[type] || <Server className="w-5 h-5" />;
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

interface AssetRelationship {
  relationship_id: string;
  source_asset_id: string;
  target_asset_id: string;
  relationship_type: string;
  source_asset?: { asset_id: string; name: string; type: string };
  target_asset?: { asset_id: string; name: string; type: string };
}

export default function AssetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedAsset, loading, error, items: allAssets } = useAppSelector((state) => state.assets);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [relationships, setRelationships] = useState<AssetRelationship[]>([]);
  const [relationshipsLoading, setRelationshipsLoading] = useState(false);
  const [isAddRelationshipOpen, setIsAddRelationshipOpen] = useState(false);
  const [newRelationshipTarget, setNewRelationshipTarget] = useState<string>("");
  const [newRelationshipType, setNewRelationshipType] = useState<string>("");
  const [isDeleteRelationshipOpen, setIsDeleteRelationshipOpen] = useState(false);
  const [relationshipToDelete, setRelationshipToDelete] = useState<{ id: string; targetName: string; type: string } | null>(null);

  useEffect(() => {
    if (id) {
      dispatch(fetchAssetById(id));
      loadRelationships();
    }
  }, [dispatch, id]);

  // Load all assets for relationship selector
  useEffect(() => {
    if (allAssets.length === 0) {
      dispatch(fetchAssets({ page: 1, pageSize: 100 }));
    }
  }, [dispatch, allAssets.length]);

  const loadRelationships = async () => {
    if (!id) return;
    setRelationshipsLoading(true);
    try {
      const rels = await assetsService.getRelationships(id);
      setRelationships(rels);
    } catch (error: any) {
      toast.error(error.message || "Failed to load relationships");
    } finally {
      setRelationshipsLoading(false);
    }
  };

  const handleCreateRelationship = async () => {
    if (!id || !newRelationshipTarget || !newRelationshipType) {
      toast.error("Please select both target asset and relationship type");
      return;
    }

    try {
      await assetsService.createRelationship(id, newRelationshipTarget, newRelationshipType);
      toast.success("Relationship created successfully");
      setNewRelationshipTarget("");
      setNewRelationshipType("");
      setIsAddRelationshipOpen(false);
      loadRelationships();
    } catch (error: any) {
      toast.error(error.message || "Failed to create relationship");
    }
  };

  const handleDeleteRelationshipClick = (relationshipId: string, targetAssetName: string, relationshipType: string) => {
    setRelationshipToDelete({ id: relationshipId, targetName: targetAssetName, type: relationshipType });
    setIsDeleteRelationshipOpen(true);
  };

  const handleDeleteRelationship = async () => {
    if (!relationshipToDelete) return;
    
    try {
      await assetsService.deleteRelationship(relationshipToDelete.id);
      toast.success("Relationship deleted successfully");
      setIsDeleteRelationshipOpen(false);
      setRelationshipToDelete(null);
      loadRelationships();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete relationship");
    }
  };

  const getRelationshipTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      depends_on: "Depends On",
      communicates_with: "Communicates With",
      processes_data_from: "Processes Data From",
    };
    return labels[type] || type;
  };

  const getRelationshipTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      depends_on: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      communicates_with: "bg-green-500/20 text-green-400 border-green-500/30",
      processes_data_from: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  const handleDelete = async () => {
    if (!id || !selectedAsset) return;
    
    // Double-check confirmation text matches
    if (deleteConfirmationText !== selectedAsset.name) {
      toast.error("Asset name does not match. Please type the exact asset name.");
      return;
    }
    
    try {
      await dispatch(deleteAsset(id)).unwrap();
      toast.success("Asset deleted successfully");
      setDeleteConfirmationText(""); // Reset confirmation text
      navigate("/assets");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete asset");
    }
  };

  const handleDeleteDialogClose = (open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      // Reset confirmation text when dialog closes
      setDeleteConfirmationText("");
    }
  };

  if (loading && !selectedAsset) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !selectedAsset) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => navigate("/assets")} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Assets
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Asset not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/assets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {getTypeIcon(selectedAsset.type)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{selectedAsset.name}</h1>
              <p className="text-sm text-muted-foreground">ID: {selectedAsset.id}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
          <TabsTrigger value="threats">Threats ({selectedAsset.threatCount})</TabsTrigger>
          <TabsTrigger value="findings">Findings ({selectedAsset.findingsCount})</TabsTrigger>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="graph">Dependency Graph</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedAsset.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Classification</p>
                  <Badge variant="outline" className={cn("mt-1", getClassificationColor(selectedAsset.classification))}>
                    {selectedAsset.classification}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedAsset.status} variant="asset" className="mt-1" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Environment</p>
                  <p className="font-medium">{selectedAsset.environment}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(selectedAsset.createdAt || "").toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* CIA Scores */}
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">CIA Scores</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Confidentiality</span>
                    <span className="text-sm font-bold">{selectedAsset.confidentiality}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(selectedAsset.confidentiality / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Integrity</span>
                    <span className="text-sm font-bold">{selectedAsset.integrity}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(selectedAsset.integrity / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Availability</span>
                    <span className="text-sm font-bold">{selectedAsset.availability}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(selectedAsset.availability / 5) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sensitivity Score</span>
                    <span className={cn("text-lg font-bold", getSensitivityColor(selectedAsset.sensitivityScore))}>
                      {selectedAsset.sensitivityScore.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Technology Stack */}
          {selectedAsset.technologyStack && selectedAsset.technologyStack.length > 0 && (
            <div className="p-6 rounded-xl bg-card border border-border">
              <h2 className="text-lg font-semibold mb-4">Technology Stack</h2>
              <div className="flex flex-wrap gap-2">
                {selectedAsset.technologyStack.map((tech, index) => (
                  <Badge key={index} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Threats Tab */}
        <TabsContent value="threats">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-warning" />
              <h2 className="text-lg font-semibold">Threats</h2>
            </div>
            {selectedAsset.threatCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedAsset.threatCount} threat(s) identified for this asset.
                <Link to={`/threats?assetId=${selectedAsset.id}`} className="text-primary ml-1 hover:underline">
                  View all threats →
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No threats identified for this asset yet.</p>
            )}
          </div>
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold">Findings</h2>
            </div>
            {selectedAsset.findingsCount > 0 ? (
              <p className="text-sm text-muted-foreground">
                {selectedAsset.findingsCount} finding(s) identified for this asset.
                <Link to={`/findings?assetId=${selectedAsset.id}`} className="text-primary ml-1 hover:underline">
                  View all findings →
                </Link>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No findings identified for this asset yet.</p>
            )}
          </div>
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Asset Relationships</h2>
                <p className="text-sm text-muted-foreground">
                  Manage dependencies and connections between assets
                </p>
              </div>
              <Button onClick={() => setIsAddRelationshipOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Relationship
              </Button>
            </div>

            {/* Loading State */}
            {relationshipsLoading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            )}

            {/* Relationships List */}
            {!relationshipsLoading && relationships.length === 0 && (
              <div className="p-12 text-center rounded-xl bg-card border border-border">
                <p className="text-muted-foreground">No relationships found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create relationships to show how assets depend on or interact with each other
                </p>
              </div>
            )}

            {/* Outgoing Relationships */}
            {!relationshipsLoading && relationships.filter((rel) => rel.source_asset_id === id).length > 0 && (
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-md font-semibold mb-4">Outgoing Relationships</h3>
                <div className="space-y-3">
                  {relationships
                    .filter((rel) => rel.source_asset_id === id)
                    .map((rel) => {
                      const targetAsset = allAssets.find((a) => a.id === rel.target_asset_id);
                      return (
                        <div
                          key={rel.relationship_id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {getTypeIcon(selectedAsset?.type || "Application")}
                              </div>
                              <span className="font-medium">{selectedAsset?.name}</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline" className={cn("text-xs", getRelationshipTypeColor(rel.relationship_type))}>
                              {getRelationshipTypeLabel(rel.relationship_type)}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => targetAsset && navigate(`/assets/${targetAsset.id}`)}
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {targetAsset ? getTypeIcon(targetAsset.type) : <Server className="w-5 h-5" />}
                              </div>
                              <span className="font-medium">
                                {targetAsset?.name || rel.target_asset?.name || "Unknown Asset"}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRelationshipClick(
                              rel.relationship_id,
                              targetAsset?.name || rel.target_asset?.name || "Unknown Asset",
                              getRelationshipTypeLabel(rel.relationship_type)
                            )}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Incoming Relationships */}
            {!relationshipsLoading && relationships.filter((rel) => rel.target_asset_id === id).length > 0 && (
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-md font-semibold mb-4">Incoming Relationships</h3>
                <div className="space-y-3">
                  {relationships
                    .filter((rel) => rel.target_asset_id === id)
                    .map((rel) => {
                      const sourceAsset = allAssets.find((a) => a.id === rel.source_asset_id);
                      return (
                        <div
                          key={rel.relationship_id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div 
                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => sourceAsset && navigate(`/assets/${sourceAsset.id}`)}
                            >
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {sourceAsset ? getTypeIcon(sourceAsset.type) : <Server className="w-5 h-5" />}
                              </div>
                              <span className="font-medium">
                                {sourceAsset?.name || rel.source_asset?.name || "Unknown Asset"}
                              </span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <Badge variant="outline" className={cn("text-xs", getRelationshipTypeColor(rel.relationship_type))}>
                              {getRelationshipTypeLabel(rel.relationship_type)}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-muted-foreground" />
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                {getTypeIcon(selectedAsset?.type || "Application")}
                              </div>
                              <span className="font-medium">{selectedAsset?.name}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRelationshipClick(
                              rel.relationship_id,
                              targetAsset?.name || rel.target_asset?.name || "Unknown Asset",
                              getRelationshipTypeLabel(rel.relationship_type)
                            )}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Dependency Graph Tab */}
        <TabsContent value="graph">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Dependency Graph</h2>
              <p className="text-sm text-muted-foreground">
                Visual representation of asset relationships and dependencies
              </p>
            </div>
            <DependencyGraph
              assetId={selectedAsset.id}
              assetName={selectedAsset.name}
              relationships={relationships}
              allAssets={allAssets}
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedAsset && (
        <AssetForm
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          asset={selectedAsset}
          mode="edit"
        />
      )}

      {/* Add Relationship Dialog */}
      <Dialog open={isAddRelationshipOpen} onOpenChange={setIsAddRelationshipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Relationship</DialogTitle>
            <DialogDescription>
              Create a relationship between this asset and another asset
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="target-asset">Target Asset</Label>
              <Select value={newRelationshipTarget} onValueChange={setNewRelationshipTarget}>
                <SelectTrigger id="target-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {allAssets
                    .filter((asset) => asset.id !== id)
                    .map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name} ({asset.type})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relationship-type">Relationship Type</Label>
              <Select value={newRelationshipType} onValueChange={setNewRelationshipType}>
                <SelectTrigger id="relationship-type">
                  <SelectValue placeholder="Select relationship type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="depends_on">Depends On</SelectItem>
                  <SelectItem value="communicates_with">Communicates With</SelectItem>
                  <SelectItem value="processes_data_from">Processes Data From</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRelationshipOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRelationship}>
              Create Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Relationship Dialog */}
      <Dialog open={isDeleteRelationshipOpen} onOpenChange={(open) => {
        setIsDeleteRelationshipOpen(open);
        if (!open) {
          setRelationshipToDelete(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Relationship</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the relationship between{" "}
              <span className="font-semibold">{selectedAsset?.name}</span> and{" "}
              <span className="font-semibold">{relationshipToDelete?.targetName}</span>?
              <br />
              <br />
              Relationship type: <span className="font-semibold">{relationshipToDelete?.type}</span>
              <br />
              <br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDeleteRelationshipOpen(false);
              setRelationshipToDelete(null);
            }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRelationship}
            >
              Delete Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedAsset.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-semibold">"{selectedAsset.name}"</span> to confirm deletion:
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Enter asset name"
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDeleteDialogClose(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteConfirmationText !== selectedAsset.name}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

