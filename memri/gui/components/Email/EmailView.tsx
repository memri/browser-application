//
//  EmailView.swift
//  memri
//
//  Created by Toby Brennan on 30/7/20.
//  Copyright © 2020 memri. All rights reserved.
//

import {MainUI} from "../../swiftUI";
import * as React from "react";
import {geom} from "../../../../geom";
import * as ReactDOM from 'react-dom'
var DOMPurify = require('dompurify');

export class EmailView extends MainUI {
    emailHTML: string

    updateHeight() {
        let emailView = ReactDOM.findDOMNode(this);
        if (emailView) {
            let customRenderer = document.getElementById("CustomRenderer");
            let topNavigation = document.getElementsByClassName("TopNavigation").item(0)
            let bottomBarView = document.getElementsByClassName("BottomBarView").item(0);
            let height = geom.size.height - topNavigation.clientHeight - bottomBarView.clientHeight;
            if (customRenderer) {
                if (customRenderer.clientHeight > emailView.clientHeight) {
                    height = height - customRenderer.clientHeight + emailView.clientHeight;
                    emailView.style.maxHeight = height + "px";
                }
            } else {
                let labelAnnotationRenderer = document.getElementById("LabelAnnotationRenderer");
                if (labelAnnotationRenderer) {
                    let bottomLabels = document.getElementById("BottomLabels");
                    height = height - (labelAnnotationRenderer.clientHeight - emailView.clientHeight + bottomLabels.clientHeight);
                }
                emailView.style.maxHeight = height + "px";
            }

        }
    }

    sanitize() {
        this.emailHTML = DOMPurify.sanitize(this.emailHTML, { WHOLE_DOCUMENT: true, RETURN_DOM: true});
    }

    componentDidMount(): void {
        this.updateHeight();
    }

    componentDidUpdate(): void {
        this.updateHeight();
    }

    resetContentWidth() {
        this.emailHTML = this.emailHTML.replace(/width:\s*([0-9]+)\s*px\s*?;?/gi, function (match, p1) {
            if (Number(p1) > geom.size.width) {
                return "";
            } else {
                return match
            }
        })
    }

    render() {
        this.emailHTML = this.props.emailHTML;
        this.context = this.props.context;
        this.resetContentWidth();
        this.sanitize();
        let style = this.setStyles();
        Object.assign(style, {overflowY: "auto"})

        return (
            <div id={"EmailView"} style={style} dangerouslySetInnerHTML={{__html: this.emailHTML.outerHTML}} />)
    }
}
