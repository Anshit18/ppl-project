const fs = require("fs");
const Lexer = require("./src/lexer/lexer");
const Parser = require("./src/parser/parser");
const Interpreter = require("./src/interpreter/interpreter");

const code = fs.readFileSync("./examples/sample-program.ppl", "utf-8");

const lexer = new Lexer(code);
const tokens = [];
let token;
while ((token = lexer.nextToken()) !== null) {
    tokens.push(token);
}

const parser = new Parser(tokens);
const ast = parser.parse();

const interpreter = new Interpreter();
interpreter.evaluate(ast);

console.log("Execution complete.");
