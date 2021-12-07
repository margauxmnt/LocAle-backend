const mongoose = require('mongoose');

var options = {
    connectTimeoutMS: 5000,
    useNewUrlParser: true,
    useUnifiedTopology: true
}

// DB connection
mongoose.connect(process.env.CONNECT_DB,
    options,
    function (err) {
        console.log(err);
    }
);