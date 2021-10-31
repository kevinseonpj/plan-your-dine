const express = require('express');
const exphbs = require('express-handlebars');

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const serviceAccount = require("./plan-your-dine-firebase-adminsdk-9xve9-f27aa4313f.json");
const { testElement } = require('domutils');
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
// Set up cookies
app.use(session({
    name: 'server-session-cookie-id',
    secret: 'super safe secret',
    saveUninitialized: false,
    resave: false,
    cookie: {
       maxAge: 3600000 * 24 * 7 * 2 // 2 weeks
    }
}));

// Easy access to user and user updated when fields updated
app.use(async (req, res, next) => {
    if (req.session.userId) {
        const userDoc = await db.collection('Users').doc(req.session.userId).get();
        const user = userDoc.data();
        user.password = null;
        delete user.password;
        req.user = user;
        return next();
    } else {
       return next();
    }
});

// Middleware
function requireLogin(req, res, next) {
    if(req.session && req.session.userId) {
        return next();
    }
    else {
        var err = new Error('You must be logged in to view this page.');
        err.status = 400;
        return next(err);
    }
}

handlebars = exphbs.create({
    defaultLayout: 'main',
    extname: '.html'
});

app.engine('html', handlebars.engine);
app.set('view engine', 'html');

app.get('/', (req, res) => {
    let d = new Date();
    const email = req.user ? req.user.email: "None";
    res.render('index', {
        loggedIn: true,
        restaurant1: "Cava",
        restaurant2: "Chipotle",
        restaurant3: "Sweetgreen",
        date: d.toDateString(),
        email: email,
        layout: false
    });
});

app.get('/preferences', (req, res) => {
    res.render('preferences', {layout: false});
});

app.get('/postlogin', (req, res) => {
    res.render('postlogin', {layout: false});
});

app.get('/login', (req, res) => {
    res.render('login', {layout: false});
});

app.get('/registration', (req, res) => {
    res.render('registration', {layout: false});
});

app.get('/group_link', (req, res) => {
    res.render('group_link', {layout: false});
});

app.get('/my_group', (req, res) => {
    res.render('my_group', {layout: false});
});

app.get('/group_code', (req, res) => {
    res.render('group_code', {layout: false});
});

app.post('/register', async (req, res) => {
    if(req.user) res.json({"error" : "user already logged in"});
    
    const usersRef = db.collection('Users');
    const snapshot = await usersRef.where('email', '==', req.body.email).get();

    if (!snapshot.empty) {
        res.json({"error" : "email already in use"});
    } else {
        bcrypt.hash(req.body.password, 12, async (err, hash) => {
            const userRes = await db.collection('Users').add({
                email: req.body.email,
                password: hash
            });
            req.session.userId = userRes.id;
            req.session.save();
            res.redirect("/");
        });
    }
});

app.post('/login', async (req, res) => {
    const userRef = db.collection('Users');
    const snapshot = await userRef.where('email', '==', req.body.email).get();

    if (snapshot.empty) {
        res.status(400).json({"error" : "invalid login"});
    } else {
        const userDoc = snapshot.docs[0];
        const user = userDoc.data();
        bcrypt.compare(req.body.password, user.password, (err, match) => {
            if(err) console.log(err);
            else if(match) {
                req.session.userId = userDoc.id;
                req.session.save();
                res.redirect("/");
                return;
            } else {
                res.status(400).json({"error" : "invalid login"});
            }
        })
    }
});

app.get('/logout', (req, res, next) => {
    if(req.session) {
        req.session.destroy((err) => {
            if(err) {
                next(err);
            }
            else {
                return res.redirect('/')
            }
        });
    }
});

app.engine('html', handlebars.engine);
app.set('view engine', 'html');

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
}); 