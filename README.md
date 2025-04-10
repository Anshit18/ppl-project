# Probabilistic Programming Language (PPL) Implementation

A simple probabilistic programming language implementation in JavaScript that supports basic arithmetic operations, variable assignments, and probabilistic constructs.

## Overview

This project implements a basic PPL with a focus on:

- Mathematical expressions (addition, subtraction, multiplication, division)
- Variable assignments
- Probabilistic operations (sampling, observations)
- Normal distributions

## Project Structure

```
ppl-project/
│
├── src/
│   ├── lexer/
│   │   └── lexer.js             # Tokenizes input code into tokens
│   │
│   ├── parser/
│   │   └── parser.js            # Transforms tokens into an AST
│   │
│   ├── ast/
│   │   └── ast.js               # Defines AST node structures
│   │
│   ├── interpreter/
│   │   ├── interpreter.js       # Executes the AST
│   │   └── inference.js         # Inference mechanisms for PPL
│   │
│   ├── grammar/
│   │   └── grammar.js           # Grammar definition
│   │
│   ├── utils/
│   │   └── utils.js             # Utility functions
│
├── examples/
│   └── sample-program.ppl       # Example PPL program
│
├── main.js                      # Entry point
├── package.json                 # Project dependencies
└── README.md                    # This file
```

## Features

- **Lexical Analysis**: Converts raw code into tokens, handling identifiers, numbers, operators, and comments.
- **Parsing**: Implements recursive descent parsing with operator precedence.
- **Abstract Syntax Tree**: Represents the structure of PPL programs.
- **Interpretation**: Executes PPL programs, maintaining variable state.
- **Probabilistic Constructs**:
  - `normal(mean, stddev)`: Creates a normal distribution
  - `sample(distribution)`: Draws random values from distributions
  - `observe(value, distribution)`: For probabilistic inference

## Example Program

```
# Example program for the PPL interpreter
x = 5 + 3         # Assignment
observe(x, normal(5, 1))  # Observing a value from a normal distribution
y = sample(normal(0, 1))  # Sampling from a normal distribution
z = x * y        # Performing an arithmetic operation
```

## Running the Project

1. Install dependencies:
   ```
   npm install
   ```

2. Run the example program:
   ```
   npm start
   ```

## Output Example

The interpreter provides detailed output at each step:

```
Lexical Analysis:
Tokens: [...]

Parsing:
AST: {...}

Interpretation:
Execution Result: ...
Variable State: { x: 8, y: -0.062..., z: -0.499... }
```
