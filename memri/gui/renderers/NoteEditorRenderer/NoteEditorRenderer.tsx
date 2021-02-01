//
//  ListRendererView.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {DatabaseController} from "../../../../router";
import {
    RenderersMemri,
} from "../../swiftUI";
import {CascadingRendererConfig} from "../../../../router";
import {MemriTextEditor} from "./UIKit/MemriTextEditor";

export class NoteEditorRendererController {
    static rendererType = {name:"noteEditor",icon: "doc.richtext"/*doc.richtext*/, makeController:NoteEditorRendererController, makeConfig:NoteEditorRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new NoteEditorRendererConfig()
    }

    context: MemriContext
    config: NoteEditorRendererConfig

    makeView() {
        return <NoteEditorRendererView controller={this} context={this.context}/>
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new NoteEditorRendererConfig(head, tail, host)
    }

    get note(): Note {
        return this.context.item;
    }

    get searchTerm() {
        return this.context.currentView?.filterText
    }

    get editModeBinding() {
        return {
            get: () => {
                this.context.editMode
            },
            set: ($0) => {
                this.context.editMode = $0;
            }
        }
    }

    showingImagePicker: boolean = false
    showingImagePicker_shouldUseCamera: boolean = false
    imagePickerPromise

    getEditorModel() {
        return {
            title: this.note?.title,
            body: this.note?.content
        }
    } //TODO:

    handleModelUpdate(newModel) {
        DatabaseController.sync(true, () => {
            if (this.note) {
                this.note.title = newModel.title
                this.note.content = newModel.body
            }
        })
    }

    /*func onImagePickerFinished(image: UIImage?) {
    var url: URL?
    defer { imagePickerPromise?(.success(url)) }

guard let image = image, let note = note else { return }
let filename = UUID().uuidString

guard let data = image.jpegData(compressionQuality: 0.8) else { return }
try? FileStorageController.writeData(data, toFileForUUID: filename)

DatabaseController.sync(write: true) { realm in
let file = File()
    file.uid.value = try Cache.incrementUID()
    file.filename = filename
    realm.add(file)
    _ = try note.link(file, type: "file", distinct: false, overwrite: true)
}

// The value of url is passed to the completion promise (done by the defer statement)
url = URL(string: "memriFile://\(filename)")
}*/

}
/*
extension NoteEditorRendererController: MemriTextEditorImageSelectionHandler {
    func presentImageSelectionUI(useCamera: Bool) -> AnyPublisher<URL?, Never> {
        Future<URL?, Never> { promise in
            self.imagePickerPromise = promise
            self.showingImagePicker_shouldUseCamera = useCamera
            self.showingImagePicker = true
        }.eraseToAnyPublisher()
    }
}

extension NoteEditorRendererController: MemriTextEditorFileHandler {
    func getFileData(forEditorURL url: URL) -> Data? {
        guard let fileUID = url.host,
              let note = self.note,
              let file = note.file?.first(where: { $0.filename == fileUID }),
              let data = file.asData
        else { return nil }
        return data
    }
}
 */

export class NoteEditorRendererConfig extends CascadingRendererConfig {
    get showSortInConfig() {
        return false
    }

    get showContextualBarInEditMode() {
        return false
    }

    configItems(context: MemriContext) {
        return []
    }
}

export class NoteEditorRendererView extends RenderersMemri {
    controller: NoteEditorRendererController

    render() {
        this.controller = this.props.controller;

        return (
            <MemriTextEditor model={this.controller.getEditorModel()}
                             onModelUpdate={(newModel) => this.controller.handleModelUpdate(newModel)}
                             searchTerm={this.controller.searchTerm}
                             isEditing={this.controller.editModeBinding} {...this.props}
            />
        )
    }

}

