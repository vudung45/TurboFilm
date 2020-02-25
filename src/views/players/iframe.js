import React from 'react';


export default class IFramePlayer extends React.Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <div className="embed-responsive embed-responsive-16by9">
                <iframe className="embed-responsive-item" src={this.props.iframeSrc} scrolling="no" frameBorder="0" width="100%" allowFullScreen={true}></iframe>
            </div>
        );
    }
}