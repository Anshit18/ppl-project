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
        if (char === ',') return this.makeToken('COMMA', ',');
        if (char === '+') return this.makeToken('PLUS', '+');
        if (char === '-') return this.makeToken('MINUS', '-');
        if (char === '*') return this.makeToken('MULTIPLY', '*');
        if (char === '/') return this.makeToken('DIVIDE', '/');

        throw new Error(`Unexpected character: ${char}`);
    }

    readIdentifier() {
        let start = this.position;
        while (/[a-zA-Z]/.test(this.input[this.position])) {
            this.position++;
        }

        let value = this.input.slice(start, this.position);

        if (value === "sample") return { type: "SAMPLE", value };
        if (value === "observe") return { type: "OBSERVE", value };

        return this.makeToken('IDENTIFIER', value);
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
