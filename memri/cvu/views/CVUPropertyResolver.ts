//
// CVUPropertyResolver.swift
// Copyright © 2020 memri. All rights reserved.

import {MemriDictionary} from "../../model/MemriDictionary";
import {Font} from "../../parsers/cvu-parser/CVUParser";

export class CVUPropertyResolver {
    properties = MemriDictionary

    constructor(properties) {
    }

    get color(): ColorDefinition {
        let colorDef = this.properties["color"]
        if (colorDef?.constructor?.name == "ColorDefinition") {
            return colorDef
        }
        else if (typeof colorDef === "string") {
            return ColorDefinition.hex(colorDef)
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
                return new FontDefinition("", size, value[1])
            }
        }
        else if (typeof fontProperty === "number") {
            let size = fontProperty
            return FontDefinition("", size)
        }
        else if let weight = fontProperty as? Font.Weight {
            return FontDefinition(weight: weight)
        }
        return FontDefinition()
    }

    var lineLimit: Int? {
        properties["lineLimit"] as? Int
    }

    var fitContent: Bool {
        switch properties["resizable"] as? String {
        case "fill": return false
        case "fit": return true
        default: return true
        }
    }

    var forceAspect: Bool {
        (properties["forceAspect"] as? Bool) ?? false
    }
}

public enum ColorDefinition {
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
}

export class FontDefinition {
    name: string
    size: number
    weight: Font.Weight
    italic: boolean = false

    get font(): Font {
		return Font(this.uiFont)
    }

    get uiFont(): UIFont {
        let font = UIFont.systemFont(
            ofSize: size ?? UIFont.systemFontSize,
            weight: weight?.uiKit ?? .regular
        )
        let fontWithTraits = font.withTraits(traits: italic ? .traitItalic : [])
        return fontWithTraits
    }
}

extension UIFont {
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
}
