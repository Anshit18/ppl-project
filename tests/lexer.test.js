const Lexer = require('../src/lexer/lexer');

test('Lexer should tokenize a simple assignment', () => {
    const input = 'x = 5';
    const lexer = new Lexer(input);  // Ensure Lexer is imported correctly
    const tokens = lexer.tokenize();

    expect(tokens).toEqual([
        { type: 'VARIABLE', value: 'x' },
        { type: 'EQUALS', value: '=' },
        { type: 'NUMBER', value: 5 }
    ]);
});
