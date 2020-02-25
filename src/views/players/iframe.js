import React from 'react';


export default class IFramePlayer extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div>
            <iframe src={this.props.iframeSrc} scrolling="no" frameBorder="0" width="100%" minHeight="400px" allowFullScreen={true}></iframe>
            </div>
        );
    }
}