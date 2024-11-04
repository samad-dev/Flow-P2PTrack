// const express = require('express');
// const path = require('path');
// const fs = require('fs');
// const mysql = require('mysql');

// const app = express();
// const port = 3000;

// // Create a connection object with the database configuration
// const db = mysql.createConnection({
//     host: 'localhost',    // Your MySQL server hostname or IP address
//     user: 'root', // Your MySQL username
//     password: '', // Your MySQL password
//     database: 'shell' // The name of the database you want to connect to
// });

// // Connect to the database
// db.connect((err) => {
//     if (err) {
//         console.error('Error connecting to the database:', err.stack);
//         return;
//     }
//     console.log('Connected to the database with ID:', db.threadId);
// });

// // Define your route



// // Start the server
// app.listen(port, () => {
//     console.log(`Server running on port ${port}`);
// });



// const route = require('./routes/route');
// const expressLayouts = require('express-ejs-layouts');
// const session = require('express-session');
// const cookieParser = require('cookie-parser');
// // const upload = require('express-fileupload');
// const dotenv = require('dotenv');
// dotenv.config({ path: "./config.env" });

// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));
// // app.use(upload());

// app.use(express.json());
// app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
// app.use(cookieParser());

// app.set('layout', 'partials/layout-vertical');
// app.use(expressLayouts);

// app.use(express.static(__dirname + '/public'));

// app.use('/', route);

// app.use((err, req, res, next) => {
//     let error = { ...err }
//     if (error.name === 'JsonWebTokenError') {
//         err.message = "please login again";
//         err.statusCode = 401;
//         return res.status(401).redirect('view/login');
//     }
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'errors';

//     res.status(err.statusCode).json({
//         status: err.status,
//         message: err.message,

//     })
// });

// const http = require("http").createServer(app);
// http.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));





const express = require('express');
const app = express();
const path = require('path');
const route = require('./routes/route');
const expressLayouts = require('express-ejs-layouts');
// const session = require('express-session');
const cookieSession = require('cookie-session')
const cookieParser = require('cookie-parser');
const upload = require('express-fileupload');
const dotenv = require('dotenv');
dotenv.config({ path: "./config.env" });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(upload({
    useTempFiles : true,
    tempFileDir : '/tmp/'
}));




app.use(express.json());
app.use(cookieSession({
    name: 'session',
    keys: ['Samad123'],  // Used to sign and encrypt the session cookie
    maxAge: 24 * 60 * 60 * 1000  // Cookie will expire after 24 hours
  }));
// app.use(session({ resave: false, saveUninitialized: true, secret: 'nodedemo' }));
app.use(cookieParser());

app.set('layout', 'partials/layout-vertical');
app.use(expressLayouts);

app.use(express.static(__dirname + '/public'));

app.use('/', route);

app.use((err, req, res, next) => {
    let error = { ...err }
    if (error.name === 'JsonWebTokenError') {
        err.message = "please login again";
        err.statusCode = 401;
        return res.status(401).redirect('view/login');
    }
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'errors';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,

    })
});

const http = require("http").createServer(app);
http.listen(process.env.PORT, () => console.log(`Server running on port ${process.env.PORT}`));