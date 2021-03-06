//
//  ContentPane.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {MainUI, ZStack} from "../../swiftUI";
import {Alignment} from "../../../../router";
import {ContextPaneBackground} from "./ContextPaneBackground";
import {ContextPaneForeground} from "./ContextPaneForeground";
import {geom} from "../../../../geom";

export class ContextPane extends MainUI {
	widthRatio = 0.75
/*
	@GestureState(reset: { _, transaction in
		transaction.animation = .default
    }) var offset: CGFloat = .zero*/

	offset = 0

	get isVisible () {
		return this.context.currentSession?.showContextPane ?? true/*false*/
	}

	set isVisible (newValue) {
		if (this.context.currentSession)
			this.context.currentSession.showContextPane = newValue
		this.context.scheduleUIUpdate(true)
	}

	paneWidth(geom) {
		return Math.min(geom.size.width * this.widthRatio, 300)
	}

	cappedOffset(geom) {
		return Math.min(Math.max(0, this.offset), this.paneWidth(geom))
	}

	fractionVisible(geom) {
		return 1 - Number(Math.abs(this.cappedOffset(geom)) / this.paneWidth(geom))
	}

	body() {
		/*GeometryReader { geom in
			self.body(withGeom: geom)
		}*/
	}

	render() {
		this.context = this.props.context

		return (
			<div className="ContextPane" style={{position:"absolute"}}>
			<ZStack alignment={Alignment.trailing}>
				{this.isVisible && <ContextPaneBackground
					opacity={this.fractionVisible(geom) * 0.5}
					edgesIgnoringSafeArea={"vertical"}
					transition={"opacity"}
					zIndex={"-1"}
				/>}
				{this.isVisible && <ContextPaneForeground
					context={this.context}
					frame={this.paneWidth(geom)}
					offset={this.cappedOffset(geom)}
					edgesIgnoringSafeArea={"vertical"}
					// transition={move("trailing")}
				/>}
			</ZStack>
			</div>
		)
	}

	/*get contextPaneDragGesture() {
		return DragGesture()
			.updating($offset, body: { value, offset, _ in
				offset = value.translation.width
            })
			.onEnded { value in
				if value.predictedEndTranslation.width > 100, abs(value.translation.width) > 10 {
					withAnimation {
						self.isVisible = false
					}
				}
			}
	}*/
}

/*struct ContentPane_Previews: PreviewProvider {
	static var previews: some View {
		ContextPane().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
