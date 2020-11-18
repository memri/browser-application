//
// UIElementView.swift
// Copyright © 2020 memri. All rights reserved.


import {
    EmptyView,
    MainUI, MemriDivider,
    MemriText,
    Spacer,
} from "../swiftUI";
import {CVU_Image, CVUStateDefinition, Item} from "../../../router";
import {ViewArguments} from "../../../router";
import * as React from "react";
import {Action} from "../../../router";
import {CVUParsedViewDefinition} from "../../../router";
import {debugHistory} from "../../../router";
import {ActionButton} from "../ActionView";

import {SubView} from "../common/SubView";
import {CVU_HStack, CVU_VStack, CVU_ZStack} from "./nodeTypes/CVU_Stack";
import {CVU_SmartText, CVU_Text, CVU_TextField} from "./nodeTypes/CVU_Text";
import {CVU_Map} from "./nodeTypes/CVU_Map";
import {CVU_EditorRow, CVU_EditorSection} from "./nodeTypes/CVU_EditorSection";
import {CVU_Toggle} from "./nodeTypes/CVU_Toggle";
import {CVU_MemriButton} from "./nodeTypes/CVU_MemriButton";
import {CVU_Button} from "./nodeTypes/CVU_Button";
import {CVU_ShapeCircle, CVU_ShapeRectangle} from "./nodeTypes/CVU_Shape";
import {CVU_HTMLView} from "./nodeTypes/CVU_HTMLView";
import {ItemCell} from "../common/ItemCell";
import {CVU_TimelineItem} from "./nodeTypes/CVU_TimelineItem";
import {CVU_AppearanceModifier} from "./nodeTypes/CVU_AppearanceModifier";
import {FlowStack} from "../components/FlowStack";
require("../../extensions/common/string");


export enum UIElementFamily {
    // Implemented
    VStack="VStack", HStack="HStack", ZStack="ZStack", FlowStack="FlowStack",
    Text="Text", SmartText="SmartText", Textfield="Textfield",
    Image="Image",
    Toggle="Toggle", Picker="Picker",
    MemriButton="MemriButton", Button="Button", ActionButton="ActionButton",
    Map="Map",
    Empty="Empty", Spacer="Spacer", Divider="Divider", HorizontalLine="HorizontalLine",
    Circle="Circle", Rectangle="Rectangle",
    EditorSection="EditorSection", EditorRow="EditorRow",
    SubView="SubView",
    HTMLView="HTMLView",
    TimelineItem="TimelineItem",
    ItemCell="ItemCell",
    FileThumbnail="FileThumbnail",
}

export class UIElementView extends MainUI {
    context: MemriContext

    nodeResolver: UINodeResolver

    editModeBinding = {
        get: () => {
            return this.context.editMode
        },
        set: ($0) => {
            this.context.editMode = $0
        }
    }

    get resolvedComponent() {
        switch (this.nodeResolver.node.type) {
            case UIElementFamily.HStack:
                return new CVU_HStack({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.VStack:
                return new CVU_VStack({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.ZStack:
                return new CVU_ZStack({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Text:
                return new CVU_Text({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.SmartText:
                return new CVU_SmartText({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Image:
                return new CVU_Image({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Map:
                return new CVU_Map({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Textfield:
                return new CVU_TextField({nodeResolver: this.nodeResolver, editModeBinding: this.editModeBinding})
            case UIElementFamily.EditorSection:
                return new CVU_EditorSection({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.EditorRow:
                return new CVU_EditorRow({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Toggle:
                return new CVU_Toggle({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.MemriButton:
                return new CVU_MemriButton({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.ActionButton:
                return new ActionButton({action: this.nodeResolver.resolve("press") ?? new Action(this.context, "noop"), item: this.nodeResolver.item, context: this.context})
            case UIElementFamily.Button:
                return new CVU_Button({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Divider:
                return new MemriDivider({})
            case UIElementFamily.HorizontalLine:
                return new HorizontalLine({})
            case UIElementFamily.Circle:
                return new CVU_ShapeCircle({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Rectangle:
                return new CVU_ShapeRectangle({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.HTMLView:
                return new CVU_HTMLView({nodeResolver: this.nodeResolver, context: this.context})
            case UIElementFamily.Spacer:
                return new Spacer({})
            case UIElementFamily.Empty:
                return new EmptyView({})
            case UIElementFamily.SubView:
                return this.subview
            case UIElementFamily.FlowStack:
                return this.flowstack
            case UIElementFamily.Picker:
                return this.picker
            case UIElementFamily.ItemCell:
                return new ItemCell({
                    item: this.nodeResolver.item,
                    rendererNames: this.nodeResolver.resolve("rendererNames") ?? [],
                    argumentsJs: this.nodeResolver.viewArguments, context: this.context
                })
            case UIElementFamily.TimelineItem:
                return new CVU_TimelineItem({nodeResolver: this.nodeResolver, context: this.context, item: this.nodeResolver.item}) //TODO: needs additional props to work @mkslanc
            case UIElementFamily.FileThumbnail:
                return new CVU_FileThumbnail({nodeResolver: this.nodeResolver, context: this.context})
        }
    }

    get needsModifier(): boolean {
        if (this.nodeResolver) {
            if (!this.nodeResolver.showNode) {
                return false
            }
            switch (this.nodeResolver.node.type) {
                case UIElementFamily.Empty:
                case UIElementFamily.Spacer:
                case UIElementFamily.Divider:
                case UIElementFamily.FlowStack:
                case UIElementFamily.SubView:
                case UIElementFamily.ActionButton:
                case UIElementFamily.ItemCell:
                    return false
                default:
                    return true
            }
        }
        return false;
    }

    render() {
        this.nodeResolver = this.props.nodeResolver;
        this.context = this.props.context;
        // var x = this.render1()
        //if (x === undefined) debugger
        // return x || null
        var resolvedComponent
        if (this.nodeResolver.showNode) {
            resolvedComponent = this.resolvedComponent;

            if (this.needsModifier) {
                if (!resolvedComponent.modifier) {
                    console.log(resolvedComponent)
                }
                let modifiers = resolvedComponent.modifier(new CVU_AppearanceModifier(this.nodeResolver));
                Object.assign(resolvedComponent.props, modifiers);
            }
            return resolvedComponent.render();
        }

    }

    get flowstack() {//TODO:
        return new FlowStack({
            nodeResolver: this.nodeResolver,
            data: this.nodeResolver.resolve("list") ?? [],
            spacing: this.nodeResolver.spacing,
            content: (listItem) => this.nodeResolver.childrenInForEach(this.context, listItem)
        })
    }

    get picker() {//TODO:
        let [_, propItem, propName] = this.nodeResolver.getType("value")
        let selected = this.nodeResolver.resolve("value", Item) ?? this.nodeResolver.resolve("defaultValue", Item)
        let emptyValue = this.nodeResolver.resolve("hint") ?? "Pick a value"
        let query = this.nodeResolver.resolve("query", String)
        let renderer = this.nodeResolver.resolve("renderer", String)

        let item = this.nodeResolver.item

        if (item && propItem) {
            return <Picker
                item={item}
                selected={selected}
                title={this.nodeResolver.string("title") ?? "Select:"}
                emptyValue={emptyValue}
                propItem={propItem}
                propName={propName}
                renderer={renderer}
                query={query ?? ""}
            />
        }
    }

    get subview() {
        let subviewArguments = new ViewArguments(this.nodeResolver.resolve("arguments"))
        let viewName = this.nodeResolver.string("viewName")
        if (viewName) {
            return new SubView({context: this.context, viewName: viewName, item: this.nodeResolver.item, viewArguments: subviewArguments})
        } else {
            // TODO: Carried over from the old UIElementView - this has potential to cause performance issues.
            // It is creating a new CVU at every redraw.
            // Instead architect this to only create the CVU once and have that one reload
            let parsed = this.nodeResolver.resolve("view")
            let view
            if (parsed) {
                let def = new CVUParsedViewDefinition(
                    "[view]",
                    undefined,
                    "view",
                    undefined,
                    "user",
                    parsed
                )
                try {
                    view = CVUStateDefinition.fromCVUParsedDefinition(def)
                } catch (error) {
                    debugHistory.error(`${error}`)
                }
            } else {
                debugHistory
                    .error(
                        "Failed to make subview (not defined), creating empty one instead"
                    )
                view = new CVUStateDefinition()
            }
            return new SubView({context: this.context, view: view, item: this.nodeResolver.item, viewArguments: subviewArguments})
        }
    }
}