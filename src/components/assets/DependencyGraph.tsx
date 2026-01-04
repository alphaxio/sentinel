import { useEffect, useRef, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { useNavigate } from "react-router-dom";
import type { Asset } from "@/types";

interface AssetRelationship {
  relationship_id: string;
  source_asset_id: string;
  target_asset_id: string;
  relationship_type: string;
  source_asset?: { asset_id: string; name: string; type: string };
  target_asset?: { asset_id: string; name: string; type: string };
}

interface DependencyGraphProps {
  assetId: string;
  assetName: string;
  relationships: AssetRelationship[];
  allAssets: Asset[];
}

export function DependencyGraph({ assetId, assetName, relationships, allAssets }: DependencyGraphProps) {
  const navigate = useNavigate();
  const graphRef = useRef<any>();

  // Build graph data from relationships
  const graphData = useMemo(() => {
    const nodes = new Map<string, any>();
    const links: any[] = [];

    // Add current asset as center node
    const currentAsset = allAssets.find(a => a.id === assetId);
    if (currentAsset) {
      nodes.set(assetId, {
        id: assetId,
        name: currentAsset.name,
        type: currentAsset.type,
        isCenter: true,
      });
    } else {
      nodes.set(assetId, {
        id: assetId,
        name: assetName,
        type: "Application",
        isCenter: true,
      });
    }

    // Collect all related nodes
    relationships.forEach((rel) => {
      // Add source asset node
      let sourceNode = null;
      if (rel.source_asset) {
        sourceNode = {
          id: rel.source_asset_id,
          name: rel.source_asset.name,
          type: rel.source_asset.type,
          isCenter: rel.source_asset_id === assetId,
        };
      } else {
        const asset = allAssets.find(a => a.id === rel.source_asset_id);
        if (asset) {
          sourceNode = {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            isCenter: asset.id === assetId,
          };
        }
      }

      if (sourceNode && rel.source_asset_id !== assetId && !nodes.has(rel.source_asset_id)) {
        nodes.set(rel.source_asset_id, sourceNode);
      }

      // Add target asset node
      let targetNode = null;
      if (rel.target_asset) {
        targetNode = {
          id: rel.target_asset_id,
          name: rel.target_asset.name,
          type: rel.target_asset.type,
          isCenter: rel.target_asset_id === assetId,
        };
      } else {
        const asset = allAssets.find(a => a.id === rel.target_asset_id);
        if (asset) {
          targetNode = {
            id: asset.id,
            name: asset.name,
            type: asset.type,
            isCenter: asset.id === assetId,
          };
        }
      }

      if (targetNode && rel.target_asset_id !== assetId && !nodes.has(rel.target_asset_id)) {
        nodes.set(rel.target_asset_id, targetNode);
      }

      // Add link
      if (nodes.has(rel.source_asset_id) && nodes.has(rel.target_asset_id)) {
        links.push({
          source: rel.source_asset_id,
          target: rel.target_asset_id,
          type: rel.relationship_type,
          id: rel.relationship_id,
        });
      }
    });

    // Set initial positions in a circle to prevent clustering
    const nodeArray = Array.from(nodes.values());
    const centerNode = nodeArray.find(n => n.isCenter);
    const otherNodes = nodeArray.filter(n => !n.isCenter);
    
    // Center node at origin
    if (centerNode) {
      centerNode.x = 0;
      centerNode.y = 0;
      centerNode.fx = 0;
      centerNode.fy = 0; // Fix center node position
    }
    
    // Position other nodes in a circle
    const radius = Math.max(200, otherNodes.length * 40);
    otherNodes.forEach((node, index) => {
      const angle = (index / Math.max(otherNodes.length, 1)) * 2 * Math.PI - Math.PI / 2;
      node.x = Math.cos(angle) * radius;
      node.y = Math.sin(angle) * radius;
    });

    return {
      nodes: nodeArray,
      links: links,
    };
  }, [assetId, assetName, relationships, allAssets]);

  // Get node color based on type
  const getNodeColor = (node: any) => {
    if (node.isCenter) return "#3b82f6"; // Blue for center node
    
    const typeColors: Record<string, string> = {
      Application: "#10b981",
      Database: "#f59e0b",
      Microservice: "#8b5cf6",
      Cloud: "#06b6d4",
      Container: "#ec4899",
      Network: "#6366f1",
      Server: "#14b8a6",
      Infrastructure: "#64748b",
    };
    
    return typeColors[node.type] || "#6b7280";
  };

  // Get link color based on relationship type
  const getLinkColor = (link: any) => {
    const typeColors: Record<string, string> = {
      depends_on: "#ef4444",
      communicates_with: "#3b82f6",
      processes_data_from: "#10b981",
    };
    return typeColors[link.type] || "#6b7280";
  };

  // Center and fit graph
  const centerGraph = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50);
    }
  };

  // Initial centering
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      const timer1 = setTimeout(() => {
        centerGraph();
      }, 500);
      
      const timer2 = setTimeout(() => {
        centerGraph();
      }, 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [graphData]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] rounded-lg border border-border bg-muted/30">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">No relationships found</p>
          <p className="text-sm text-muted-foreground">
            Add relationships to see the dependency graph
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] rounded-lg border border-border overflow-hidden bg-background relative">
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={centerGraph}
          className="px-3 py-1.5 text-sm bg-background/90 backdrop-blur-sm border border-border rounded-md hover:bg-accent transition-colors text-foreground shadow-sm"
          title="Center graph"
        >
          Center Graph
        </button>
      </div>

      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `${node.name}\n(${node.type})`}
        nodeColor={getNodeColor}
        nodeVal={(node: any) => node.isCenter ? 12 : 8}
        nodeRelSize={8}
        linkLabel={(link: any) => link.type.replace(/_/g, ' ')}
        linkColor={getLinkColor}
        linkWidth={2}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.1}
        onNodeClick={(node: any) => {
          if (node.id !== assetId) {
            navigate(`/assets/${node.id}`);
          }
        }}
        onNodeHover={(node: any) => {
          if (node) {
            document.body.style.cursor = node.id !== assetId ? 'pointer' : 'default';
          } else {
            document.body.style.cursor = 'default';
          }
        }}
        // Use built-in SVG labels instead of custom canvas rendering
        cooldownTicks={200}
        onEngineStop={() => {
          // Release center node after simulation
          const centerNode = graphData.nodes.find((n: any) => n.isCenter);
          if (centerNode) {
            centerNode.fx = null;
            centerNode.fy = null;
          }
          setTimeout(() => {
            centerGraph();
          }, 100);
        }}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.4}
        warmupTicks={200}
        d3Force={(d3: any) => {
          // Center force
          d3.force('center', d3.forceCenter(0, 0).strength(0.1));
          
          // Link force
          d3.force('link', d3.forceLink(graphData.links)
            .id((d: any) => d.id)
            .distance(150)
            .strength(0.5)
          );
          
          // Collision force - critical for preventing overlap
          d3.force('collision', d3.forceCollide()
            .radius((d: any) => (d.isCenter ? 20 : 15))
            .strength(1.0)
          );
          
          // Charge force - repulsion
          d3.force('charge', d3.forceManyBody()
            .strength(-500)
          );
        }}
      />
    </div>
  );
}
