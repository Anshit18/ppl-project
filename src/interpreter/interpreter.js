const { randomSample } = require('../utils/utils');

class Interpreter {
    constructor(ast) {
        this.ast = ast;
        this.variables = {};
        this.observations = [];
        this.totalLogProb = 0; // Track total log probability of all observations
        this.distributionFunctions = {
            normal: (mean, stddev) => ({
                sample: () => mean + stddev * this.gaussianRandom(),
                logPdf: (x) => -0.5 * Math.log(2 * Math.PI * stddev * stddev) - ((x - mean) ** 2) / (2 * stddev * stddev)
            }),
            uniform: (min, max) => ({
                sample: () => min + Math.random() * (max - min),
                logPdf: (x) => (x >= min && x <= max) ? -Math.log(max - min) : -Infinity
            }),
            bernoulli: (p) => ({
                sample: () => Math.random() < p ? 1 : 0,
                logPdf: (x) => x === 1 ? Math.log(p) : (x === 0 ? Math.log(1 - p) : -Infinity)
            }),
            exponential: (lambda) => ({
                sample: () => -Math.log(Math.random()) / lambda,
                logPdf: (x) => x >= 0 ? Math.log(lambda) - lambda * x : -Infinity
            })
        };
    }

    // Standard normal distribution using Box-Muller transform
    gaussianRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }

    run() {
        if (!this.ast) throw new Error("Invalid AST");
        const result = this.evaluate(this.ast);
        
        // Return both the last execution result and information about observations
        return {
            result,
            totalLogProb: this.totalLogProb,
            observations: this.observations,
            variables: this.variables
        };
    }

    evaluate(node) {
        if (!node) return null;

        switch (node.type) {
            case "Program":
                let result;
                for (const stmt of node.statements) {
                    result = this.evaluate(stmt);
                }
                return result;

            case "Assignment":
                const value = this.evaluate(node.expression);
                this.variables[node.variable] = value;
                return value;

            case "BinaryExpression":
                const left = this.evaluate(node.left);
                const right = this.evaluate(node.right);
                
                switch (node.operator) {
                    case "+": return left + right;
                    case "-": return left - right;
                    case "*": return left * right;
                    case "/": return left / right;
                    default: throw new Error(`Unknown operator: ${node.operator}`);
                }

            case "NumberLiteral":
                return node.value;

            case "Variable":
                if (node.name in this.variables) {
                    return this.variables[node.name];
                }
                throw new Error(`Undefined variable: ${node.name}`);

            case "FunctionCall":
                return this.evaluateFunctionCall(node);

            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    evaluateFunctionCall(node) {
        const args = node.arguments.map(arg => this.evaluate(arg));
        
        switch (node.name) {
            case "sample":
                if (args.length !== 1 || typeof args[0] !== 'object') {
                    throw new Error("sample() expects a distribution object");
                }
                return args[0].sample();
                
            case "observe":
                if (args.length !== 2 || typeof args[1] !== 'object') {
                    throw new Error("observe() expects a value and a distribution object");
                }
                const value = args[0];
                const distribution = args[1];
                
                // Calculate log probability
                const logProb = distribution.logPdf(value);
                
                // Store observation details
                this.observations.push({
                    value,
                    distribution: node.arguments[1].name,
                    logProb
                });
                
                // Update total log probability
                this.totalLogProb += logProb;
                
                return logProb;
                
            case "normal":
                if (args.length !== 2) {
                    throw new Error("normal() expects two parameters: mean and standard deviation");
                }
                const mean = args[0];
                const stddev = args[1];
                
                if (typeof mean !== 'number' || typeof stddev !== 'number') {
                    throw new Error("normal() parameters must be numbers");
                }
                
                if (stddev <= 0) {
                    throw new Error("Standard deviation must be positive");
                }
                
                return this.distributionFunctions.normal(mean, stddev);
            
            case "uniform":
                if (args.length !== 2) {
                    throw new Error("uniform() expects two parameters: min and max");
                }
                const min = args[0];
                const max = args[1];
                
                if (typeof min !== 'number' || typeof max !== 'number') {
                    throw new Error("uniform() parameters must be numbers");
                }
                
                if (min >= max) {
                    throw new Error("Min must be less than max for uniform distribution");
                }
                
                return this.distributionFunctions.uniform(min, max);
                
            case "bernoulli":
                if (args.length !== 1) {
                    throw new Error("bernoulli() expects one parameter: probability");
                }
                const p = args[0];
                
                if (typeof p !== 'number' || p < 0 || p > 1) {
                    throw new Error("bernoulli() parameter must be a probability between 0 and 1");
                }
                
                return this.distributionFunctions.bernoulli(p);
                
            case "exponential":
                if (args.length !== 1) {
                    throw new Error("exponential() expects one parameter: rate");
                }
                const lambda = args[0];
                
                if (typeof lambda !== 'number' || lambda <= 0) {
                    throw new Error("exponential() parameter must be a positive number");
                }
                
                return this.distributionFunctions.exponential(lambda);
                
            default:
                throw new Error(`Unknown function: ${node.name}`);
        }
    }
}

module.exports = Interpreter;




// const { randomSample } = require('../utils/utils');

// class Interpreter {
//     constructor(ast) {
//         this.ast = ast;
//         this.variables = {};
//         this.distributionFunctions = {
//             normal: (mean, stddev) => ({
//                 sample: () => mean + stddev * this.gaussianRandom(),
//                 logPdf: (x) => -0.5 * Math.log(2 * Math.PI * stddev * stddev) - ((x - mean) ** 2) / (2 * stddev * stddev)
//             })
//         };
//     }

//     // Standard normal distribution using Box-Muller transform
//     gaussianRandom() {
//         let u = 0, v = 0;
//         while (u === 0) u = Math.random();
//         while (v === 0) v = Math.random();
//         return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
//     }

//     run() {
//         if (!this.ast) throw new Error("Invalid AST");
//         return this.evaluate(this.ast);
//     }

//     evaluate(node) {
//         if (!node) return null;

//         switch (node.type) {
//             case "Program":
//                 let result;
//                 for (const stmt of node.statements) {
//                     result = this.evaluate(stmt);
//                 }
//                 return result;

//             case "Assignment":
//                 const value = this.evaluate(node.expression);
//                 this.variables[node.variable] = value;
//                 return value;

//             case "BinaryExpression":
//                 const left = this.evaluate(node.left);
//                 const right = this.evaluate(node.right);
                
//                 switch (node.operator) {
//                     case "+": return left + right;
//                     case "-": return left - right;
//                     case "*": return left * right;
//                     case "/": return left / right;
//                     default: throw new Error(`Unknown operator: ${node.operator}`);
//                 }

//             case "NumberLiteral":
//                 return node.value;

//             case "Variable":
//                 if (node.name in this.variables) {
//                     return this.variables[node.name];
//                 }
//                 throw new Error(`Undefined variable: ${node.name}`);

//             case "FunctionCall":
//                 return this.evaluateFunctionCall(node);

//             default:
//                 throw new Error(`Unknown node type: ${node.type}`);
//         }
//     }

//     evaluateFunctionCall(node) {
//         const args = node.arguments.map(arg => this.evaluate(arg));
        
//         switch (node.name) {
//             case "sample":
//                 if (args.length !== 1 || typeof args[0] !== 'object') {
//                     throw new Error("sample() expects a distribution object");
//                 }
//                 return args[0].sample();
                
//             case "observe":
//                 if (args.length !== 2 || typeof args[1] !== 'object') {
//                     throw new Error("observe() expects a value and a distribution object");
//                 }
//                 const value = args[0];
//                 const distribution = args[1];
                
//                 // In a real PPL, this would update inference state
//                 // Here we just return the log probability density of the observation
//                 return distribution.logPdf(value);
                
//             case "normal":
//                 if (args.length !== 2) {
//                     throw new Error("normal() expects two parameters: mean and standard deviation");
//                 }
//                 const mean = args[0];
//                 const stddev = args[1];
                
//                 if (typeof mean !== 'number' || typeof stddev !== 'number') {
//                     throw new Error("normal() parameters must be numbers");
//                 }
                
//                 if (stddev <= 0) {
//                     throw new Error("Standard deviation must be positive");
//                 }
                
//                 return this.distributionFunctions.normal(mean, stddev);
                
//             default:
//                 throw new Error(`Unknown function: ${node.name}`);
//         }
//     }
// }

// module.exports = Interpreter;