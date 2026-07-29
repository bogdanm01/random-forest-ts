export type MatrixRow = (number | string)[];
export type Matrix = MatrixRow[];

export interface SplitResult {
  match: Matrix;
  noMatch: Matrix;
}

export interface Node {
  type: "leaf" | "decision";
  left?: Node | null;
  right?: Node | null;
  prediction?: string | number;
  attributeIndex?: number;
  attributeValue?: string | number;
}

export interface Forest {
  trees: Node[];
}

export interface RandomForestOptions {
  maxDepth?: number;
  minSamplesSplit?: number;
  numTrees?: number;
}
