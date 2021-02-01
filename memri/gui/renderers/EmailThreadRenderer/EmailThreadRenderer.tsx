//
//  EmailThreadRenderer.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI, RenderersMemri} from "../../swiftUI";
import {ViewArguments} from "../../../../router";
import * as React from "react";
import {Color} from "../../../../router";
import {EmailThreadItem} from "./EmailThreadCell";
import {UUID} from "../../../../router";
import {CascadingRendererConfig} from "../../../../router";

export class EmailThreadRendererController {
    static rendererType = {name: "emailThread", icon: "email"/*envelope.fill*/, makeController: EmailThreadRendererController, makeConfig: EmailThreadRendererController.makeConfig}

    constructor(context: MemriContext, config?: CascadingRendererConfig) {
        this.context = context
        this.config = config ?? new EmailThreadRendererConfig()
    }

    context: MemriContext
    config: EmailThreadRendererConfig

    makeView() {
        return <EmailThreadRendererView controller={this} context={this.context}/>
    }

    update() {
        /*objectWillChange.send()*/
        return
    }

    static makeConfig(head?: CVUParsedDefinition, tail?: CVUParsedDefinition[], host?: Cascadable) {
        return new EmailThreadRendererConfig(head, tail, host)
    }

    getEmailHeader(item: Item) {
        return this.config.render(item);
    }

    getEmailItems() {
        return this.context.items.map((item) => {
            return (
                <EmailThreadItem uuid={item.uid ?? UUID()} contentHTML={this.resolveExpression(this.config.content, item) ?? ""} headerView={this.getEmailHeader(item)}/>
            )
        })
    }

    resolveExpression(expression: Expression, dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem)
        return expression?.execForReturnType(args);
    }
}

export class EmailThreadRendererConfig extends CascadingRendererConfig {
    get content() {
        return this.cascadeProperty("content", "Expression")
    }
}

class EmailThreadRendererView extends RenderersMemri {
    render() {
        this.controller = this.props.controller;

        return (
            <EmailThreadRenderer_SubView emails={this.controller.getEmailItems()}
                                         background={this.controller.config.backgroundColor?.value ?? new Color("systemGroupedBackground").toLowerCase()}/>
        )
    }
}

class EmailThreadRenderer_SubView extends MainUI {
    emails

    render() {
        this.emails = this.props.emails;
        let style = this.setStyles();
        Object.assign(style, {width: "100%"})

        return (
            <div style={style} className={"EmailThreadRenderer_SubView"}>
                {this.emails}
            </div>
        )
    }

    /*func makeUIViewController(context: Context) -> EmailThreadedViewController {
        EmailThreadedViewController()
    }
    
    func updateUIViewController(_ emailThreadController: EmailThreadedViewController, context: Context) {
        emailThreadController.emails = emails
    }*/
}

/*struct EmailThreadRenderer_Previews: PreviewProvider {
    static var previews: some View {
        EmailThreadRenderer()
    }
}*/
