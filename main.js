const fs = require("fs");
const Lexer = require("./src/lexer/lexer");
const Parser = require("./src/parser/parser");
const Interpreter = require("./src/interpreter/interpreter");

let input;
const filePath = "./examples/sample-program.ppl";

try {
    input = fs.readFileSync(filePath, "utf8");
} catch (error) {
    console.warn(`Warning: Could not read ${filePath}, using default input.`);
    input = `
        x = 5 + 3
        observe(x, normal(5, 1))
        y = sample(normal(0, 1))
    `;
}

const lexer = new Lexer(input);
const tokens = lexer.tokenize();
console.log("Tokens:", tokens);

const parser = new Parser(tokens);
const ast = parser.parse();
console.log("AST:", JSON.stringify(ast, null, 2));

const interpreter = new Interpreter(ast);
const result = interpreter.run();
console.log("Execution Result:", result);
