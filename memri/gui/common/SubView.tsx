//
// SubView.swift
// Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {MainUI} from "../swiftUI";
import {ViewArguments} from "../../../router";
import {debugHistory} from "../../../router";
import {Browser} from "../browser/Browser";


export class SubView extends MainUI {
    context: MemriContext

    proxyMain?: MemriContext
    toolbar: boolean = true
    searchbar: boolean = true
    showCloseButton: boolean = false

    init(context: MemriContext, viewName: string | CVUStateDefinition, item?: Item, viewArguments?: ViewArguments) {
        viewArguments = viewArguments ?? new ViewArguments();
        try {
            let args = viewArguments.resolve(item)

            this.showCloseButton = args.get("showCloseButton") ?? this.showCloseButton
            if (context?.constructor?.name != "RootContext") {
                throw "Exception: Too much nesting"
            }

            if (viewName?.constructor?.name == "CVUStateDefinition") {
                this.proxyMain = this.context.createSubContext()
                this.proxyMain?.currentSession?.setCurrentView(viewName, args)
            } else {
                try {
                    let stored = context.views.fetchDefinitions(viewName)[0];
                    if (!stored) {
                        throw `Could not fetch view by name: ${viewName}`
                    }

                    let state = context.views.getViewStateDefinition(stored);
                    this.proxyMain = context.createSubContext()
                    this.proxyMain?.currentSession?.setCurrentView(state, args)
                } catch (error) {
                    // TODO: Refactor error handling
                    throw `Cannot update view ${this}: ${error}`
                }
            }
        } catch (error) {
            // TODO: Refactor: error handling
            debugHistory.error(`Error: cannot init subview: ${error}`)
        }
    }

    render() {
        this.context = this.props.context;
        this.init(this.props?.context, this.props?.viewName ?? this.props?.view, this.props?.item, this.props?.viewArguments);

        return (
            <div className={"SubView"}>
            <Browser inSubView={true} showCloseButton={this.showCloseButton} fullHeight context={this.proxyMain}>
                {this.props.children}
            </Browser>
            </div>
        )
    }
}
