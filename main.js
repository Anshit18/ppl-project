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

// Define the path to the sample program
const filePath = path.join(examplesDir, "sample-program.ppl");

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

console.log("Executing PPL program:");
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
    console.log("Execution Result:", result);
    console.log("Variable State:", interpreter.variables);
} catch (error) {
    console.error("Runtime Error:", error.message);
}



// const fs = require("fs");
// const Lexer = require("./src/lexer/lexer");
// const Parser = require("./src/parser/parser");
// const Interpreter = require("./src/interpreter/interpreter");

// let input;
// const filePath = "./examples/sample-program.ppl";

// try {
//     input = fs.readFileSync(filePath, "utf8");
// } catch (error) {
//     console.warn(`Warning: Could not read ${filePath}, using default input.`);
//     input = `
//         x = 5 + 3
//         observe(x, normal(5, 1))
//         y = sample(normal(0, 1))
//     `;
// }

// const lexer = new Lexer(input);
// const tokens = lexer.tokenize();
// console.log("Tokens:", tokens);

// const parser = new Parser(tokens);
// const ast = parser.parse();
// console.log("AST:", JSON.stringify(ast, null, 2));

// const interpreter = new Interpreter(ast);
// const result = interpreter.run();
// console.log("Execution Result:", result);
