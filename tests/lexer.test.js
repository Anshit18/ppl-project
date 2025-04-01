const Lexer = require("../src/lexer/lexer");

test("Lexer should tokenize a simple assignment", () => {
    const input = "x = 5";
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    expect(tokens).toEqual([
        { type: "IDENTIFIER", value: "x" },
        { type: "EQUAL", value: "=" },
        { type: "NUMBER", value: "5" }
    ]);
});
