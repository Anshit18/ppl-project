const Interpreter = require('../src/interpreter/interpreter');

test('Interpreter should evaluate simple expressions', () => {
    const input = 'x = 5 + 3';
    const interpreter = new Interpreter(input);
    const result = interpreter.run();

    expect(result).toEqual({ x: 8 });
});
