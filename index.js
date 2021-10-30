const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

handlebars = exphbs.create({
    defaultLayout: 'main',
    extname: '.html'
});

app.engine('html', handlebars.engine);
app.set('view engine', 'html');

app.get('/', (req, res) => {
    let d = new Date();
    res.render('index', {
        loggedIn: true,
        restaurant1: "Cava",
        restaurant2: "Chipotle",
        restaurant3: "Sweetgreen",
        date: d.toDateString(),
        layout: false
    });
});

app.get('/preferences', (req, res) => {
    res.render('preferences', {layout: false});
});

app.engine('html', handlebars.engine);
app.set('view engine', 'html');

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
}); 