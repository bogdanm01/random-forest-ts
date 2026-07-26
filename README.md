# Decision Tree Classifier

A lightweight, zero-dependency Decision Tree classifier built completely from scratch in TypeScript using Gini impurity.

## Features

- **Gini Impurity Splitting:** Finds optimal partitions by minimizing child node impurity.
- **Mixed Feature Types:** Automatically handles continuous numerical features (`>=` threshold) and categorical string features (`===` equality).
- **Pure Recursive Training:** Builds intuitive decision boundaries with base-case stopping criteria (pure leaves or un-splittable branches).
- **Fully Typed:** Written with strict TypeScript interfaces for simple integration and refactoring.

## Installation

Clone the repository and install dependencies:

```bash
git clone [https://github.com/your-username/decision-tree-ts.git](https://github.com/your-username/decision-tree-ts.git)
cd decision-tree-ts
npm install
```
