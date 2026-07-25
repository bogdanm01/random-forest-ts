type MatrixRow = (number | string)[];
type Matrix = MatrixRow[];

// # Gini impurity - koliko je svaki node "miksovan" (od 0 do 1)
// # impurity od 0 znaci da node nije miksovan tj. ima samo jednu klasu
// # kako se tacno mery gini impurity? Pronaci formulu
// # informaiton gain -> koliko pitanje/uslov/split smanjuje gini index
// # koristimo gini index i information gain da bismo selektovali anjbolji split u svakom trenutku
// # rekurzivno delimo podatke dok nema vise pitanja
// # pokusavamo svaki split u trenutnom nodu i biramo najbolji (onaj koji ima najveci gain)
// # information gain = pocetni impurity - nastali impurity

// 1. Define training data set
const trainingData = [
  ["Green", 3, "Apple"],
  ["Yellow", 3, "Apple"],
  ["Red", 1, "Grape"],
  ["Red", 1, "Grape"],
  ["Yellow", 3, "Lemon"],
];

/*
    It should return reference to root node
    1. 
 */
function trainTree(trainingData: any[]) {
  // 1. Pronalazimo najbolje pitanje

  const split = findSplit(trainingData);
}

function findSplit(trainingData: any[]) {}

// 1 - number of classes
// input label i broj podataka sa tom klasom [['Apple', 2], ['Lemon', 1]]

/**
    apple: 2
    lemon: 1

    pApple = 2/3 = 0.66
    pLemon = 1/3 = 0.33

    gini = 1 - pApple^2 - pLemon^2
 */

function calculateGiniImpurity(data: Matrix): number {
  const map = new Map<string, number>();

  for (let row of data) {
    const label = String(row[row.length - 1]);

    if (!map.has(label)) {
      map.set(label, 1);
    } else {
      const currentVal: number = Number(map.get(label));
      if (!Number.isNaN(currentVal)) {
        map.set(label, currentVal + 1);
      }
    }
  }

  // now for each key calculate probability
  const valueCounts = Array.from(map.values()).reduce((acc, current) => {
    return acc + current;
  }, 0);

  const probsSquared = [];

  for (let count of map.values()) {
    probsSquared.push(Math.pow(count / valueCounts, 2));
  }

  const res = probsSquared.reduce((acc, curr) => {
    return acc - curr;
  }, 1);

  return res;
}

function calculateInformationGain(): number {
  return 0;
}

/**
 *
 * @returns predicted class
 */
function predict(): string {
  return "";
}

const splitByDiameter: MatrixRow[] = [
  ["Green", 3, "Apple"],
  ["Yellow", 3, "Apple"],
  ["Yellow", 3, "Lemon"],
];

const tree = calculateGiniImpurity(splitByDiameter);
