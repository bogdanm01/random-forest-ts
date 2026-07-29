import Papa from "papaparse";
import { readFile } from "node:fs/promises";
import type { Matrix } from "./randomForest.types.js";
import type {
  DatasetRow,
  SourceRow,
  TransformedRow,
} from "./titanic.types.js";

/**
 * Reads the Titanic dataset from a CSV file, parses its contents, performs
 * basic preprocessing, and transforms each record into the matrix format
 * expected by the Random Forest implementation.
 *
 * The preprocessing step:
 * - removes unused attributes,
 * - replaces missing age values with `0`,
 * - preserves the target class (`survived`) as the last column.
 *
 * @param datasetPath - Path to the CSV dataset file.
 *
 * @returns A promise that resolves once the dataset has been parsed and
 * transformed.
 */
export async function parseCSV(datasetPath: string): Promise<Matrix> {
  const fileContent = await readFile(datasetPath, "utf8");

  const result = Papa.parse<SourceRow>(fileContent, {
    header: true,
    dynamicTyping: true,
  });

  if (result && result.errors && result.errors.length > 0) {
    throw new Error(`Failed to parse CSV: ${result.errors[0]!.message}`);
  }

  const transformedRows: Matrix = result.data.map((item) => {
    const transformedRow: TransformedRow = {
      pClass: item.Pclass,
      sex: item.Sex,
      age: item.Age ?? 0, // TODO: Replace missing values with the average age for the corresponding sex.
      sibSp: item.SibSp,
      parch: item.Parch,
      fare: item.Fare,
      embarked: item.Embarked,
      survived: item.Survived,
    };

    return Object.values(transformedRow);
  });

  return transformedRows;
}

/**
 * Randomly shuffles the dataset using the Fisher-Yates algorithm and splits it
 * into training and test subsets based on the specified training ratio.
 *
 * @param trainRatio - Proportion of the dataset to use for training.
 * Must be a value between 0 and 1 (exclusive).
 * @param data - Dataset represented as a matrix, where each row corresponds
 * to a single data instance.
 *
 * @returns An object containing the training and test datasets.
 *
 * @throws {Error} If {@link trainRatio} is less than or equal to 0,
 * or greater than or equal to 1.
 */
export function splitData(
  trainRatio: number,
  data: Matrix,
): { train: DatasetRow[]; test: DatasetRow[] } {
  if (trainRatio <= 0 || trainRatio >= 1) {
    throw new Error("Split factor must be between 0 and 1.");
  }

  const shuffled = [...data];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const currentRow = shuffled[i]!;
    const swapRow = shuffled[j]!;
    shuffled[i] = swapRow;
    shuffled[j] = currentRow;
  }

  const splitIndex = Math.floor(data.length * trainRatio);

  return {
    train: shuffled.slice(0, splitIndex),
    test: shuffled.slice(splitIndex),
  };
}
