import {CVUSerializer} from "./CVUToString";

class CVUToString {
    
}
export class CVUParsedDefinition extends CVUToString {
    name: string
    selector: string
    domain: string

    constructor(selector, name?, domain = "user", parsed?) {
        super(selector, name, domain, parsed)
        this.selector = selector
        this.name = name
        this.domain = domain;
        this.parsed = parsed ?? this.parsed
    }
    
    subscript(propName:string) {
        return this.parsed[propName]
    }
    
//    var unparsed:String = ""
    parsed = {};
    
    toCVUString(depth: number, tab: string): string {
        if (this.selector == `[renderer = "list"]`) {

        }

        let body = new CVUSerializer().dictToString(this.parsed, depth+1, tab, true, true, function (lhp, rhp) {
            let lv = this.parsed[lhp];
            let rv = this.parsed[rhp]

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

        return `${this.selector ?? ""} ${body}`;
    }
    
    toString() {
        return this.toCVUString(0, "    ")
    }
}
export class CVUParsedDatasourceDefinition extends CVUParsedDefinition {
}
export class CVUParsedStyleDefinition extends CVUParsedDefinition {
}
export class CVUParsedLanguageDefinition extends CVUParsedDefinition {
}
export class CVUParsedColorDefinition extends CVUParsedDefinition {
}
export class CVUParsedRendererDefinition extends CVUParsedDefinition {
}
export class CVUParsedViewDefinition extends CVUParsedDefinition {
    constructor(selector, name, type?, query?) {
        super(selector, name)
        this.type = type
        this.query = query
    }
}
export class CVUParsedSessionDefinition extends CVUParsedDefinition {
}
export class CVUParsedSessionsDefinition extends CVUParsedDefinition {
}
