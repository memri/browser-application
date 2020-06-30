//
//  Languages.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


class Languages {
    currentLanguage = "English"
    keywords = {}
    
    load(definitions) {
        for (let def of definitions) {
            if (def.name == this.currentLanguage) {
                for (let [keyword, naturalLanguageString] of Object.entries(def.parsed)) {
                    if (this.keywords[keyword] != null) {
                        // TODO warn developers
                        console.log(`Keyword already exists ${keyword} for language ${this.currentLanguage}`)
                    }
                    else {
                        this.keywords[keyword] = naturalLanguageString
                    }
                }
            }
        }
    }
}
