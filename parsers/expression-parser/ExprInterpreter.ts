//
//  Compiler.swift
//
//  Copyright © 2020 Memri. All rights reserved.
//

const {ExprLexer, ExprToken, ExprOperator, ExprOperatorPrecedence} = require("./ExprLexer");
const {ExprNodes} = require("./ExprNodes");

class ExprInterpreter {
    ast;
    lookup;
    execFunc;
    stack = [];
    
    constructor(ast, lookup, execFunc) {
        this.ast = ast
        this.lookup = lookup
        this.execFunc = execFunc
    }
    
    execute(args) {
        return this.execSingle(this.ast, args ?? ViewArguments())
    }
    
    evaluateBoolean(x) {
        return Boolean(x)
    }
    
    evaluateNumber(x) {
        return Number(x);
    }
    
    evaluateString(x) {
        return x == null ? "" : String(x);
    }
    
    compare(a, b) {
        let type = typeof a;
        if (type === "boolean") { return a == this.evaluateBoolean(b) }
        else if (type === "number") { return a == this.evaluateNumber(b) }
        else if (type === "string") { return a == `${b ?? ""}` }//TODO
        else if (a == null) { return b == null }
        else { return false }
    }
    
    execSingle(expr, args) {
        if (expr instanceof ExprNodes.ExprBinaryOpNode) {
            let result = this.execSingle(expr.lhs, args);
            
            switch (expr.op) {
                case expr.ConditionEquals:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.compare(result, otherResult)
                case expr.ConditionAND:
                    var boolLHS = this.evaluateBoolean(result)
                    if (!boolLHS) { return false }
                    else {
                        var otherResult = this.execSingle(expr.rhs, args)
                        return this.evaluateBoolean(otherResult)
                    }
                case expr.ConditionOR:
                    var boolLHS = this.evaluateBoolean(result)
                    if (boolLHS) { return true }
                    else {
                        var otherResult = this.execSingle(expr.rhs, args)
                        return this.evaluateBoolean(otherResult)
                    }
                case expr.Division:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) / this.evaluateNumber(otherResult)
                case expr.Minus:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) - this.evaluateNumber(otherResult)
                case expr.Multiplication:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) * this.evaluateNumber(otherResult)
                case expr.Plus:
                    var otherResult = this.execSingle(expr.rhs, args)
                    return this.evaluateNumber(result) + this.evaluateNumber(otherResult)
                default:
                    break // this can never happen
            }
        }
        else if (expr instanceof ExprNodes.ExprConditionNode) {
            if (this.evaluateBoolean(this.execSingle(expr.condition, args))) {
                return this.execSingle(expr.trueExp, args)
            }
            else {
                return this.execSingle(expr.falseExp, args)
            }
        }
        else if (expr instanceof ExprNodes.ExprStringModeNode) {
            var result = []
            for (var exprI in expr.expressions) {
                result.push(this.evaluateString(this.execSingle(expr.expressions[exprI], args), ""))
            }
            return result.join("")
        }
        else if (expr instanceof ExprNodes.ExprNegationNode) {
            let result = this.execSingle(expr.exp, args)
            return !this.evaluateBoolean(result)
        }
        else if (expr instanceof ExprNodes.ExprNumberNode) { return expr.value }
        else if (expr instanceof ExprNodes.ExprStringNode) { return expr.value }
        else if (expr instanceof ExprNodes.ExprBoolNode) { return expr.value }
        else if (expr instanceof ExprNodes.ExprNumberExpressionNode) {
            let result = this.execSingle(expr.exp, args)
            return this.evaluateNumber(result)
        }
        else if (expr instanceof ExprNodes.ExprLookupNode) {
            let x = this.lookup(expr, args)
            return x
        }
        else if (expr instanceof ExprNodes.ExprCallNode) {
            let fArgs = expr.arguments.map(x => this.execSingle(x, args))//TODO
            return this.execFunc(expr.lookup, fArgs, args)
        }
        
        return null
    }
}

exports.ExprInterpreter = ExprInterpreter