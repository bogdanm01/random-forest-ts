type MatrixRow = (number | string)[];
type Matrix = MatrixRow[];

interface SplitResult {
  match: Matrix;
  noMatch: Matrix;
}

interface Node {
  type: "leaf" | "decision";
  left?: Node | null;
  right?: Node | null;
  prediction?: string | number;
  attributeIndex?: number;
  attributeValue?: string | number;
}

interface Forest {
  trees: Node[];
}

interface TreeOptions {
  maxDepth?: number;
  minSamplesSplit?: number;
}

/**
 * Recursively builds a decision tree from a dataset using Gini impurity.
 *
 * Evaluates stopping conditions at each node (pure subset or no valid splits remaining)
 * to construct leaf nodes. For non-terminal nodes, finds the optimal feature split,
 * creates a decision node, and recursively generates the left (`match`) and
 * right (`noMatch`) subtrees.
 *
 * @param dataset - The matrix of training samples where each row contains feature
 * values ending with the target class label.
 *
 * @returns The root `Node` of the trained decision tree, or a single leaf node if training
 * stops immediately. Returns `null` if the dataset cannot be processed.
 */
function trainTree(
  dataset: Matrix,
  treeOptions: TreeOptions,
  currentDepth: number = 0,
): Node | null {
  if (calculateGiniImpurity(dataset) === 0) {
    return {
      type: "leaf",
      prediction: getMajorityClass(dataset),
    };
  }

  if (
    (treeOptions.minSamplesSplit &&
      dataset.length < treeOptions.minSamplesSplit) ||
    (treeOptions.maxDepth !== undefined && currentDepth >= treeOptions.maxDepth)
  ) {
    return {
      type: "leaf",
      prediction: getMajorityClass(dataset),
    };
  }

  const result = findBestSplit(dataset);

  if (
    !result.split ||
    result?.split?.match.length === 0 ||
    result?.split?.noMatch.length === 0
  ) {
    return {
      type: "leaf",
      prediction: getMajorityClass(dataset),
    };
  }

  const leftChild = trainTree(
    result?.split?.match!,
    treeOptions,
    currentDepth + 1,
  );
  const rightChild = trainTree(
    result?.split?.noMatch!,
    treeOptions,
    currentDepth + 1,
  );

  return {
    type: "decision",
    attributeIndex: result?.columnIndex,
    attributeValue: result?.attributeValue!,
    left: leftChild,
    right: rightChild,
  };
}

/**
 * Determines the majority class label within a dataset by frequency count.
 *
 * Iterates through the target labels (assumed to be the final element of each row)
 * and tracks frequency counts to find the most common class. Used by leaf nodes
 * when training stops or when a dataset cannot be split further.
 *
 * @param dataset - The matrix of samples to analyze, where the target class label
 * resides in the last column of each row.
 *
 * @returns The class label (`string` or `number`) with the highest occurrence count,
 * or an empty string `""` if the dataset is empty.
 */
function getMajorityClass(dataset: Matrix): string | number {
  if (dataset.length === 0) return "";

  const map = new Map<string | number, number>();
  let majorityClass: string | number = dataset[0]![dataset[0]!.length - 1]!;
  let topCount = 0;

  for (const row of dataset) {
    const label = row[row.length - 1];
    if (label === undefined) continue;

    const count = (map.get(label) ?? 0) + 1;
    map.set(label, count);

    if (count > topCount) {
      topCount = count;
      majorityClass = label;
    }
  }

  return majorityClass;
}

/**
 * Evaluates all possible feature splits across a dataset to find the partition
 * that yields the lowest weighted Gini impurity.
 *
 * Iterates through every feature column (excluding the target class in the last column)
 * and tests each unique feature value as a potential split candidate using `findSplit`.
 * Computes the weighted Gini impurity for each partition and returns the split criteria
 * that minimizes child node impurity (maximizing Gini reduction).
 *
 * @param dataset - The matrix of samples to evaluate, where each row consists of feature
 * values followed by the target class label in the final column.
 *
 * @returns An object containing the details of the optimal split:
 * - `split`: The resulting `SplitResult` (`match` and `noMatch` subsets), or `null` if no valid split reduces impurity.
 * - `attributeValue`: The threshold or feature value used for the best split criteria, or `null` if no split is found.
 * - `minGini`: The lowest weighted Gini impurity score achieved by the best split. Defaults to `Number.MAX_VALUE` if no valid split exists.
 * - `columnIndex`: The index of the column/attribute corresponding to the best split criteria.
 */
function findBestSplit(dataset: Matrix) {
  let minGini = Number.MAX_VALUE;
  let bestSplit: SplitResult | null = null;
  let bestAttributeValue: string | number | null = null;
  let bestColumnIndex = 0;

  if (dataset.length === 0 || !dataset[0]) {
    return {
      split: null,
      attributeValue: null,
      minGini: Number.MAX_VALUE,
      columnIndex: 0,
    };
  }

  const classIndex = dataset[0].length - 1;

  for (let colIndex = 0; colIndex < classIndex; colIndex++) {
    const featureSet = new Set<string | number>();

    for (let rowIndex = 0; rowIndex < dataset.length; rowIndex++) {
      const featureValue = dataset[rowIndex]?.[colIndex];

      if (featureValue !== undefined && !featureSet.has(featureValue)) {
        featureSet.add(featureValue);
        const split = findSplit(dataset, colIndex, featureValue);

        if (split.match.length === 0 || split.noMatch.length === 0) {
          continue;
        }

        const weightedGini = calculateWeightedGini(split, dataset);

        if (weightedGini < minGini) {
          minGini = weightedGini;
          bestSplit = split;
          bestAttributeValue = featureValue;
          bestColumnIndex = colIndex;
        }
      }
    }
  }

  return {
    split: bestSplit,
    attributeValue: bestAttributeValue,
    minGini: minGini,
    columnIndex: bestColumnIndex,
  };
}

/**
 * Calculates the weighted Gini impurity for a candidate data split.
 *
 * Computes the Gini impurity for both the `match` and `noMatch` subsets,
 * weighting each subset by its proportion relative to the total dataset size.
 *
 * @param split - The candidate split containing the partitioned `match` and `noMatch` subsets.
 * @param dataset - The parent matrix before the split, used to determine total sample size.
 *
 * @returns The total weighted Gini impurity score for the split. A lower value indicates
 * a purer partition.
 */
function calculateWeightedGini(split: SplitResult, dataset: Matrix) {
  return (
    (split.match.length / dataset.length) * calculateGiniImpurity(split.match) +
    (split.noMatch.length / dataset.length) *
      calculateGiniImpurity(split.noMatch)
  );
}

/**
 * Partitions a dataset into two subsets based on an attribute index and threshold value.
 *
 * - **Numeric values:** Uses a `>=` threshold check (`row[columnIndex] >= value`).
 * - **String values:** Uses exact equality (`row[columnIndex] === value`).
 *
 * @param dataSet - The input matrix (array of rows) to be split.
 * @param columnIndex - The index of the column/attribute to test against.
 * @param value - The value or threshold used as the splitting criteria.
 *
 * @returns An object containing two matrices: `match` (rows satisfying the condition)
 * and `noMatch` (rows that do not).
 */
function findSplit(
  dataSet: Matrix,
  columnIndex: number,
  value: string | number,
): SplitResult {
  const match = [];
  const noMatch = [];

  for (const row of dataSet) {
    const columnVal = row[columnIndex];

    if (typeof value === "number") {
      if (typeof columnVal === "number" && columnVal >= value) {
        match.push(row);
      } else {
        noMatch.push(row);
      }
    } else {
      if (columnVal === value) {
        match.push(row);
      } else {
        noMatch.push(row);
      }
    }
  }

  return { match, noMatch };
}

/**
 * Calculates the Gini impurity for a given dataset (matrix).
 *
 * **ELI5:** Imagine picking an item from a bag with your eyes closed. Gini impurity
 * measures how likely you are to guess its label wrong.
 * - `0` means the bag has only one label (100% pure, no confusion).
 * - Higher values mean the labels are mixed up (high confusion).
 *
 * The target class label is assumed to be the **last element** of each row.
 *
 * @param data - The matrix of samples, where each row is an array of attributes
 * ending with the target class label (e.g., `["Green", 3, "Apple"]`).
 *
 * @returns The Gini impurity score between `0.0` (pure) and `1 - (1 / C)`
 * (where `C` is the number of unique classes). Returns `0` if the matrix is empty.
 */
function calculateGiniImpurity(data: Matrix): number {
  const total = data.length;

  if (total === 0) {
    return 0;
  }

  const map = new Map<string, number>();

  for (let row of data) {
    const label = String(row[row.length - 1]);
    const currentCount = map.get(label) ?? 0;
    map.set(label, currentCount + 1);
  }

  let giniImpurity = 1;

  for (let count of map.values()) {
    giniImpurity = giniImpurity - Math.pow(count / total, 2);
  }

  return giniImpurity;
}

/**
 * Traverses a trained decision tree to predict the target class label for an input sample.
 *
 * Evaluates conditions at each decision node using either continuous threshold comparisons
 * (`>=` for numeric attributes) or categorical equality checks (`===` for non-numeric attributes),
 * following matching outcomes down the `left` subtree and non-matching outcomes down the `right`
 * subtree until reaching a leaf node.
 *
 * @param tree - The root `Node` of the trained decision tree.
 * @param input - The array representing a single sample's feature values (`MatrixRow`).
 *
 * @returns The predicted class label (`string` or `number`) if a leaf node is reached,
 * or `null` if traversal fails due to an invalid or incomplete tree structure.
 */
function predict(tree: Node, input: MatrixRow): string | number | null {
  let currentNode: Node | null = tree;

  while (currentNode && currentNode.type !== "leaf") {
    const attrIdx: number = currentNode.attributeIndex!;
    const inputVal: number | string | undefined = input[attrIdx];
    const targetVal: string | number | undefined = currentNode.attributeValue!;

    let isMatch = false;

    if (typeof targetVal === "number") {
      isMatch = typeof inputVal === "number" && inputVal >= targetVal;
    } else {
      isMatch = inputVal === targetVal;
    }

    currentNode = isMatch
      ? (currentNode.left ?? null)
      : (currentNode.right ?? null);
  }

  return currentNode?.prediction ?? null;
}

/**
 *
 * @param dataset
 */
export function bootstrapSample(dataset: Matrix): Matrix {
  const samples: Matrix = [];
  const n = dataset.length;

  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * n);
    samples.push(dataset[randomIndex]!);
  }

  return samples;
}
