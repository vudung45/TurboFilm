// for ES6 async await compatiability //
const express = require("express");
const CONFIG = require("./src/config.js");
const proxy = require('http-proxy-middleware');
const path = require('path');
const serveStatic = require('serve-static')


const app = express({ strict: true })
app.enable('strict routing');

app.use(serveStatic(__dirname+'/build'));
app.use(
    '/api',
    proxy.createProxyMiddleware({
      target: CONFIG.API_SERVER,
      changeOrigin: true,
    })
  );
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname,'./build/index.html'));
});



const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server started on port ${port}`))
