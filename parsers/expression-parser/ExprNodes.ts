//
//  Nodes.swift
//
//  Based on work by Matthew Cheok on 15/11/15.
//  Copyright © 2015 Matthew Cheok. All rights reserved.
//  Copyright © 2020 memri. All rights reserved.
//

import {Item} from "../../model/items/Item";
import {debugHistory} from "../../cvu/views/ViewDebugger";

interface ExprNode {
    toExprString()
}

export class ExprNumberNode implements ExprNode{
    value

    constructor(value) {this.value = value};
    toString() {
        var value = this.value.toString()
        if (!/\./.test(value)) value = this.value.toFixed(1);
        return `NumberNode(${value})`
    }

    toExprString() {
        return `${this.value}`
    }
}

export class ExprNumberExpressionNode implements ExprNode{
    exp

    constructor(exp) {this.exp = exp};
    toString() {
        return `NumberExpressionNode(${this.exp})`
    }

    toExprString() {
        return `${this.exp.toExprString()}`
    }
}

export class ExprBoolNode implements ExprNode{
    value

    constructor(value) {this.value = value};
    toString() {
        return `BoolNode(${ this.value })`
    }

    toExprString() {
        return this.value ? "true" : "false"
    }
}

export class ExprStringNode implements ExprNode{
    value

    constructor(value) {this.value = value};
    toString() {
        return `StringNode(${this.value})`
    }

    toExprString() {
        return `"${this.value}"`
    }
}

export class ExprAnyNode implements ExprNode{
    value

    constructor(value) {this.value = value};
    toString() {
        return `AnyNode(${this.value})`
    }
    toExprString() {
        let item = this.value
        let uid = (item.constructor.name == "Item") && item.uid
        if (uid) {
            return `item(${item.genericType}, ${uid})`
        }
        else {
            debugHistory.error(`Not implemented serialization for: ${this.value}`)
            return "0"
        }
    }
}

export class ExprNilNode implements ExprNode{
    toString() {
        return "NilNode()"
    }
    toExprString() {
        return "nil"
    }
}

export class ExprNegationNode implements ExprNode{
    exp

    constructor(exp) {this.exp = exp};
    toString() {
        return `NegationNode(${this.exp})`
    }
    toExprString() {
        return `!${this.exp.toExprString()}`
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

export class ExprVariableNode implements ExprNode{
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

    toExprString() {
        var strName = this.name;
        if (strName == "@@DEFAULT@@") { strName = "." };
        switch (this.type) {
            case ExprVariableType.reverseEdge: return `_~${strName}${this.list == ExprVariableList.single ? "" : "[]"}`
            case ExprVariableType.reverseEdgeItem: return `~${strName}${this.list == ExprVariableList.single ? "" : "[]"}`
            case ExprVariableType.edge: return `_${strName}${this.list == ExprVariableList.single ? "" : "[]"}`
            case ExprVariableType.propertyOrItem: return `${strName}${this.list == ExprVariableList.single ? "" : "[]"}`
        }
    }
}

export class ExprLookupNode implements ExprNode{
    sequence

    constructor(sequence) {
        this.sequence = sequence;
    }
    toString() {
        return `LookupNode(${formatArray(this.sequence)})`
    }

    toExprString() {
        return this.sequence.map((node) => {
                let value = node.toExprString()
                if (value == "." && this.sequence.length > 1) {
                    return ""
                }
                return value
            }
        ).join(".")
    }
}

export class ExprBinaryOpNode implements ExprNode{
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

    toExprString() {
        return `${this.lhs.toExprString()} ${this.op} ${this.rhs.toExprString()}`
    }
}

export class ExprConditionNode implements ExprNode{
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

    toExprString() {
        return `${this.condition.toExprString()} ? ${this.trueExp.toExprString()} : ${this.falseExp.toExprString()}`
    }
}

export class ExprStringModeNode implements ExprNode{
    expressions: []

    constructor(expressions) {
        this.expressions = expressions;
    }
    toString() {
        return `StringModeNode(expressions: ${formatArray(this.expressions)})`
    }

    toExprString() {
        return this.expressions.map ((node: ExprNode) => {
            if (node.constructor.name == "ExprStringNode") {
                return node.value
            }
            else {
                return `{${node.toExprString()}}`
            }
        }).join("")
    }
}

export class ExprCallNode implements ExprNode{
    lookup
    argumentsJs

    constructor(lookup, argumentsJs) {
        this.lookup = lookup;
        this.argumentsJs = argumentsJs;
    }
    toString() {
        return `CallNode(lookup: ${this.lookup}, argument: ${formatArray(this.argumentsJs)})`
    }

    toExprString() {
        return `${this.lookup.toExprString()}(${this.argumentsJs.map(($0) => {$0.toExprString()}).join(", ")})`
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
    ExprAnyNode,
    ExprNilNode,
    ExprVariableList,
    ExprVariableNode,
    ExprVariableType
};