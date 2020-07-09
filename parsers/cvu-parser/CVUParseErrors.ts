//
//  CVUParseErrors.swift
//
//  Copyright © 2020 memri. All rights reserved.
//
export class ParseErrors {
    CVUToken: CVUToken;
    type: any;
    Character?: any;

    toErrorString() {
        return (this.Character) ? this.type + "('" + this.Character + "')" : this.type + "(" + (this.CVUToken.toString()) + ")";
    }
}

class UnexpectedToken extends ParseErrors {
    CVUToken: CVUToken;
    type = "UnexpectedToken";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class UnknownDefinition extends ParseErrors {
    CVUToken: CVUToken;
    type = "UnknownDefinition";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class ExpectedCharacter extends ParseErrors {
    CVUToken: CVUToken;
    type = "ExpectedCharacter";
    Character: any;

    constructor(Character, CVUToken) {
        super();
        this.Character = Character;
        this.CVUToken = CVUToken;
    }
}

class ExpectedDefinition extends ParseErrors {
    CVUToken: CVUToken;
    type = "ExpectedDefinition";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class ExpectedIdentifier extends ParseErrors {
    CVUToken: CVUToken;
    type = "ExpectedIdentifier";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class ExpectedKey extends ParseErrors {
    CVUToken: CVUToken;
    type = "ExpectedKey";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class ExpectedString extends ParseErrors {
    CVUToken: CVUToken;
    type = "ExpectedString";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class MissingQuoteClose extends ParseErrors {
    CVUToken: CVUToken;
    type = "MissingQuoteClose";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

class MissingExpressionClose extends ParseErrors {
    CVUToken: CVUToken;
    type = "MissingExpressionClose";

    constructor(CVUToken) {
        super();
        this.CVUToken = CVUToken;
    }
}

export const CVUParseErrors = {
    UnexpectedToken,
    UnknownDefinition,
    ExpectedCharacter,
    ExpectedDefinition,
    ExpectedIdentifier,
    ExpectedKey,
    ExpectedString,
    MissingQuoteClose,
    MissingExpressionClose
};
