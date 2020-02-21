import React from 'react';


export default class Search extends React.Component {
    constructor(props) {
        super(props)
        this.handleChange = this.handleChange.bind(this);
        this.processTextDelay = null;
        this.processText = this.processText.bind(this)
    }

    handleChange(event) {
        clearTimeout(this.processTextDelay)
        let value = event.target.value
        this.processTextDelay = setTimeout(() => {this.processText(value)}, 500)
    }  

    processText(txt) { 
        console.log(txt);
    }


    render() {
        return ( 
            <div className="active-cyan-3 active-cyan-4 mb-4">
                <input className="form-control" type="text" placeholder="Search" aria-label="Search" onChange={this.handleChange}/>
            </div>
        );
    }
}