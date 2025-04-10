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




// class Parser {
//     constructor(tokens) {
//         this.tokens = tokens;
//         this.position = 0;
//     }

//     parse() {
//         let statements = [];
//         while (this.position < this.tokens.length) {
//             statements.push(this.parseStatement());
//         }
//         return statements;
//     }

//     parseStatement() {
//         let token = this.tokens[this.position];

//         // If it's an assignment like `x = ...`
//         if (token.type === "IDENTIFIER" && this.tokens[this.position + 1]?.type === "EQUAL") {
//             return this.parseAssignment();
//         }

//         // If it's a function call like `observe(x, normal(5,1))`
//         if (token.type === "IDENTIFIER" && this.tokens[this.position + 1]?.type === "LPAREN") {
//             return this.parseFunctionCall();
//         }

//         throw new Error(`Unexpected token: ${token.value}`);
//     }

//     parseAssignment() {
//         let variableName = this.tokens[this.position].value;
//         this.position++; // Move past variable

//         this.consume("EQUAL", `Expected '=' after variable name, found: ${this.tokens[this.position].value}`);
        
//         let expression = this.parseExpression();
//         return { type: "Assignment", variable: variableName, expression };
//     }

//     parseFunctionCall() {
//         const name = this.consume("IDENTIFIER").value;  // Get the function name
//         this.consume("LPAREN"); // Ensure we consume the '(' after the function name
    
//         const args = [];
//         while (this.tokens[this.position].type !== "RPAREN") {
//             args.push(this.parseExpression());  // Parse the function arguments (expressions)
//             if (this.tokens[this.position].type === "COMMA") {
//                 this.consume("COMMA"); // Consume the comma separator
//             }
//         }
    
//         this.consume("RPAREN"); // Consume the closing parenthesis
//         return { type: "FUNCTION_CALL", name, args }; // Return the function call with name and arguments
//     }    

//     parseExpression() {
//         let left = this.parseTerm();

//         while (this.position < this.tokens.length &&
//                (this.tokens[this.position].type === "PLUS" || this.tokens[this.position].type === "MULTIPLY")) {
//             let operator = this.tokens[this.position].value;
//             this.position++;
//             let right = this.parseTerm();
//             left = { type: "BinaryExpression", operator, left, right };
//         }

//         return left;
//     }

//     parseTerm() {
//         let token = this.tokens[this.position];
        
//         if (token.type === "IDENTIFIER") {
//             // Handle function call (e.g., observe, sample)
//             if (this.tokens[this.position + 1] && this.tokens[this.position + 1].type === "LPAREN") {
//                 return this.parseFunctionCall();
//             } else {
//                 // Handle variables or constants
//                 return this.consume("IDENTIFIER");
//             }
//         }
    
//         // Handle numbers or other terms
//         if (token.type === "NUMBER") {
//             return this.consume("NUMBER");
//         }
    
//         // Handle other possible terms (like parentheses)
//         if (token.type === "LPAREN") {
//             this.consume("LPAREN");
//             const expr = this.parseExpression();
//             this.consume("RPAREN");
//             return expr;
//         }
    
//         throw new Error(`Unexpected token: ${token.value}`);
//     }    

//     consume(expectedType, errorMessage) {
//         if (this.tokens[this.position].type !== expectedType) {
//             throw new Error(errorMessage);
//         }
//         this.position++; // Move past expected token
//     }
// }
// module.exports = Parser;




// const AST = require("../ast/ast");

// class Parser {
//     constructor(tokens) {
//         this.tokens = tokens;
//         this.position = 0;
//     }

//     parse() {
//         let statements = [];
//         while (this.position < this.tokens.length) {
//             statements.push(this.parseStatement());
//         }
//         return new AST.Program(statements);
//     }

//     parseStatement() {
//         let token = this.tokens[this.position];
    
//         // Check for function calls (like `observe(...)`)
//         if (token.type === "IDENTIFIER" && this.tokens[this.position + 1]?.type === "LPAREN") {
//             return this.parseFunctionCall();
//         }
    
//         // Handle Assignments: `variable = expression`
//         if (token.type === "IDENTIFIER") {
//             let variableName = token.value;
//             this.position++; // Move past variable
    
//             // Ensure `=` token is present
//             if (this.tokens[this.position].type !== "EQUAL") {
//                 throw new Error(`Expected '=', found: ${this.tokens[this.position].value}`);
//             }
//             this.position++; // Move past '='
    
//             // Parse the right-hand side as an expression
//             let expression = this.parseExpression();
    
//             return { type: "Assignment", variable: variableName, expression };
//         }
    
//         throw new Error(`Unexpected token: ${token.value}`);
//     }    

//     // parseStatement() {
//     //     let token = this.tokens[this.position];

//     //     // Handle Assignments: `variable = expression`
//     //     if (token.type === "IDENTIFIER") {
//     //         let variableName = token.value;
//     //         this.position++; // Move past the variable

//     //         // Ensure `=` token is present
//     //         if (this.tokens[this.position].type !== "EQUAL") {
//     //             throw new Error(`Expected '=', found: ${this.tokens[this.position].value}`);
//     //         }
//     //         this.position++; // Move past '='

//     //         // Parse the right-hand side as an expression
//     //         let expression = this.parseExpression();

//     //         return { type: "Assignment", variable: variableName, expression };
//     //     }

//     //     // Handle `observe(x, normal(5,1))`
//     //     if (token.type === "IDENTIFIER" && token.value === "observe") {
//     //         this.position++;
//     //         return this.parseObserve();
//     //     }

//     //     throw new Error(`Unexpected token: ${token.value}`);
//     // }

//     // parseStatement() {
//     //     let token = this.tokens[this.position];

//     //     if (token.type === "IDENTIFIER") {
//     //         return this.parseAssignment();
//     //     }

//     //     throw new Error(`Unexpected token: ${token.value}`);
//     // }

//     parseFunctionCall() {
//         let functionName = this.tokens[this.position].value;
//         this.position++; // Move past function name
    
//         if (this.tokens[this.position].type !== "LPAREN") {
//             throw new Error(`Expected '(', found: ${this.tokens[this.position].value}`);
//         }
//         this.position++; // Move past '('
    
//         let args = [];
//         while (this.tokens[this.position].type !== "RPAREN") {
//             args.push(this.parseExpression()); // Parse argument
    
//             if (this.tokens[this.position].type === "COMMA") {
//                 this.position++; // Skip comma and continue parsing arguments
//             }
//         }
    
//         this.position++; // Move past ')'
//         return { type: "FunctionCall", functionName, arguments: args };
//     }    
    
//     parseAssignment() {
//         let variable = this.consume("IDENTIFIER");
//         this.consume("EQUAL");
//         let expression = this.parseExpression();
//         return new AST.Assignment(variable.value, expression);
//     }

//     parseExpression() {
//         let left = this.parseTerm();  // Parse the first part (a number or variable)
    
//         while (
//             this.position < this.tokens.length &&
//             ["PLUS", "MINUS", "MULTIPLY", "DIVIDE"].includes(this.tokens[this.position].type)
//         ) {
//             let operator = this.tokens[this.position]; // Store operator (`+`, `-`, etc.)
//             this.position++; // Move past operator
//             let right = this.parseTerm(); // Parse the right side
    
//             left = { type: "BinaryExpression", operator: operator.value, left, right };
//         }
    
//         return left;
//     }
    
//     parseTerm() {
//         let token = this.tokens[this.position];
    
//         if (token.type === "NUMBER") {
//             this.position++;
//             return { type: "NumberLiteral", value: token.value };
//         }
    
//         if (token.type === "IDENTIFIER") {
//             this.position++;
//             return { type: "Variable", name: token.value };
//         }
    
//         if (token.type === "LPAREN") {
//             this.position++; // Skip '('
//             let expression = this.parseExpression(); // Recursively parse the inner expression
//             if (this.tokens[this.position].type !== "RPAREN") {
//                 throw new Error(`Expected ')' but found: ${this.tokens[this.position].value}`);
//             }
//             this.position++; // Skip ')'
//             return expression;
//         }
    
//         throw new Error(`Unexpected token: ${token.value}`);
//     }    

//     // parseExpression() {
//     //     let token = this.tokens[this.position];
//     //     if (token.type === "NUMBER" || token.type === "IDENTIFIER") {
//     //         this.position++;
//     //         return new AST.Expression(token.value);
//     //     }
//     //     throw new Error(`Invalid expression: ${token.value}`);
//     // }

//     consume(expectedType) {
//         let token = this.tokens[this.position];
//         if (token.type !== expectedType) throw new Error(`Expected ${expectedType} but found ${token.type}`);
//         this.position++;
//         return token;
//     }
// }

// module.exports = Parser;
