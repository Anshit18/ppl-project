const { randomSample } = require('../utils/utils');

class Interpreter {
    constructor(ast) {
        this.ast = ast;
        this.variables = {};
        this.distributionFunctions = {
            normal: (mean, stddev) => ({
                sample: () => mean + stddev * this.gaussianRandom(),
                logPdf: (x) => -0.5 * Math.log(2 * Math.PI * stddev * stddev) - ((x - mean) ** 2) / (2 * stddev * stddev)
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
        return this.evaluate(this.ast);
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
                
                // In a real PPL, this would update inference state
                // Here we just return the log probability of the observation
                return distribution.logPdf(value);
                
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
                
            default:
                throw new Error(`Unknown function: ${node.name}`);
        }
    }
}

module.exports = Interpreter;