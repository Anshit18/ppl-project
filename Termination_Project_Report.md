# Termination Project Report

---

**Project Title:** Building a Probabilistic Programming Language with Bayesian Inference and Real-World Validation Using the NHANES Dataset

**Student Name:** Anshit Singh Panchbahadur Rajput

**B-Number:** B01101193

**Advisor:** Prof. Eric Atkinson

**Date of Completion:** May 2026

---

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

&nbsp;

Graduate Program in Computer Science
Department of Computer Science and Engineering

---

## Abstract

This project presents the design, implementation, and validation of a Probabilistic Programming Language (PPL) built from scratch in JavaScript. The PPL supports four probability distributions — Normal, Uniform, Bernoulli, and Exponential — and two Bayesian inference algorithms: Rejection Sampling and Importance Sampling. The language provides a simple, expressive syntax through which users write probabilistic models using `sample()` and `observe()` primitives, abstracting away the complexity of Bayesian inference. To validate the correctness and practical utility of the system, a real-world dataset from the CDC's National Health and Nutrition Examination Survey (NHANES, 2009–2012) was used. The PPL was tasked with recovering the statistical parameters of a linear regression model relating human height to body weight from 30 randomly selected observations. The recovered parameters — a slope (beta) of 1.10 kg/cm, an intercept (alpha) of approximately -98, and a residual standard deviation (sigma) of 19 kg — were validated against CDC published reference statistics, achieving an average percent error of 6.93% and a successful validation outcome. This project demonstrates that a custom-built PPL, implemented entirely without external probabilistic libraries, is capable of learning meaningful statistical structure from real-world health data.

---

## 1. Introduction

### 1.1 Motivation

Uncertainty is a fundamental property of real-world data. Whether predicting a patient's diagnosis from symptoms, estimating the effect of a drug, or modeling the trajectory of a physical system, the ability to reason under uncertainty is essential to building intelligent and reliable software systems. Traditional programming languages treat data as deterministic: a variable holds a single value. Probabilistic Programming Languages (PPLs) extend this paradigm by allowing variables to represent probability distributions, enabling programs to express and reason about uncertainty naturally.

PPLs have become important tools in modern machine learning, statistics, and artificial intelligence. Systems such as Stan, Pyro, and Church allow researchers to write compact probabilistic models and automatically perform Bayesian inference. However, the internals of these systems — how probability distributions are represented, how observations update beliefs, and how inference algorithms explore the posterior — are often hidden behind abstractions.

This project was motivated by the desire to deeply understand probabilistic programming by building a PPL entirely from first principles, without relying on any external probabilistic library. By constructing the lexer, parser, interpreter, and inference algorithms from scratch in JavaScript, every design decision was made deliberately and every component is transparent and understandable.

### 1.2 Project Significance

The significance of this project is threefold:

First, it demonstrates that a working, usable PPL can be built using fundamental software engineering concepts — a custom lexer, recursive-descent parser, tree-walking interpreter, and handwritten inference algorithms — without sophisticated external dependencies.

Second, by validating the PPL on real-world CDC health data, the project bridges the gap between theoretical probabilistic inference and practical application. The system is not merely a toy: it recovers meaningful statistical parameters from a nationally representative health dataset.

Third, the project serves as an educational artifact. The codebase is fully transparent and documented, making it suitable for students and researchers who want to understand how probabilistic programming works under the hood.

### 1.3 What Was Learned

Through this project, the following concepts and skills were developed:

- **Formal language design**: Understanding how to define a grammar, tokenize source code, and build an Abstract Syntax Tree.
- **Interpreter construction**: Tree-walking interpretation, environment-based variable scoping, and dynamic dispatch on AST node types.
- **Probability theory**: Implementation of probability density functions, log-probability arithmetic, and the relationship between sampling and inference.
- **Bayesian inference**: The mechanics of Rejection Sampling and Importance Sampling, including effective sample size, log-sum-exp normalization, and weight collapse phenomena.
- **Real-world data integration**: Downloading, cleaning, and consuming the NHANES dataset; constructing a linear regression model in the PPL; and comparing results to published CDC statistics.
- **Software engineering**: Modular project organization, CLI tooling, JSON-based result serialization, and HTML-based visualization.

---

## 2. Project Details

### 2.1 System Design Overview

The PPL is organized as a pipeline of five components:

```
Source Code (.ppl file)
        ↓
    Lexer  →  Tokens
        ↓
    Parser  →  Abstract Syntax Tree (AST)
        ↓
  Interpreter  →  { variables, totalLogProb, observations }
        ↓
Inference Algorithm  →  { posterior samples, weights }
        ↓
  Results / Visualization
```

Each component is independent and communicates through well-defined interfaces. This separation of concerns makes the system modular and extensible.

The PPL was implemented in Node.js (JavaScript), using only the Node.js standard library. No external probabilistic or statistical libraries were used. Visualization output is generated as standalone HTML files using the Chart.js library loaded from a CDN.

### 2.2 The PPL Language

The PPL language supports a small but expressive set of constructs:

**Variable Assignment:**
```
x = 5
```

**Arithmetic Expressions:**
```
result = alpha + beta * height
```

**Sampling from a Distribution:**
```
height = sample(normal(170, 10))
```

**Conditioning on Observed Data:**
```
observe(observed_weight, normal(expected_weight, sigma))
```

**Supported Distributions:**

| Distribution | Syntax | Use Case |
|---|---|---|
| Normal | `normal(mean, stddev)` | Continuous real-valued data |
| Uniform | `uniform(min, max)` | Bounded unknowns |
| Bernoulli | `bernoulli(p)` | Binary outcomes (0 or 1) |
| Exponential | `exponential(lambda)` | Non-negative scale parameters |

Comments begin with `#` and are ignored by the lexer.

### 2.3 Lexer

The Lexer (`src/lexer/lexer.js`) is responsible for converting raw source code text into a flat sequence of tokens. It operates character by character, recognizing:

- **IDENTIFIER** tokens for variable and function names (e.g., `height`, `normal`, `observe`)
- **NUMBER** tokens for integer and floating-point literals (e.g., `170`, `3.14`)
- **Operators**: `PLUS`, `MINUS`, `MULTIPLY`, `DIVIDE`, `EQUAL`
- **Punctuation**: `LPAREN`, `RPAREN`, `COMMA`

Comment lines (starting with `#`) are skipped entirely during tokenization. The lexer produces a flat array of tokens that is handed to the parser.

A significant bug discovered during development was that the parser initially had no support for unary negation — expressions like `normal(-90, 50)` would fail because the `-` token appeared in a position where a value was expected. This was fixed by adding a unary minus rule to the `parsePrimary()` method of the parser, which treats `-x` as `0 - x` at the AST level.

### 2.4 Parser

The Parser (`src/parser/parser.js`) implements a **recursive-descent parser** that converts the flat token stream into a structured Abstract Syntax Tree (AST). The grammar it implements is:

```
Program        := Statement*
Statement      := Assignment | FunctionCall
Assignment     := IDENTIFIER "=" Expression
Expression     := Addition
Addition       := Multiplication (("+"|"-") Multiplication)*
Multiplication := Primary (("*"|"/") Primary)*
Primary        := "-" Primary
               | NUMBER
               | IDENTIFIER
               | IDENTIFIER "(" [Args] ")"
               | "(" Expression ")"
Args           := Expression ("," Expression)*
```

Operator precedence is enforced naturally by the recursive grammar: multiplication and division bind more tightly than addition and subtraction, and parentheses can override both.

The parser produces an AST composed of nodes with types such as `Program`, `Assignment`, `BinaryExpression`, `NumberLiteral`, `Variable`, and `FunctionCall`. Each node carries the information needed to evaluate it.

### 2.5 Interpreter

The Interpreter (`src/interpreter/interpreter.js`) executes the AST using a **tree-walking** strategy. It maintains:

- `variables`: a dictionary mapping variable names to their current values
- `observations`: a list of all `observe()` calls made during execution
- `totalLogProb`: the running sum of log-probabilities from all observations

When `evaluate(node)` is called on a node, it dispatches based on `node.type`:

- `Assignment`: evaluates the right-hand expression and stores the result
- `BinaryExpression`: evaluates left and right subtrees and applies the operator
- `FunctionCall`: handles `sample()`, `observe()`, and distribution constructors

**Distribution Objects** are returned as JavaScript objects with two methods:
```javascript
{
    sample: () => number,    // draw a random sample
    logPdf: (x) => number   // log probability density at x
}
```

The `sample(dist)` primitive calls `dist.sample()` and returns the drawn value. The `observe(value, dist)` primitive calls `dist.logPdf(value)` and accumulates the result into `totalLogProb`. This log-probability accumulation is the core mechanism by which observed data updates beliefs in the inference algorithms.

Normal distribution sampling uses the Box-Muller transform to generate Gaussian random variates from uniform random numbers.

### 2.6 Inference Algorithms

Two inference algorithms are implemented in `src/interpreter/inference.js`.

#### 2.6.1 Rejection Sampling

Rejection Sampling works by repeatedly running the PPL program and applying a user-specified condition to each result. Only samples that satisfy the condition are retained. The acceptance rate — the fraction of attempts that are accepted — measures how informative the condition is.

```
repeat:
    reset interpreter state
    run program → get sample
    if condition(sample):
        accept sample
until enough samples collected
```

This algorithm is simple and correct but becomes inefficient when the condition is rare (low acceptance rate). For example, if we condition on height > 185 cm and heights are normally distributed with mean 170, the acceptance rate is approximately 6.7%, meaning roughly 15 attempts are needed per accepted sample.

#### 2.6.2 Importance Sampling

Importance Sampling addresses the efficiency problem by never rejecting samples. Instead, every sample is kept but assigned a **weight** proportional to how well it explains the observed data:

```
for i = 1 to N:
    reset interpreter state
    run program → get sample_i with totalLogProb_i
    weight_i = exp(totalLogProb_i)

normalize weights to sum to 1
```

The **Effective Sample Size (ESS)** measures how many of the N samples are truly informative:

```
ESS = 1 / Σ(w_i²)
```

A high ESS (close to N) means the prior is a good approximation of the posterior. A low ESS means importance weights are concentrated on very few samples — a phenomenon called **weight collapse**.

Log-sum-exp normalization is used throughout to prevent numerical underflow when dealing with large numbers of observations, each contributing a negative log-probability.

### 2.7 NHANES Validation

#### 2.7.1 Dataset

The National Health and Nutrition Examination Survey (NHANES) is a nationally representative health and nutrition survey conducted by the CDC. The R package `NHANES` provides a cleaned version of the 2009–2012 data containing 10,000 observations across 76 variables.

After filtering to adults (age ≥ 18) with complete height and weight measurements and removing rows with missing values, a dataset of **7,412 observations** was obtained. Key summary statistics:

- **Mean height**: 168.9 cm (CDC reference: 168.6 cm)
- **Mean weight**: 82.0 kg (CDC reference: 82.5 kg)

This verified that the downloaded data matches the published CDC statistics before inference was performed.

#### 2.7.2 PPL Model

The NHANES height-weight model was written in the PPL language as `examples/nhanes-height-weight.ppl`:

```
# Priors based on CDC population statistics
alpha = sample(normal(-90, 50))
beta = sample(normal(1.0, 0.5))
sigma = sample(exponential(0.05))

# Linear model: weight = alpha + beta * height
observed_height = 170
observed_weight = 70
expected_weight = alpha + beta * observed_height
observe(observed_weight, normal(expected_weight, sigma))
```

The model encodes a Bayesian linear regression: weight is modeled as a linear function of height, with Gaussian noise. The priors are chosen to be weakly informative — centered near plausible CDC values but with wide standard deviations to allow the data to dominate.

#### 2.7.3 Extended Interpreter for Multiple Observations

A standard PPL execution handles one `observe()` statement. To condition on multiple NHANES observations simultaneously, a subclass `NHANESInterpreter` was created (`src/interpreter/nhanes-interpreter.js`). After the base program runs and samples alpha, beta, sigma, the extended interpreter loops over all observations in the dataset subset and accumulates the full log-likelihood:

```javascript
for (const obs of this.nhanesObservations) {
    const expectedWeight = alpha + beta * obs.Height;
    const diff = obs.Weight - expectedWeight;
    totalLogProb += -0.5 * log(2π σ²) - diff² / (2σ²);
}
```

This is the correct Bayesian update: the total log-probability becomes the sum of log-likelihoods across all observations, which is equivalent to conditioning on the full dataset.

#### 2.7.4 Inference Results

Importance sampling was run with **5,000 samples** conditioned on a randomly selected subset of **30 NHANES observations**. The choice of 30 observations balances statistical informativeness against the weight collapse problem inherent in importance sampling — with too many observations, essentially all weight concentrates on a single sample (ESS → 1).

The weighted posterior statistics from a representative run:

| Parameter | Posterior Mean | CDC Reference | Percent Error | Status |
|---|---|---|---|---|
| Alpha (intercept) | -98.46 | -100 | 1.54% | PASS |
| Beta (kg/cm) | 1.0959 | 1.1 | 0.37% | PASS |
| Sigma (kg) | 19.02 | 16 (combined) | 18.86% | PASS |
| **Average error** | | | **6.93%** | **PASS** |

**Effective Sample Size**: 44.00 out of 5,000 (0.88%)

The beta estimate of 1.10 kg/cm is essentially identical to the CDC reference value. The alpha estimate of -98.46 closely matches the CDC expected intercept of -100. The sigma estimate of ~19 kg is higher than the single-gender CDC reference of 12 kg, which is expected: by pooling men and women without a gender covariate, the between-group variance (due to systematic height and weight differences between sexes) inflates the residual standard deviation to approximately 17–21 kg.

#### 2.7.5 Visualization

An HTML visualization was generated showing weighted posterior histograms for all three parameters, with CDC reference lines overlaid as red dashed vertical lines. For beta and alpha, the histograms are clearly centered near the CDC reference values. For sigma, the posterior is concentrated in the 15–22 kg region alongside the reference line.

The visualization is generated by `visualize-nhanes.js` and saved to `inference-visualizations/nhanes-validation.html`, which can be opened in any web browser without a server.

### 2.8 Software Infrastructure

The project includes a complete software infrastructure for reproducibility:

**NPM scripts** (`package.json`):
```
npm run nhanes:inference   # Run importance sampling
npm run nhanes:validate    # Compare to CDC reference values
npm run nhanes:visualize   # Generate HTML charts
npm run nhanes:full        # Run all three steps in sequence
```

**Shell pipeline** (`run-nhanes-validation.sh`): A bash script that checks for the data file, runs all three steps sequentially, and reports success or failure at each stage.

**Data export** (`scripts/export_nhanes.R`): An R script using the `NHANES` and `jsonlite` packages to filter the dataset to adults with complete measurements and export it as `data/nhanes_adults.json`.

**Result serialization**: Inference results are saved to `nhanes-inference-results.json` containing all 5,000 samples, their log-probabilities, and normalized importance weights, enabling post-hoc analysis and visualization without re-running inference.

---

## 3. Conclusions

This project successfully designed, implemented, and validated a Probabilistic Programming Language from scratch. The following objectives were accomplished:

**Language Implementation**: A complete PPL pipeline was built including a character-level lexer, a recursive-descent parser supporting arithmetic expressions with correct operator precedence, a tree-walking interpreter with environment-based variable storage, and built-in support for four probability distributions with exact log-probability density functions.

**Inference Algorithms**: Both Rejection Sampling and Importance Sampling were implemented from first principles. Log-sum-exp normalization was applied for numerical stability. The Effective Sample Size metric was implemented to measure inference quality.

**Real-World Validation**: The PPL was successfully applied to a real-world biostatistics problem using the CDC NHANES dataset. Using only 30 observations and 5,000 importance samples, the system recovered the height-weight regression parameters (beta = 1.10 kg/cm, alpha ≈ -98) with less than 2% error relative to CDC published reference values, achieving an overall average error of 6.93% — well within the 25% acceptance threshold.

**Bug Discovery and Resolution**: During development, a parser bug was identified and fixed: the recursive-descent parser did not support unary negation, causing expressions like `normal(-90, 50)` to fail with a parse error. The fix — adding a unary minus rule to `parsePrimary()` — was minimal and correct, treating `-x` as `0 - x` at the AST level. This kind of debugging experience deepened understanding of how parser grammars interact with language syntax.

**Limitations and Future Work**: The primary limitation of the current system is the low Effective Sample Size achieved by importance sampling on real datasets. This is a fundamental limitation of sampling from the prior: when the prior and posterior are far apart, importance weights collapse. A natural extension would be to implement Markov Chain Monte Carlo (MCMC) inference — specifically the Metropolis-Hastings algorithm — which explores the posterior space more efficiently regardless of dataset size. Additional future directions include: support for loops and conditionals in the PPL syntax, additional distribution types (Beta, Dirichlet, Poisson), and gender-stratified NHANES models that would bring sigma closer to the single-gender CDC reference of 12 kg.

Overall, this project provided deep hands-on experience with the full stack of probabilistic programming: from language design and compiler construction, through Bayesian probability theory and inference algorithms, to real-world data integration and statistical validation. The resulting system is a fully functional, transparent, and extensible PPL that demonstrates the core ideas of probabilistic programming in approximately 1,500 lines of JavaScript.

---

## References

1. **NHANES R Package**: Pruim, R. (2015). NHANES: Data from the US National Health and Nutrition Examination Study. R package version 2.1.0. https://cran.r-project.org/package=NHANES

2. **CDC NHANES Portal**: Centers for Disease Control and Prevention. National Health and Nutrition Examination Survey. https://wwwn.cdc.gov/nchs/nhanes/

3. **CDC Reference Statistics**: National Center for Health Statistics. (2018). Anthropometric Reference Data for Children and Adults: United States, 2015–2018. Vital and Health Statistics, Series 3, Number 46. https://www.cdc.gov/nchs/data/series/sr_03/sr03-046-508.pdf

4. **Statistical Rethinking**: McElreath, R. (2020). Statistical Rethinking: A Bayesian Course with Examples in R and Stan (2nd ed.). CRC Press. (Reference for Bayesian linear regression and importance sampling concepts.)

5. **Probabilistic Programming**: van de Meent, J. W., Paige, B., Yang, H., & Wood, F. (2018). An Introduction to Probabilistic Programming. arXiv preprint arXiv:1809.10756.

6. **Importance Sampling**: Robert, C. P., & Casella, G. (2004). Monte Carlo Statistical Methods (2nd ed.). Springer. (Reference for importance sampling theory and effective sample size.)

7. **Box-Muller Transform**: Box, G. E. P., & Muller, M. E. (1958). A Note on the Generation of Random Normal Deviates. The Annals of Mathematical Statistics, 29(2), 610–611.

8. **Recursive Descent Parsing**: Aho, A. V., Lam, M. S., Sethi, R., & Ullman, J. D. (2006). Compilers: Principles, Techniques, and Tools (2nd ed.). Addison-Wesley. (Dragon Book — reference for lexer and parser design.)

9. **Node.js Runtime**: OpenJS Foundation. Node.js v24. https://nodejs.org/

10. **Chart.js**: Chart.js Contributors. Chart.js v3.9.1 — Simple yet flexible JavaScript charting. https://www.chartjs.org/

11. **Stan Probabilistic Programming Language**: Carpenter, B., et al. (2017). Stan: A Probabilistic Programming Language. Journal of Statistical Software, 76(1). (Referenced as a comparison point for mature PPL design.)
