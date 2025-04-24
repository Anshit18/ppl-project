class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
    }

    nextToken() {
        while (this.position < this.input.length) {
            let char = this.input[this.position];

            // Skip whitespace
            if (/\s/.test(char)) {
                this.position++;
                continue;
            }

            // Skip comments (newly added)
            if (char === "#") {
                while (this.position < this.input.length && this.input[this.position] !== "\n") {
                    this.position++;  // Skip until end of line
                }
                continue;  // Move to the next token
            }

            // Handle known tokens
            if (/[a-zA-Z]/.test(char)) {
                return this.identifier();
            }
            if (/[0-9]/.test(char)) {
                return this.number();
            }
            if (char === "=") {
                this.position++;
                return { type: "EQUAL", value: "=" };
            }
            if (char === "+") {
                this.position++;
                return { type: "PLUS", value: "+" };
            }
            if (char === "-") {
                this.position++;
                return { type: "MINUS", value: "-" };
            }
            if (char === "*") {
                this.position++;
                return { type: "MULTIPLY", value: "*" };
            }
            if (char === "/") {
                this.position++;
                return { type: "DIVIDE", value: "/" };
            }
            if (char === "(") {
                this.position++;
                return { type: "LPAREN", value: "(" };
            }
            if (char === ")") {
                this.position++;
                return { type: "RPAREN", value: ")" };
            }
            if (char === ",") { 
                this.position++;
                return { type: "COMMA", value: "," };
            }

            // If no valid token is found
            throw new Error(`Unexpected character: ${char}`);
        }
        return { type: "EOF", value: null };
    }

    identifier() {
        let start = this.position;
        while (this.position < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.position])) {
            this.position++;
        }
        return { type: "IDENTIFIER", value: this.input.slice(start, this.position) };
    }

    number() {
        let start = this.position;
        // Handle integer part
        while (this.position < this.input.length && /[0-9]/.test(this.input[this.position])) {
            this.position++;
        }
        
        // Handle decimal part if present
        if (this.position < this.input.length && this.input[this.position] === '.') {
            this.position++; // Skip the decimal point
            // Must have at least one digit after decimal
            if (this.position < this.input.length && /[0-9]/.test(this.input[this.position])) {
                while (this.position < this.input.length && /[0-9]/.test(this.input[this.position])) {
                    this.position++;
                }
            } else {
                // Reset position to before the decimal
                this.position--;
            }
        }
        
        return { type: "NUMBER", value: Number(this.input.slice(start, this.position)) };
    }

    tokenize() {
        let tokens = [];
        let token;
        while ((token = this.nextToken()).type !== "EOF") {
            tokens.push(token);
        }
        return tokens;
    }
}

module.exports = Lexer;



// class Lexer {
//     constructor(input) {
//         this.input = input;
//         this.position = 0;
//     }

//     tokenize() {
//         let tokens = [];
//         let token;
//         while ((token = this.nextToken()) !== null) {
//             tokens.push(token);
//         }
//         return tokens;
//     }

//     nextToken() {
//         this.skipWhitespace();

//         if (this.position >= this.input.length) return null;

//         let char = this.input[this.position];

//         if (/[a-zA-Z]/.test(char)) return this.readIdentifier();
//         if (/\d/.test(char)) return this.readNumber();
//         if (char === '=') return this.makeToken('EQUAL', '=');
//         if (char === '(') return this.makeToken('LPAREN', '(');
//         if (char === ')') return this.makeToken('RPAREN', ')');

//         throw new Error(`Unexpected character: ${char}`);
//     }

//     readIdentifier() {
//         let start = this.position;
//         while (/[a-zA-Z]/.test(this.input[this.position])) {
//             this.position++;
//         }
//         return this.makeToken('IDENTIFIER', this.input.slice(start, this.position));
//     }

//     readNumber() {
//         let start = this.position;
//         while (/\d/.test(this.input[this.position])) {
//             this.position++;
//         }
//         return this.makeToken('NUMBER', this.input.slice(start, this.position));
//     }

//     makeToken(type, value) {
//         this.position++;
//         return { type, value };
//     }

//     skipWhitespace() {
//         while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
//             this.position++;
//         }
//     }
// }

// module.exports = Lexer;
