import React from 'react';
import logo from './logo.svg';
import './App.css';
import Search from "./views/Search.js"
import { Router, Route, Switch } from "react-router";

function App() {
  return (
    <div className="App">
       <Search/>
    </div>
  );
}

export default App;
