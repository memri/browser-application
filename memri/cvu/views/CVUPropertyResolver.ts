//
// CVUPropertyResolver.swift
// Copyright © 2020 memri. All rights reserved.

import {MemriDictionary} from "../../model/MemriDictionary";
import {Font} from "../../parsers/cvu-parser/CVUParser";

export class CVUPropertyResolver {
    properties = new MemriDictionary()


    constructor(properties: MemriDictionary) {
        this.properties = properties ?? this.properties;
    }

    get color(): ColorDefinition {
        let colorDef = this.properties["color"]
        if (colorDef?.constructor?.name == "ColorDefinition") {
            return colorDef
        }
        else if (typeof colorDef === "string") {
            return colorDef //ColorDefinition.hex(colorDef)
        }
        return undefined
    }

    get font(): FontDefinition {
        let fontProperty = this.properties["font"]
        if (!fontProperty) { return new FontDefinition() }
        if (Array.isArray(fontProperty)) {
            let value = fontProperty
            if (typeof value[0] == "string" && typeof value[1] == "number") {
                let name = value[0]
                let size = value[1]
                return new FontDefinition(
                    name,
                    size,
                    value[2]
                )
            }
            else if (typeof value[0] == "number") {
                let size = value[0]
                return new FontDefinition(undefined, size, value[1])
            }
        }
        else if (typeof fontProperty === "number") {
            let size = fontProperty
            return new FontDefinition(undefined, size)
        }
        else if (Object.values(Font.Weight).includes(fontProperty)) {
            return new FontDefinition(undefined,undefined, fontProperty)
        }
        return new FontDefinition()
    }

    get lineLimit() {
        return Number(this.properties["lineLimit"])
    }

    get fitContent() {
        switch (this.properties["resizable"]) {
            case "fill":
                return false
            case "fit":
                return true
            default:
                return true
        }
    }

    get forceAspect() {
        return (Boolean(this.properties["forceAspect"])) ?? false
    }
}

/*public enum ColorDefinition {
    case hex(String)
    case system(UIColor)

    var color: Color {
        switch self {
        case let .hex(hex):
            return Color(hex: hex)
        case let .system(color):
            return Color(color)
        }
    }

    var uiColor: UIColor {
        switch self {
        case let .hex(hex):
            return UIColor(hex: hex)
        case let .system(color):
            return color
        }
    }
}*/

export class FontDefinition {
    name: string
    size: number
    weight
    italic: boolean = false


    constructor(name?: string, size?: number, weight?, italic?: boolean) {
        this.name = name;
        this.size = size;
        this.weight = weight;
        this.italic = italic ?? this.italic;
    }

    get font(): Font {
		return "Arial" //TODO: Font(this.uiFont)
    }

    /*get uiFont(): UIFont {
        let font = UIFont.systemFont(
            ofSize: size ?? UIFont.systemFontSize,
            weight: weight?.uiKit ?? .regular
        )
        let fontWithTraits = font.withTraits(traits: italic ? .traitItalic : [])
        return fontWithTraits
    }*/
}

/*extension UIFont {
    func withTraits(traits: UIFontDescriptor.SymbolicTraits) -> UIFont {
        let descriptor = fontDescriptor
            .withSymbolicTraits(fontDescriptor.symbolicTraits.union(traits))
        return UIFont(descriptor: descriptor!, size: 0)
    }
}

extension Font.Weight {
    var uiKit: UIFont.Weight {
        switch self {
        case .black: return .black
        case .bold: return .bold
        case .heavy: return .heavy
        case .light: return .light
        case .medium: return .medium
        case .regular: return .regular
        case .semibold: return .semibold
        case .thin: return .thin
        case .ultraLight: return .ultraLight
        default: return .regular
        }
    }
}*/
