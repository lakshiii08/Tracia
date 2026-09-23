"use client";

import { useEffect, useRef, useState } from "react";
import { DataSet } from "vis-data";
import { Network } from "vis-network";
import type { Options } from "vis-network";
import {
  entityColors,
  type GraphNode,
  type GraphEdge,
} from "@/lib/graphData";

interface RelationshipGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onSelectNode: (node: GraphNode | null) => void;
  selectedNode?: GraphNode | null;
}

const edgeColorByKind: Record<string, string> = {
  direct: "#64748b",
  inferred: "#a855f7",
  temporal: "#f59e0b",
  suspicious: "#ef4444",
};

export default function RelationshipGraph({
  nodes: graphNodes,
  edges: graphEdges,
  onSelectNode,
  selectedNode,
}: RelationshipGraphProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const networkRef = useRef<Network | null>(null);
  const onSelectNodeRef = useRef(onSelectNode);

  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  useEffect(() => {
    onSelectNodeRef.current = onSelectNode;
  }, [onSelectNode]);

  // Zoom and fit controls
  const handleZoomIn = () => {
    if (!networkRef.current) return;
    const currentScale = networkRef.current.getScale();
    networkRef.current.moveTo({ scale: currentScale * 1.3, animation: { duration: 250, easingFunction: "easeInOutQuad" } });
  };

  const handleZoomOut = () => {
    if (!networkRef.current) return;
    const currentScale = networkRef.current.getScale();
    networkRef.current.moveTo({ scale: currentScale * 0.75, animation: { duration: 250, easingFunction: "easeInOutQuad" } });
  };

  const handleFit = () => {
    if (!networkRef.current) return;
    networkRef.current.fit({ animation: { duration: 400, easingFunction: "easeInOutQuad" } });
  };

  const togglePhysics = () => {
    if (!networkRef.current) return;
    const nextState = !physicsEnabled;
    setPhysicsEnabled(nextState);
    networkRef.current.setOptions({ physics: { enabled: nextState } });
  };

  // Build and mount graph network
  useEffect(() => {
    if (!containerRef.current) return;

    // Deduplicate nodes and edges by id
    const uniqueNodesMap = new Map<string, GraphNode>();
    graphNodes.forEach((n) => {
      if (n && n.id && !uniqueNodesMap.has(n.id)) {
        uniqueNodesMap.set(n.id, n);
      }
    });
    const uniqueGraphNodes = Array.from(uniqueNodesMap.values());

    const uniqueEdgesMap = new Map<string, GraphEdge>();
    graphEdges.forEach((e) => {
      if (e && e.id && !uniqueEdgesMap.has(e.id)) {
        uniqueEdgesMap.set(e.id, e);
      }
    });
    const uniqueGraphEdges = Array.from(uniqueEdgesMap.values());

    const nodes = new DataSet(
      uniqueGraphNodes.map((n) => {
        const isHub = n.id === "per_a" || (n.details?.connections && n.details.connections > 10);
        const nodeColor = entityColors[n.type] || "#94a3b8";

        return {
          id: n.id,
          label: n.label,
          shape: "dot",
          size: isHub ? 26 : n.risk === "high" ? 22 : 17,
          color: {
            background: "#0f172a",
            border: n.risk === "high" ? "#ef4444" : nodeColor,
            highlight: {
              background: "#1e293b",
              border: "#38bdf8",
            },
            hover: {
              background: "#1e293b",
              border: nodeColor,
            },
          },
          borderWidth: n.risk === "high" ? 3 : isHub ? 3 : 2,
          shadow: {
            enabled: true,
            color: "rgba(0, 0, 0, 0.4)",
            size: 6,
            x: 0,
            y: 2,
          },
          font: {
            color: "#f8fafc",
            size: isHub ? 12 : 11,
            face: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
            strokeWidth: 3,
            strokeColor: "#020617",
            vadjust: 4,
          },
          title: `${n.label} (${n.type.toUpperCase()})${n.details?.subtitle ? `\n${n.details.subtitle}` : ""}`,
        };
      })
    );

    const edges = new DataSet(
      uniqueGraphEdges.map((e) => {
        const isSuspicious = e.kind === "suspicious";
        const isTemporal = e.kind === "temporal";
        const isDashed = isSuspicious || isTemporal || e.kind === "inferred";
        const strokeColor = edgeColorByKind[e.kind] || "#64748b";

        return {
          id: e.id,
          from: e.from,
          to: e.to,
          label: e.label,
          dashes: isDashed ? (isSuspicious ? [6, 4] : [4, 4]) : false,
          width: isSuspicious ? 2 : 1.5,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 0.6,
              type: "arrow",
            },
          },
          color: {
            color: strokeColor,
            highlight: "#38bdf8",
            hover: "#93c5fd",
            opacity: 0.85,
          },
          font: {
            color: "#94a3b8",
            size: 9,
            face: "ui-monospace, SFMono-Regular, Menlo, monospace",
            strokeWidth: 0,
            background: "#090d16",
            align: "horizontal",
          },
          smooth: {
            enabled: true,
            type: "continuous",
            roundness: 0.2,
          },
        };
      })
    );

    const options: Options = {
      physics: {
        enabled: true,
        solver: "forceAtlas2Based",
        forceAtlas2Based: {
          gravitationalConstant: -55,
          centralGravity: 0.012,
          springLength: 130,
          springConstant: 0.06,
          damping: 0.5,
          avoidOverlap: 0.75,
        },
        stabilization: {
          enabled: true,
          iterations: 180,
          updateInterval: 25,
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 120,
        selectable: true,
        multiselect: false,
        zoomView: true,
        dragView: true,
        dragNodes: true,
        navigationButtons: false,
      },
      nodes: {
        scaling: {
          min: 16,
          max: 32,
        },
      },
    };

    const network = new Network(containerRef.current, { nodes, edges }, options);
    networkRef.current = network;

    // After stabilization, gently freeze physics so dragging doesn't shake everything
    network.once("stabilizationIterationsDone", () => {
      network.setOptions({ physics: { enabled: false } });
      setPhysicsEnabled(false);
    });

    network.on("click", (params) => {
      network.setOptions({ physics: { enabled: false } });
      setPhysicsEnabled(false);

      if (params.nodes.length > 0) {
        const id = params.nodes[0];
        const node = graphNodes.find((n) => n.id === id) ?? null;
        onSelectNodeRef.current(node);

        // Highlight connected subgraph
        const connectedNodes = network.getConnectedNodes(id) as string[];
        const allConnected = new Set([id, ...connectedNodes]);

        // Update opacity
        const updatedNodes = uniqueGraphNodes.map((n) => {
          const isConnected = allConnected.has(n.id);
          return {
            id: n.id,
            opacity: isConnected ? 1.0 : 0.25,
          };
        });
        nodes.update(updatedNodes);
      } else {
        onSelectNodeRef.current(null);
        // Reset all nodes opacity
        const resetNodes = uniqueGraphNodes.map((n) => ({
          id: n.id,
          opacity: 1.0,
        }));
        nodes.update(resetNodes);
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, [graphNodes, graphEdges]);

  // Keep the selected-node badge in sync without refitting or re-centering the graph.
  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.setOptions({ physics: { enabled: false } });
    if (selectedNode) {
      networkRef.current.selectNodes([selectedNode.id], false);
    } else {
      networkRef.current.unselectAll();
    }
  }, [selectedNode]);

  return (
    <div className="relative w-full h-full bg-[#070a11] overflow-hidden select-none">
      {/* Tactical Dot Matrix Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Main Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Graph Floating Action Toolbar (Top-Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface-container/90 p-1 backdrop-blur-md shadow-lg z-10">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
        >
          <span className="material-symbols-outlined text-[17px]">add</span>
        </button>

        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
        >
          <span className="material-symbols-outlined text-[17px]">remove</span>
        </button>

        <div className="h-4 w-[1px] bg-outline-variant/60 mx-0.5" />

        <button
          onClick={handleFit}
          title="Fit to Screen"
          className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition"
        >
          <span className="material-symbols-outlined text-[17px]">crop_free</span>
        </button>

        <button
          onClick={togglePhysics}
          title={physicsEnabled ? "Freeze Physics (Pin Nodes)" : "Enable Physics (Auto Layout)"}
          className={`flex h-7 w-7 items-center justify-center rounded transition ${
            physicsEnabled
              ? "bg-primary/20 text-primary font-semibold"
              : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {physicsEnabled ? "motion_photos_on" : "motion_photos_off"}
          </span>
        </button>
      </div>

      {/* Graph Status Badge (Bottom-Left) */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container/85 px-2.5 py-1 text-[11px] font-mono text-outline backdrop-blur-sm pointer-events-none z-10">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span>{graphNodes.length} Nodes</span>
        <span>·</span>
        <span>{graphEdges.length} Edges</span>
        {selectedNode && (
          <>
            <span>·</span>
            <span className="text-primary font-semibold">Selected: {selectedNode.label}</span>
          </>
        )}
      </div>
    </div>
  );
}
