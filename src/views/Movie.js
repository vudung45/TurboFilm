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

function generateHistoryLink(movieId, origin, episode, server) {
    let path = [movieId, origin, episode, server];
    let url = "/movie"
    for(const subPath of path) {
        if(subPath == null)
            return url;
        url += "/"+encodeURIComponent(subPath)
    }
    return url;
}

class Movie extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
                      movieInfo: {},
                      selection: null, 
                      episodeSelection: 0, 
                      mediaCache: {}, 
                      selections: {
                        origin: null,
                        episodeSelection: 0,
                        serverSelection: null
                      },
                      movieSrcs: [],
                      loading: {
                        "origins": false,
                        "episodes": false,
                        "servers": false,
                        "player": false
                        }
                    }
        this.selectEpisode = this.selectEpisode.bind(this)
        this.selectOrigin = this.selectOrigin.bind(this)
        this.selectServer = this.selectServer.bind(this)
        this.mediaCache = {}
        this.instances = {}
        this.selections = {
              origin: null, 
              episodeSelection: 0, 
              origin: null
        }

    }

    componentDidMount() {
        let movieId =  this.props.match.params.id;
        const params = new URLSearchParams(this.props.location.search); 
        this.selections = {
                origin: decodeURIComponent(this.props.match.params.origin), 
                episodeSelection: parseInt(decodeURIComponent(this.props.match.params.episode)),
                serverSelection: decodeURIComponent(this.props.match.params.server)
        }

        console.log(this.selections);

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
                if(!(this.selections.origin in this.instances)) {
                    let origins = Object.keys(movieInstances).sort((a,b) => {
                        return (this.instances[a].episodes.length - this.instances[b].episodes.length) ?  
                                    (this.instances[b].episodes.length - this.instances[a].episodes.length) : a > b;
                    })
                    this.selections.origin = origins[0];
                } 
                this.setState({loading : {origins: false, episodes:false}})
                this.selectOrigin(this.selections.origin);
            }
        }).catch(e => {
            this.setState({loading : {origins: false, episodes:false}});
            console.log(e)
        })
    }

    selectOrigin(instanceId, manual=false) {
        if(!(instanceId in this.instances))
            return;

        this.selections.origin = instanceId;
        let currentEpisode = this.selections.episodeSelection != null ? this.selections.episodeSelection : null;
        this.setState({selections: {origin: this.selections.origin}, movieSrcs: []})
        let correspondingEpisode = null;
        if(currentEpisode !== null)
            correspondingEpisode = this.instances[instanceId].episodes.length > currentEpisode ? 
                                                currentEpisode : (this.instances[instanceId].episodes.length > 0 ? this.instances[instanceId].episodes.length - 1 : null);
        else
            correspondingEpisode = this.instances[instanceId].episodes.length > 0 ? 0 : null;

        if(correspondingEpisode === null)
            return;
        //update originSelection state, and remove current movieSrcs
        this.selectEpisode(instanceId, correspondingEpisode);
    }

    selectEpisode(instanceId, ep, manual=false) {
        if(!(instanceId in this.instances) || !(this.instances[instanceId].episodes.length > ep))
            return;
        
        this.selections = {
            ...this.selections,
            origin: instanceId, 
            episodeSelection: ep
        }

        if(manual) // reset server selection on manual click
            this.selections.serverSelection = null;

        this.setState({loading : {servers: true, player: true}});
        this.setState({selections: this.selections, movieSrcs: []});
        if(this.mediaCache[instanceId] && this.mediaCache[instanceId][ep]) {
            this.setState({loading : {servers: false, player: false}});
            if(!(this.selections.serverSelection in this.mediaCache[instanceId][ep])){
                this.selections.serverSelection = Object.keys(this.mediaCache[instanceId][ep]).sort(function(a, b) { return getServerScore(a) - getServerScore(b)})[0]
            }
            this.selectServer(instanceId, ep, this.selections.serverSelection)
        } else {
            fetch(`/api/movie/getEpisodeMedia?instanceId=${instanceId}&ep=${ep}`)
            .then(r => r.json())
            .then(jsonResp => {
                if(!jsonResp.status)
                    return;
                let sources = jsonResp.response.sources; // sources extracted from the site
                let mirrorSources = jsonResp.response.mirrors; // pre-processed, perma links
                if(!this.mediaCache[instanceId])
                    this.mediaCache[instanceId] = {}
                if(!this.mediaCache[instanceId][ep])
                    this.mediaCache[instanceId][ep] = {}

                Object.keys(sources).forEach(k => {
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
                console.log(this.selections.serverSelection);
                if(!this.selections.serverSelection || !(this.selections.serverSelection in this.mediaCache[instanceId][ep]))
                    this.selections.serverSelection = Object.keys(this.mediaCache[instanceId][ep]).sort(function(a, b) { return getServerScore(a) - getServerScore(b)})[0]
                
                this.selectServer(instanceId, ep, this.selections.serverSelection);
                this.setState({loading : {servers: false, player: false}});
            }).catch(e => {
                console.log(e);
                this.setState({loading : {servers: false, player: false}});
            })
        }
    }

    componentDidUpdate(prevProps) {
        if(this.state.movieInfo){
            window.history.replaceState({}, this.state.movieInfo["title"], 
                generateHistoryLink(this.state.movieInfo["_id"], this.state.selections.origin, this.state.selections.episodeSelection, this.state.selections.serverSelection));
        }
    }

    selectServer(instanceId, ep, serverName, manual = false){
        this.selections = {
            ...this.selections,
            origin: instanceId, 
            episodeSelection: ep,
            serverSelection: serverName
        }
        if(serverName in this.mediaCache[instanceId][ep]){
            console.log(this.mediaCache[instanceId][ep][serverName]);
            this.setState({selections: { episodeSelection : ep,  origin: instanceId, serverSelection: serverName}, 
                           movieSrcs : this.mediaCache[instanceId][ep][serverName]})
        }
    }

    render() {
        let originsNav = []
        let episodesNav = []
        let serversNav = []
        if(Object.keys(this.instances).length > 0)
        {
            originsNav = Object.keys(this.instances).map(key => {
                return (<li key={key} className="nav-item">
                        <button key={key} className={"nav-link " + (key == this.state.selections.origin ? "active" : "")} 
                         onClick={this.selectOrigin.bind(this, key, true)}>{this.instances[key].origin}</button>
                      </li>)
            });
            if(this.state.selections.origin) {
                let episodes = this.instances[this.state.selections.origin].episodes;
                episodesNav = episodes.map((ep,i) => {
                    return (<li key={this.state.selections.origin+"_"+i} className="nav-item">
                        <button key={this.state.selections.origin+"_"+i} className={"nav-link " + (i === this.state.selections.episodeSelection ? "active" : "")}  
                                onClick={this.selectEpisode.bind(this, this.state.selections.origin, i, true)}>{ep}</button>
                    </li>)
                });
            }
            if(this.mediaCache[this.state.selections.origin] && this.mediaCache[this.state.selections.origin][this.state.selections.episodeSelection]) {
                let servers = this.mediaCache[this.state.selections.origin][this.state.selections.episodeSelection];
                let serverSorted = Object.keys(servers).sort(function(a, b) { return getServerScore(a) - getServerScore(b)})
                serversNav = serverSorted.map(k => {
                    return (<li key={this.state.selections.origin+"_"+this.state.selections.episodeSelection+"_"+k} className="nav-item">
                        <button key={this.state.selections.origin+"_"+this.state.selections.episodeSelection+"_"+k} className={"nav-link " + (k === this.state.selections.serverSelection ? "active" : "")}  
                                onClick={this.selectServer.bind(this, this.state.selections.origin, this.state.selections.episodeSelection, k, true)}>{k}</button>
                    </li>)
                })
            }

        }
        return (
        <div className="container">
            <h3>{this.state.movieInfo.title ? this.state.movieInfo.title : "Loading..."}</h3>
             {this.state.movieSrcs.length === 0 ? null : 
                           ( this.state.movieSrcs[0].type !== "iframe" ? 
                                    <JWMoviePlayer key={this.state.selections.origin+"_"+this.state.selections.episodeSelection+"_"+this.state.selections.serverSelection} movieSrcs={this.state.movieSrcs}/> :
                                    <IFramePlayer  key={this.state.selections.origin+"_"+this.state.selections.episodeSelection+"_"+this.state.selections.serverSelection} iframeSrc={this.state.movieSrcs.length ? this.state.movieSrcs[0].src : ""}/>) }
                 {this.state.loading.player ? (<img src="/loading.gif"/>) : null}
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