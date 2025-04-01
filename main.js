const Lexer = require("./src/lexer/lexer");
const Parser = require("./src/parser/parser");
const Interpreter = require("./src/interpreter/interpreter");
const fs = require("fs");

const code = fs.readFileSync("./examples/sample-program.ppl", "utf-8");
const lexer = new Lexer(code);
const tokens = lexer.tokenize();
const parser = new Parser(tokens);
const ast = parser.parse();
const interpreter = new Interpreter(ast);

console.log("Running PPL Program...");
interpreter.run();
console.log("Execution finished.");
