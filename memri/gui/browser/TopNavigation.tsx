//
//  TopNavigation.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from 'react';
import {Alignment, Color, Font} from "../../../router";
import {
	ActionBack,
	ActionBackAsSession, ActionClosePopup,
	ActionForward,
	ActionForwardToFront,
	ActionOpenViewByName, ActionShowNavigation, ActionShowSessionSwitcher
} from "../../../router";
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
	VStack, ActionSheet
} from "../swiftUI";
import {debugHistory} from "../../../router";
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
		this.inSubView = this.props.inSubView ?? false;
		this.showCloseButton = this.props.showCloseButton ?? false;
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
		buttons.push(isNamed
			? {text: "Update view", action: () => this.toFront()}
			: {text: "Save view", action: () => this.toFront()}
		)

		buttons.push({text: "Add to Navigation", action: () => this.toFront()})
		buttons.push({text: "Duplicate view", action: () => this.toFront()})

		if (isNamed) {
			buttons.push({text: "Reset to saved view", action: () => this.backAsSession()})
		}

		buttons.push({text: "Copy a link to this view", action: () => this.toFront()})
		buttons.push({text: "Cancel"})

		return <ActionSheet title={"Do something with the current view"}
							buttons={buttons}
							context={this.context}
							closeCallback={() => {
								this.showingTitleActions = false
							}}
		/>
	}

	createBackActionSheet() {
		return <ActionSheet title={"Navigate to a view in this session"}
							buttons={[
								{text: "Forward", action: () => this.forward()},
								{text: "To the front", action: () => this.toFront()},
								{text: "Back as a new session", action: () => this.backAsSession()},
								{text: "Show all views", action: () => this.openAllViewsOfSession()},
								{text: "Cancel"}
							]}
							context={this.context}
							closeCallback={() => {
								this.showingBackActions = false
							}}
		/>

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
			backButtonAction = () => {
				this.showingBackActions = true;
				this.context.scheduleUIUpdate(true);
			}
		}

		return (
			<div className="TopNavigation">
			<VStack spacing={0}
					padding={padding({bottom: 0})}
					centeredOverlayWithinBoundsPreferenceKey>
				<HStack alignment={Alignment.center} spacing={10}
						padding={padding({vertical: 12, horizontal: 15})}
						frame={frame({height: 50})} background={new Color("secondarySystemGroupedBackground").toLowerCase()}
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
								padding={padding({horizontal: 5, vertical: 2})} foregroundColor={new Color("systemBlue").toLowerCase()}>Close
							</MemriText>
						</MemriRealButton>
					}
					{(backButton != undefined) ?
						<MemriRealButton action={backButtonAction}
                                         font={font({size: 19, weight: Font.Weight.semibold})}
										 onContextMenu={(e)=> {
											 e.preventDefault();
											 this.showingBackActions = true;
											 this.context.scheduleUIUpdate(true)
										 }}
							>
							<MemriImage padding={padding({horizontal: 5, vertical: 5})}
										foregroundColor={backButton?.color ?? "white"}>
								{backButton?.getString("icon") ?? ""}
							</MemriImage>
						</MemriRealButton> :
						<MemriRealButton action={backButtonAction}
                                         font={font({size: 19, weight: Font.Weight.semibold})}
							/*actionSheet={}*/
						>
							<MemriImage foregroundColor={new Color("secondaryLabel").toLowerCase()} padding={padding({horizontal: 5, vertical: 8})}
										font={font({size: 10, weight: Font.Weight.bold})}>
								adjust
							</MemriImage>
						</MemriRealButton>
					}
					<ColorArea layoutPriority={5}>
						<MemriRealButton action={() => {
											if (!this.showingTitleActions) {
												let titleActionButton = context.currentView?.titleActionButton
												if (titleActionButton) {
													context.executeAction(titleActionButton)
												}
											}
										 }}
										 onContextMenu={(e)=> {
											 e.preventDefault();
											 this.showingTitleActions = true;
											 this.context.scheduleUIUpdate(true)
										 }}
						>
							<MemriText foregroundColor={new Color("label").toLowerCase()} truncationMode={"tail"} font={font({family: "headline"})}>
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
				{this.showingTitleActions && this.createTitleActionSheet()}
				{this.showingBackActions && this.createBackActionSheet()}
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
