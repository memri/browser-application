//
//  TopNavigation.swift
//  memri
//
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from 'react';
import {Alignment} from "../../parsers/cvu-parser/CVUParser";
import {MemriContext} from "../../context/MemriContext";

export class TopNavigation extends React.Component {
	context: MemriContext

	showingBackActions = false
	showingTitleActions = false

	isPressing = false // HACK because long-press isnt working why?

	inSubView: boolean
	showCloseButton: boolean

	init(inSubView = false, showCloseButton = false) {
		this.inSubView = inSubView
		this.showCloseButton = showCloseButton
	}

	forward() {
		this.context.executeAction(new ActionForward(this.context))
	}

	toFront() {
		this.context.executeAction(new ActionForwardToFront(this.context))
	}

	backAsSession() {
		this.context.executeAction(new ActionBackAsSession(this.context))
	}

	openAllViewsOfSession() {
		try {
			ActionOpenViewByName.exec(this.context, {name: "views-in-current-session"})
		} catch (error) {
			debugHistory.error(`Unable to open views for session: ${error}`)
		}
	}

	createTitleActionSheet() {
		var buttons = []
		let isNamed = this.context.currentSession?.currentView?.name != undefined

		// TODO: or copyFromView
		// buttons.push(isNamed//TODO
		// 	? .default(Text("Update view")) { this.toFront() }
		// 	: .default(Text("Save view")) { this.toFront() }
		// )

		// buttons.push(.default(Text("Add to Navigation")) { this.toFront() })
		// buttons.push(.default(Text("Duplicate view")) { this.toFront() })

		if (isNamed) {
			// buttons.push(.default(Text("Reset to saved view")) { this.backAsSession() })
		}

		// buttons.push(.default(Text("Copy a link to this view")) { this.toFront() })
		// buttons.push(.cancel())

		return new ActionSheet(new Text("Do something with the current view"), buttons)
	}

	createBackActionSheet() {
		new ActionSheet(new Text("Navigate to a view in this session"),
					{//TODO
						// .default(Text("Forward")) { self.forward() },
						// .default(Text("To the front")) { self.toFront() },
						// .default(Text("Back as a new session")) { self.backAsSession() },
						// .default(Text("Show all views")) { self.openAllViewsOfSession() },
						// .cancel(),
					})
	}

	render() {
		let backButton = this.context.currentSession?.hasHistory ?? false ? new ActionBack(this.context) : null
		let context = this.context

		return (
			<VStack alignment={"leading"}
					spacing={0}
					padding={padding({bottom: 0})}
					centeredOverlayWithinBoundsPreferenceKey>
				<HStack alignment={Alignment.top} spacing={10}
						padding={padding({top: 15, bottom: 10, leading: 15, trailing: 15})}
						frame={frame({height: 50, alignment: Alignment.top})}
				>

				</HStack>
				<Divider/>
			</VStack>
		);

	}
}

class BoundsPreferenceKey extends PreferenceKey {
	typealias Value = Anchor<CGRect>?

	static var defaultValue: Value = nil

	static func reduce(
		value: inout Value,
		nextValue: () -> Value
	) {
		value = nextValue() ?? value
	}
}

/*private extension View {
	func centeredOverlayWithinBoundsPreferenceKey<Content: View>(content: @escaping () -> Content) -> some View {
		func calculateCenterAndMaxSize(geometry: GeometryProxy, anchor: Anchor<CGRect>?) -> (CGPoint, CGSize)? {
			guard let bounds = anchor.map({ geometry[$0] }) else { return nil }
			let center = CGPoint(x: geometry.size.width / 2, y: geometry.size.height / 2)
			let maxWidth = min(abs(bounds.maxX - center.x), abs(bounds.minX - center.x)) * 2
			return (center, CGSize(width: maxWidth, height: bounds.height))
		}

		return overlayPreferenceValue(BoundsPreferenceKey.self) { preference in
			GeometryReader { geometry in
				calculateCenterAndMaxSize(geometry: geometry, anchor: preference).map { center, maxSize in
					content()
						.frame(maxWidth: maxSize.width, maxHeight: maxSize.height)
						.position(center)
				}
			}
		}
	}
}*/

/*
struct Topnavigation_Previews: PreviewProvider {
	static var previews: some View {
		TopNavigation().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}
*/