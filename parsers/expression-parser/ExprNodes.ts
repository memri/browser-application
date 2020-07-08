//
//  Nodes.swift
//
//  Based on work by Matthew Cheok on 15/11/15.
//  Copyright © 2015 Matthew Cheok. All rights reserved.
//  Copyright © 2020 memri. All rights reserved.
//


exports.ExprNumberNode = class ExprNumberNode {
    constructor(value) {this.value = value};
    toString() {
        var value = this.value.toString()
        if (!/\./.test(value)) value = this.value.toFixed(1);
        return `NumberNode(${value})`
    }
};

exports.ExprNumberExpressionNode = class ExprNumberExpressionNode {
    constructor(exp) {this.exp = exp};
    toString() {
        return `NumberExpressionNode(${this.exp})`
    }
};

exports.ExprBoolNode = class ExprBoolNode {
    constructor(value) {this.value = value};
    toString() {
        return `BoolNode(${ this.value })`
    }
};

exports.ExprStringNode = class ExprStringNode {
    constructor(value) {this.value = value};
    toString() {
        return `StringNode(${this.value})`
    }
};

exports.ExprNegationNode = class ExprNegationNode {
    constructor(exp) {this.exp = exp};
    toString() {
        return `NegationNode(${this.exp})`
    }
};

enum ExprVariableType {
    reverseEdge = "_~",
    reverseEdgeItem = "~",
    edge = "_",
    propertyOrItem = ""
}

enum ExprVariableList {
    list,
    single
}

exports.ExprVariableNode = class ExprVariableNode {
    name
    type = ExprVariableType.propertyOrItem
    list = ExprVariableList.single

    constructor(name) {
        this.name = name

        // TODO: This could be optimized by moving it into the expression parser
        for (var i in ExprVariableType) {
            var varType = ExprVariableType[i]
            if (this.name.indexOf(varType) === 0) {//TODO starts?
                this.type = varType
                this.name = this.name.substring(varType.length)//TODO suffix?
                break
            }
        }
    };
    toString() {
        return `VariableNode(${this.name}, type:${this.type}, list:${this.list})`
    }
};

exports.ExprLookupNode = class ExprLookupNode {
    constructor(sequence) {
        this.sequence = sequence;
    }
    toString() {
        return `LookupNode(${formatArray(this.sequence)})`
    }
};

exports.ExprBinaryOpNode = class ExprBinaryOpNode {
    constructor(op, lhs, rhs) {
        this.op = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `BinaryOpNode(${this.op}, lhs: ${this.lhs}, rhs: ${this.rhs})`
    }
};

exports.ExprConditionNode = class ExprConditionNode {
    constructor(condition, trueExp, falseExp) {
        this.condition = condition;
        this.trueExp = trueExp;
        this.falseExp = falseExp;
    }
    toString() {
        return `ConditionNode(condition: ${this.condition}, trueExp: ${this.trueExp}, falseExp: ${this.falseExp})`
    }
};

exports.ExprStringModeNode = class ExprStringModeNode {
    constructor(expressions) {
        this.expressions = expressions;
    }
    toString() {
    return `StringModeNode(expressions: ${formatArray(this.expressions)})`
    }
};

exports.ExprCallNode = class ExprCallNode {
    constructor(lookup, argumentsJs) {
        this.lookup = lookup;
        this.argumentsJs = argumentsJs;
    }
    toString() {
        return `CallNode(lookup: ${this.lookup}, argument: ${formatArray(this.argumentsJs)})`
    }
};


function formatArray(array) {
    return `[${array.join(", ")}]`
}