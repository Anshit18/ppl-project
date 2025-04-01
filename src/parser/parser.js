const AST = require("../ast/ast");

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }

    parse() {
        let statements = [];
        while (this.position < this.tokens.length) {
            statements.push(this.parseStatement());
        }
        return new AST.Program(statements);
    }

    parseStatement() {
        let token = this.tokens[this.position];

        if (token.type === "IDENTIFIER") {
            return this.parseAssignment();
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }

    parseAssignment() {
        let variable = this.consume("IDENTIFIER");
        this.consume("EQUAL");
        let expression = this.parseExpression();
        return new AST.Assignment(variable.value, expression);
    }

    parseExpression() {
        let token = this.tokens[this.position];
        if (token.type === "NUMBER" || token.type === "IDENTIFIER") {
            this.position++;
            return new AST.Expression(token.value);
        }
        throw new Error(`Invalid expression: ${token.value}`);
    }

    consume(expectedType) {
        let token = this.tokens[this.position];
        if (token.type !== expectedType) throw new Error(`Expected ${expectedType} but found ${token.type}`);
        this.position++;
        return token;
    }
}

module.exports = Parser;
