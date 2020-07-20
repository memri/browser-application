//
//  Search.swift
//  memri
//
//  Created by Koen van der Veen on 19/02/2020.
//  Copyright © 2020 memri. All rights reserved.
//

import * as React from "react";
import {Color} from "../../parsers/cvu-parser/CVUParser";
import {ActionButton, font, HStack, MainUI, MemriText, MemriTextField, padding, VStack} from "../swiftUI";
import {Divider} from "@material-ui/core";

export class Search extends MainUI{
	init() {
		this.context = this.props.context;
	}

	render() {
		this.init()
		return (
			<VStack spacing={0}
					background={new Color("white").toLowerCase()}
					// modifier={new KeyboardModifier(null)}
			>
				<Divider background={"#efefef"}/>
				<HStack padding={padding({horizontal: 15, vertical: 6})}>
					<MemriTextField value={this.context.cascadingView?.filterText ?? "" }
									placeholder={this.context.cascadingView?.searchHint ?? ""}
									showPrevNextButtons={false}
									layoutPriority={-1}
					>
					</MemriTextField>

					<MemriText>{this.context.cascadingView?.searchMatchText ?? ""}</MemriText>

					{(this.context.cascadingView?.filterButtons ?? []).map((filterButton) =>
						<ActionButton action={filterButton}
							font={font({size: 20, weight: "medium"})}/>
					)}

				</HStack>
			</VStack>
		);
	}
}

/*class KeyboardModifier extends React.Component {
	keyboard = KeyboardResponder.shared
	screenSize
	contentBounds?: CGRect

	render() {
		return()
		content
			.offset(x: 0, y: contentBounds.flatMap { contentBounds in
				screenSize.map { screenSize in
					min(0, (screenSize.height - contentBounds.maxY) - keyboard.currentHeight)
				}
            } ?? 0)
			.background(
				GeometryReader { geom in
					Color.clear.preference(key: BoundsPreferenceKey.self, value: geom.frame(in: .global))
				}
			)
			.onPreferenceChange(BoundsPreferenceKey.self, perform: { value in
				DispatchQueue.main.async {
					self.contentBounds = value
				}
            })
	}
}*/

/*class BoundsPreferenceKey extends PreferenceKey {
	Value? = CGRect

	defaultValue

	static reduce(
		value,
		nextValue
	) {
		value = nextValue() ?? value
	}
}*/

/*struct Search_Previews: PreviewProvider {
	static var previews: some View {
		Search().environmentObject(try! RootContext(name: "", key: "").mockBoot())
	}
}*/
