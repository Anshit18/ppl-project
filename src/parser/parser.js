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
        } else if (token.type === "SAMPLE") {
            return this.parseSample();
        } else if (token.type === "OBSERVE") {
            return this.parseObserve();
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }

    parseAssignment() {
        let variable = this.consume("IDENTIFIER");
        this.consume("EQUAL");
        let expression = this.parseExpression();
        return new AST.Assignment(variable.value, expression);
    }

    parseSample() {
        this.consume("SAMPLE");
        this.consume("LPAREN");
        let distribution = this.consume("IDENTIFIER");
        this.consume("LPAREN");

        let params = [];
        while (this.tokens[this.position].type !== "RPAREN") {
            params.push(this.consume("NUMBER").value);
            if (this.tokens[this.position].type === "COMMA") {
                this.consume("COMMA");
            }
        }

        this.consume("RPAREN");
        this.consume("RPAREN");

        return new AST.SampleExpression(distribution.value, params);
    }

    parseObserve() {
        this.consume("OBSERVE");
        this.consume("LPAREN");
        let value = this.parseExpression();
        this.consume("COMMA");
        let distribution = this.parseSample();
        this.consume("RPAREN");

        return new AST.ObserveStatement(value, distribution);
    }

    parseExpression() {
        let left = this.parseTerm();

        while (this.position < this.tokens.length && (this.tokens[this.position].type === "PLUS" || this.tokens[this.position].type === "MINUS")) {
            let operator = this.consume(this.tokens[this.position].type);
            let right = this.parseTerm();
            left = new AST.BinaryExpression(left, operator.value, right);
        }

        return left;
    }

    parseTerm() {
        let left = this.parseFactor();

        while (this.position < this.tokens.length && (this.tokens[this.position].type === "MULTIPLY" || this.tokens[this.position].type === "DIVIDE")) {
            let operator = this.consume(this.tokens[this.position].type);
            let right = this.parseFactor();
            left = new AST.BinaryExpression(left, operator.value, right);
        }

        return left;
    }

    parseFactor() {
        let token = this.tokens[this.position];

        if (token.type === "NUMBER") {
            return new AST.NumberLiteral(this.consume("NUMBER").value);
        } else if (token.type === "IDENTIFIER") {
            return new AST.Variable(this.consume("IDENTIFIER").value);
        } else if (token.type === "LPAREN") {
            this.consume("LPAREN");
            let expr = this.parseExpression();
            this.consume("RPAREN");
            return expr;
        }

        throw new Error(`Unexpected token: ${token.value}`);
    }

    consume(expectedType) {
        if (this.position >= this.tokens.length) {
            throw new Error(`Unexpected end of input, expected ${expectedType}`);
        }

        let token = this.tokens[this.position];
        if (token.type !== expectedType) {
            throw new Error(`Expected ${expectedType} but found ${token.type}`);
        }

        this.position++;
        return token;
    }
}

module.exports = Parser;
