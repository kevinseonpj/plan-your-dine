const express = require('express');
const exphbs = require('express-handlebars');

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const session = require('express-session');
const database = require('./database.js');
const sortMenu = require('./sortMenu.js');
const db = database.db;

const app = express();
const PORT = process.env.PORT || 3000;

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

app.get('/', async (req, res) => {
    database.scrapeMenus();
    let d = new Date();
    if (req.user) {
        const email = req.user ? req.user.email: "None";
        let rankResult = await sortMenu.rankUser(req.user, req.session.userId);

        res.render('postlogin', {
            email: email,
            date: d.toDateString(),
            layout: false,
            restaurant1: rankResult[0].name,
            restaurant2: rankResult[1].name,
            restaurant3: rankResult[2].name,
            dish1: rankResult[0].item,
            dish2: rankResult[1].item,
            dish3: rankResult[2].item
        });
    } else {
        res.render('index', {
            date: d.toDateString(),
            layout: false
        });
    }
});

app.get('/preferences', (req, res) => {
    if (req.user) {
        res.render('preferences', {prefs: req.user.prefs, layout: false});
    } else {
        res.redirect('/login');
    }
});

app.post('/preferences', async (req, res) => {
    delete req.body["action"];
    const foods = Object.keys(req.body);
    const userRef = await db.collection('Users').doc(req.session.userId);

    await userRef.update({
        prefs: foods
    });
    const userDoc = await userRef.get();
    req.user = userDoc.data();
    
    res.redirect("/preferences");
});

app.get('/login', (req, res) => {
    res.render('login', {layout: false});
});

app.get('/registration', (req, res) => {
    res.render('registration', {layout: false});
});

app.get('/group_link', (req, res) => {
    if (req.user) {
        res.render('group_link', {layout: false});
    } else {
        res.redirect('/login');
    }
});

app.get('/my_group', (req, res) => {
    if (req.user) {
        database.scrapeMenus();
        res.render('my_group', {layout: false});
    } else {
        res.redirect('/login');
    }
});

app.get('/group_code', (req, res) => {
    if (req.user) {
        res.render('group_code', {layout: false});
    } else {
        res.redirect('/login');
    }
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