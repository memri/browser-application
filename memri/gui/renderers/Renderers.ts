//
//  Renderer.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


// Potential solution: https://stackoverflow.com/questions/42746981/list-all-subclasses-of-one-class

import {ListRendererController} from "./ListRenderer/ListRenderer";
import {GridRendererController} from "./GridRenderer/GridRenderer";
import {CustomRendererController} from "./CustomRenderer";
import {GeneralEditorRendererController} from "./GeneralEditorRenderer/GeneralEditorRenderer";
import {MessageRendererController} from "./MessageRenderer/MessageRenderer";
import {LabelAnnotationRendererController} from "./LabelAnnotationRenderer/LabelAnnotationRenderer";
import {PhotoViewerRendererController} from "./PhotoViewerRenderer/PhotoViewerRenderer";
import {EmailThreadRendererController} from "./EmailThreadRenderer/EmailThreadRenderer";
import {NoteEditorRendererController} from "./NoteEditorRenderer/NoteEditorRenderer";
import {TimelineRendererController} from "./TimelineRenderer/TimelineRenderer";
import {FileRendererController} from "./FileRenderer/FileRenderer";
import {CalendarRendererController} from "./CalendarRenderer/CalendarRenderer";

export class Renderers {
    static get rendererTypes() {
        let renderers = {};
        renderers[ListRendererController.rendererType.name] = ListRendererController.rendererType;
        renderers[GridRendererController.rendererType.name] = GridRendererController.rendererType;
        renderers[NoteEditorRendererController.rendererType.name] = NoteEditorRendererController.rendererType;
        renderers[GeneralEditorRendererController.rendererType.name] = GeneralEditorRendererController.rendererType;
        renderers[CustomRendererController.rendererType.name] = CustomRendererController.rendererType;
        renderers[LabelAnnotationRendererController.rendererType.name] = LabelAnnotationRendererController.rendererType;
        renderers[MessageRendererController.rendererType.name] = MessageRendererController.rendererType;
        renderers[PhotoViewerRendererController.rendererType.name] = PhotoViewerRendererController.rendererType;
        renderers[EmailThreadRendererController.rendererType.name] = EmailThreadRendererController.rendererType;
        renderers[CalendarRendererController.rendererType.name] = CalendarRendererController.rendererType;
        renderers[TimelineRendererController.rendererType.name] = TimelineRendererController.rendererType;
        renderers[FileRendererController.rendererType.name] = FileRendererController.rendererType;
        return  renderers;
        /*return {
            MapRendererController.rendererType,

            ChartRendererController.rendererType,
        }*/
    }
}

export class RendererType {
    name: string
    icon: string
    makeController
    makeConfig

    constructor(name: string, icon: string, makeController, makeConfig) {
        this.name = name;
        this.icon = icon;
        this.makeController = makeController;
        this.makeConfig = makeConfig;
    }
}