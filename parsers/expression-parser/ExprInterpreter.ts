//
//  Compiler.swift
//
//  Copyright © 2020 Memri. All rights reserved.
//

import { ViewArguments } from "../../cvu/views/CascadableDict";

import {ExprLexer, ExprToken, ExprOperator, ExprOperatorPrecedence} from "./ExprLexer";
import {
    ExprBinaryOpNode,
    ExprConditionNode,
    ExprStringModeNode,
    ExprNegationNode,
    ExprNumberNode,
    ExprStringNode,
    ExprBoolNode,
    ExprNumberExpressionNode,
    ExprLookupNode,
    ExprCallNode,
    ExprVariableNode, ExprNilNode, ExprAnyNode
} from "./ExprNodes";
import {Item} from "../../model/items/Item";

export class ExprInterpreter {
    ast: ExprNode
    lookup;
    execFunc;
    stack = [];
    compilableIdentifiers = ["view", "currentView"]
    
    constructor(ast, lookup, execFunc) {
        this.ast = ast
        this.lookup = lookup
        this.execFunc = execFunc
    }
    
    execute(args) {
        return this.execSingle(this.ast, args)
    }
    
    evaluateBoolean(x) {
        if (Array.isArray(x)) {
            return x.length > 0
        } else {
            return Boolean(x)
        }
    }
    
    evaluateNumber(x) {
        return Number(x);
    }

    evaluateDateTime(x) {
        return x//TODO as? Date
    }
    
    evaluateString(x) {
        return x == null ? "" : String(x);
    }
    
    compare(a, b) {
        let type = typeof a;
        if (type === "boolean") { return a == this.evaluateBoolean(b) }
        else if (type === "number") { return a == this.evaluateNumber(b) }
        else if (type === "string") { return a == `${b ?? ""}` }//TODO
        else if (a instanceof Item && b instanceof Item) { return a == b }
        else if (a == null) { return b == null }
        else { return false }
    }

    compile(args?) {
        let recur = function(node) {
            if (node instanceof ExprLookupNode) {
                let first = node.sequence[0]
                if (first instanceof ExprVariableNode) {
                    if (this.compilableIdentifiers.includes(first.name)) {
                        let value = tgus.lookup(node, args)
                        if (typeof value == "boolean") {
                            return new ExprBoolNode(value)
                        } else if (typeof value == "number") {
                            return new ExprNumberNode(Number(value))
                        } else if (typeof value == "string") {
                            return new ExprStringNode(value)
                        } else if (value == undefined) {
                            return new ExprNilNode()
                        } else {
                            return new ExprAnyNode(value)
                        }
                    }
                }
            } else if (node instanceof ExprBinaryOpNode) {
                return new ExprBinaryOpNode(
                    node.op,
                    recur(node.lhs),
                    recur(node.rhs)
                )
            } else if (node instanceof ExprConditionNode) {
                return new ExprConditionNode(
                    recur(node.condition),
                    recur(node.trueExp),
                    recur(node.falseExp)
                )
            } else if (node instanceof ExprStringModeNode) {
                var expressions = []
                node.expressions.forEach((node) => { expressions.push(recur(node)) })
                return new ExprStringModeNode(expressions)
            } else if (node instanceof ExprCallNode) {
                // recur(node.lookup) // TODO Functions are not supported
                var argumentsJs = []
                node.argumentsJs.forEach((node) => { argumentsJs.push(recur(node)) })
                return new ExprCallNode(node.lookup, argumentsJs)
            }
            return node
        }.bind(this)

        this.ast = recur(this.ast)

        return this.ast
    }

    execSingle(expr, args) {
        if (expr instanceof ExprBinaryOpNode) {
            let result = this.execSingle(expr.lhs, args);
            
            switch (expr.op) {
                case ExprOperator.ConditionEquals:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.compare(result, otherResult)
                case ExprOperator.ConditionAND:
                    var boolLHS = this.evaluateBoolean(result)
                    if (!boolLHS) { return false }
                    else {
                        var otherResult = this.execSingle(expr.rhs, args)
                        return otherResult //this.evaluateBoolean(otherResult)
                    }
                case ExprOperator.ConditionOR:
                    var boolLHS = result //this.evaluateBoolean(result)
                    if (this.evaluateBoolean(boolLHS)) { return boolLHS }
                    else {
                        var otherResult = this.execSingle(expr.rhs, args)
                        return otherResult //this.evaluateBoolean(otherResult)
                    }
                case ExprOperator.Division:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) / this.evaluateNumber(otherResult)
                case ExprOperator.Minus:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) - this.evaluateNumber(otherResult)
                case ExprOperator.Multiplication:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) * this.evaluateNumber(otherResult)
                case ExprOperator.Plus:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) + this.evaluateNumber(otherResult)
                default:
                    break // this can never happen
            }
        }
        else if (expr instanceof ExprConditionNode) {
            if (this.evaluateBoolean(this.execSingle(expr.condition, args))) {
                return this.execSingle(expr.trueExp, args)
            }
            else {
                return this.execSingle(expr.falseExp, args)
            }
        }
        else if (expr instanceof ExprStringModeNode) {
            var result = []
            for (var exprI in expr.expressions) {
                result.push(this.evaluateString(this.execSingle(expr.expressions[exprI], args), ""))
            }
            return result.join("")
        }
        else if (expr instanceof ExprNegationNode) {
            let result = this.execSingle(expr.exp, args)
            return !this.evaluateBoolean(result)
        }
        else if (expr instanceof ExprNumberNode) { return expr.value }
        else if (expr instanceof ExprStringNode) { return expr.value }
        else if (expr instanceof ExprBoolNode) { return expr.value }
        else if (expr instanceof ExprNilNode) { return null }
        else if (expr instanceof ExprAnyNode) { return expr.value }
        else if (expr instanceof ExprNumberExpressionNode) {
            let result = this.execSingle(expr.exp, args)
            return this.evaluateNumber(result)
        }
        else if (expr instanceof ExprLookupNode) {
            let x = this.lookup(expr, args)
            return x
        }
        else if (expr instanceof ExprCallNode) {
            let fArgs = expr.argumentsJs.map(x => this.execSingle(x, args))//TODO
            return this.execFunc(expr.lookup, fArgs, args)
        }
        
        return null
    }
}

exports.ExprInterpreter = ExprInterpreter