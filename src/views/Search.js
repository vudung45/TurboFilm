import React from 'react';
import MoviesList from "./MoviesList"


export default class Search extends React.Component {
    constructor(props) {
        super(props)
        this.handleChange = this.handleChange.bind(this);
        this.processTextDelay = null;
        this.processText = this.processText.bind(this)
        this.state = {movies : {}};
    }

    handleChange(event) {
        clearTimeout(this.processTextDelay);
        let value = event.target.value;
        this.processTextDelay = setTimeout(() => {this.processText(value)}, 500);
    }  

    processText(txt) { 
        if(txt == "")
            this.setState({"movies": {}})
        fetch("/api/movie/search?title="+txt)
        .then(r => r.json())
        .then(jsonResp => {
            if(!jsonResp.status)
                return;

            console.log(jsonResp);
            let movies = [];
            this.setState({"movies": jsonResp.response});
        }).catch(e => console.log(e));
    }


    render() {
        return ( 
            <div class="container">

                <div className="active-cyan-3 active-cyan-4 mb-4">
                    <input className="form-control" type="text" placeholder="Search" aria-label="Search" onChange={this.handleChange}/>
                </div>
                <MoviesList {...{"movies" : this.state.movies}}/>
            </div>
        );
    }
}