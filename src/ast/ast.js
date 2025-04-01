class ASTNode {
    constructor(type) {
        this.type = type;
    }
}

class Program extends ASTNode {
    constructor(statements) {
        super("Program");
        this.statements = statements;
    }
}

class Assignment extends ASTNode {
    constructor(variable, expression) {
        super("Assignment");
        this.variable = variable;
        this.expression = expression;
    }
}

class Expression extends ASTNode {
    constructor(value) {
        super("Expression");
        this.value = value;
    }
}

module.exports = { Program, Assignment, Expression };
