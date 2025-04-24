class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.current = 0; // Pointer to track the current token
    }

    // Helper function to check if we reached the end of the tokens
    isAtEnd() {
        return this.current >= this.tokens.length;
    }

    // Function to get the current token
    peek() {
        return this.isAtEnd() ? null : this.tokens[this.current];
    }

    // Function to advance and return the previous token
    advance() {
        if (!this.isAtEnd()) this.current++;
        return this.tokens[this.current - 1];
    }

    // Check if current token matches expected type
    match(type) {
        return !this.isAtEnd() && this.peek().type === type;
    }

    // Check if the next token matches expected type
    matchNext(type) {
        if (this.current + 1 >= this.tokens.length) return false;
        return this.tokens[this.current + 1].type === type;
    }

    // Function to consume a token of a specific type
    consume(type, errorMessage) {
        if (this.peek() && this.peek().type === type) {
            return this.advance();
        }
        throw new Error(errorMessage || `Expected token of type ${type}, but got ${this.peek()?.type}`);
    }

    // Parse the entire program
    parse() {
        const statements = [];
        try {
            while (!this.isAtEnd()) {
                statements.push(this.parseStatement());
            }
            return { type: "Program", statements };
        } catch (error) {
            console.error("Parsing error:", error.message);
            return { type: "Error", message: error.message };
        }
    }

    // Parse a single statement
    parseStatement() {
        if (this.match("IDENTIFIER")) {
            // Check for assignment: variable = expression
            if (this.matchNext("EQUAL")) {
                return this.parseAssignment();
            }
            
            // Check for function calls: observe(...) or other functions
            if (this.matchNext("LPAREN")) {
                return this.parseFunctionCall();
            }
        }
        
        throw new Error(`Unexpected token: ${this.peek()?.value || 'end of input'}`);
    }

    // Parse assignment statement: variable = expression
    parseAssignment() {
        const variable = this.consume("IDENTIFIER").value;
        this.consume("EQUAL", `Expected '=' after variable name '${variable}'`);
        const expression = this.parseExpression();
        return { type: "Assignment", variable, expression };
    }

    // Parse function call like observe(x, normal(5, 1))
    parseFunctionCall() {
        const name = this.consume("IDENTIFIER").value;
        this.consume("LPAREN", `Expected '(' after function name '${name}'`);
        
        const args = [];
        // If not empty argument list
        if (!this.match("RPAREN")) {
            do {
                args.push(this.parseExpression());
                
                // If there's a comma, consume it and continue parsing arguments
                if (this.match("COMMA")) {
                    this.advance();
                } else {
                    break; // No more arguments
                }
            } while (!this.isAtEnd() && !this.match("RPAREN"));
        }
        
        this.consume("RPAREN", `Expected ')' after arguments for '${name}'`);
        return { type: "FunctionCall", name, arguments: args };
    }

    // Parse expressions with precedence handling
    parseExpression() {
        return this.parseAddition();
    }

    // Handle addition and subtraction
    parseAddition() {
        let left = this.parseMultiplication();
        
        while (this.match("PLUS") || this.match("MINUS")) {
            const operator = this.advance().value;
            const right = this.parseMultiplication();
            left = { type: "BinaryExpression", operator, left, right };
        }
        
        return left;
    }

    // Handle multiplication and division
    parseMultiplication() {
        let left = this.parsePrimary();
        
        while (this.match("MULTIPLY") || this.match("DIVIDE")) {
            const operator = this.advance().value;
            const right = this.parsePrimary();
            left = { type: "BinaryExpression", operator, left, right };
        }
        
        return left;
    }

    // Parse primary expressions (numbers, variables, parenthesized expressions, function calls)
    parsePrimary() {
        if (this.match("NUMBER")) {
            return { type: "NumberLiteral", value: this.advance().value };
        }
        
        if (this.match("IDENTIFIER")) {
            // Check if it's a function call
            if (this.matchNext("LPAREN")) {
                return this.parseFunctionCall();
            }
            
            // Otherwise it's a variable
            return { type: "Variable", name: this.advance().value };
        }
        
        if (this.match("LPAREN")) {
            this.advance(); // Consume '('
            const expr = this.parseExpression();
            this.consume("RPAREN", "Expected ')' after expression");
            return expr;
        }
        
        throw new Error(`Unexpected token: ${this.peek()?.value || 'end of input'}`);
    }
}

module.exports = Parser;
