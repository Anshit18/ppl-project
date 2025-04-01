class Interpreter {
    constructor(ast) {
        this.ast = ast;
        this.variables = {};
    }

    run() {
        if (!this.ast || !this.ast.statements) throw new Error("Invalid AST");
        return this.evaluate(this.ast);
    }

    evaluate(ast) {
        if (ast.type === "Program") {
            ast.statements.forEach(stmt => this.evaluate(stmt));
        } else if (ast.type === "Assignment") {
            this.variables[ast.variable] = this.evaluate(ast.expression);
        } else if (ast.type === "Expression") {
            return parseFloat(ast.value);
        }
    }
}

module.exports = Interpreter;
