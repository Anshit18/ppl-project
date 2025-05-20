// inference-cli.js

const fs = require('fs');
const path = require('path');
const Lexer = require('./src/lexer/lexer');
const Parser = require('./src/parser/parser');
const Interpreter = require('./src/interpreter/interpreter');
const { RejectionSampling, ImportanceSampling } = require('./src/interpreter/inference');

// Parse command line arguments
const args = process.argv.slice(2);
let algorithm = 'rejection'; // Default algorithm
let exampleName = 'height-weight'; // Default example
let numSamples = 1000; // Default sample count
let outputFile = null;
let condition = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--algorithm' && i + 1 < args.length) {
        algorithm = args[i + 1];
        i++;
    }
    else if (args[i] === '--example' && i + 1 < args.length) {
        exampleName = args[i + 1];
        i++;
    }
    else if (args[i] === '--samples' && i + 1 < args.length) {
        numSamples = parseInt(args[i + 1], 10);
        i++;
    }
    else if (args[i] === '--output' && i + 1 < args.length) {
        outputFile = args[i + 1];
        i++;
    }
    else if (args[i] === '--condition' && i + 1 < args.length) {
        // Allow simple conditions like 'height>170'
        condition = args[i + 1];
        i++;
    }
}

// Load and parse the program
const filePath = path.join(__dirname, 'examples', `${exampleName}.ppl`);
let programCode;
try {
    programCode = fs.readFileSync(filePath, 'utf8');
    console.log(`Loaded program from ${filePath}`);
} catch (error) {
    console.error(`Error loading program: ${error.message}`);
    process.exit(1);
}

// Tokenize and parse the program
const lexer = new Lexer(programCode);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();

// Check for parsing errors
if (ast.type === 'Error') {
    console.error(`Parsing error: ${ast.message}`);
    process.exit(1);
}

// Create the interpreter
const interpreter = new Interpreter(ast);

// Parse the condition if specified
let conditionFunction = null;
if (condition) {
    // Simple condition parser (very basic, just for demonstration)
    const match = condition.match(/(\w+)([<>=]+)(\d+(?:\.\d+)?)/);
    if (match) {
        const [_, variable, operator, valueStr] = match;
        const value = parseFloat(valueStr);
        
        switch (operator) {
            case '>':
                conditionFunction = result => result.variables[variable] > value;
                break;
            case '<':
                conditionFunction = result => result.variables[variable] < value;
                break;
            case '>=':
                conditionFunction = result => result.variables[variable] >= value;
                break;
            case '<=':
                conditionFunction = result => result.variables[variable] <= value;
                break;
            case '==':
            case '=':
                conditionFunction = result => result.variables[variable] === value;
                break;
            default:
                console.error(`Unsupported operator: ${operator}`);
                process.exit(1);
        }
    } else {
        console.error(`Invalid condition format: ${condition}`);
        process.exit(1);
    }
}

// Run the appropriate inference algorithm
let inferenceAlgorithm;
let results;

if (algorithm === 'rejection') {
    inferenceAlgorithm = new RejectionSampling(interpreter, conditionFunction);
    results = inferenceAlgorithm.run(numSamples);
} else if (algorithm === 'importance') {
    inferenceAlgorithm = new ImportanceSampling(interpreter);
    results = inferenceAlgorithm.run(numSamples);
} else {
    console.error(`Unknown algorithm: ${algorithm}`);
    process.exit(1);
}

// Get statistics for key variables
const variableStats = {};
const sampleVariables = inferenceAlgorithm.samples[0]?.variables || {};

for (const varName in sampleVariables) {
    if (algorithm === 'importance') {
        variableStats[varName] = inferenceAlgorithm.getWeightedStatistics(varName);
    } else {
        variableStats[varName] = inferenceAlgorithm.getStatistics(varName);
    }
}

console.log('\nVariable Statistics:');
for (const varName in variableStats) {
    const stats = variableStats[varName];
    console.log(`${varName}:`);
    console.log(`  Mean: ${stats.mean.toFixed(4)}`);
    console.log(`  StdDev: ${stats.stdDev.toFixed(4)}`);
    console.log(`  Min: ${stats.min.toFixed(4)}`);
    console.log(`  Max: ${stats.max.toFixed(4)}`);
}

// Save results if an output file was specified
if (outputFile) {
    inferenceAlgorithm.saveResults(outputFile);
}