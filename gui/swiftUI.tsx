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