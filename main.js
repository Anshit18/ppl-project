const fs = require("fs");
const path = require("path");
const Lexer = require("./src/lexer/lexer");
const Parser = require("./src/parser/parser");
const Interpreter = require("./src/interpreter/interpreter");
const utils = require("./src/utils/utils");

// Create the examples directory if it doesn't exist
const examplesDir = path.join(__dirname, "examples");
if (!fs.existsSync(examplesDir)) {
    fs.mkdirSync(examplesDir, { recursive: true });
}

// Check for command line argument to specify which example to run
const exampleArg = process.argv[2];
let filePath;

if (exampleArg && exampleArg.startsWith('--example=')) {
    const exampleName = exampleArg.split('=')[1];
    filePath = path.join(examplesDir, `${exampleName}.ppl`);
} else {
    filePath = path.join(examplesDir, "sample-program.ppl");
}

// Try to read the sample program file
let input;
try {
    input = fs.readFileSync(filePath, "utf8");
    console.log(`Successfully loaded program from ${filePath}`);
} catch (error) {
    console.warn(`Warning: Could not read ${filePath}, using default input.`);
    input = `
        x = 5 + 3
        observe(x, normal(5, 1))
        y = sample(normal(0, 1))
        z = x * y
    `;
    
    // Write the default program to the file for future use
    try {
        fs.writeFileSync(filePath, input.trim());
        console.log(`Created sample program at ${filePath}`);
    } catch (writeError) {
        console.error(`Could not write to ${filePath}:`, writeError.message);
    }
}

console.log("\nExecuting PPL program:");
console.log(input);
console.log("-------------------");

// Lexical analysis
console.log("Lexical Analysis:");
const lexer = new Lexer(input);
const tokens = lexer.tokenize();
console.log("Tokens:", tokens);
console.log("-------------------");

// Parsing
console.log("Parsing:");
const parser = new Parser(tokens);
const ast = parser.parse();
console.log("AST:", JSON.stringify(ast, null, 2));
console.log("-------------------");

// Interpretation
console.log("Interpretation:");
const interpreter = new Interpreter(ast);
try {
    const result = interpreter.run();
    
    console.log("Last Statement Result:", result.result);
    console.log("Variable State:", result.variables);
    
    console.log("\nProbabilistic Analysis:");
    console.log("Total Log Probability:", result.totalLogProb);
    
    if (result.observations.length > 0) {
        console.log("\nObservations:");
        result.observations.forEach((obs, index) => {
            console.log(`  [${index + 1}] Observed value ${obs.value} in ${obs.distribution} distribution: log probability = ${obs.logProb}`);
        });
    } else {
        console.log("No observations were made in this program.");
    }
    
    console.log("\nModel Evidence (approximation):", Math.exp(result.totalLogProb));
} catch (error) {
    console.error("Runtime Error:", error.message);
}
