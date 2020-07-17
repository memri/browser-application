import * as React from "react";

export class VStack extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let styles = {
            spacing: this.props.spacing
        }
        return (
            <div style={styles} className="VStack">
                {this.props.children}
            </div>
        )
    }
}

export class ZStack extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="ZStack">
                {this.props.children}
            </div>
        )
    }
}

export class HStack extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="HStack">
                {this.props.children}
            </div>
        )
    }
}

export class ColorArea extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="ColorArea">
                {this.props.children}
            </div>
        )
    }
}

export class Content extends React.Component {
    constructor(props) {
        super(props);
    }
    render() {
        let styles = {
            spacing: this.props.spacing,
            alignment: this.props.alignment
        }
        return (
            <div style={styles} className="Content">
                {this.props.children}
            </div>
        )
    }
}

export function frame(attrs) { //TODO:
    return "frame:";
}

export function padding(attrs) { //TODO:
    return "padding:";
}

export function offset(attrs) { //TODO: x,y
    return "offset:";
}