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
import {CVU_FileThumbnail} from "./nodeTypes/CVU_FileThumbnail";
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
        let modifiers = {}
        if (this.needsModifier) {
            modifiers = new CVU_AppearanceModifier(this.nodeResolver).body();
        }

        switch (this.nodeResolver.node.type) {
            case UIElementFamily.HStack:
                return <CVU_HStack nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.VStack:
                return <CVU_VStack nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.ZStack:
                return <CVU_ZStack nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Text:
                return <CVU_Text nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.SmartText:
                return <CVU_SmartText nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Image:
                return <CVU_Image nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Map:
                return <CVU_Map nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Textfield:
                return <CVU_TextField nodeResolver={this.nodeResolver} context={this.context} editModeBinding={this.editModeBinding} {...modifiers}/>
            case UIElementFamily.EditorSection:
                return <CVU_EditorSection nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.EditorRow:
                return <CVU_EditorRow nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Toggle:
                return <CVU_Toggle nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.MemriButton:
                return <CVU_MemriButton nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.ActionButton:
                return <ActionButton action={this.nodeResolver.resolve("press") ?? new Action(this.context, "noop")}
                                     item={this.nodeResolver.item} context={this.context} {...modifiers}/>
            case UIElementFamily.Button:
                return <CVU_Button nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Divider:
                return <MemriDivider {...modifiers}/>
            case UIElementFamily.HorizontalLine:
                return <HorizontalLine {...modifiers}/>
            case UIElementFamily.Circle:
                return <CVU_ShapeCircle nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Rectangle:
                return <CVU_ShapeRectangle nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.HTMLView:
                return <CVU_HTMLView nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
            case UIElementFamily.Spacer:
                return <Spacer {...modifiers}/>
            case UIElementFamily.Empty:
                return <EmptyView {...modifiers}/>
            case UIElementFamily.SubView:
                return this.subview(modifiers)
            case UIElementFamily.FlowStack:
                return this.flowstack(modifiers)
            case UIElementFamily.Picker:
                return this.picker(modifiers)
            case UIElementFamily.ItemCell:
                return <ItemCell item={this.nodeResolver.item}
                                 rendererNames={this.nodeResolver.resolve("rendererNames") ?? []}
                                 argumentsJs={this.nodeResolver.viewArguments} context={this.context} {...modifiers}/>
            case UIElementFamily.TimelineItem:
                return <CVU_TimelineItem nodeResolver={this.nodeResolver} item={this.nodeResolver.item} context={this.context} {...modifiers}/> //TODO: needs additional props to work @mkslanc
            case UIElementFamily.FileThumbnail:
                return <CVU_FileThumbnail nodeResolver={this.nodeResolver} context={this.context} {...modifiers}/>
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
        var resolvedComponent
        if (this.nodeResolver.showNode) {
            resolvedComponent = this.resolvedComponent;

            return resolvedComponent
        }
        return  null;
    }

    flowstack(modifiers) {//TODO:
        return <FlowStack nodeResolver={this.nodeResolver} data={this.nodeResolver.resolve("list") ?? []}
                          spacing={this.nodeResolver.spacing}
                          content={(listItem) => this.nodeResolver.childrenInForEach(this.context, listItem)} {...modifiers}/>
    }

    picker(modifiers) {//TODO:
        let [_, propItem, propName] = this.nodeResolver.getType("value")
        let selected = this.nodeResolver.resolve("value", "Item") ?? this.nodeResolver.resolve("defaultValue", "Item")
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
                {...modifiers}
            />
        }
    }

    subview(modifiers) {
        let subviewArguments = new ViewArguments(this.nodeResolver.resolve("arguments"))
        let viewName = this.nodeResolver.string("viewName")
        if (viewName) {
            return <SubView context={this.context} viewName={viewName} item={this.nodeResolver.item} viewArguments={subviewArguments} {...modifiers}/>
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
            return <SubView context={this.context} view={view} item={this.nodeResolver.item} viewArguments={subviewArguments} {...modifiers}/>
        }
    }
}