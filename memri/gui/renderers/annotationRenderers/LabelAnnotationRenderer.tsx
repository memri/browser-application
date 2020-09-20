//
//  LabelAnnotationRenderer.swift
//  memri
//
//  Created by Toby Brennan on 26/8/20.
//  Copyright © 2020 memri. All rights reserved.
//

/*struct LabelOption {
    var labelID: String
    var text: String
    var icon: Image

    var id: String { labelID }
}*/

import {CascadingRendererConfig} from "../../../cvu/views/CascadingRendererConfig";
import {DatabaseController} from "../../../storage/DatabaseController";
import {CacheMemri} from "../../../model/Cache";
import {
    font, frame,
    HStack,
    MainUI,
    MemriDivider, MemriImage, MemriList,
    MemriRealButton,
    MemriText,
    padding,
    RenderersMemri,
    VStack
} from "../../swiftUI";
import {Color, Font} from "../../../cvu/parsers/cvu-parser/CVUParser";
import * as React from "react";

export class LabelAnnotationRendererController {
    static rendererType = {name: "labelAnnotation", icon: "tag.circle.fill", makeController:LabelAnnotationRendererController, makeConfig:LabelAnnotationRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new LabelAnnotationRendererConfig()
        this.loadExistingAnnotation()
    }

    context: MemriContext
    config: LabelAnnotationRendererConfig

    makeView() {
        return new LabelAnnotationRendererView({controller: this, context: this.context}).render();
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new LabelAnnotationRendererConfig(head, tail, host)
    }

    view(item: Item) {
        return this.config.render(item)
    }

    currentIndex = 0;
    /*
    .zero {
        didSet {
            if currentIndex != oldValue {
                loadExistingAnnotation()
            }
        }
    }
     */
    selectedLabels= {}

    get labelType() {
        return this.config.labelType
    }
/*
    get labelOptions() {
    return this.config.labelOptions.indexed().map { label in
    LabelOption(labelID: label.element, text: label.element.titleCase(), icon: Image(systemName: config.labelOptionIcons[safe: label.index] ?? "tag"))
}
}*/ //TODO:

    moveToPreviousItem() {
        if (this.currentIndex <= 0) { return;}
        this.currentIndex--;
    }

    moveToNextItem() {
        if (this.currentIndex >= this.context.items.length - 1 - 1) { return;}
        this.currentIndex++;
    }

    loadExistingAnnotation() {
        this.selectedLabels = this.currentAnnotationLabels
    }

    applyCurrentItem() {
        if (!this.currentItem) {
            return;
        }

        let oldAnnotation = this.currentAnnotation()
        DatabaseController.sync(true, (realm) => {
            let annotationItem: Item = oldAnnotation ?? new LabelAnnotation()
            annotationItem.labelType = this.labelType
            annotationItem.labelsSet = this.selectedLabels
            try {
                if (oldAnnotation == undefined) {
                    annotationItem.uid.value = annotationItem.uid ?? CacheMemri.incrementUID()
                    realm.add(annotationItem)
                }
                annotationItem.link(this.currentItem, "annotatedItem", undefined, undefined, true, true)
            } catch (error) {
                console.log(`Couldn't link item to annotation: ${error}`)
            }
        })

        this.moveToNextItem()
    }

    get currentAnnotation() {
        return DatabaseController.sync(false, (realm) => {
            let edge = this.currentItem?.reverseEdges("annotatedItem")?.find(($0) => {
                return $0.source()?.labelType == labelType
            }) //TODO:
            return edge?.source()
        })
    }

    get currentAnnotationLabels() {
        return this.currentAnnotation()?.labelsSet ?? []
    }

    get currentItem() {
        return this.context.items[this.currentIndex]
    }

    get currentRenderedItem() {
        return this.config.render(this.currentItem)
    }

    get progressText() {
        if (this.context.items.isEmpty) {
            return
        }
        return `Item ${this.currentIndex + 1} of ${this.context.items.length}`
    }

    get enableBackButton() {
        return this.currentIndex > 0
    }

    get enableSkipButton() {
        return this.currentIndex < this.context.items.length - 1 - 1
    }

}

class LabelAnnotationRendererConfig extends CascadingRendererConfig {
    showSortInConfig = false
    showContextualBarInEditMode = false

    configItems(context: MemriContext) {
        return []
    }

    get labelType() {
        return this.cascadeProperty("labelType") ?? "UNDEFINED"
    }

    get labelOptions() {
        return this.cascadeList("labelOptions")
    }

    get labelOptionIcons() {
        return this.cascadeList("labelOptionIcons")
    }
}


export class LabelAnnotationRendererView extends RenderersMemri {
    controller : LabelAnnotationRendererController

    get currentContent() {
        if (this.controller.currentItem != undefined) {
            return this.controller.currentRenderedItem
        } else {
            return (
                <MemriText font={font({weight:Font.Weight.bold})}>
                    "No items to label"
                </MemriText>
            )
                //.frame(maxWidth: .infinity, maxHeight: .infinity)
        }
    }

    selectedLabelBinding() {
      /*  Binding(
            get: { self.controller.selectedLabels },
        set: {
            self.controller.selectedLabels = $0
        })*/
      return
    }

    render() {
        this.controller = this.props.controller;
        return (
            <LabelSelectionView options={this.controller.labelOptions} selected={this.selectedLabelBinding()}
                                enabled={this.controller.currentItem != undefined}
                                onBackPressed={this.controller.moveToPreviousItem()}
                                onCheckmarkPressed={this.controller.applyCurrentItem()}
                                onSkipPressed={this.controller.moveToNextItem}
                                enableBackButton={this.controller.enableBackButton}
                                enableCheckmarkButton={true}
                                enableSkipButton={this.controller.enableSkipButton}
                                topText={this.controller.progressText}
                                content={this.currentContent}
                                useScrollView={false}
            />
        )
    }
}

class LabelSelectionView extends MainUI {
    options

    selected
    enabled: boolean

    onBackPressed
    onCheckmarkPressed
    onSkipPressed

    enableBackButton
    enableCheckmarkButton
    enableSkipButton

    topText: string

    content
    useScrollView

    render(){
        this.options = this.props.options;
        this.selected = this.props.selected;
        this.enabled = this.props.enabled;
        this.onBackPressed = this.props.onBackPressed;
        this.onCheckmarkPressed = this.props.onCheckmarkPressed;
        this.onSkipPressed = this.props.onSkipPressed;
        this.enableBackButton = this.props.enableBackButton;
        this.enableCheckmarkButton = this.props.enableCheckmarkButton;
        this.enableSkipButton = this.props.enableSkipButton;
        this.topText = this.props.topText;
        this.content = this.props.content;
        this.useScrollView = this.props.useScrollView;
        //opacity(0.5)
        return (
            <VStack spacing={0} disabled={!this.enabled}>
                <MemriText padding={padding({horizontal: 10, vertical: 5})} background={new Color("secondarySystemBackground")}>
                    {this.topText}
                </MemriText>
                {this.topText != undefined &&
                    <MemriDivider/>
                }
                {this.content}
                <MemriList opacity={this.enabled ? 1 : 0.4} frame={frame({height: 220})}>
                    {this.options.map((option) => {
                        return (
                            <MemriRealButton action={() => {
                                if (this.selected.remove(option.id) == undefined) {
                                    this.selected.insert(option.id)
                                } //TODO:?
                            }}>
                                <HStack>
                                    {option.icon}
                                    <MemriText>
                                        {option.text}
                                    </MemriText>
                                </HStack>
                            </MemriRealButton>
                        )
                    })
                    }
                </MemriList>
                <MemriDivider/>
                <HStack spacing={0} opacity={this.enabled ? 1 : 0.4} frame={frame({height: 50})} background={new Color("secondarySystemBackground")}>
                    <MemriRealButton action={this.onBackPressed} disabled={!this.enableBackButton}>
                        <MemriImage font={font({family: "system", size: 20})} padding={padding({horizontal: 20})}
                                    foregroundColor={this.enableBackButton ? "blue" : "gray"}>
                            arrow.uturn.left
                        </MemriImage>
                    </MemriRealButton>
                    <MemriRealButton action={this.onCheckmarkPressed} disabled={!this.enableCheckmarkButton}>
                        <MemriImage font={font({family: "system", size: 25})}
                                    foregroundColor={"white"} background={"green"}>
                            checkmark
                        </MemriImage>
                    </MemriRealButton>
                    <MemriRealButton action={this.onSkipPressed} disabled={!this.enableSkipButton}>
                        <MemriText font={font({family: "system", size: 20})} padding={padding({horizontal: 20})} foregroundColor={this.enableSkipButton ? "blue" : "gray"}>
                            Skip
                        </MemriText>
                    </MemriRealButton>
                </HStack>
            </VStack>
        )
    }

    /*var body: some View {
        VStack(spacing: 0) {

            if useScrollView {
                GeometryReader { geometry in
                ScrollView(.vertical) {
                    self.content
                        .frame(width: geometry.size.width)
                }
                }
            } else {
                self.content
            }
            SwiftUI.List {
                ForEach(options, id: \.id) { option in
                Button(action: {
                    if self.selected.remove(option.id) == nil {
                        self.selected.insert(option.id)
                    }
                }) {
                    HStack {
                        option.icon
                        Text(option.text)
                    }
                .frame(maxWidth: .infinity, alignment: .leading)
                .if(self.selected.contains(option.id)) {
                        $0
                            .foregroundColor(.white)
                    .background(Color.blue.cornerRadius(4).padding(-5))
                    }
                .contentShape(Rectangle())
                }
                .buttonStyle(PlainButtonStyle())
                }
            }
        .opacity(enabled ? 1 : 0.4)
                .frame(height: 220)
        .clipShape(RoundedCornerRectangle(radius: 20, corners: [.topLeft, .topRight]))
        .background(
                RoundedCornerRectangle(radius: 20, corners: [.topLeft, .topRight])
        .fill(Color(.systemBackground))
        .shadow(radius: 10))
            Divider()
            HStack(spacing: 0) {
                Button(action: onBackPressed) {
                    Image(systemName: "arrow.uturn.left").font(.system(size: 20))
                .padding(.horizontal, 20)
                .contentShape(Rectangle())
                        .foregroundColor(enableBackButton ? Color.blue : Color.gray.opacity(0.5))
                }
            .disabled(!enableBackButton)
                Button(action: onCheckmarkPressed) {
                    Image(systemName: "checkmark").font(.system(size: 25))
                .padding()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                .foregroundColor(.white)
                .background(Color.green.opacity(enableCheckmarkButton ? 1 : 0.5))
                        .contentShape(Rectangle())
                }
            .disabled(!enableCheckmarkButton)
                Button(action: onSkipPressed) {
                    Text("Skip").font(.system(size: 20))
                .padding(.horizontal, 20)
                .contentShape(Rectangle())
                        .foregroundColor(enableSkipButton ? Color.blue : Color.gray.opacity(0.5))
                }
            .disabled(!enableSkipButton)
            }
        .opacity(enabled ? 1 : 0.4)
                .frame(height: 50)
        .background(Color(.secondarySystemBackground))
        }
    .disabled(!enabled)
    }*/
}
