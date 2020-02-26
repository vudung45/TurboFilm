import React from 'react';

export default class MoviePlayer extends React.Component {
    

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
        let videojs = window.videojs;
        
        if(!videojs)
            return;

        if(newSrcs == null)
            return;

        if(this.player)
            this.player.src({})



        if(!this.player)
            this.player = videojs(this.videoNode,{
                controls: true,
                width: 1000,
                plugins: {
                    videoJsResolutionSwitcher: {
                      ui: true,
                      dynamicLabel: true // Display dynamic labels or gear symbol
                    }
                }
            }, () => {
                console.log('onPlayerReady', this);
                var player = this.player;

                if(newSrcs.length)
                {
                    if(newSrcs[0].type == "application/x-mpegURL")
                        player.updateSrc(newSrcs, {hls:true});
                    else
                        player.updateSrc(newSrcs);
                }
            });
        else {
            if(newSrcs.length)
            {
                if(newSrcs[0].type == "application/x-mpegURL")
                    this.player.updateSrc(newSrcs, {hls:true});
                else
                    this.player.updateSrc(newSrcs);
            }
        }
    }



    componentDidMount(){
       
        if(window) window.videojs = videojs;
        require('../videojs/videojs-resolution-switcher')
        require("videojs-contrib-hls");
        this.updatePlayer(this.props.movieSrcs);
    }

    render() {

        return(   
            <div  data-vjs-player>
                <video ref={ node => this.videoNode = node } className="video-js"></video>
            </div>
        );

    }
}