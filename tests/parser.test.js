const Parser = require("../src/parser/parser");
const Lexer = require("../src/lexer/lexer");

test("Parser should parse a simple assignment", () => {
    const input = "x = 5";
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    expect(ast).toBeDefined();
});
