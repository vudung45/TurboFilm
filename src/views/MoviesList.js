import React from 'react';
import { Link } from "react-router-dom";
class MovieBox extends React.Component {
    constructor(props) {
        super(props);
    }


    render(){
        console.log(this.props)
        return (<div class="card mb-4" style={{"width" : "18rem"}}>
              <img class="card-img-top" src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/1024px-No_image_available.svg.png" alt="Card image cap"/>
              <div class="card-body">
                <h5 class="card-title">{this.props.title}</h5>  
                <h6 class="card-title">{this.props.title_vietnamese}</h6>  
                <Link to={{pathname: '/movie',
                           movieId: this.props._id}} className="btn btn-primary">Watch</Link>
              </div>
              </div> );
    }
}


export default class MoviesList extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    componentDidMount() {

    }

    render() {
        let movieboxes = Object.keys(this.props.movies).map(k => {
            return (<div key={k} className="col-md-4"><MovieBox key={k} {...this.props.movies[k]} /></div>)
        })
        return (<div>
                <div class="card-deck">
                    <div className="row">
                       {movieboxes}
                    </div>
                </div>
            </div>)
    }

}
