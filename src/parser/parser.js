// parser.js

const { Lexer } = require('./lexer');  // Assuming lexer is in lexer.js
const { TokenTypes } = require('./lexer');  // Token Types (like 'NUMBER', 'VARIABLE', etc.)

class Parser {
    constructor(input) {
        this.lexer = new Lexer(input);  // Initialize lexer with input string
        this.currentToken = this.lexer.getNextToken();  // Get the first token
    }

    // Helper method to advance to the next token
    eat(tokenType) {
        if (this.currentToken.type === tokenType) {
            this.currentToken = this.lexer.getNextToken();
        } else {
            throw new Error(`Expected ${tokenType}, but got ${this.currentToken.type}`);
        }
    }

    // Parse an expression (number, variable, or sample expression)
    parseExpression() {
        switch (this.currentToken.type) {
            case TokenTypes.NUMBER:
                const number = this.currentToken.value;
                this.eat(TokenTypes.NUMBER);
                return { type: 'NumberLiteral', value: number };

            case TokenTypes.VARIABLE:
                const variable = this.currentToken.value;
                this.eat(TokenTypes.VARIABLE);
                return { type: 'Variable', name: variable };

            case TokenTypes.SAMPLE:
                return this.parseSample();  // Will call another function to handle the sample expression

            // Handle more cases (like operators or function calls) later
            default:
                throw new Error('Unexpected token: ' + this.currentToken.type);
        }
    }

    // Parse a sample expression: sample(<distribution>)
    parseSample() {
        this.eat(TokenTypes.SAMPLE);  // Eat the "sample" token
        this.eat(TokenTypes.LPAREN);  // Eat the opening parenthesis

        const distribution = this.parseExpression();  // Parse the distribution inside the sample

        this.eat(TokenTypes.RPAREN);  // Eat the closing parenthesis
        return { type: 'SampleExpression', distribution };
    }

    // Parse an assignment statement: variable = expression
    parseAssignment() {
        const variable = this.currentToken.value;
        this.eat(TokenTypes.VARIABLE);
        this.eat(TokenTypes.EQUALS);
        const expression = this.parseExpression();
        return { type: 'Assignment', variable, expression };
    }

    // Main parsing method for the entire program
    parseProgram() {
        const statements = [];

        while (this.currentToken.type !== TokenTypes.EOF) {  // EOF indicates the end of input
            let statement;

            if (this.currentToken.type === TokenTypes.VARIABLE) {
                statement = this.parseAssignment();  // Parse assignment if the token is a variable
            } else if (this.currentToken.type === TokenTypes.SAMPLE) {
                statement = this.parseSample();  // Parse sample statement
            } else {
                throw new Error('Unknown statement type: ' + this.currentToken.type);
            }

            statements.push(statement);  // Add the parsed statement to the program
        }

        return { type: 'Program', statements };  // Return the complete AST for the program
    }
}

// For testing
const input = 'x = sample(Gaussian(0, 1))';  // Example input
const parser = new Parser(input);

try {
    const ast = parser.parseProgram();
    console.log(JSON.stringify(ast, null, 2));  // Print the AST in a readable format
} catch (error) {
    console.error('Error parsing program:', error.message);
}

module.exports = Parser;
