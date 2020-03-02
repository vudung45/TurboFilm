import React from 'react';
import logo from './logo.svg';
import './App.css';
import Search from "./views/Search.js"
import Movie from "./views/Movie.js"
import NavBar from "./views/NavBar.js"
import { BrowserRouter as Router,
  Switch,
  Route,
  Link } from "react-router-dom";

function App() {
  return (
    <Router>
    <div className="App">
    <header>
        <NavBar/>
    </header>
    <div className="container">
 
       {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/movie/:id/:origin?/:episode?/:server?" component={Movie}>
          </Route>
          <Route path="/">
            <Search />
          </Route>
        </Switch>
    </div>
    </div>
    </Router>
  );
}

export default App;
