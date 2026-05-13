# Probabilistic Programming Language (PPL) Implementation

A simple probabilistic programming language implementation in JavaScript that supports basic arithmetic operations, variable assignments, and probabilistic constructs, and advanced inference algorithms.

## Overview

This project implements a basic PPL with a focus on:

- Mathematical expressions (addition, subtraction, multiplication, division)
- Variable assignments
- Probabilistic operations (sampling, observations)
- Multiple probability distributions (normal, uniform, bernoulli, exponential)
- Inference algorithms (rejection sampling, importance sampling, Metropolis-Hastings)
- Validation against real-world datasets (CDC NHANES)
- Visualization capabilities for inference results

## Project Structure

```
ppl-project/
│
├── src/
│   ├── lexer/
│   │   └── lexer.js                 # Tokenizes input code into tokens
│   │
│   ├── parser/
│   │   └── parser.js                # Transforms tokens into an AST
│   │
│   ├── ast/
│   │   └── ast.js                   # Defines AST node structures
│   │
│   ├── interpreter/
│   │   ├── interpreter.js           # Executes the AST
│   │   ├── inference.js             # Rejection and importance sampling
│   │   ├── mh-interpreter.js        # MH-aware interpreter (sample + evaluate modes)
│   │   └── nhanes-interpreter.js    # NHANES-specific interpreter
│   │
│   ├── grammar/
│   │   └── grammar.js               # Grammar definition
│   │
│   ├── utils/
│   │   └── utils.js                 # Utility functions
│
├── data/
│   └── nhanes_adults.json           # CDC NHANES 2009-2012 adult survey data
│
├── examples/
│   ├── sample-program.ppl           # Example PPL program
│   ├── height-weight.ppl            # Models relationship between height and weight
│   ├── coin-flip.ppl                # Demonstrates coin flips using Bernoulli distribution
│   ├── mixture-model.ppl            # Models data from two different distributions
│   └── nhanes-height-weight.ppl     # Linear regression model for NHANES validation
│
├── scripts/
│   └── export_nhanes.R              # R script to download and export NHANES data
│
├── main.js                          # Entry point
├── multiple-runs.js                 # Runs the PPL program 10,000 times and collects statistical data
├── visualize-results.js             # Creates charts and visualizations from the collected data
├── inference-cli.js                 # Command-line interface for inference algorithms
├── visualize-inference.js           # Creates detailed visualizations of inference results
├── nhanes-inference.js              # Importance sampling over the NHANES dataset
├── nhanes-mh.js                     # Metropolis-Hastings inference over the NHANES dataset
├── run-nhanes-validation.sh         # End-to-end NHANES validation pipeline
├── package.json                     # Project dependencies
└── README.md                        # This file
```

## Features

- **Lexical Analysis**: Converts raw code into tokens, handling identifiers, numbers, operators, and comments.
- **Parsing**: Implements recursive descent parsing with operator precedence.
- **Abstract Syntax Tree**: Represents the structure of PPL programs.
- **Interpretation**: Executes PPL programs, maintaining variable state.
- **Probabilistic Constructs**:
  - `normal(mean, stddev)`: Creates a normal distribution
  - `uniform(low, high)`: Creates a uniform distribution
  - `bernoulli(p)`: Creates a Bernoulli distribution
  - `exponential(rate)`: Creates an exponential distribution
  - `sample(distribution)`: Draws random values from distributions
  - `observe(value, distribution)`: Conditions the model on observed data
- **Inference Algorithms**:
  - **Rejection Sampling**: Filters samples based on user-defined conditions
  - **Importance Sampling**: Weights samples by likelihood; uses log-sum-exp normalization for numerical stability; reports Effective Sample Size (ESS)
  - **Metropolis-Hastings (MH)**: MCMC algorithm that scales to the full dataset without weight collapse; supports configurable burn-in and step sizes; all collected samples carry equal (uniform) posterior weight
- **Real-World Validation**: Linear regression model fit to CDC NHANES 2009-2012 height/weight data using both importance sampling and MH

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
   node inference-cli.js --algorithm importance --example height-weight --samples 1000 --output importance-samples.json

   node visualize-inference.js --input importance-samples.json
   ```

## NHANES Real-World Validation

The project includes a linear regression model validated against CDC NHANES 2009-2012 survey data (~7,400 adult observations). Two inference algorithms are available for this dataset:

### Importance Sampling (subset of 30 observations)

Uses a random subset to avoid weight collapse. Reports Effective Sample Size (ESS).

```
node nhanes-inference.js
```

### Metropolis-Hastings (full dataset)

Runs MCMC on all observations with a 2,000-iteration burn-in. Acceptance rate target is 25–40%.

```
node nhanes-mh.js
```

### Full Validation Pipeline

Runs inference, validates against CDC reference values, and generates HTML visualizations:

```
# First, download NHANES data via R (one-time setup):
Rscript scripts/export_nhanes.R

# Then run the full pipeline:
bash run-nhanes-validation.sh
```

The NHANES model (`examples/nhanes-height-weight.ppl`) fits a Bayesian linear regression:

```
alpha = sample(normal(-90, 50))     # intercept
beta  = sample(normal(1.0, 0.5))    # height coefficient (kg/cm)
sigma = sample(exponential(0.05))   # error std dev

expected_weight = alpha + beta * observed_height
observe(observed_weight, normal(expected_weight, sigma))
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

2. Rejection Sampling:
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

3. Metropolis-Hastings (NHANES):
   ```
   Running Metropolis-Hastings on ALL 7412 observations...
   Burn-in: 2000 | Samples to collect: 5000

   MH completed:
   - Acceptance rate: 31.45%  (target: 25-40%)
   - Samples collected: 5000

   === POSTERIOR STATISTICS (Metropolis-Hastings) ===

   Alpha (Intercept):
     Mean:    -89.3241
     Std Dev: 1.2876

   Beta (Height Coefficient):
     Mean:    0.9712
     Std Dev: 0.0075

   Sigma (Error Std Dev):
     Mean:    14.8531
     Std Dev: 0.1203

   Results saved to nhanes-mh-results.json
   ```
