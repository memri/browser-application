import {CVUSerializer, Expression, UINode} from "../../../../router";
import {MemriDictionary} from "../../../../router";

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

    constructor(selector: string|MemriDictionary  = "", name?, domain = "user", parsed?) {
        //super(selector, name, domain, parsed)
        if (typeof selector != "string") {
            parsed = selector;
            selector = "";
        }

        this.selector = selector
        this.name = name
        this.domain = domain;
        this.parsed = new MemriDictionary(parsed)
    }
    
    get(propName:string) {
        //return [].concat(...this.parsed[propName]);
        return this.parsed && this.parsed[propName]
    }

    set(propName:string, value) {
        if (this.parsed == undefined) { this.parsed = new MemriDictionary() }
        this.parsed[propName] = value
    }

    
    parsed = new MemriDictionary();

    get description(): string {
        return this.toCVUString(0, "    ")
    }

    get selectorIsForList(): boolean {
        return /\[\]$/.test(this.selector) ?? false
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

            if (notnil instanceof Expression) {
                return scope == CompileScope.all
                    ? notnil.execute(viewArguments)
                    : notnil.compile(viewArguments)
            } else if (notnil.constructor.name == "MemriDictionary") {
                for (let [key, value] of Object.entries(notnil)) {
                    notnil[key] = recur(value)
                }
                return notnil
            } else if (Array.isArray(notnil)) {
                var list = notnil;
                for (let i =0;i < list.length;i++) {
                    list[i] = recur(list[i])
                }
                return list
            } else if (Array.isArray(notnil) && notnil.length > 0 && notnil[0] instanceof CVUParsedDefinition) {
                var list = notnil;
                for (let i = 0; i < list.length; i++) {
                    let def = recur(list[i]);
                    if (def instanceof CVUParsedDefinition) {
                        list[i] = def
                    }
                }
                return list;
            } else if (notnil instanceof CVUParsedDefinition) {
                let def = notnil;
                def.parsed = recur(def.parsed);
            } else if (notnil instanceof UINode) { //TODO: MemtriDictionary?
                let el = notnil;
                let dict = recur(el.properties);
                if (typeof dict.isCVUObject == "function") {
                    el.properties = dict
                    return el;
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
                if (value instanceof CVUParsedObjectDefinition) {
                    let parsedObject = this.parsed[key];
                    if (parsedObject instanceof CVUParsedObjectDefinition) {
                        parsedObject.mergeValuesWhenNotSet(value);
                        this.parsed[key] = parsedObject;
                    }
                    else {
                        this.parsed[key] = new CVUParsedObjectDefinition(value.parsed);
                    }
                }
            } else if (this.parsed[key] == undefined) {
                this.parsed[key] = value;
            } else if (value instanceof CVUParsedDefinition) {
                (this.parsed[key])?.mergeValuesWhenNotSet(value)
            } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof CVUParsedDefinition) {
                let list = value;
                var localList = this.parsed[key];
                if (Array.isArray(localList) && localList.length > 0 && localList[0] instanceof CVUParsedDefinition) {
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

    constructor(selector, name?, type?, query?, domain: string = "user", parsed?: MemriDictionary) {//TODO
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
