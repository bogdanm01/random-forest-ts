export interface SourceRow {
  PassengerId: string;
  Survived: number;
  Pclass: number;
  name: string;
  Sex: "male" | "female";
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
