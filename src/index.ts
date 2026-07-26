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
  prediction?: string;
  attributeIndex?: number;
  attributeValue?: string | number;
}

// TODO: Don't hardcode, infer fom training data
const CLASSES = ["Apple", "Grape", "Lemon"];

function trainTree(dataset: Matrix): Node | null {
  // Base Case 1: Gini impurity is 0 - return a pure leaf
  if (calculateGiniImpurity(dataset) === 0) {
    return {
      type: "leaf",
      prediction: "b1p",
    };
  }

  const split = findBestSplit(dataset);

  // Base Case 2: Data can't be split further
  if (
    split?.split?.match.length === 0 ||
    split?.split?.noMatch.length === 0 ||
    !split ||
    !split.split
  ) {
    return {
      type: "leaf",
      prediction: "b2p",
    };
  }

  const leftChild = trainTree(split?.split?.match!);
  const rightChild = trainTree(split?.split?.noMatch!);

  return {
    type: "decision",
    left: leftChild,
    right: rightChild,
    attributeIndex: split?.columnIndex,
    attributeValue: split?.attributeValue!,
  };
}

/**
 *
 * @param trainingData
 */
function findBestSplit(dataset: Matrix): {
  split: SplitResult | null;
  minGini: number;
  attributeValue: string | number | null;
  columnIndex: number;
} {
  let minGini = Number.MAX_VALUE;
  let bestSplit = null;
  let attributeValue = null;

  let classIndex = 0;
  let columnIndex = 0;

  if (dataset[0]) {
    classIndex = dataset[0].length - 1;
  }

  let rowIndex;
  let colIndex;

  const featureSet = new Set();

  for (colIndex = 0; colIndex < classIndex; colIndex++) {
    for (rowIndex = 0; rowIndex < trainingData.length; rowIndex++) {
      const featureValue = trainingData[rowIndex][colIndex];

      if (!featureSet.has(featureValue)) {
        const split = findSplit(dataset, colIndex, featureValue);

        if (split.match.length === 0 || split.noMatch.length === 0) {
          continue;
        }

        const weightedGini =
          (split.match.length / dataset.length) *
            calculateGiniImpurity(split.match) +
          (split.noMatch.length / dataset.length) *
            calculateGiniImpurity(split.noMatch);

        if (weightedGini < minGini) {
          minGini = weightedGini;
          bestSplit = split;
          attributeValue = featureValue;
          columnIndex = colIndex;
        }

        featureSet.add(featureValue);
      }
    }
  }

  return {
    split: bestSplit,
    attributeValue: attributeValue!,
    minGini: minGini,
    columnIndex: columnIndex,
  };
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

const trainingData: Matrix = [
  ["Green", 3, "Apple"],
  ["Yellow", 3, "Apple"],
  ["Red", 1, "Grape"],
  ["Red", 1, "Grape"],
  ["Yellow", 3, "Lemon"],
];

const res = trainTree(trainingData);
console.log(res);
