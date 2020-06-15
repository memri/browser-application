import {CVUSerializer} from "./CVUToString";

class CVUToString {
    
}
export class CVUParsedDefinition extends CVUToString {

    constructor(selector, name, domain = "user", parsed) {
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

        let body = new CVUSerializer().dictToString(this.parsed, depth+1, tab, true, false, function (lhp, rhp) {
            let lv = this.parsed[lhp]
            let rv = this.parsed[rhp]

            let leftIsDict = lv != null
            let rightIsDict = rv != null
            let leftHasChildren = lv && lv["children"] != null
            let rightHasChildren = rv && rv["children"] != null

            return (leftHasChildren ? 1 : 0, leftIsDict ? 1 : 0, lhp.toLowerCase())//TODO
                < (rightHasChildren ? 1 : 0, rightIsDict ? 1 : 0, rhp.toLowerCase())
        });

        return `${this.selector ?? ""} ${body}`;
    }
    
    toString() {
        this.toCVUString(0, "    ")
    }
}
export class CVUParsedDatasourceDefinition extends CVUParsedDefinition {
}
export class CVUParsedStyleDefinition extends CVUParsedDefinition {
}
export class CVUParsedLanguageDefinition extends CVUParsedDefinition {
}
export class CVUParsedColorDefinition extends CVUParsedDefinition {
    constructor(selector, name, domain, parsed) {
        super(selector, name, domain, parsed)
    }
}
export class CVUParsedRendererDefinition extends CVUParsedDefinition {
    constructor(selector, name, domain, parsed) {
        super(selector, name, domain, parsed)
    }
}
export class CVUParsedViewDefinition extends CVUParsedDefinition {
    constructor(selector, name, type, query) {
        super(selector, name, type, query)
        this.type = type
        this.query = query
    }
}
export class CVUParsedSessionDefinition extends CVUParsedDefinition {
}
export class CVUParsedSessionsDefinition extends CVUParsedDefinition {
}
