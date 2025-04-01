const Parser = require('../src/parser/parser');

test('Parser should parse a simple assignment', () => {
    const input = 'x = 5';
    const parser = new Parser(input);
    const ast = parser.parseProgram();

    expect(ast).toEqual({
        type: 'Program',
        statements: [
            {
                type: 'Assignment',
                variable: 'x',
                expression: {
                    type: 'NumberLiteral',
                    value: 5
                }
            }
        ]
    });
});
