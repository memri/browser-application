import {CVUSerializer} from "./CVUToString";

export enum CompileScope {
    all="all",
    needed="needed",
    none="none"
}

export class CVUParsedDefinition {
    name: string
    selector: string
    domain: string
    get definitionType() {return ""}
    isCompiled: boolean = false

    constructor(selector  = "", name?, domain = "user", parsed?) {
        //super(selector, name, domain, parsed)
        if (typeof selector != "string") {
            parsed = selector;
            selector = "";
        }

        this.selector = selector
        this.name = name
        this.domain = domain;
        this.parsed = parsed
    }
    
    subscript(propName:string) {
        return this.parsed && this.parsed[propName]
    }

    setSubscript(propName:string, value) {
        if (this.parsed == undefined) { this.parsed = {} }
        this.parsed[propName] = value
    }

    
    parsed: {};

    get description(): string {
        return this.toCVUString(0, "    ")
    }
    
    toCVUString(depth: number, tab: string): string {
        if (this.selector == `[renderer = "list"]`) {

        }

        let body = CVUSerializer.dictToString(this.parsed ?? {}, depth+1, tab, true, true, function (lhp, rhp) {
            let lv = this.parsed && this.parsed[lhp];
            let rv = this.parsed && this.parsed[rhp]

            let leftIsDict = lv && typeof lv.isCVUObject === "function"
            let rightIsDict = rv && typeof rv.isCVUObject === "function"
            let leftHasChildren = lv && lv["children"] != null
            let rightHasChildren = rv && rv["children"] != null

            if (leftHasChildren && !rightHasChildren) return 1
            if (!leftHasChildren && rightHasChildren) return -1
            if (leftIsDict && !rightIsDict) return 1
            if (!leftIsDict && rightIsDict) return -1
            if (lhp.toLowerCase() < rhp.toLowerCase()) {
                return -1;
            } else
                return 1
        }.bind(this));

        return `${this.selector != "" ? `${this.selector ?? ""} ` : ""}${body}`;
    }
    
    toString() {
        return this.toCVUString(0, "    ")
    }

    compile(viewArguments?: ViewArguments, scope = CompileScope.needed) {
        if (this.isCompiled || !this.parsed || scope == CompileScope.none) { return }

        let recur = function(unknown?) {
            let notnil = unknown
            if (!notnil) { return unknown }

            if (notnil?.constructor?.name == "Expression") {
                return scope == CompileScope.all
                    ? notnil.execute(viewArguments)
                    : notnil.compile(viewArguments)
            } else if (typeof notnil === "object") {
                for (let [key, value] of Object.entries(notnil)) {
                    notnil[key] = recur(value)
                }
                return notnil
            } else if (Array.isArray(notnil)) {
                if (notnil[0]?.constructor?.name == "CVUParsedDefinition") {
                    for (var i in notnil) {
                        let def = recur(notnil[i])
                        if (def?.constructor?.name == "CVUParsedDefinition") {
                            notnil[i] = def
                        }
                    }
                } else {
                    for (var i in notnil) {
                        notnil[i] = recur(notnil[i])
                    }
                }

                return notnil
            } else if (notnil?.constructor?.name == "CVUParsedDefinition") {
                notnil.parsed = recur(notnil.parsed)
            } else if (notnil?.constructor?.name == "UIElement") {
                let dict = recur(notnil.properties)
                if (dict) {
                    notnil.properties = dict
                }
            }

            return notnil
        }

        this.parsed = recur(this.parsed)
    }

    mergeValuesWhenNotSet(other: CVUParsedDefinition) {
        let dict = other.parsed;
        if (!dict) return;
        if (this.parsed == undefined) {
            this.parsed = {}
        }
        for (let [key, value] of Object.entries(dict)) {
            if (key == "userState" || key == "viewArguments") {
                /*if (this.parsed == undefined) {
                    this.parsed = {}
                }*/
                let cascadableDict = this.parsed[key];
                if (cascadableDict?.constructor?.name == "CascadableDict") {
                    cascadableDict.deepMerge(value);
                } else {
                    this.parsed[key] = (value)?.copy() //CascadablaDict
                }
            } else if (this.parsed[key] == undefined) {
                /*if (this.parsed == undefined) {
                    this.parsed = {}
                }*/
                this.parsed[key] = value;
            } else if (value?.constructor?.name == "CVUParsedDefinition") {
                (this.parsed[key])?.mergeValuesWhenNotSet(value)
            } else if (Array.isArray(value) && value.length > 0 && value[0]?.constructor?.name == "CVUParsedDefinition") {
                let list = value;
                var localList = this.parsed[key];
                if (Array.isArray(localList) && localList.length > 0 && localList[0]?.constructor?.name == "CVUParsedDefinition") {
                    for (let def of list) {
                        var found = false;
                        for (let localDef of localList) {
                            if (localDef.selector == def.selector) {
                                localDef.mergeValuesWhenNotSet(def)
                                found = true
                                break
                            }
                        }
                        if (!found) {
                            localList.push(def)
                            this.parsed[key] = localList
                        }
                    }
                }
            } else if (Array.isArray(value)) {
                let list = value;
                var localList = this.parsed[key];
                if (Array.isArray(localList)) {
                    for (let item of list) {
                        localList.push(item)
                    }
                    this.parsed[key] = localList;
                }
            }
        }
    }
}
export class CVUParsedObjectDefinition extends CVUParsedDefinition {
    get definitionType() {return "object" }
}
export class CVUParsedDatasourceDefinition extends CVUParsedDefinition {
    get definitionType() {return "datasource" }
}
export class CVUParsedStyleDefinition extends CVUParsedDefinition {
    get definitionType() {return "style" }
}
export class CVUParsedLanguageDefinition extends CVUParsedDefinition {
    get definitionType() {return "language" }
}
export class CVUParsedColorDefinition extends CVUParsedDefinition {
    get definitionType() {return "color" }
}
export class CVUParsedRendererDefinition extends CVUParsedDefinition {
    get definitionType() {return "renderer" }
}
export class CVUParsedViewDefinition extends CVUParsedDefinition {
    type?: string
    query?: ExprNode
    get definitionType() {return "view" }

    constructor(selector, name, type?, query?, domain: string = "user", parsed?) {//TODO
        super(selector, name, domain, parsed)

        this.type = type
        this.query = query
    }
}
export class CVUParsedSessionDefinition extends CVUParsedDefinition {
    get definitionType() {return "session" }
}
export class CVUParsedSessionsDefinition extends CVUParsedDefinition {
    get definitionType() {return "sessions" }
}
