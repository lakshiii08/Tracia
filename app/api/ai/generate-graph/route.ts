import { NextRequest, NextResponse } from "next/server";
import { generateAiKnowledgeGraph, deployAiGraphToNeo4j } from "@/lib/aiGraphGenerator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const dossierText = body.dossier;

    // 1. Generate graph using AI
    const generatedGraph = await generateAiKnowledgeGraph(dossierText);

    // 2. Deploy directly to Neo4j Aura cloud database
    const deployResult = await deployAiGraphToNeo4j(generatedGraph);

    return NextResponse.json({
      success: deployResult.success,
      message: deployResult.message,
      sourceModel: generatedGraph.sourceModel,
      summary: generatedGraph.summary,
      nodesCreated: deployResult.nodesCreated,
      edgesCreated: deployResult.edgesCreated,
      nodesSample: generatedGraph.nodes.slice(0, 6).map((n) => ({
        id: n.id,
        label: n.label,
        type: n.type,
        risk: n.risk,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate AI graph";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const generatedGraph = await generateAiKnowledgeGraph();
    return NextResponse.json({
      summary: generatedGraph.summary,
      sourceModel: generatedGraph.sourceModel,
      nodeCount: generatedGraph.nodes.length,
      edgeCount: generatedGraph.edges.length,
      sampleNodes: generatedGraph.nodes.slice(0, 8),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to preview AI graph";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
