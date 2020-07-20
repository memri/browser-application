//
//  ForgroundContextPane.swift
//  memri
//
//  Created by Jess Taylor on 3/21/20.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from "react";
import {
	ActionButton,
	font,
	frame,
	HStack,
	MemriButton,
	MemriText,
	padding,
	ScrollView,
	VStack
} from "../swiftUI";
import {MemriContext} from "../../context/MemriContext";
import {ActionNoop} from "../../cvu/views/Action";
import {Alignment, Font} from "../../parsers/cvu-parser/CVUParser";
import {Divider} from "@material-ui/core";

export class ContextPaneForeground extends React.Component {
	context: MemriContext

	paddingLeft = 25

	render() {
		let context = this.props.context
		let labels = context.cascadingView?.resultSet
			.singletonItem?.edges("label")?.itemsArray("Label") ?? []
		let addLabelAction = new ActionNoop(context)
		return (
			<ScrollView background={"white"}>
				<VStack alignment={Alignment.leading} padding={padding({top: 60})}>
					<VStack alignment={Alignment.leading}>
						<MemriText
							font={font({
								size: 23, weight: Font.Weight.bold/*TODO regular???*/, design: "default"
							})}
							opacity={0.75}
							padding={padding({horizontal: this.paddingLeft, vertical: 5})}
						>
							{context.cascadingView?.title ?? "title"}{/*TODO: make this generic*/}
						</MemriText>
						<MemriText
							font={font({family: "body"})}
							opacity={0.75}
							padding={padding({horizontal: this.paddingLeft, bottom: 15})}
						>{context.cascadingView?.subtitle ?? "subtitle"}</MemriText>

						<HStack padding={padding({horizontal: this.paddingLeft, bottom: 15})}>
							{(context.cascadingView?.contextButtons ?? []).map((actionItem) => <ActionButton action={actionItem}/>)}
						</HStack>

						<Divider/>
						<MemriText
							font={font({
								family: "body"/*TODO system???*/, size: 14, weight: Font.Weight.regular, design: "default"
							})}
							padding={padding({horizontal: this.paddingLeft, vertical: 10})}
							multilineTextAlignment={Alignment.center}
						>
							{"You created this note in August 2017 and viewed it 12 times and edited it 3 times over the past 1.5 years."}
						</MemriText>
						<Divider/>
					</VStack>

					<HStack padding={padding({top: 15, bottom: 10})}>
						<MemriText
							opacity={0.4}
							font={font({
								size: 16, weight: Font.Weight.bold/*TODO regular???*/, design: "default"
							})}
							padding={padding({horizontal: this.paddingLeft})}
						>{"actionLabel"}</MemriText>{/*NSLocalizedString("actionLabel", comment: "")*/}
						{/*<Spacer/>*/}
					</HStack>
					<VStack alignment={Alignment.leading} spacing={0} padding={padding({horizontal: this.paddingLeft})}>
						{(context.cascadingView?.actionItems ?? []).map((actionItem) =>
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
					<Divider/>
					<HStack padding={padding({top: 15, bottom: 10})}>
						<MemriText
							opacity={0.4}
							font={font({size: 16, weight: Font.Weight.bold/*TODO regular???*/, design: "default"})}
							padding={padding({horizontal: this.paddingLeft})}
						>{"navigateLabel"}</MemriText>{/*NSLocalizedString("navigateLabel", comment: "")*/}
					</HStack>
					<VStack alignment={Alignment.leading} spacintg={0}>
						{(context.cascadingView?.navigateItems ?? []).map((navigateItem) =>
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
					<Divider/>
					<HStack padding={padding({top: 15, bottom: 15})}>
						<MemriText
							opacity={0.4}
							font={font({size: 16, weight: Font.Weight.bold/*TODO regular???*/, design: "default"})}
							padding={padding({horizontal: this.paddingLeft})}
						>{"labelsLabel"}</MemriText>{/*NSLocalizedString("labelsLabel", comment: "")*/}
						{/*<Spacer/>*/}
					</HStack>
					<VStack alignment={Alignment.leading} spacintg={10}>
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
						{/*<Spacer/>*/}
					</VStack>

				</VStack>

			</ScrollView>
		)
	}
}

/*struct ForgroundContextPane_Previews: PreviewProvider {
	static var previews: some View {
		ContextPaneForeground().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
