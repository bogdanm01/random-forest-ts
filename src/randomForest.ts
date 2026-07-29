import type {
  Forest,
  Matrix,
  MatrixRow,
  Node,
  RandomForestOptions,
  SplitResult,
} from "./randomForest.types.js";

/**
 * Trains a Random Forest classifier by constructing an ensemble of decision trees.
 *
 * Employs bootstrap aggregating (bagging) by drawing random samples with replacement
 * from the input dataset to train each individual decision tree.
 *
 * @param dataSet - Matrix of training data where each row represents a sample and the final column contains the target label.
 * @param options - Configuration settings for building the forest, including tree depth, split criteria, and the total number of trees.
 *
 * @returns A `Forest` object containing the collection of trained decision tree root nodes.
 */
export function trainForest(
  dataSet: Matrix,
  options: RandomForestOptions,
): Forest {
  const trees = [];

  for (let i = 0; i < options.numTrees!; i++) {
    const sample = bootstrapSample(dataSet);
    const tree = trainTree(sample, options);

    if (tree) {
      trees.push(tree);
    }
  }

  return {
    trees: trees,
  };
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
  treeOptions: RandomForestOptions,
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

  const result = findBestSplitWithFeatureSubSampling(dataset);

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
 * Finds the best split for a dataset by randomly selecting a subset of features (Feature Subsampling).
 *
 * Implements the Random Forest approach where a random subset of features is selected for each tree node.
 * For each selected feature, the weighted Gini impurity is evaluated across all candidate values,
 * returning the split that minimizes overall impurity.
 *
 * @param dataset - Matrix of data where each row represents a sample and the last column contains the target label.
 *
 * @returns An object containing the details of the best split:
 *  - `split`: An object containing the partitioned data (`match` and `noMatch`), or `null` if no valid split was found.
 *  - `attributeValue`: The specific feature value used to split the data, or `null`.
 *  - `minGini`: The lowest calculated weighted Gini impurity.
 *  - `columnIndex`: The column index of the feature that yielded the best split.
 */
function findBestSplitWithFeatureSubSampling(dataset: Matrix) {
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

  const totalFeatures = dataset[0].length - 1;
  const numberOfAttributes = Math.floor(Math.sqrt(totalFeatures)) || 1;

  const allIndices = Array.from({ length: totalFeatures }, (_, i) => i);
  const selectedAttributes = allIndices
    .sort(() => Math.random() - 0.5)
    .slice(0, numberOfAttributes);

  for (let colIndex of selectedAttributes) {
    const featureSet = new Set<string | number>();

    for (let rowIndex = 0; rowIndex < dataset.length; rowIndex++) {
      const featureValue = dataset[rowIndex]?.[colIndex];

      if (
        featureValue !== undefined &&
        featureValue !== null &&
        !featureSet.has(featureValue)
      ) {
        featureSet.add(featureValue);
        const split = findSplit(dataset, colIndex, featureValue);

        if (split.match.length === 0 || split.noMatch.length === 0) {
          continue;
        }

        const weightedGini = calculateWeightedGini(split, dataset.length);

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
function calculateWeightedGini(split: SplitResult, totalSampleSize: number) {
  return (
    (split.match.length / totalSampleSize) *
      calculateGiniImpurity(split.match) +
    (split.noMatch.length / totalSampleSize) *
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
function predictSingleTree(
  tree: Node,
  input: MatrixRow,
): string | number | null {
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
 * Predicts the target outcome for a single input record using majority voting across all trees in the forest.
 *
 * Traverses each decision tree within the ensemble to generate an individual prediction,
 * then tallies the results and returns the class label that received the highest number of votes.
 *
 * @param forest - The trained Random Forest model containing an array of decision trees.
 * @param input - A single row of features representing the input sample to classify.
 *
 * @returns The majority-voted prediction label (string or number), or `null` if the forest contains no trees.
 */
export function predictForest(
  forest: Forest,
  input: MatrixRow,
): string | number | null {
  if (!forest.trees.length) {
    return null;
  }

  const votes = new Map<string | number, number>();

  for (const tree of forest.trees) {
    const prediction = predictSingleTree(tree, input);

    if (prediction !== null) {
      const currentVotes = votes.get(prediction) ?? 0;
      votes.set(prediction, currentVotes + 1);
    }
  }

  let maxVotes = -1;
  let winningClass: string | number | null = null;

  votes.forEach((count, label) => {
    if (count > maxVotes) {
      maxVotes = count;
      winningClass = label;
    }
  });

  return winningClass;
}

/**
 * Generates a bootstrap sample from the dataset using sampling with replacement.
 *
 * Creates a new dataset of equal length to the original by randomly selecting rows
 * uniformly at random, allowing individual rows to be chosen multiple times.
 *
 * @param dataset - Matrix of training data to sample from.
 *
 * @returns A new matrix containing the bootstrapped sample of rows.
 */
function bootstrapSample(dataset: Matrix): Matrix {
  const samples: Matrix = [];
  const n = dataset.length;

  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * n);
    samples.push(dataset[randomIndex]!);
  }

  return samples;
}
