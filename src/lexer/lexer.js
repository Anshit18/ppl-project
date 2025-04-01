class Lexer {
    constructor(input) {
        this.input = input;
        this.position = 0;
    }

    tokenize() {
        let tokens = [];
        let token;
        while ((token = this.nextToken()) !== null) {
            tokens.push(token);
        }
        return tokens;
    }

    nextToken() {
        this.skipWhitespace();

        if (this.position >= this.input.length) return null;

        let char = this.input[this.position];

        if (/[a-zA-Z]/.test(char)) return this.readIdentifier();
        if (/\d/.test(char)) return this.readNumber();
        if (char === '=') return this.makeToken('EQUAL', '=');
        if (char === '(') return this.makeToken('LPAREN', '(');
        if (char === ')') return this.makeToken('RPAREN', ')');

        throw new Error(`Unexpected character: ${char}`);
    }

    readIdentifier() {
        let start = this.position;
        while (/[a-zA-Z]/.test(this.input[this.position])) {
            this.position++;
        }
        return this.makeToken('IDENTIFIER', this.input.slice(start, this.position));
    }

    readNumber() {
        let start = this.position;
        while (/\d/.test(this.input[this.position])) {
            this.position++;
        }
        return this.makeToken('NUMBER', this.input.slice(start, this.position));
    }

    makeToken(type, value) {
        this.position++;
        return { type, value };
    }

    skipWhitespace() {
        while (this.position < this.input.length && /\s/.test(this.input[this.position])) {
            this.position++;
        }
    }
}

module.exports = Lexer;
