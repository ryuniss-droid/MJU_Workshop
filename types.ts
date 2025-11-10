import React from 'react';

// FIX: Removed self-import causing declaration conflicts.

export interface MissionStatement {
  companyOrProject?: string;
  vision?: string;
  challenge?: string;
  approach?: string;
  valueProposition?: string;
}

export interface UserInput {
  domain: string;
  missionStatement: MissionStatement;
}

export interface RelationalFrameworkInput {
  relationshipAxes: string[];
  selectedSubCategories: string[];
  temporality: string[];
  spatialScope: string[];
}

export interface KeywordPair {
  en: string;
  ko: string;
}

export interface RefinedKeyword extends KeywordPair {
    id: string;
    score?: 1 | 2 | 3;
    label: 'Core' | 'Reference';
}

export interface GeneratedKeywordsResponse {
  actional: KeywordPair[];
  sensory: KeywordPair[];
  symbolic: KeywordPair[];
  thematic: KeywordPair[];
}

export interface ImageReference {
  id: string;
  imageBase64: string;
  imageMimeType: string;
}

export interface StyleReference {
  id: string;
  imageBase64?: string;
  imageMimeType?: string;
  srefCode?: string;
}

export interface ResultImage {
  id: string;
  imageBase64: string;
  imageMimeType: string;
  isHighlighted?: boolean;
}

export interface PromptDiff {
    added: string;
    removed: string;
    changed: string;
}

export interface IterationNode {
  id: string;
  parentId: string | null;
  creationAction: string;
  prompt: string[];
  parameters: string;
  analysis: string;
  nextPlan: string;
  processCommentary?: string;
  imagePrompts: ImageReference[];
  styleReferences: StyleReference[];
  resultImages: ResultImage[];
  sourceResultImageId?: string;
  promptDiff?: PromptDiff;
}

export interface ReferenceAnalysisItem {
    id: string;
    imageBase64?: string;
    imageMimeType?: string;
    descriptions: string[];
    isGeneratingDescription?: boolean;
    isExtractingKeywords?: boolean;
}

export type AppState = 'projectInput' | 'frameworkInput' | 'generating' | 'results' | 'refinement' | 'exploration' | 'convergence' | 'error';

export interface Project {
    id: string;
    name: string;
    lastModified: number;
    appState: AppState;
    userInput: UserInput;
    frameworkInput: RelationalFrameworkInput | null;
    keywords: GeneratedKeywordsResponse | null;
    refinedKeywords: RefinedKeyword[];
    emergentKeywords: KeywordPair[];
    iterationNodes: IterationNode[];
    error: string | null;
}