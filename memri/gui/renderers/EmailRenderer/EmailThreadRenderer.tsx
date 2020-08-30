//
//  EmailThreadRenderer.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {allRenderers, CascadingEmailThreadRendererConfig, CascadingThumbnailConfig} from "../../../cvu/views/Renderers";
import {MainUI, RenderersMemri} from "../../swiftUI";
import {ViewArguments} from "../../../cvu/views/CascadableDict";
import * as React from "react";
import {Color} from "../../../parsers/cvu-parser/CVUParser";
import {EmailThreadItem} from "./EmailThreadCell";
import {UUID} from "../../../model/items/Item";

export var registerEmailRenderers = function () {
    if (allRenderers) {
        allRenderers.register(
            "email",
            "Email Thread",
            0,
            "envelope.fill", //
            new EmailThreadRenderer(),
            CascadingEmailThreadRendererConfig,
            function(items) { return items[0] && (items[0].genericType == "Message" || items[0].genericType == "Note" || items[0].genericType == "EmailMessage")}
        )
    }
}

class EmailThreadRenderer extends RenderersMemri {
    context: MemriContext

    get renderConfig(): CascadingThumbnailConfig {
        return this.context.currentView?.renderConfig ?? new CascadingEmailThreadRendererConfig()
    }

    getEmailHeader(item: Item) {
        return this.renderConfig.render(item);
    }
    
    getEmailItems() {
        return this.context.items.map((item) => {
            return (
                <EmailThreadItem uuid={item.uid ?? UUID()} contentHTML={this.resolveExpression(this.renderConfig.content, item) ?? ""} headerView={this.getEmailHeader(item)}/>
            )
        })
    }
    
    resolveExpression(expression: Expression, dataItem: Item) {
        let args = new ViewArguments(this.context.currentView?.viewArguments, dataItem)
        return expression?.execForReturnType(args);
    }

    render() {
        this.context = this.props.context;

        return (
            <EmailThreadRendererController emails={this.getEmailItems()} background={this.renderConfig.backgroundColor?.value ?? new Color("systemGroupedBackground")}/>
        )
    }
    
    /*var body: some View {
        EmailThreadRendererController(emails: getEmailItems())
            .background(renderConfig.backgroundColor?.color ?? Color(.systemGroupedBackground))
    }*/
}

class EmailThreadRendererController extends MainUI {
    emails

    render() {
        this.emails = this.props.emails;
        let style = this.setStyles();
        Object.assign(style, {width: "100%"})

        return (
            <div style={style} className={"EmailThreadRendererController"}>
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
