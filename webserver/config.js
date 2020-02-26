

module.exports = function(){
    switch(process.env.NODE_ENV){
        case 'dev':
            return {
                MOVIE_DIRECTORY_API: "http://127.0.0.1:5002",
                MEDIA_EXTRACTOR_API: "http://127.0.0.1:5001"
            };

        default: // prod
            return {
                MOVIE_DIRECTORY_API: process.env.MOVIE_DIRECTORY_API ? process.env.MOVIE_DIRECTORY_API : "https://moviescraper123.herokuapp.com",
                MEDIA_EXTRACTOR_API: process.env.MEDIA_EXTRACTOR_API ? process.env.MEDIA_EXTRACTOR_API : "https://mediaextractor.herokuapp.com"
            };
    }
}();