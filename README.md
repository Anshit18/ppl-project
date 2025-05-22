# Probabilistic Programming Language (PPL) Implementation

A simple probabilistic programming language implementation in JavaScript that supports basic arithmetic operations, variable assignments, and probabilistic constructs, and advanced inference algorithms.

## Overview

This project implements a basic PPL with a focus on:

- Mathematical expressions (addition, subtraction, multiplication, division)
- Variable assignments
- Probabilistic operations (sampling, observations)
- Normal 
- Multiple probability distributions (normal, uniform, bernoulli, exponential)
- Inference algorithms (rejection sampling, importance sampling)
- Visualization capabilities for inference results

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
│   ├── sample-program.ppl      # Example PPL program
│   ├── height-weight.ppl       # Models relationship between height and weight
│   ├── coin-flip.ppl           # Demonstrates coin flips using Bernoulli distribution
│   └── mixture-model.ppl        # Models data from two different distributions      
│
├── main.js                      # Entry point
├── multiple-runs.js             # Runs the PPL program 10,000 times and collects statistical data
├── visualize-results.js         # Creates charts and visualizations from the collected data
├── inference-cli.js             # Command-line interface for inference algorithms
├── visualize-inference.js       # Creates detailed visualizations of inference 
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
- **Probabilistic Constructs**:
  - Rejection Sampling: Filters samples based on conditions
  - Importance Sampling: Weights samples by their likelihood

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

## Inference with Visualization

1. Run Rejection Sampling with condition and visualization:
   ```
   node inference-cli.js --algorithm rejection --example height-weight --samples 1000 --condition "height>180" --output tall-samples.json

   node visualize-inference.js --input tall-samples.json
   ```

2. Run Importance Sampling with visualization:
   ```
   node inference-cli.js --algorithm rejection --example height-weight --samples 1000 --condition "height>180" --output tall-samples.json

   node visualize-inference.js --input tall-samples.json
   ```

## Output Example

1. Basic Interpretation:

   ```
   Lexical Analysis:
   Tokens: [...]

   Parsing:
   AST: {...}

   Interpretation:
   Execution Result: ...
   Variable State: { x: 8, y: -0.062..., z: -0.499... }
   ```

2. Inference Results:
   ```
   Rejection sampling completed:
   - Attempts: 5966
   - Accepted: 1000
   - Acceptance rate: 16.76%

   Variable Statistics:
   height:
     Mean: 185.4158
     StdDev: 4.4263
     Min: 180.0075
     Max: 208.3912

   Results saved to tall-samples.json
   Visualizations created: inference-visualizations/tall-samples-visualizations.html
   ```
