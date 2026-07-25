import { log } from "console";

type MatrixRow = (number | string)[];
type Matrix = MatrixRow[];

interface SplitResult {
  match: Matrix;
  noMatch: Matrix;
}

const CLASSES = ["Apple", "Grape", "Lemon"];

// # Gini impurity - koliko je svaki node "miksovan"
// # impurity od 0 znaci da node nije miksovan tj. ima samo jednu klasu
// # kako se tacno mery gini impurity? Pronaci formulu
// # informaiton gain -> koliko pitanje/uslov/split smanjuje gini index
// # koristimo gini index i information gain da bismo selektovali anjbolji split u svakom trenutku
// # rekurzivno delimo podatke dok nema vise pitanja
// # pokusavamo svaki split u trenutnom nodu i biramo najbolji (onaj koji ima najveci gain)
// # information gain = pocetni impurity - nastali impurity

// I=0 J=0
// I=1 J=0
// I=2 J=0
// I=3 J=0
// I=4 J=0

// I=0 J=1
// I=1 J=1
// I=2 J=1
// I=3 J=1
// I=4 J=1

// 1. Define training data set
const trainingData = [
  ["Green", 3, "Apple"],
  ["Yellow", 3, "Apple"],
  ["Red", 1, "Grape"],
  ["Red", 1, "Grape"],
  ["Yellow", 3, "Lemon"],
];

// [Green, Yellow, Red, 3, 1]

/*
    It should return reference to root node
    1. 
 */
function trainTree(trainingData: any[]) {
  // 1. Pronalazimo najbolje pitanje
  const bestSplit = findBestSplit(trainingData);
}

/**
 *
 * @param trainingData
 */
function findBestSplit(dataset: Matrix) {
  if (dataset.length < 1) {
    return;
  }

  // Get unique values for each feature
  // ? Loop through values create questions
  // use findSplit and calculateGiniImpurity

  let minGini = Number.MAX_VALUE;
  let bestSplit = null;
  let question = null;

  let classIndex = 0;

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
          question = featureValue;
        }

        featureSet.add(featureValue);
      }
    }
  }

  console.log(minGini, bestSplit, question);
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

function calculateInformationGain(): number {
  return 0;
}

function predict(): string {
  return "";
}

findBestSplit(trainingData);
