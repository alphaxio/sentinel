import { useState, useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchAssets } from "@/store/slices/assetsSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Save, Download, X, Link2, Upload, Edit, Shield } from "lucide-react";
import type { Asset } from "@/types";
import { toast } from "@/components/ui/sonner";
import { threatsService, type ThreatModelDiagram, type ThreatModelDiagramCreate } from "@/services/threats.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fetchThreats } from "@/store/slices/threatsSlice";
import type { Threat } from "@/types";

interface CanvasNode {
  id: string;
  type: 'asset' | 'threat' | 'trust-boundary';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  data?: any;
}

interface CanvasLink {
  id: string;
  source: string;
  target: string;
  type: 'data-flow' | 'dependency';
}

interface ThreatModelingCanvasProps {
  assetId?: string;
  threatId?: string;
}

export function ThreatModelingCanvas({ assetId, threatId }: ThreatModelingCanvasProps) {
  const dispatch = useAppDispatch();
  const { items: assets } = useAppSelector((state) => state.assets);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [links, setLinks] = useState<CanvasLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionSource, setConnectionSource] = useState<string | null>(null);
  const [dragDistance, setDragDistance] = useState(0);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [isLoadDialogOpen, setIsLoadDialogOpen] = useState(false);
  const [isEditNodeDialogOpen, setIsEditNodeDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [savedDiagrams, setSavedDiagrams] = useState<ThreatModelDiagram[]>([]);
  const [editingNode, setEditingNode] = useState<CanvasNode | null>(null);
  const [availableThreats, setAvailableThreats] = useState<Threat[]>([]);
  const [currentDiagramId, setCurrentDiagramId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchAssets({ page: 1, pageSize: 100 }));
    // Fetch threats for linking
    dispatch(fetchThreats({ page: 1, pageSize: 100 })).then((result: any) => {
      if (result.type === 'threats/fetchAll/fulfilled' && result.payload?.items) {
        setAvailableThreats(result.payload.items);
      }
    });
  }, [dispatch]);

  // Initialize with assets if provided
  useEffect(() => {
    if (assets.length > 0 && nodes.length === 0) {
      const initialNodes: CanvasNode[] = assets.slice(0, 5).map((asset, index) => ({
        id: `asset-${asset.id}`,
        type: 'asset',
        x: 100 + (index % 3) * 200,
        y: 100 + Math.floor(index / 3) * 150,
        width: 120,
        height: 80,
        label: asset.name,
        data: asset,
      }));
      setNodes(initialNodes);
    }
  }, [assets, nodes.length]);

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Don't allow dragging in connection mode
    if (connectionMode) {
      return;
    }
    
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      setSelectedLink(null);
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setDragOffset({
          x: mouseX - node.x,
          y: mouseY - node.y,
        });
        setDragStartPos({ x: e.clientX, y: e.clientY });
        setDragDistance(0);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Don't allow dragging in connection mode
    if (connectionMode) return;
    
    // Only update position if we're actively dragging
    if (isDragging && selectedNode && dragStartPos) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setNodes(prevNodes =>
          prevNodes.map(node =>
            node.id === selectedNode
              ? {
                  ...node,
                  x: e.clientX - rect.left - dragOffset.x,
                  y: e.clientY - rect.top - dragOffset.y,
                }
              : node
          )
        );
      }
      return;
    }
    
    // Check if we should start dragging (only if not already dragging)
    if (selectedNode && dragStartPos && !isDragging) {
      const moveDistance = Math.sqrt(
        Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
      );
      
      setDragDistance(moveDistance);
      
      if (moveDistance > 5) {
        setIsDragging(true);
        // Immediately update position when drag starts
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          setNodes(prevNodes =>
            prevNodes.map(node =>
              node.id === selectedNode
                ? {
                    ...node,
                    x: e.clientX - rect.left - dragOffset.x,
                    y: e.clientY - rect.top - dragOffset.y,
                  }
                : node
            )
          );
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      // Clear drag state after a small delay to allow onClick to process
      setTimeout(() => {
        setDragStartPos(null);
        setDragDistance(0);
      }, 100);
    }
  };

  // Add global mouse up listener to catch mouse release outside canvas
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
        setDragStartPos(null);
        setDragDistance(0);
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mouseleave', handleGlobalMouseUp);
      
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
        window.removeEventListener('mouseleave', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  // Add global mouse up listener to catch mouse release outside canvas
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStartPos(null);
        setDragDistance(0);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging]);

  const handleAddAsset = () => {
    const newAsset = assets[nodes.filter(n => n.type === 'asset').length];
    if (newAsset) {
      // Find a good position for the new node (avoid overlapping)
      let newX = 100;
      let newY = 100;
      let attempts = 0;
      const maxAttempts = 50;
      
      // Try to find a non-overlapping position
      while (attempts < maxAttempts) {
        const overlaps = nodes.some(node => {
          const margin = 20; // Minimum distance between nodes
          return (
            newX < node.x + node.width + margin &&
            newX + 120 + margin > node.x &&
            newY < node.y + node.height + margin &&
            newY + 80 + margin > node.y
          );
        });
        
        if (!overlaps) {
          break; // Found a good position
        }
        
        // Try a new position (spiral pattern)
        newX = 100 + (attempts % 5) * 150;
        newY = 100 + Math.floor(attempts / 5) * 120;
        attempts++;
      }
      
      const newNode: CanvasNode = {
        id: `asset-${newAsset.id}-${Date.now()}`,
        type: 'asset',
        x: newX,
        y: newY,
        width: 120,
        height: 80,
        label: newAsset.name,
        data: newAsset,
      };
      setNodes([...nodes, newNode]);
      // Select the newly added node so user can immediately interact with it
      setSelectedNode(newNode.id);
      setSelectedLink(null);
    } else {
      toast.info("No more assets to add");
    }
  };

  const handleAddThreat = () => {
    if (!selectedNode) {
      toast.error("Please select an asset first");
      return;
    }

    const newNode: CanvasNode = {
      id: `threat-${Date.now()}`,
      type: 'threat',
      x: nodes.find(n => n.id === selectedNode)!.x + 150,
      y: nodes.find(n => n.id === selectedNode)!.y,
      width: 100,
      height: 60,
      label: "New Threat",
      data: { assetId: selectedNode },
    };
    setNodes([...nodes, newNode]);
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes(nodes.filter(n => n.id !== nodeId));
    setLinks(links.filter(l => l.source !== nodeId && l.target !== nodeId));
    if (selectedNode === nodeId) {
      setSelectedNode(null);
    }
    if (connectionSource === nodeId) {
      setConnectionSource(null);
      setConnectionMode(false);
    }
  };

  const handleStartConnection = () => {
    if (!selectedNode) {
      toast.error("Please select a node first");
      return;
    }
    setConnectionMode(true);
    setConnectionSource(selectedNode);
    toast.info("Click on another node to create a connection");
  };

  const handleCancelConnection = () => {
    setConnectionMode(false);
    setConnectionSource(null);
  };

  const handleCreateConnection = (targetNodeId: string) => {
    if (!connectionSource) return;
    
    if (connectionSource === targetNodeId) {
      toast.error("Cannot connect a node to itself");
      return;
    }

    // Check if connection already exists
    const existingLink = links.find(
      l => (l.source === connectionSource && l.target === targetNodeId) ||
           (l.source === targetNodeId && l.target === connectionSource)
    );

    if (existingLink) {
      toast.error("Connection already exists");
      setConnectionMode(false);
      setConnectionSource(null);
      return;
    }

    // Create new connection (default to data-flow)
    const newLink: CanvasLink = {
      id: `link-${Date.now()}`,
      source: connectionSource,
      target: targetNodeId,
      type: 'data-flow',
    };

    // Use functional update to ensure we have the latest links
    setLinks(prevLinks => {
      const updated = [...prevLinks, newLink];
      console.log("Creating connection:", newLink, "Total links:", updated.length);
      return updated;
    });
    setConnectionMode(false);
    setConnectionSource(null);
    setSelectedNode(targetNodeId);
    toast.success("Connection created");
  };

  const handleDeleteLink = (linkId: string) => {
    setLinks(links.filter(l => l.id !== linkId));
    if (selectedLink === linkId) {
      setSelectedLink(null);
    }
    toast.success("Connection deleted");
  };

  const handleChangeLinkType = (linkId: string, newType: 'data-flow' | 'dependency') => {
    setLinks(links.map(l => 
      l.id === linkId ? { ...l, type: newType } : l
    ));
    toast.success("Connection type updated");
  };

  // Save/Load Functions
  const handleSave = async () => {
    if (!saveName.trim()) {
      toast.error("Please enter a name for the diagram");
      return;
    }

    try {
      const canvasData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          label: node.label,
          data: node.data,
        })),
        links: links,
      };

      const diagramData: ThreatModelDiagramCreate = {
        name: saveName.trim(),
        description: saveDescription.trim() || undefined,
        threat_id: threatId || undefined,
        canvas_data: canvasData,
      };

      if (currentDiagramId) {
        // Update existing diagram
        await threatsService.updateDiagram(currentDiagramId, diagramData);
        toast.success("Diagram updated successfully");
      } else {
        // Create new diagram
        const saved = await threatsService.createDiagram(diagramData);
        setCurrentDiagramId(saved.diagram_id);
        toast.success("Diagram saved successfully");
      }

      setIsSaveDialogOpen(false);
      setSaveName("");
      setSaveDescription("");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to save diagram");
    }
  };

  const handleLoad = async (diagramId: string) => {
    try {
      const diagram = await threatsService.getDiagram(diagramId);
      
      // Restore nodes and links
      if (diagram.canvas_data?.nodes) {
        setNodes(diagram.canvas_data.nodes.map((node: any) => ({
          ...node,
          width: node.width || 120,
          height: node.height || 80,
        })));
      }
      if (diagram.canvas_data?.links) {
        setLinks(diagram.canvas_data.links);
      }

      setCurrentDiagramId(diagram.diagram_id);
      setIsLoadDialogOpen(false);
      toast.success("Diagram loaded successfully");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to load diagram");
    }
  };

  const handleOpenSaveDialog = () => {
    if (currentDiagramId) {
      // Load existing diagram name/description
      threatsService.getDiagram(currentDiagramId).then(diagram => {
        setSaveName(diagram.name);
        setSaveDescription(diagram.description || "");
      }).catch(() => {
        setSaveName("");
        setSaveDescription("");
      });
    } else {
      setSaveName("");
      setSaveDescription("");
    }
    setIsSaveDialogOpen(true);
  };

  const handleOpenLoadDialog = async () => {
    try {
      const response = await threatsService.getDiagrams({
        page: 1,
        pageSize: 100,
        threatId: threatId,
      });
      setSavedDiagrams(response.items);
      setIsLoadDialogOpen(true);
    } catch (error: any) {
      toast.error("Failed to load diagrams list");
    }
  };

  // Export Functions
  const handleExportJSON = () => {
    const exportData = {
      nodes,
      links,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threat-model-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Diagram exported as JSON");
  };

  const handleExportImage = async (format: "png" | "svg" = "png") => {
    if (!canvasRef.current) return;

    try {
      if (format === "png") {
        // Use html2canvas or similar library
        // For now, we'll use a simple approach with canvas
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const rect = canvasRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Draw background
        ctx.fillStyle = "#f5f5f5";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Note: Full canvas rendering would require html2canvas library
        // For now, we'll export as SVG which is easier
        toast.info("PNG export requires additional setup. Use SVG export instead.");
      } else {
        // Export as SVG
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", canvasRef.current.scrollWidth.toString());
        svg.setAttribute("height", canvasRef.current.scrollHeight.toString());
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        // Add nodes as rectangles
        nodes.forEach(node => {
          const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          rect.setAttribute("x", node.x.toString());
          rect.setAttribute("y", node.y.toString());
          rect.setAttribute("width", node.width.toString());
          rect.setAttribute("height", node.height.toString());
          rect.setAttribute("fill", node.type === "asset" ? "#3b82f6" : node.type === "threat" ? "#ef4444" : "#f59e0b");
          rect.setAttribute("stroke", "#000");
          rect.setAttribute("stroke-width", "1");
          svg.appendChild(rect);

          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", (node.x + node.width / 2).toString());
          text.setAttribute("y", (node.y + node.height / 2).toString());
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("fill", "#000");
          text.setAttribute("font-size", "12");
          text.textContent = node.label;
          svg.appendChild(text);
        });

        // Add links as lines
        links.forEach(link => {
          const source = nodes.find(n => n.id === link.source);
          const target = nodes.find(n => n.id === link.target);
          if (source && target) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", (source.x + source.width / 2).toString());
            line.setAttribute("y1", (source.y + source.height / 2).toString());
            line.setAttribute("x2", (target.x + target.width / 2).toString());
            line.setAttribute("y2", (target.y + target.height / 2).toString());
            line.setAttribute("stroke", "#6b7280");
            line.setAttribute("stroke-width", "2");
            svg.appendChild(line);
          }
        });

        const svgString = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgString], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `threat-model-${new Date().toISOString().split("T")[0]}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Diagram exported as SVG");
      }
    } catch (error) {
      toast.error("Failed to export diagram");
    }
  };

  // Edit Node Functions
  const handleEditNode = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setEditingNode({ ...node });
      setIsEditNodeDialogOpen(true);
    }
  };

  const handleSaveNodeEdit = () => {
    if (!editingNode) return;

    setNodes(nodes.map(n => 
      n.id === editingNode.id ? { ...editingNode } : n
    ));
    setIsEditNodeDialogOpen(false);
    setEditingNode(null);
    toast.success("Node updated");
  };

  // Add Trust Boundary
  const handleAddTrustBoundary = () => {
    const newNode: CanvasNode = {
      id: `trust-boundary-${Date.now()}`,
      type: 'trust-boundary',
      x: 200,
      y: 200,
      width: 300,
      height: 200,
      label: "Trust Boundary",
      data: {},
    };
    setNodes([...nodes, newNode]);
    toast.success("Trust boundary added");
  };

  // Link Threat to Real Record
  const handleLinkThreatToRecord = async (nodeId: string, threatId: string) => {
    const threat = availableThreats.find(t => t.id === threatId);
    if (!threat) return;

    setNodes(nodes.map(n => 
      n.id === nodeId 
        ? { 
            ...n, 
            label: threat.title,
            data: { ...n.data, threatId: threat.id, threat: threat }
          }
        : n
    ));
    toast.success("Threat linked to record");
  };

  // Helper function to calculate intersection point of line with rectangle edge
  const getEdgeIntersection = (
    centerX: number,
    centerY: number,
    targetX: number,
    targetY: number,
    nodeX: number,
    nodeY: number,
    nodeWidth: number,
    nodeHeight: number
  ): { x: number; y: number } => {
    const dx = targetX - centerX;
    const dy = targetY - centerY;
    const angle = Math.atan2(dy, dx);
    
    // Calculate which edge the line intersects
    const halfWidth = nodeWidth / 2;
    const halfHeight = nodeHeight / 2;
    
    // Calculate intersection with each edge and find the closest one
    const intersections: { x: number; y: number; dist: number }[] = [];
    
    // Top edge
    const topY = nodeY;
    const topX = centerX + (topY - centerY) / Math.tan(angle);
    if (topX >= nodeX && topX <= nodeX + nodeWidth && Math.abs(Math.tan(angle)) > 0.001) {
      const dist = Math.sqrt(Math.pow(topX - centerX, 2) + Math.pow(topY - centerY, 2));
      intersections.push({ x: topX, y: topY, dist });
    }
    
    // Bottom edge
    const bottomY = nodeY + nodeHeight;
    const bottomX = centerX + (bottomY - centerY) / Math.tan(angle);
    if (bottomX >= nodeX && bottomX <= nodeX + nodeWidth && Math.abs(Math.tan(angle)) > 0.001) {
      const dist = Math.sqrt(Math.pow(bottomX - centerX, 2) + Math.pow(bottomY - centerY, 2));
      intersections.push({ x: bottomX, y: bottomY, dist });
    }
    
    // Left edge
    const leftX = nodeX;
    const leftY = centerY + (leftX - centerX) * Math.tan(angle);
    if (leftY >= nodeY && leftY <= nodeY + nodeHeight) {
      const dist = Math.sqrt(Math.pow(leftX - centerX, 2) + Math.pow(leftY - centerY, 2));
      intersections.push({ x: leftX, y: leftY, dist });
    }
    
    // Right edge
    const rightX = nodeX + nodeWidth;
    const rightY = centerY + (rightX - centerX) * Math.tan(angle);
    if (rightY >= nodeY && rightY <= nodeY + nodeHeight) {
      const dist = Math.sqrt(Math.pow(rightX - centerX, 2) + Math.pow(rightY - centerY, 2));
      intersections.push({ x: rightX, y: rightY, dist });
    }
    
    // Return the intersection point closest to the target (farthest from center in direction of target)
    if (intersections.length === 0) {
      // Fallback to center if no intersection found
      return { x: centerX, y: centerY };
    }
    
    // Find the intersection that's in the direction of the target
    const validIntersections = intersections.filter(i => {
      const toIntersection = { x: i.x - centerX, y: i.y - centerY };
      const toTarget = { x: dx, y: dy };
      const dot = toIntersection.x * toTarget.x + toIntersection.y * toTarget.y;
      return dot > 0; // Same direction
    });
    
    if (validIntersections.length > 0) {
      // Return the farthest one (closest to target)
      const farthest = validIntersections.reduce((prev, curr) => 
        curr.dist > prev.dist ? curr : prev
      );
      return { x: farthest.x, y: farthest.y };
    }
    
    // Fallback
    return { x: centerX, y: centerY };
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'bg-primary/20 border-primary text-primary';
      case 'threat':
        return 'bg-destructive/20 border-destructive text-destructive';
      case 'trust-boundary':
        return 'bg-warning/20 border-warning text-warning';
      default:
        return 'bg-muted border-border';
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleAddAsset}>
            <Plus className="w-4 h-4 mr-2" />
            Add Asset
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddThreat} disabled={!selectedNode}>
            <Plus className="w-4 h-4 mr-2" />
            Add Threat
          </Button>
          <Button 
            size="sm" 
            variant={connectionMode ? "default" : "outline"} 
            onClick={connectionMode ? handleCancelConnection : handleStartConnection}
            disabled={!selectedNode && !connectionMode}
          >
            {connectionMode ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel Connection
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4 mr-2" />
                Create Connection
              </>
            )}
          </Button>
          {selectedNode && !connectionMode && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteNode(selectedNode)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          )}
          {selectedLink && (
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleDeleteLink(selectedLink)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Connection
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleOpenLoadDialog}>
            <Upload className="w-4 h-4 mr-2" />
            Load
          </Button>
          <Button size="sm" variant="outline" onClick={handleOpenSaveDialog}>
            <Save className="w-4 h-4 mr-2" />
            {currentDiagramId ? "Update" : "Save"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExportImage("svg")}>
            <Download className="w-4 h-4 mr-2" />
            Export SVG
          </Button>
          <Button size="sm" variant="outline" onClick={handleExportJSON}>
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button size="sm" variant="outline" onClick={handleAddTrustBoundary}>
            <Shield className="w-4 h-4 mr-2" />
            Add Trust Boundary
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 relative overflow-auto bg-muted/20"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseDown={(e) => {
          // Only deselect if clicking directly on canvas (not on a node)
          if (e.target === e.currentTarget) {
            setSelectedNode(null);
            setSelectedLink(null);
            // Cancel connection mode if clicking on empty canvas
            if (connectionMode) {
              handleCancelConnection();
            }
          }
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Nodes */}
        {nodes.map((node, index) => {
          const isSelected = selectedNode === node.id;
          const isLabelTruncated = node.label.length > 15; // Approximate truncation point
          
          return (
            <Tooltip key={node.id} delayDuration={300}>
              <TooltipTrigger asChild>
                <Card
                  className={cn(
                    "absolute cursor-move select-none transition-all",
                    getNodeColor(node.type),
                    isSelected && "ring-2 ring-primary ring-offset-2",
                    isSelected && "shadow-lg scale-105" // Slightly larger when selected
                  )}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: isSelected ? Math.max(node.width, 140) : node.width, // Expand width when selected
                    height: isSelected ? Math.max(node.height, 90) : node.height, // Expand height when selected
                    zIndex: isSelected ? 20 : 10 + index, // Selected nodes and newer nodes on top
                    minHeight: isSelected ? 90 : 80,
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    // Don't start drag if in connection mode
                    if (!connectionMode) {
                      handleNodeMouseDown(node.id, e);
                    } else {
                      // In connection mode, prevent default drag behavior
                      e.preventDefault();
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    
                    // If in connection mode, create connection (priority over selection)
                    if (connectionMode && connectionSource) {
                      if (connectionSource === node.id) {
                        toast.info("Cannot connect a node to itself");
                        setConnectionMode(false);
                        setConnectionSource(null);
                        return;
                      }
                      handleCreateConnection(node.id);
                      return;
                    }

                    // Only select if we didn't just drag (simple click - less than 5px movement)
                    // But skip if we just finished dragging
                    if (!isDragging && dragDistance <= 5) {
                      setSelectedNode(node.id);
                      setSelectedLink(null);
                    }
                    
                    // Clear drag tracking after processing click
                    setTimeout(() => {
                      setDragStartPos(null);
                      setDragDistance(0);
                    }, 0);
                  }}
                >
                  <div className="p-3 h-full flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <Badge variant="outline" className="text-xs">
                        {node.type}
                      </Badge>
                      {isSelected && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0 hover:bg-destructive/20 z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteNode(node.id);
                          }}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          title="Delete node"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-2 flex-1 flex items-center">
                      <p 
                        className={cn(
                          "text-sm font-medium",
                          isSelected ? "line-clamp-2 break-words" : "truncate"
                        )}
                        title={isSelected ? undefined : node.label} // Native tooltip fallback
                      >
                        {node.label}
                      </p>
                    </div>
              {isSelected && node.data && node.data.id && (
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  ID: {String(node.data.id).slice(0, 8)}...
                </p>
              )}
              {isSelected && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditNode(node.id);
                  }}
                >
                  <Edit className="w-3 h-3 mr-2" />
                  Edit
                </Button>
              )}
                  </div>
                </Card>
              </TooltipTrigger>
              {isLabelTruncated && !isSelected && (
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-medium">{node.label}</p>
                    {node.type === 'asset' && node.data && (
                      <p className="text-xs text-muted-foreground">
                        Type: {node.type}
                      </p>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}

        {/* Links */}
        <svg 
          className="absolute inset-0" 
          style={{ zIndex: 1, pointerEvents: connectionMode ? 'none' : 'auto' }}
          width="100%"
          height="100%"
        >
          {links.map((link) => {
            const source = nodes.find(n => n.id === link.source);
            const target = nodes.find(n => n.id === link.target);
            if (!source || !target) return null;

            // Calculate center points
            const sourceCenterX = source.x + source.width / 2;
            const sourceCenterY = source.y + source.height / 2;
            const targetCenterX = target.x + target.width / 2;
            const targetCenterY = target.y + target.height / 2;

            // Calculate intersection points at node edges
            const sourceEdge = getEdgeIntersection(
              sourceCenterX,
              sourceCenterY,
              targetCenterX,
              targetCenterY,
              source.x,
              source.y,
              source.width,
              source.height
            );
            
            const targetEdge = getEdgeIntersection(
              targetCenterX,
              targetCenterY,
              sourceCenterX,
              sourceCenterY,
              target.x,
              target.y,
              target.width,
              target.height
            );
            
            const x1 = sourceEdge.x;
            const y1 = sourceEdge.y;
            const x2 = targetEdge.x;
            const y2 = targetEdge.y;

            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            const isSelected = selectedLink === link.id;
            const strokeColor = isSelected ? "#3b82f6" : "#6b7280";
            const strokeWidth = isSelected ? 3 : 2;
            const markerId = `arrowhead-${isSelected ? 'selected' : 'default'}`;

            return (
              <g key={link.id}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  markerEnd={`url(#${markerId})`}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLink(link.id);
                    setSelectedNode(null);
                  }}
                  style={{ pointerEvents: 'auto' }}
                />
                {/* Connection label */}
                <g
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedLink(link.id);
                    setSelectedNode(null);
                  }}
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                >
                  <rect
                    x={midX - 30}
                    y={midY - 10}
                    width={60}
                    height={20}
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke={strokeColor}
                    strokeWidth={1}
                    rx={4}
                  />
                  <text
                    x={midX}
                    y={midY + 5}
                    textAnchor="middle"
                    fontSize="10"
                    fill={strokeColor}
                    fontWeight={isSelected ? "bold" : "normal"}
                  >
                    {link.type === 'data-flow' ? 'Data Flow' : 'Dependency'}
                  </text>
                </g>
              </g>
            );
          })}
          <defs>
            <marker
              id="arrowhead-default"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
            </marker>
            <marker
              id="arrowhead-selected"
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
            </marker>
          </defs>
        </svg>

        {/* Connection mode indicator */}
        {connectionMode && connectionSource && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Link2 className="w-4 h-4" />
              <span className="text-sm font-medium">Click on a node to connect</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 ml-2"
                onClick={handleCancelConnection}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No elements on canvas</p>
              <Button onClick={handleAddAsset}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Asset
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Info panel */}
      {(selectedNode || selectedLink) && (
        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center justify-between">
            <div>
              {selectedNode && (
                <>
                  <p className="font-medium">
                    {nodes.find(n => n.id === selectedNode)?.label}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Type: {nodes.find(n => n.id === selectedNode)?.type}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Connections: {links.filter(l => l.source === selectedNode || l.target === selectedNode).length}
                  </p>
                </>
              )}
              {selectedLink && (
                <>
                  <p className="font-medium mb-2">Connection</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <Select
                        value={links.find(l => l.id === selectedLink)?.type || 'data-flow'}
                        onValueChange={(value: 'data-flow' | 'dependency') => 
                          handleChangeLinkType(selectedLink, value)
                        }
                      >
                        <SelectTrigger className="w-40 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="data-flow">Data Flow</SelectItem>
                          <SelectItem value="dependency">Dependency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {nodes.find(n => n.id === links.find(l => l.id === selectedLink)?.source)?.label} → {nodes.find(n => n.id === links.find(l => l.id === selectedLink)?.target)?.label}
                    </p>
                  </div>
                </>
              )}
              {selectedNode && (
                <div className="mt-4 pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleEditNode(selectedNode)}
                  >
                    <Edit className="w-3 h-3 mr-2" />
                    Edit Node
                  </Button>
                </div>
              )}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedNode(null);
                setSelectedLink(null);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentDiagramId ? "Update Diagram" : "Save Diagram"}</DialogTitle>
            <DialogDescription>
              Save your threat model diagram for later use.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="diagram-name">Name *</Label>
              <Input
                id="diagram-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Enter diagram name"
              />
            </div>
            <div>
              <Label htmlFor="diagram-description">Description</Label>
              <Textarea
                id="diagram-description"
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                placeholder="Enter diagram description (optional)"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {currentDiagramId ? "Update" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={isLoadDialogOpen} onOpenChange={setIsLoadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Diagram</DialogTitle>
            <DialogDescription>
              Select a saved threat model diagram to load.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {savedDiagrams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No saved diagrams found
              </p>
            ) : (
              savedDiagrams.map((diagram) => (
                <div
                  key={diagram.diagram_id}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleLoad(diagram.diagram_id)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{diagram.name}</p>
                      {diagram.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {diagram.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(diagram.created_at).toLocaleDateString()}
                        {diagram.creator_name && ` by ${diagram.creator_name}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoad(diagram.diagram_id);
                      }}
                    >
                      Load
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLoadDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Node Dialog */}
      <Dialog open={isEditNodeDialogOpen} onOpenChange={setIsEditNodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Node</DialogTitle>
            <DialogDescription>
              Update node properties.
            </DialogDescription>
          </DialogHeader>
          {editingNode && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="node-label">Label</Label>
                <Input
                  id="node-label"
                  value={editingNode.label}
                  onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
                />
              </div>
              {editingNode.type === "threat" && availableThreats.length > 0 && (
                <div>
                  <Label htmlFor="link-threat">Link to Threat Record</Label>
                  <Select
                    value={editingNode.data?.threatId || ""}
                    onValueChange={(value) => {
                      if (value) {
                        handleLinkThreatToRecord(editingNode.id, value);
                        setEditingNode({
                          ...editingNode,
                          data: { ...editingNode.data, threatId: value }
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a threat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {availableThreats.map((threat) => (
                        <SelectItem key={threat.id} value={threat.id}>
                          {threat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditNodeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNodeEdit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}

