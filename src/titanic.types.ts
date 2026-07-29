import type { MatrixRow } from "./randomForest.types.js";

export interface SourceRow {
  PassengerId: string;
  Survived: number;
  Pclass: number;
  name: string;
  Sex: string;
  Age?: number;
  SibSp: number;
  Parch: number;
  Ticket: string;
  Fare: number;
  Cabin?: string;
  Embarked: string;
}

export interface TransformedRow {
  pClass: number;
  sex: string;
  age: number;
  sibSp: number;
  parch: number;
  fare: number;
  embarked: string;
  survived: number;
}

export type DatasetRow = MatrixRow | TransformedRow;
