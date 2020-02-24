import express from "express";
import CONFIG from "../../config.js"
import request from "request-promise";

const router = express.Router()

function raiseForStatus(resp, res) {
    if(resp.statusCode >= 400) {
        res.status(resp.statusCode).json({
            status: 0,
            error: "Something went wrong!"
        });
        return true;
    }
    return false;
}

// Get Movies
router.get("/search", async (req, res) => {
    try  {
        if(req.query.title){
            let apiResp = await request({
                "uri": CONFIG.MOVIE_DIRECTORY_API+`/search?title=${encodeURIComponent(req.query.title)}`,
                "method": "GET",
                "header": {
                    "Content-Type": "application/json"
                },
                resolveWithFullResponse: true  
            });
            if(raiseForStatus(apiResp, res))
                return;

            res.json({
                status: 1,
                response: JSON.parse(apiResp.body).response
            });
        } else {
            res.status(501).json({
                status: 0,
                error: "Missing arguments"
            });
        }

    } catch (e) {
        console.log(e);
        res.status(500).json({
            status: 0,
            error: "Something went wrong!"
        });
    }
});


router.get("/info", async (req, res) => {
    let apiOpts = null;
    if(req.query.movieId) 
        apiOpts =  `movieId=${req.query.movieId}`
    else if(req.query.instanceId)
        apiOpts =  `instanceId=${req.query.instanceId}`
    else {
        res.status(501).json({
            status: 0,
            error: "Missing arguments"
        });
        return;
    } 

    try {
        let apiResp = await request({
            "uri": CONFIG.MOVIE_DIRECTORY_API+`/info?${apiOpts}`, 
            "method": "GET",
            "header": {
                "Content-Type": "application/json"
            },
             resolveWithFullResponse: true  
        });

        if(raiseForStatus(apiResp, res))
            return;

        let jsonResp = JSON.parse(apiResp.body).response;
        res.json({
            status: 1,
            response: jsonResp
        });

    } catch (e){
        console.log(e);
        res.status(500).json({
            status: 0,
            error: "Something went wrong!"
        });
    }
});

router.get("/episodes", async (req, res) => {
    let apiOpts = null;
    if(req.query.movieId) 
        apiOpts =  `movieId=${req.query.movieId}`
    else if(req.query.instanceId)
        apiOpts =  `instanceId=${req.query.instanceId}`
    else {
        res.status(501).json({
            status: 0,
            error: "Missing arguments"
        });
        return;
    } 

    try {
        let apiResp = await request({
            "uri": CONFIG.MOVIE_DIRECTORY_API+`/episodes?${apiOpts}`,
            "method": "GET",
            "header": {
                "Content-Type": "application/json"
            },
            resolveWithFullResponse: true  
        });
        if(raiseForStatus(apiResp, res))
            return;

        let jsonResp = JSON.parse(apiResp.body).response;

        //hide the actual movie urls from user
        Object.keys(jsonResp).forEach(origin => {
            let obfs = jsonResp[origin].episodes.map( m => {return Object.keys(m)[0]})
            console.log(obfs);
            jsonResp[origin] = {
                ...jsonResp[origin],
                episodes: obfs
            };
        });
        res.json({
            status: 1,
            response: jsonResp
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            status: 0,
            error: "Something went wrong!"
        });
    }
});

async function getMediaSource(url) { 
    let apiResp = await request({
            "uri": CONFIG.MEDIA_EXTRACTOR_API+`/api/getmedia?url=${url}`,
            "method": "GET",
            "header": {
                "Content-Type": "application/json"
            },
            resolveWithFullResponse: true  
    });
    
    let jsonResp = JSON.parse(apiResp.body).response
    return jsonResp;
}

router.get("/getEpisodeMedia", async (req, res) => {
    let ep = -1;
    let instanceId = null;
    if(req.query.instanceId && req.query.ep) {
        ep = Math.max(0,parseInt(req.query.ep));
        instanceId = req.query.instanceId
    } else {
        res.status(501).json({
            status: 0,
            error: "Missing arguments"
        });
        return;
    } 
    let apiOpts = "instanceId="+instanceId;
    try {
        let apiResp = await request({
            "uri": CONFIG.MOVIE_DIRECTORY_API+`/episodes?${apiOpts}`,
            "method": "GET",
            "header": {
                "Content-Type": "application/json"
            },
            resolveWithFullResponse: true  
        });
        if(raiseForStatus(apiResp, res))
            return;
        console.log(apiResp);
        let jsonResp = JSON.parse(apiResp.body).response;
        let episodesUrls = jsonResp[Object.keys(jsonResp)[0]].episodes;
        if(ep >= episodesUrls.length) {
            res.status(501).json({
                status: 1,
                error: "Such episode doesn't exist"
            });
        }
        let requestingEp = Object.values(episodesUrls[ep])[0];

        //request to media extractor service
        res.json({
            status: 1,
            response: await getMediaSource(requestingEp)
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            status: 0,
            error: "Something went wrong!"
        });
    }

});


module.exports = router;
