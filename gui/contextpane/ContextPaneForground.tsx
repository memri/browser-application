//
//  ForgroundContextPane.swift
//  Copyright © 2020 memri. All rights reserved.

import * as React from "react";
import {
	ActionButton,
	font,
	frame,
	HStack, MainUI,
	MemriButton, MemriDivider,
	MemriText,
	padding,
	ScrollView, Spacer,
	VStack
} from "../swiftUI";
import {ActionNoop} from "../../cvu/views/Action";
import {Alignment, Font} from "../../parsers/cvu-parser/CVUParser";

export class ContextPaneForeground extends MainUI {
	paddingLeft = 25

	render() {
		let context = this.props.context
		let labels = context.currentView?.resultSet
			.singletonItem?.edges("label")?.itemsArray("Label") ?? []
		let addLabelAction = new ActionNoop(context)
		return (
			<div className="ContextPaneForeground">
			<ScrollView background="white">
				<VStack alignment={Alignment.leading} padding={padding({top: 60})}>
					<VStack alignment={Alignment.leading}>
						<MemriText
							font={font({
								size: 23, weight: Font.Weight.bold/*TODO regular???*/, design: "default"
							})}
							opacity={0.75}
							padding={padding({horizontal: this.paddingLeft, vertical: 5})}
						>
							{context.currentView?.title ?? "title"}{/*TODO: make this generic*/}
						</MemriText>
						<MemriText
							font={font({family: "body"})}
							opacity={0.75}
							padding={padding({horizontal: this.paddingLeft, bottom: 15})}
						>{context.currentView?.subtitle ?? "subtitle"}</MemriText>

						<HStack padding={padding({horizontal: this.paddingLeft, bottom: 15})}>
							{(context.currentView?.contextPane.buttons ?? []).map((actionItem) => <ActionButton action={actionItem}/>)}
						</HStack>

						<MemriDivider/>
						<MemriText
							font={font({
								family: "body"/*TODO system???*/, size: 14, weight: Font.Weight.regular, design: "default"
							})}
							padding={padding({horizontal: this.paddingLeft, vertical: 10})}
							multilineTextAlignment={Alignment.center}
						>
							{"You created this note in August 2017 and viewed it 12 times and edited it 3 times over the past 1.5 years."}
						</MemriText>
						<MemriDivider/>
					</VStack>

					<HStack padding={padding({top: 15, bottom: 10})}>
						<MemriText
							opacity={0.4}
							font={font({
								size: 16, weight: Font.Weight.bold/*TODO regular???*/, design: "default"
							})}
							padding={padding({horizontal: this.paddingLeft})}
						>{"actionLabel"}</MemriText>{/*NSLocalizedString("actionLabel", comment: "")*/}
						<Spacer/>
					</HStack>
					<VStack alignment={Alignment.leading} spacing={0} padding={padding({horizontal: this.paddingLeft})}>
						{(context.currentView?.contextPane.actions ?? []).map((actionItem) =>
							<MemriButton action={context.executeAction(actionItem)}>
								<MemriText
									foregroundColor={"black"}
									opacity={0.6}
									font={font({size: 20, weight: Font.Weight.regular, design: "default"})}
									padding={padding({vertical: 10})}
								>{actionItem.getString("title")}</MemriText>{/*TODO*/}
							</MemriButton>
						)}
					</VStack>
					<MemriDivider/>
					<HStack padding={padding({top: 15, bottom: 10})}>
						<MemriText
							opacity={0.4}
							font={font({size: 16, weight: Font.Weight.bold/*TODO regular???*/, design: "default"})}
							padding={padding({horizontal: this.paddingLeft})}
						>{"navigateLabel"}</MemriText>{/*NSLocalizedString("navigateLabel", comment: "")*/}
					</HStack>
					<VStack alignment={Alignment.leading} spacing={0}>
						{(context.currentView?.contextPane.navigate ?? []).map((navigateItem) =>
							<MemriButton action={context.executeAction(navigateItem)}>
								<MemriText
									foregroundColor={"black"}
									opacity={0.6}
									font={font({size: 20, weight: Font.Weight.regular, design: "default"})}
									padding={padding({vertical: 10, horizontal: this.paddingLeft})}
								>{navigateItem.getString("title")}</MemriText>{/*TODO*/}{/*LocalizedStringKey(navigateItem.getString("title"))*/}
							</MemriButton>
						)}
					</VStack>
					<MemriDivider/>
					<HStack padding={padding({top: 15, bottom: 15})}>
						<MemriText
							opacity={0.4}
							font={font({size: 16, weight: Font.Weight.bold/*TODO regular???*/, design: "default"})}
							padding={padding({horizontal: this.paddingLeft})}
						>{"labelsLabel"}</MemriText>{/*NSLocalizedString("labelsLabel", comment: "")*/}
						<Spacer/>
					</HStack>
					<VStack alignment={Alignment.leading} spacing={10}>
						{(labels).map((labelItem) =>
							<MemriButton action={context.executeAction(addLabelAction, labelItem)}
										 background={labelItem.color ?? "#ffd966ff"}
										 cornerRadius={5}
										 padding={padding({horizontal: this.paddingLeft})}
							>
								<MemriText
									foregroundColor={"black"}
									opacity={0.6}
									font={font({size: 20, weight: Font.Weight.regular, design: "default"})}
									padding={padding({vertical: 5, horizontal: 15})}
									frame={frame({minWidth: 150, alignment: Alignment.leading})}
								>{labelItem.name ?? ""}</MemriText>
							</MemriButton>
						)}
						{<MemriButton action={context.executeAction(new ActionNoop(context))}
									  padding={padding({horizontal: this.paddingLeft})}
						>
							<MemriText
								foregroundColor={"black"}
								opacity={0.6}
								font={font({size: 20, weight: Font.Weight.regular, design: "default"})}
								padding={padding({vertical: 10})}
							>{addLabelAction.getString("title")}</MemriText>
						</MemriButton>}
						<Spacer/>
					</VStack>

				</VStack>

			</ScrollView>
			</div>
		)
	}
}

/*struct ForgroundContextPane_Previews: PreviewProvider {
	static var previews: some View {
		ContextPaneForeground().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
