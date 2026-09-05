'use client';

import React from 'react';
import { TutorVisualData } from '@/types';
import { HierarchyVisual } from './HierarchyVisual';
import { ComparisonTableVisual } from './ComparisonTableVisual';
import { StepSequenceVisual } from './StepSequenceVisual';
import { NetworkGraphVisual } from './NetworkGraphVisual';
import { TimelineVisual } from './TimelineVisual';
import { FormulaBreakdownVisual } from './FormulaBreakdownVisual';
import { ProcessFlowVisual } from './ProcessFlowVisual';
import { CodeFlowVisual } from './CodeFlowVisual';
import { ConceptMapVisual } from './ConceptMapVisual';
import { MermaidRenderer } from '../MermaidRenderer';

interface VisualExplanationProps {
  visual?: TutorVisualData;
}

export function VisualExplanation({ visual }: VisualExplanationProps) {
  if (!visual || visual.type === 'none') {
    return null;
  }

  // If Mermaid code is present without structured payload, render MermaidRenderer
  if (
    visual.mermaidCode &&
    !visual.hierarchyLayers &&
    !visual.comparisonTable &&
    !visual.stepSequence &&
    !visual.timelineEvents &&
    !visual.formulaBreakdown &&
    !visual.codeFlow
  ) {
    return <MermaidRenderer code={visual.mermaidCode} title={visual.title} />;
  }

  switch (visual.type) {
    case 'hierarchy':
      return (
        <HierarchyVisual
          title={visual.title}
          subtitle={visual.subtitle}
          layers={visual.hierarchyLayers}
        />
      );

    case 'comparison_table':
      return (
        <ComparisonTableVisual
          title={visual.title}
          data={visual.comparisonTable}
        />
      );

    case 'step_sequence':
      return (
        <StepSequenceVisual
          title={visual.title}
          steps={visual.stepSequence}
        />
      );

    case 'network_graph':
      return (
        <NetworkGraphVisual
          title={visual.title}
          nodes={visual.diagramNodes}
          edges={visual.diagramEdges}
          mermaidCode={visual.mermaidCode}
          startNode={visual.startNode}
        />
      );

    case 'timeline':
      return (
        <TimelineVisual
          title={visual.title}
          events={visual.timelineEvents}
        />
      );

    case 'formula_breakdown':
      return (
        <FormulaBreakdownVisual
          title={visual.title}
          data={visual.formulaBreakdown}
        />
      );

    case 'flowchart':
    case 'process_diagram':
      return (
        <ProcessFlowVisual
          title={visual.title}
          nodes={visual.diagramNodes}
          edges={visual.diagramEdges}
          mermaidCode={visual.mermaidCode}
        />
      );

    case 'code_flow':
      return (
        <CodeFlowVisual
          title={visual.title}
          data={visual.codeFlow}
        />
      );

    case 'concept_map':
    case 'architecture_diagram':
      return (
        <ConceptMapVisual
          title={visual.title}
          nodes={visual.diagramNodes}
          edges={visual.diagramEdges}
          mermaidCode={visual.mermaidCode}
        />
      );

    default:
      if (visual.mermaidCode) {
        return <MermaidRenderer code={visual.mermaidCode} title={visual.title} />;
      }
      return null;
  }
}
