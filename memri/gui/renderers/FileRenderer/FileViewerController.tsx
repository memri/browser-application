//
// FileViewerController.swift
// Copyright © 2020 memri. All rights reserved.


import {MainUI, MemriImageView} from "../../swiftUI";
import * as React from "react";

export class FileViewerItem {
    constructor(url: URL, title?: string) {
        this.url = url
        this.title = title
    }

    url: URL
    title: string

    get previewItemURL(): URL {
        return this.url
    }

    get previewItemTitle(): string { return this.title ?? "" }
}

export class MemriFileViewController extends MainUI {
    files: FileViewerItem[]
    initialIndex: number
    navBarHiddenBinding

    render() {
        this.files = this.props.files
        this.initialIndex = this.props.initialIndex
        return (<div className={"MemriFileViewController"}>
            <MemriImageView image={this.files[this.initialIndex].previewItemURL}/>
        </div>);
    }

    makeUIViewController(context: Context) {
        let vc = new MemriFileViewController_UIKit(context.coordinator)
        vc.previewController.currentPreviewItemIndex = this.initialIndex ?? 0
        return vc
    }

    updateUIViewController(
        uiViewController: MemriFileViewController_UIKit,
        context: Context
    ) {
        context.coordinator.parent = this
        uiViewController.navBarHiddenBinding = navBarHiddenBinding
        // uiViewController.previewController.reloadData()
    }

    makeCoordinator() {
        return new Coordinator(this)
    }
}

class Coordinator {
    constructor(parent: MemriFileViewController) {
        this.parent = parent
    }

    parent: MemriFileViewController

    numberOfPreviewItems(controller: QLPreviewController) {
        return this.parent.files.length
    }

    previewController(
        controller: QLPreviewController,
        index: number
    ): QLPreviewItem {
        return this.parent.files[index]
    }
}

class MemriFileViewController_UIKit {
    previewController = new QLPreviewController()

    navBarHiddenBinding

    constructor(coordinator: Coordinator) {
        // super.init(nibName: nil, bundle: nil)
        this.previewController.delegate = coordinator
        this.previewController.dataSource = coordinator
    }

    // @available(*, unavailable)
    // required init?(coder: NSCoder) {
    //     fatalError("init(coder:) has not been implemented")
    // }

    viewDidLoad() {
        // super.viewDidLoad()
        // this.setViewControllers([previewController], animated: false)
    }

    // override func setNavigationBarHidden(_ hidden: Bool, animated: Bool) {
    //     super.setNavigationBarHidden(hidden, animated: animated)
    //     updateNavBarBinding()
    // }
    //
    // override var isNavigationBarHidden: Bool {
    //     didSet { updateNavBarBinding() }
    // }
    //
    // func updateNavBarBinding() {
    //     DispatchQueue.main.async {
    //         self.navBarHiddenBinding?.wrappedValue = self.isNavigationBarHidden
    //     }
    // }
}
