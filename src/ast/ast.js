class Program {
    constructor(statements) {
        this.type = "Program";
        this.statements = statements;
    }
}

class Assignment {
    constructor(variable, expression) {
        this.type = "Assignment";
        this.variable = variable;
        this.expression = expression;
    }
}

class Expression {
    constructor(value) {
        this.type = "Expression";
        this.value = value;
    }
}

module.exports = { Program, Assignment, Expression };
