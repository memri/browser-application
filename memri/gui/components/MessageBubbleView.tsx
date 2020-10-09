import {font, frame, HStack, MainUI, MemriText, padding, VStack} from "../swiftUI";
import * as React from "react";
import {FontDefinition} from "../../cvu/views/CVUPropertyResolver";
import {Alignment, Color, Font} from "../../cvu/parsers/cvu-parser/CVUParser";
import {MemriSmartTextView} from "./Text/MemriSmartTextView";

export class MessageBubbleView extends MainUI {
    timestamp?: Date
    sender?: string
    content: string
    outgoing: boolean
    font: FontDefinition

    /*dateFormatter: DateFormatter {
        // TODO: If there is a user setting for a *short* date format, we should use that
        let format = DateFormatter()
        format.dateStyle = .short
        format.timeStyle = .short
        format.doesRelativeDateFormatting = true
        return format
    }*/

    render() {
        //this.context = this.props.context;
        this.timestamp = this.props.timestamp;
        this.sender = this.props.sender;
        this.content = this.props.content;
        this.outgoing = this.props.outgoing;

        return (
            <HStack padding={padding({vertical:4, horizontal: 10})} frame={frame({maxWidth: ".infinity", alignment: this.outgoing ? Alignment.trailing : Alignment.leading})}>
                <VStack alignment={Alignment.leading} spacing={2}>
                    {(!this.outgoing) &&
                    <MemriText lineLimit={1} font={font({weight: Font.Weight.bold})}>
                        {this.sender}
                    </MemriText>
                    }
                    <MemriText lineLimit={1} font={font({family:"caption"})} foregroundColor={new Color("secondaryLabel")}>
                        {this.timestamp}
                    </MemriText>
                    <MemriSmartTextView detectLinks={true} font={font(this.font ?? new FontDefinition(undefined, 18))}
                                        fixedSize={{horizontal: false, vertical: true}}
                                        padding={padding(10)} color={this.outgoing ? "white" : new Color("label")}
                                        background={this.outgoing ? "blue" : new Color("secondarySystemBackground")}
                                        mask={""} string={this.content}
                    />

                </VStack>
            </HStack>   //.padding(outgoing ? .leading : .trailing, 20) //TODO?
        )

    }

}
