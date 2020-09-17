//
//  Renderer.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


// Potential solution: https://stackoverflow.com/questions/42746981/list-all-subclasses-of-one-class

import {UIElement, UIElementFamily} from "../../cvu/views/UIElement";
import {Cascadable} from "../../cvu/views/Cascadable";
import {registerListRenderer} from "./ListRendererView";
import {orderKeys} from "../../cvu/parsers/cvu-parser/CVUToString";
import {Item, UUID} from "../../model/schemaExtensions/Item";
import {FilterPanelRendererButton} from "../../cvu/views/Action";
import {UIElementView} from "../common/UIElementView";
import {registerCustomRenderer} from "./CustomRenderer";
import {registerThumbnailRenderer} from "./GridRenderers/ThumbnailRendererView";
import {registerThumbGridRenderer} from "./GridRenderers/ThumbGridRendererView";
import {registerMessageRenderer} from "./MessageRenderer";
import {registerPhotoViewerRenderer} from "./PhotoViewerRenderer/PhotoViewerRenderer";
import {GeneralEditorLayoutItem, registerGeneralEditorRenderer} from "./GeneralEditorView";
import {registerThumbHorizontalGridRenderer} from "./GridRenderers/ThumbHorizontalGridRendererView";
import {registerThumbWaterfallRenderer} from "./GridRenderers/ThumbWaterfallRendererView";
import {MemriDictionary} from "../../model/MemriDictionary";
import {Color} from "../../cvu/parsers/cvu-parser/CVUParser";
import {registerEmailRenderers} from "./EmailRenderer/EmailThreadRenderer";

export class Renderers {
    static get rendererTypes() {
        /*return new MemriDictionary()
            [
            ListRendererController.rendererType,
                GridRendererController.rendererType,
                GeneralEditorRendererController.rendererType,
                CustomRendererController.rendererType,
                MapRendererController.rendererType,
                FileRendererController.rendererType,
                LabelAnnotationRendererController.rendererType,
                MessageRendererController.rendererType,
                CalendarRendererController.rendererType,
                TimelineRendererController.rendererType,
                ChartRendererController.rendererType,
                PhotoViewerRendererController.rendererType,
                EmailThreadRendererController.rendererType
            ].map(($0 => {
            ($0.name, $0)
        }))*/
    }
}


//FilterPanelRendererButton moved to Action.ts



interface CascadingRendererDefaults {
    setDefaultValues(element)
}

 
//    renderDescription: [String:Any]? {
//        let rd = cascadeDict("renderDescription", sessionView.definition)
//
//        if (let renderDescription:[String: UIElement] = globalInMemoryObjectCache.get(rd)) {
//            return renderDescription
//        }
//        else if (let renderDescription:[String: UIElement] = unserialize(rd)) {
//            globalInMemoryObjectCache.set(rd, renderDescription)
//            return renderDescription
//        }
//
//        return null
//    }

//CommonRendererConfig.swift
Object.defineProperty(CascadingRenderConfig.prototype, "primaryColor", {
    get(): ColorDefinition {
        return this.cascadeProperty("color") ?? new Color("systemBlue")
    },
    set(value) {
        this.setState("color", value)
    },
})

Object.defineProperty(CascadingRenderConfig.prototype, "backgroundColor", {
    get() {
        return this.cascadeProperty("background");
    },
    set(value) {
        this.setState("background", value)
    },
})

Object.defineProperty(CascadingRenderConfig.prototype, "spacing", {
    get() {
        let spacing = this.cascadeProperty("spacing");
        if (spacing) {
            return spacing;
        }
        /*else if let x: [Double?] = cascadeProperty("spacing") {
                let spacingArray = x.compactMap { $0.map { CGFloat($0) } }
                guard spacingArray.count == 2 else { return .zero }
                return CGSize(width: spacingArray[0], height: spacingArray[1])
            }*/
        return 0;
    },
    set(value) {
        this.setState("spacing", value)
    }
})

Object.defineProperty(CascadingRenderConfig.prototype, "contextMenuActions", {
    get() {
        return this.cascadeList("contextMenu")
    },
    set(value) {
        this.setState("contextMenu", value)
    },
})
//TODO: edgeInsets
/*var edgeInset: UIEdgeInsets {
    get {
        if let edgeInset = cascadePropertyAsCGFloat("edgeInset") {
            return UIEdgeInsets(
                top: edgeInset,
                left: edgeInset,
                bottom: edgeInset,
                right: edgeInset
        )
        }
    else if let x: [Double?] = cascadeProperty("edgeInset") {
            let insetArray = x.compactMap { $0.map { CGFloat($0) } }
            switch insetArray.count {
                case 2: return UIEdgeInsets(
                    top: insetArray[1],
                    left: insetArray[0],
                    bottom: insetArray[1],
                    right: insetArray[0]
                )
                case 4: return UIEdgeInsets(
                    top: insetArray[0],
                    left: insetArray[3],
                    bottom: insetArray[2],
                    right: insetArray[1]
                )
                default: return .init()
            }
        }
        return .init()
    }
    set(value) { setState("edgeInset", value) }
}

var nsEdgeInset: NSDirectionalEdgeInsets {
    let edgeInset = self.edgeInset
    return NSDirectionalEdgeInsets(
        top: edgeInset.top,
        leading: edgeInset.left,
        bottom: edgeInset.bottom,
        trailing: edgeInset.right
)
}*/
//--------------------------

//CascadingListConfig moved from ListRendererView.tsx
export class CascadingListConfig extends CascadingRenderConfig/*, CascadingRendererDefaults*/ {
    type = "list"

    get longPress() { return this.cascadeProperty("longPress") }
    set longPress(value) { this.setState("longPress", value) }

    get press() { return this.cascadeProperty("press") }
    set press(value) { this.setState("press", value) }

    get slideLeftActions() { return this.cascadeList("slideLeftActions") }
    set slideLeftActions(value) { this.setState("slideLeftActions", value) }

    get slideRightActions() { return this.cascadeList("slideRightActions") }
    set slideRightActions(value) { this.setState("slideRightActions", value) }

    setDefaultValues(element: UIElement) {
        if (element.propertyResolver.properties["padding"] == undefined) {
            element.propertyResolver.properties["padding"] = [10, 10, 10, 20]
        }
    }
}

//CascadingCustomConfig moved from CustomRenderer.tsx
export class CascadingCustomConfig extends CascadingRenderConfig {
    type = "custom"

    showSortInConfig: boolean = false

    configItems(context: MemriContext) {
        return []
    }

    showContextualBarInEditMode: boolean = false
}

//CascadingThumbnailConfig moved from ThumbnailRendererView.tsx
export class CascadingThumbnailConfig extends CascadingRenderConfig {
    type = "thumbnail"

    get longPress() { return this.cascadeProperty("longPress") }
    set longPress(value) { this.setState("longPress", value) }

    get press() { return this.cascadeProperty("press") }
    set press(value) { this.setState("press", value) }

    get columns() { return this.cascadeProperty("columns") ?? 3 }
    set columns(value) { this.setState("columns", value) }

    get edgeInset() {
        let edgeInset = this.cascadePropertyAsCGFloat("edgeInset")
        if (edgeInset) {
            return [
                edgeInset,
                edgeInset,
                edgeInset,
                edgeInset
            ]
        } else {
            let x = this.cascadeProperty("edgeInset")
            if (x) {
                let insetArray = x.filter((item) => item != undefined/*TODO???*/).map(($0) => $0.map (($0) => Number($0) ))
                switch (insetArray.length) {
                    case 2: return [
                        insetArray[1],
                        insetArray[0],
                        insetArray[1],
                        insetArray[0]
                    ]
                    case 4: return [
                        insetArray[0],
                        insetArray[3],
                        insetArray[2],
                        insetArray[1]
                    ]
                    default: return
                }
            }
        }

        return
    }
    set edgeInset(value) { this.setState("edgeInset", value) }

    get nsEdgeInset(): NSDirectionalEdgeInsets {
        let edgeInset = this.edgeInset
        return new NSDirectionalEdgeInsets(
            edgeInset.top,
            edgeInset.left,
            edgeInset.bottom,
            edgeInset.right
        )
    }

    // Calculated
    get spacing() {
        let spacing = this.cascadePropertyAsCGFloat("spacing")
        if (spacing) {
            return [spacing, spacing]
        }
        else {
            let x = this.cascadeProperty("spacing")
            if (x) {
                let spacingArray = x.filter((item) => item != undefined/*TODO???*/).map(($0) => $0.map(($0) => Number($0)))

                if (spacingArray.length != 2) {
                    return [0, 0]
                }
                return [spacingArray[0], spacingArray[1]]
            }
        }
        return [0, 0]
    }
    set(value) { this.setState("spacing", value) }
}

export class CascadingMessageRendererConfig extends CascadingRenderConfig {
    type = "messages"

    get press() { return this.cascadeProperty("press") }

    get isOutgoing(): Expression {
        return this.cascadeProperty("isOutgoing");
    }
}

export class PhotoViewerRendererConfig extends CascadingRenderConfig {
    type = "photoViewer"

    get imageFile() { return this.cascadeProperty("file") }
    get initialItem() { return this.cascadeProperty("initialItem") }

    showSortInConfig: boolean = true

    showContextualBarInEditMode: boolean = false

    configItems(context: MemriContext) {
        return []
    }
}

export class CascadingGeneralEditorConfig extends CascadingRenderConfig {
    type = "generalEditor"

    get layout() {
        return this.cascadeList(
            "layout",
            (item) => {
                return String(item["section"]) ?? ""
            },
            (old, newJs) => {
                var result = old;
                for (let [key, value] of Object.entries(newJs)) { //TODO: need to check
                    if (old[key] == undefined) {
                        result[key] = value
                    } else if (key == "exclude") {
                        var dict = old[key];
                        if (Array.isArray(dict)) {
                            result[key] = dict.push(...(newJs[key] ?? []))
                        }
                    }
                }

                return result
            }
        )
            .map((dict) => {
                return new GeneralEditorLayoutItem(dict, this.viewArguments)
            })
    }

    showSortInConfig: boolean = false

    showContextualBarInEditMode: boolean = false

    configItems(context: MemriContext) {
        return []
    }
}

export class CascadingEmailThreadRendererConfig extends CascadingRenderConfig {
    type = "email"

    get content() {
        return this.cascadeProperty("content", "Expression")
    }
}