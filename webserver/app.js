// for ES6 async await compatiability //
const express = require("express");
const path = require('path');
const serveStatic = require('serve-static');
const movies = require("./routes/api/movie");

const app = express({ strict: true })
app.enable('strict routing');

app.use(serveStatic(path.join(__dirname,'../build')));
app.use("/api/movie", movies);
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname,'../build/index.html'));
});



const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server started on port ${port}`))
