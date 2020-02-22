import React from 'react';

export default class JWMoviePlayer extends React.Component {
    

    constructor(props){
        super(props)
        this.updatePlayer = this.updatePlayer.bind(this)
    }

    shouldComponentUpdate(nextProps, nextState) {
        // this.updatePlayer(nextProps.movieSrcs);
        // // requires switching from 
        // if(nextProps.movieSrcs && nextProps.movieSrcs.length > 0 && nextProps.movieSrcs[0].type == "iframe" && this.props.movieSrcs != "iframe")
        //     return true;
        return false;
    }

    updatePlayer(newSrcs) {
        if(newSrcs == null)
            return;

        if(!this.player)
            this.player = window.jwplayer(this.videoNode);

        this.player.setup({
            sources: newSrcs.map(m => { return {
                file: m["src"],
                label: m["label"],
                type: m["type"]
            }})
            ,width: "100%", aspectratio: "16:9", primary: "html5", autostart: true, allowscriptaccess: "always"});
    }



    componentDidMount(){
        this.updatePlayer(this.props.movieSrcs);
    }

    render() {

        return(   
            <div>
                <video ref={ node => this.videoNode = node } className="jwplayer"></video>
            </div>
        );

    }
}