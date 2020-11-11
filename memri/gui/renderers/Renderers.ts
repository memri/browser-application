//
//  Renderer.swift
//
//  Copyright © 2020 memri. All rights reserved.
//


// Potential solution: https://stackoverflow.com/questions/42746981/list-all-subclasses-of-one-class

import {ListRendererController} from "./contentRenderers/ListRenderer";
import {GridRendererController} from "./contentRenderers/GridRenderer/GridRenderer";
import {CustomRendererController} from "./contentRenderers/CustomRenderer";
import {GeneralEditorRendererController} from "./contentRenderers/GeneralEditorRenderer/GeneralEditorRenderer";
import {MessageRendererController} from "./contentRenderers/MessageRenderer";
import {LabelAnnotationRendererController} from "./annotationRenderers/LabelAnnotationRenderer";
import {PhotoViewerRendererController} from "./contentRenderers/PhotoViewerRenderer/PhotoViewerRenderer";
import {EmailThreadRendererController} from "./contentRenderers/EmailThreadRenderer/EmailThreadRenderer";

export class Renderers {
    static get rendererTypes() {
        let renderers = {};
        renderers[ListRendererController.rendererType.name] = ListRendererController.rendererType;
        renderers[GridRendererController.rendererType.name] = GridRendererController.rendererType;
        renderers[GeneralEditorRendererController.rendererType.name] = GeneralEditorRendererController.rendererType;
        renderers[CustomRendererController.rendererType.name] = CustomRendererController.rendererType;
        renderers[LabelAnnotationRendererController.rendererType.name] = LabelAnnotationRendererController.rendererType;
        renderers[MessageRendererController.rendererType.name] = MessageRendererController.rendererType;
        renderers[PhotoViewerRendererController.rendererType.name] = PhotoViewerRendererController.rendererType;
        renderers[EmailThreadRendererController.rendererType.name] = EmailThreadRendererController.rendererType;
        return  renderers;
        /*return {
            MapRendererController.rendererType,
            FileRendererController.rendererType,

            CalendarRendererController.rendererType,
            TimelineRendererController.rendererType,
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