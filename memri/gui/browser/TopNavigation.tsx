//
//  TopNavigation.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Font} from "../../cvu/parsers/cvu-parser/CVUParser";
import {MemriContext} from "../../context/MemriContext";
import {
	ActionBack,
	ActionBackAsSession, ActionClosePopup,
	ActionForward,
	ActionForwardToFront,
	ActionOpenViewByName, ActionShowNavigation, ActionShowSessionSwitcher
} from "../../cvu/views/Action";
import {
	ColorArea,
	font,
	frame,
	HStack,
	MainUI,
	MemriRealButton, MemriDivider,
	MemriImage,
	MemriText,
	padding,
	VStack
} from "../swiftUI";
import {debugHistory} from "../../cvu/views/ViewDebugger";
import {ActionButton} from "../ActionView";

export class TopNavigation extends MainUI {
	context: MemriContext

	showingBackActions = false
	showingTitleActions = false

	isPressing = false // HACK because long-press isnt working why?

	inSubView: boolean
	showCloseButton: boolean

	constructor(props) {
		super(props);
	}

	init() {
		this.context = this.props.context;
		this.inSubView = this.props.inSubView;
		this.showCloseButton = this.props.showCloseButton;
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
			new ActionOpenViewByName(this.context).exec({viewName: "views-in-current-session"})
		} catch (error) {
			debugHistory.error(`Unable to open views for session: ${error}`)
		}
	}

	createTitleActionSheet() {
		var buttons = []
		let isNamed = this.context.currentSession?.currentView?.name != undefined

		// TODO: or copyFromView
		/*buttons.push(isNamed
			? .default(Text("Update view")) { this.toFront() }
			: .default(Text("Save view")) { this.toFront() }
		)

		buttons.push(.default(Text("Add to Navigation")) { this.toFront() })
		buttons.push(.default(Text("Duplicate view")) { this.toFront() })

		if (isNamed) {
			// buttons.push(.default(Text("Reset to saved view")) { this.backAsSession() })
		}*/

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
		this.init()
		let backButton = this.context.currentSession?.hasHistory ?? false ? new ActionBack(this.context) : undefined
		let context = this.context
		let backButtonAction;
		if (backButton) {
			backButtonAction = () => {
				if (!this.showingBackActions && backButton) {
					context.executeAction(backButton)
				}
			}
		} else {
			backButtonAction = () => this.showingBackActions = true
		}

		return (
			<div className="TopNavigation">
			<VStack alignment={"leading"}
					spacing={0}
					padding={padding({bottom: 0})}
					centeredOverlayWithinBoundsPreferenceKey>
				<HStack alignment={Alignment.top} spacing={10}
						padding={padding({top: 15, bottom: 10, leading: 15, trailing: 15})}
						frame={frame({height: 50, alignment: Alignment.top})}
				>
					{(!this.inSubView) ?
						<ActionButton action={new ActionShowNavigation(this.context)}
									  font={font({size: 20, weight: Font.Weight.semibold})} context={this.context}/> :
						(this.showCloseButton) &&
						<MemriRealButton action={function () {
							context.executeAction(new ActionClosePopup(context))
						}} font={font({size: 19, weight: Font.Weight.semibold})}>
							<MemriText
								font={font({size: 16, weight: Font.Weight.regular})}
								padding={padding({horizontal: 5, vertical: 2})} foregroundColor="#106b9f">Close
							</MemriText>
						</MemriRealButton>
					}
					{(backButton != undefined) ?
						<MemriRealButton action={backButtonAction}
                                         font={font({size: 19, weight: Font.Weight.semibold})}
							/*onLongPressGesture*/ /*actionSheet={}*/>
							<MemriImage padding={padding({horizontal: 5, vertical: 5})}
										foregroundColor={backButton?.color ?? "white"}>
								{backButton?.getString("icon") ?? ""}
							</MemriImage>
						</MemriRealButton> :
						<MemriRealButton action={backButtonAction}
                                         font={font({size: 19, weight: Font.Weight.semibold})}
							/*actionSheet={}*/
						>
							<MemriImage foregroundColor="#434343" padding={padding({horizontal: 5, vertical: 8})}
										font={font({size: 10, weight: Font.Weight.bold})}>
								adjust
							</MemriImage>
						</MemriRealButton>
					}
					<ColorArea layoutPriority={5}>
						<MemriRealButton>
							<MemriText foregroundColor="#333" truncationMode={"tail"} font={font({family: "headline"})}>
								{context.currentView?.title ?? ""}
							</MemriText>
						</MemriRealButton>
					</ColorArea>
					{(context.item != undefined || context.items.length > 0 &&
					context.settings.get("user/general/gui/showEditButton") != false &&
					context.currentView?.editActionButton != undefined) &&
					<ActionButton action={context.currentView?.editActionButton} font={font({size: 19, weight: Font.Weight.semibold})} context={this.context}/>
					}
					<ActionButton action={context.currentView?.actionButton} font={font({size: 22, weight: Font.Weight.semibold})} context={this.context}/>
					{!(this.inSubView) &&
					<ActionButton action={new ActionShowSessionSwitcher(context)} font={font({size: 20, weight: Font.Weight.semibold})} context={this.context} /*rotationEffect(.degrees(90)*//>
					}
				</HStack>
				<MemriDivider/>
			</VStack>
			</div>
		);

	}
}

/*class BoundsPreferenceKey extends PreferenceKey {
	typealias Value = Anchor<CGRect>?

	static var defaultValue: Value = nil

	static func reduce(
		value: inout Value,
		nextValue: () -> Value
	) {
		value = nextValue() ?? value
	}
}*/

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
