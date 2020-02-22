import React from 'react';



export default class IFramePlayer extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>
            <iframe src={this.props.iframeSrc} scrolling="no" frameborder="0" width="100%" height="100%" allowfullscreen="true" webkitallowfullscreen="true" mozallowfullscreen="true"></iframe>
            </div>
        );
    }
}