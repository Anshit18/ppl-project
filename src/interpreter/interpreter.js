class Interpreter {
    constructor() {
        this.variables = {};
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
