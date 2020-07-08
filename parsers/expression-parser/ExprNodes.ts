//
//  Nodes.swift
//
//  Based on work by Matthew Cheok on 15/11/15.
//  Copyright © 2015 Matthew Cheok. All rights reserved.
//  Copyright © 2020 memri. All rights reserved.
//


export class ExprNumberNode {
    value

    constructor(value) {this.value = value};
    toString() {
        var value = this.value.toString()
        if (!/\./.test(value)) value = this.value.toFixed(1);
        return `NumberNode(${value})`
    }
}

export class ExprNumberExpressionNode {
    exp

    constructor(exp) {this.exp = exp};
    toString() {
        return `NumberExpressionNode(${this.exp})`
    }
}

export class ExprBoolNode {
    value

    constructor(value) {this.value = value};
    toString() {
        return `BoolNode(${ this.value })`
    }
}

export class ExprStringNode {
    value

    constructor(value) {this.value = value};
    toString() {
        return `StringNode(${this.value})`
    }
}

export class ExprNegationNode {
    exp

    constructor(exp) {this.exp = exp};
    toString() {
        return `NegationNode(${this.exp})`
    }
}

export enum ExprVariableType {
    reverseEdge = /*"reverseEdge"*/"_~",
    reverseEdgeItem = /*"reverseEdgeItem"*/"~",
    edge = /*"edge"*/"_",
    propertyOrItem = /*"propertyOrItem"*/""
}

export enum ExprVariableList {
    list = "list",
    single = "single"
}

export class ExprVariableNode {
    name
    type = ExprVariableType.propertyOrItem
    list = ExprVariableList.single

    constructor(name) {
        this.name = name

        // TODO: This could be optimized by moving it into the expression parser
        for (var i in ExprVariableType) {
            var varType = ExprVariableType[i];
            if (this.name.indexOf(varType) === 0) {//TODO starts?
                this.type = i
                this.name = this.name.substring(varType.length)//TODO suffix?
                break
            }
        }
    };
    toString() {
        return `VariableNode(${this.name}, type:${this.type}, list:${this.list})`
    }
}

export class ExprLookupNode {
    sequence

    constructor(sequence) {
        this.sequence = sequence;
    }
    toString() {
        return `LookupNode(${formatArray(this.sequence)})`
    }
}

export class ExprBinaryOpNode {
    op
    lhs
    rhs
    constructor(op, lhs, rhs) {
        this.op = op;
        this.lhs = lhs;
        this.rhs = rhs;
    }
    toString() {
        return `BinaryOpNode(${this.op}, lhs: ${this.lhs}, rhs: ${this.rhs})`
    }
}

export class ExprConditionNode {
    condition
    trueExp
    falseExp

    constructor(condition, trueExp, falseExp) {
        this.condition = condition;
        this.trueExp = trueExp;
        this.falseExp = falseExp;
    }
    toString() {
        return `ConditionNode(condition: ${this.condition}, trueExp: ${this.trueExp}, falseExp: ${this.falseExp})`
    }
}

export class ExprStringModeNode {
    expressions

    constructor(expressions) {
        this.expressions = expressions;
    }
    toString() {
    return `StringModeNode(expressions: ${formatArray(this.expressions)})`
    }
}

export class ExprCallNode {
    lookup
    argumentsJs

    constructor(lookup, argumentsJs) {
        this.lookup = lookup;
        this.argumentsJs = argumentsJs;
    }
    toString() {
        return `CallNode(lookup: ${this.lookup}, argument: ${formatArray(this.argumentsJs)})`
    }
}


function formatArray(array) {
    return `[${array.join(", ")}]`
}

export var ExprNodes = {
    ExprBinaryOpNode,
    ExprBoolNode,
    ExprCallNode,
    ExprConditionNode,
    ExprLookupNode,
    ExprNegationNode,
    ExprNumberExpressionNode,
    ExprNumberNode,
    ExprStringModeNode,
    ExprStringNode,
    ExprVariableList,
    ExprVariableNode,
    ExprVariableType
};