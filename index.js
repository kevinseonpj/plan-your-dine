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
        if (req.user.prefs) {
            let rankResult = await sortMenu.rankUser(req.user, req.session.userId);
            res.render('postlogin', {
                name: req.user.first_name,
                date: d.toDateString(),
                layout: false,
                restaurant1: rankResult[0].name,
                restaurant2: rankResult[1].name,
                restaurant3: rankResult[2].name,
                dish1: rankResult[0].item,
                dish2: rankResult[1].item,
                dish3: rankResult[2].item,
                prefsSet: true
            });
        } else {
            res.render('postlogin', {
                name: req.user.first_name,
                date: d.toDateString(),
                layout: false,
                prefsSet: false
            });
        }
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

function makeid(length) {
    let result = '';
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    for (let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

app.post("/group_link", async (req, res) => {    
    let code = makeid(5);
    const groupRes = await db.collection('Groups').add({
        code: code,
        users: [req.session.userId]
    });

    const userRef = await db.collection('Users').doc(req.session.userId);
    await userRef.update({
        groupCode: code
    });
    const userDoc = await userRef.get();
    req.user = userDoc.data();

    res.redirect('/group_code');
});

app.post("/join_group", async (req, res) => {
    const groupsRef = db.collection('Groups');
    const snapshot = await groupsRef.where('code', '==', req.body.code).get();

    if (snapshot.empty) {
        res.json({"error" : "The GroupCode is Invalid"});
    } else {
        const groupDoc = snapshot.docs[0];
        // get user array
        const group = groupDoc.data();
        group.users.push(req.session.userId);
        // and then push the updated array
        const groupRef = await db.collection('Groups').doc(groupDoc.id);
        await groupRef.update({
            users: group.users
        });

        const userRef = await db.collection('Users').doc(req.session.userId);
        await userRef.update({
            groupCode: req.body.code
        });
        const userDoc = await userRef.get();
        req.user = userDoc.data();

        res.redirect('/my_group');
    }
});

app.get('/my_group', async (req, res) => {
    if (req.user) {
        database.scrapeMenus();

        const usersRef = db.collection('Users');
        const snapshot = await usersRef.where('groupCode', '==', req.user.groupCode).get();
        
        if (snapshot.empty) {
            res.json({"error" : "No users found in group"});
        } else {
            let userCount = 0;
            let avgKin = 0;
            let avgJCL = 0;
            let avgJ2 = 0;
            // for all the users with this groupCodes
            for (let i = 0; i < snapshot.docs.length; i++) {
                const user = snapshot.docs[i].data();
                if (user.prefs) {
                    userCount++;
                    avgKin += user.rankingKin;
                    avgJCL += user.rankingJCL;
                    avgJ2 += user.rankingJ2;
                }
            }
            if (userCount != 0){
                avgKin /= userCount;
                avgJCL /= userCount;
                avgJ2 /= userCount;
            } else {
                res.render('my_group', {
                    group1: "Undetermined",
                    group2: "Undetermined",
                    group3: "Undetermined",
                    layout: false
                });
            }

            // Now sort the menu rankings
            let diningHalls = [
                {
                    name: "Kins",
                    rank: avgKin,
                },
                {
                    name: "J2",
                    rank: avgJ2,
                },
                {
                    name: "JCL",
                    rank: avgJCL,
                }
            ];
            
            diningHalls.sort(function(x, y) {
                if (x.rank < y.rank) {
                  return 1;
                }
                if (x.rank > y.rank) {
                  return -1;
                }
                return 0;
            });

            res.render('my_group', {
                group1: diningHalls[0].name,
                group2: diningHalls[1].name,
                group3: diningHalls[2].name,
                layout: false
            });
        }
    } else {
        res.redirect('/login');
    }
});

app.get('/group_code', (req, res) => {
    if (req.user) {
        res.render('group_code', {
            layout: false,
            code: req.user.groupCode
        });
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
                first_name: req.body.first_name,
                last_name: req.body.last_name,
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