const Lexer = require("../src/lexer/lexer");
const Parser = require("../src/parser/parser");
const Interpreter = require("../src/interpreter/interpreter");

test("Interpreter should evaluate simple assignment", () => {
    const input = "x = 5";
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();
    const interpreter = new Interpreter(ast);

    interpreter.run();
    expect(interpreter.variables["x"]).toBe(5);
});
