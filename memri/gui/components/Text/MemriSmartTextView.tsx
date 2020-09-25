//
// MemriTextView.swift
// Copyright © 2020 memri. All rights reserved.

import {MainUI, MemriText, font as fontF} from "../../swiftUI";
import * as React from "react";

export class MemriSmartTextView extends MainUI {
	string: String
	detectLinks: boolean = true
	font: FontDefinition
	color?: ColorDefinition
	maxLines: number
	
	// This uses a rather hacky implementation to get around SwiftUI sizing limitations
	// We use a simple text element to do the sizing, but display our custom element
    render(){
		let {string, detectLinks, font, color, maxLines, ...other} = this.props;
	    this.string = string;
	    this.detectLinks = detectLinks;
	    this.font = font;
	    this.color = color;
	    this.maxLines = maxLines;

	    return (
			<div className={"MemriSmartTextView"} style={this.setStyles()} {...other}>
				<MemriText lineLimit={this.maxLines != 0 ? this.maxLines : undefined} font={fontF(this.font)}
						   fixedSize={{horizontal: false, vertical: true}}>
					{this.string}
				</MemriText>
			</div>
		)
    }

    /*var body: some View {
		Text(verbatim: string)
				.lineLimit(maxLines != 0 ? maxLines : nil)
				.font(font.font)
				.fixedSize(horizontal: false, vertical: true)
				.hidden()
				.overlay(MemriSmartTextView_Inner(string: string, detectLinks: detectLinks, font: font, color: color, maxLines: maxLines))
	}*/
}

/*
struct MemriSmartTextView_Inner: UIViewRepresentable {
    var string: String
    var detectLinks: Bool = true
    var font: FontDefinition
    var color: ColorDefinition?
    var maxLines: Int?

    func makeUIView(context: Context) -> MemriSmartTextView_UIKit {
        let textView = MemriSmartTextView_UIKit()
        textView.dataDetectorTypes = detectLinks ? .all : []
        textView.font = font.uiFont
        textView.textColor = color?.uiColor ?? .label
        textView.text = string

		textView.contentInset = .zero
		textView.textContainer.lineFragmentPadding = 0
        textView.textContainer.maximumNumberOfLines = maxLines ?? 0

        context.coordinator.textView = textView
        textView.delegate = context.coordinator
        textView.layoutManager.delegate = context.coordinator

        return textView
    }

    func updateUIView(_ textView: MemriSmartTextView_UIKit, context: Context) {
		if textView.text != string {
			textView.text = string
		}
    }

    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    class Coordinator: NSObject, UITextViewDelegate, NSLayoutManagerDelegate {
        weak var textView: MemriSmartTextView_UIKit?
    }
}

class MemriSmartTextView_UIKit: UITextView {
    init() {
        super.init(frame: .zero, textContainer: nil)
        isEditable = false
		backgroundColor = .clear
		textContainerInset = .zero
		textContainer.lineBreakMode = .byWordWrapping
	
		 // These next few lines are critical to getting the right autosizing behaviour
		isScrollEnabled = false
		setContentCompressionResistancePriority(.defaultHigh, for: .vertical)
		setContentCompressionResistancePriority(.defaultLow, for: .horizontal) // Default low required in SwiftUI to avoid forcing larger frame
		setContentHuggingPriority(.defaultHigh, for: .horizontal)
		setContentHuggingPriority(.defaultHigh, for: .vertical)
	}
	
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
	
	override var intrinsicContentSize: CGSize {
		// super.intrinsicContentSize - this works, except for the case where a line is wider than the available space
		CGSize(width: UIView.noIntrinsicMetric, height: UIView.noIntrinsicMetric)
	}
}*/
