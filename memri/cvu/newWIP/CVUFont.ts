export class CVUFont {
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

export function CGFloat(num) {
    return Number(num);
}

export enum VerticalAlignment{
    top = "top",
    center = "center",
    bottom = "bottom"
}
export enum HorizontalAlignment{
    leading = "left",
    center = "center",
    trailing = "right"
}
export enum Alignment{
    top = "top",
    center = "center",
    bottom = "bottom",
    leading = "left",
    trailing = "right",
    topLeading = "topLeading",
    topTrailing = "topTrailing",
    bottomLeading = "bottomLeading",
    bottomTrailing = "bottomTrailing"
}
export enum TextAlignment{
    leading = "left",
    center = "center",
    trailing = "right"
}

export var Font = {
    Weight: {
        black: "black",
        bold: "bold",
        heavy: "heavy",
        light: "light",
        medium: "medium",//TODO
        regular: "regular",
        semibold: "semibold",
        thin: "thin",
        ultraLight: "ultraLight",
    }
}