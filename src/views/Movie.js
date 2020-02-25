import React from 'react';
import JWMoviePlayer from "./players/jwmovieplayer.js";
import IFramePlayer from "./players/iframe.js";
import { withRouter, useParams } from "react-router-dom";

function processSources(sources) {
    let processSources = []
    sources.forEach(source => {
        if(!source["src"] || !source["type"])
            return;

        let src = source["src"].replace(/^(https?:)?\/\//, "https://");
        let type = source["type"].includes("mp4") ? "video/mp4" : (source["type"].includes("hls") ? "application/x-mpegURL" : source["type"]);
        let label = source["label"] ? source["label"] : "MOV";
        if(src && type && label) {
            processSources.push({
                src: src,
                type: type,
                label: label
            });
        }
    });
    return processSources;
}

function getVideoServerName(src) {
    if(src.includes("google.com"))
        return "GO"; 
    return "UNK"; // unknown

}

const SERVER_PREFERENCES = {
    "SV" : 0,
    "MIRROR": 1, 
    "IFRAME": 2,
}

function getServerScore(svName){
    for(const k of Object.keys(SERVER_PREFERENCES)) {
        if(svName.includes(k))
            return SERVER_PREFERENCES[k];
    }

    return 100;
}

class Movie extends React.Component {
    constructor(props) {
        super(props);
        this.state = {movieId: null, 
                      movieInfo: {},
                      selection: null, 
                      episodeSelection: 0, 
                      mediaCache: {}, 
                      serverSelection: null,
                      movieSrcs: [],
                      loading: {
                        "origins": false,
                        "episodes": false,
                        "servers": false,
                        "player": false
                      }}
        this.selectEpisode = this.selectEpisode.bind(this)
        this.selectOrigin = this.selectOrigin.bind(this)
        this.selectServer = this.selectServer.bind(this)
        this.mediaCache = {}
        this.instances = {}

    }

    componentDidMount() {
        let movieId =  this.props.match.params.id;
        this.setState({"movieId": movieId});
        this.setState({loading : {origins: true, episodes:true}});
        fetch("/api/movie/info?movieId="+movieId)
        .then(r => r.json())
        .then(jsonResp => {
            if(!jsonResp.status)
                return;
            this.setState({movieInfo: jsonResp.response})
        }).catch(e => console.log(e))

        fetch("/api/movie/episodes?movieId="+movieId)
        .then(r => r.json())
        .then(jsonResp => {
            if(!jsonResp.status)
                return;
            let movieInstances = jsonResp.response
            if(Object.keys(movieInstances).length > 0) {
                this.instances = movieInstances;
                this.setState({selection: Object.keys(movieInstances).sort()[0], loading : {origins: false, episodes:false}})
                this.selectOrigin(Object.keys(movieInstances).sort()[0]);
            }
        }).catch(e => console.log(e))
    }

    selectOrigin(instanceId) {
        if(!(instanceId in this.instances))
            return;

        let currentEpisode = this.state.episodeSelection ? this.state.episodeSelection : 0;
        let correspondingEpisode = this.instances[instanceId].length > currentEpisode ? currentEpisode : this.instances[instanceId].length-1;
        //update originSelection state, and remove current movieSrcs
        this.setState({selection: instanceId, "serverSelection": null, movieSrcs: []})
        this.selectEpisode(instanceId, correspondingEpisode);
    }

    selectEpisode(instanceId, ep) {
        if(!(instanceId in this.instances))
            return;
        this.setState({loading : {servers: true}});
        this.setState({"episodeSelection": parseInt(ep), "selection": instanceId, "serverSelection": null, movieSrcs: []});
        if(this.mediaCache[instanceId] && this.mediaCache[instanceId][ep]) {
            this.setState({loading : {servers: false}});
            this.selectServer(instanceId, ep, Object.keys(this.mediaCache[instanceId][ep])[0])
        } else {
            fetch(`/api/movie/getEpisodeMedia?instanceId=${instanceId}&ep=${ep}`)
            .then(r => r.json())
            .then(jsonResp => {
                if(!jsonResp.status)
                    return;
                let directSources = jsonResp.response.sources.direct;
                let mirrorSources = jsonResp.response.mirrors;
                let iframeSources = jsonResp.response.sources.iframe;
                if(!this.mediaCache[instanceId])
                    this.mediaCache[instanceId] = {}
                if(!this.mediaCache[instanceId][ep])
                    this.mediaCache[instanceId][ep] = {}

                Object.keys(jsonResp.response.sources).forEach(k => {
                    let sources =  jsonResp.response.sources[k];
                    let serverPrefix = k != "iframe" ? "SV" : "IFRAME";

                    sources.forEach(s => {
                        let processed = processSources(s);
                        if(s.length > 0){
                            let serverName = serverPrefix+"#"+Object.keys(this.mediaCache[instanceId][ep]).length
                            this.mediaCache[instanceId][ep][serverName] = processed
                        }
                    })

                })

                Object.keys(mirrorSources).forEach(k => {
                    mirrorSources[k].forEach( s => {
                        let processed = processSources(s);
                        if(processed.length > 0){
                            let serverName = "MIRROR#"+Object.keys(this.mediaCache[instanceId][ep]).length
                            this.mediaCache[instanceId][ep][serverName] = processed
                        }
                    })
                });

                console.log(this.state);
                this.setState({loading : {episodes: false}});
                let serverSorted = Object.keys(this.mediaCache[instanceId][ep]).sort(function(a, b) { return getServerScore(a) - getServerScore(b)})
                this.selectServer(instanceId, ep, serverSorted[0]);
                this.setState({loading : {servers: false}});
            }).catch(e => {
                console.log(e);
                this.setState({selection: instanceId, "episodeSelection":0, "serverSelection": null, movieSrcs: []})
            })
        }
    }

    selectServer(instanceId, ep, serverName){
        if(serverName in this.mediaCache[instanceId][ep]){
            console.log(this.mediaCache[instanceId][ep][serverName]);
            this.setState({serverSelection: serverName, movieSrcs : this.mediaCache[instanceId][ep][serverName]})
        }
    }

    render() {
        let originsNav = []
        let episodesNav = []
        let serversNav = []
        if(Object.keys(this.instances).length > 0)
        {
            let selection = this.state.selection ? this.state.selection : Object.keys(this.instances).sort()[0];
            originsNav = Object.keys(this.instances).map(key => {
                return (<li key={key} className="nav-item">
                        <button key={key} className={"nav-link " + (key == selection ? "active" : "")} 
                         onClick={this.selectOrigin.bind(this, key)}>{this.instances[key].origin}</button>
                      </li>)
            });
            let episodes = this.instances[selection].episodes;
            episodesNav = episodes.map((ep,i) => {
                return (<li key={selection+"_"+i} className="nav-item">
                    <button key={selection+"_"+i} className={"nav-link " + (i == this.state.episodeSelection ? "active" : "")}  
                            onClick={this.selectEpisode.bind(this, selection, i)}>{ep}</button>
                </li>)
            });
            if(this.mediaCache[selection] && this.mediaCache[selection][this.state.episodeSelection]) {
                let servers = this.mediaCache[selection][this.state.episodeSelection];
                let serverSorted = Object.keys(servers).sort(function(a, b) { return getServerScore(a) - getServerScore(b)})
                let serverSelection = this.state.serverSelection ? this.state.serverSelection : serverSorted[0];
                serversNav = serverSorted.map(k => {
                    return (<li key={selection+"_"+this.state.episodeSelection+"_"+k} className="nav-item">
                        <button key={selection+"_"+this.state.episodeSelection+"_"+k} className={"nav-link " + (k == serverSelection ? "active" : "")}  
                                onClick={this.selectServer.bind(this, selection, this.state.episodeSelection, k)}>{k}</button>
                    </li>)
                })
            }

        }
        return (
        <div className="container">
            <h3>{this.state.movieInfo.title ? this.state.movieInfo.title : "Loading..."}</h3>
             {this.state.movieSrcs.length > 0 && this.state.movieSrcs[0].type != "iframe" ? <JWMoviePlayer key={this.state.selection+"_"+this.state.episodeSelection+"_"+this.state.serverSelection} movieSrcs={this.state.movieSrcs}/> :
                 <IFramePlayer  key={this.state.selection+"_"+this.state.episodeSelection+"_"+this.state.serverSelection} iframeSrc={this.state.movieSrcs.length ? this.state.movieSrcs[0].src : ""}/> }
                 {this.state.loading.player ? (<img src="./loading.gif"/>) : null}
            <div className="card" style={{"textAlign": "left"}}>
              <div className="card-header">
                <ul className="nav nav-pills card-header-pills">
                  {originsNav}
                  {this.state.loading.origins ? (<img src="/loading.gif"/>) : null}
                </ul>
              </div>
              <div className="card-body">
                <ul className="nav nav-pills">
                  {episodesNav}
                  {this.state.loading.episodes ? (<img src="/loading.gif"/>) : null}
                </ul>
                <div className="card-body">
                    <h6>Servers</h6>
                    <ul className="nav nav-pills">
                      {serversNav}
                      {this.state.loading.servers ? (<img src="/loading.gif"/>) : null}
                    </ul>
              </div>
              </div>

            </div>
        </div>
        );
    }
}

export default withRouter(Movie);