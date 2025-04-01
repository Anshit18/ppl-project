class Interpreter {
    constructor() {
        this.variables = {};
    }

    run() {
        return this.evaluate(this.ast);
    }

    evaluate(ast) {
        if (ast.type === "Program") {
            ast.statements.forEach(stmt => this.evaluate(stmt));
        } else if (ast.type === "Assignment") {
            this.variables[ast.variable] = this.evaluate(ast.expression);
        } else if (ast.type === "Expression") {
            return ast.value;
        }
    }
}

module.exports = Interpreter;
