const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://tommy:27Leviathan_91@tommycluster-yfhlt.gcp.mongodb.net/jc8Mongoose?retryWrites=true', { // Generate connection to database
    useNewUrlParser: true, // Parsing URL to the form mongodb needs
    useCreateIndex: true, // Auto generate Indexes from mongodb, to get access to the data
    useFindAndModify: false //  deprecated
})