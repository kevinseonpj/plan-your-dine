const axios = require('axios');
const cheerio = require('cheerio');

class Food {
    constructor(name) {
        this.name = name;
        this.setCats(false, false, false, false, false, false, false, false, false, false, false, false, false);
    }

    setCats(beef, egg, fish, milk, peanuts, pork, shellfish, 
            soy, treenuts, vegan, vegetarian, wheat, halal) {
        this.beef = beef;
        this.egg = egg;
        this.fish = fish;
        this.milk = milk;
        this.peanuts = peanuts;
        this.pork = pork;
        this.shellfish = shellfish;
        this.soy = soy;
        this.treenuts = treenuts;
        this.vegan = vegan;
        this.vegetarian = vegetarian;
        this.wheat = wheat;
        this.halal = halal;
    }
}

// For Kins
async function getDiningHallFoods(url) {
    let response = await axios.get(url);
    const $ = cheerio.load(response.data);
    let items = $(".shortmenurecipes");

    var foodArr = [];
    for (let i = 0; i < items.length; i++) {
        // new food object 
        let newFood = new Food($(items[i]).text());
        let cats = $(items[i]).parent().siblings().children();
        for (let j = 0; j < cats.length; j++) {
            // get each of the category types (from image)
            let cat = $(cats[j]).attr("src").split("/").pop().split(".")[0];
            if (cat == "Beef") {
                newFood.beef = true;
            } else if (cat == "Eggs") {
                newFood.egg = true;
            } else if (cat == "Fish") {
                newFood.fish = true;
            } else if (cat == "Milk") {
                newFood.milk = true;
            } else if (cat == "Peanuts") {
                newFood.peanuts = true;
            } else if (cat == "Pork") {
                newFood.pork = true;
            } else if (cat == "Shellfish") {
                newFood.egg = true;
            } else if (cat == "Soy") {
                newFood.soy = true;
            } else if (cat == "Tree_Nuts") {
                newFood.treenuts = true;
            } else if (cat == "Vegan") {
                newFood.vegan = true;
            } else if (cat == "Veggie") {
                newFood.vegetarian = true;
            } else if (cat == "Wheat") {
                newFood.wheat = true;
            } else if (cat == "Halal") {
                newFood.halal = true;
            }
        }
        foodArr.push(JSON.stringify(newFood));
    }
    return foodArr;
}

// For J2 and JCL
async function getDiningHallFoodsJ(url) {
    // Kins Menus
    let response = await axios.get(url);
    const $ = cheerio.load(response.data);
    let items = $(".shortmenucats, .shortmenurecipes");
    let jclFood = [];
    let j2Food = [];
    
    let type; // values: both, jcl, j2
    for (let i = 0; i < items.length; i++) {
        if ($(items[i]).text().includes("--")) {
            if ($(items[i]).text().includes("JCL")) {
                type = "jcl";
            } else if ($(items[i]).text().includes("J2")) {
                type = "j2";
            } else {
                type = "both";
            }
            continue;
        }
        
        // new food object 
        let newFood = new Food($(items[i]).text());
        let cats = $(items[i]).parent().siblings().children();
        for (let j = 0; j < cats.length; j++) {
            // get each of the category types (from image)
            let cat = $(cats[j]).attr("src").split("/").pop().split(".")[0];
            if (cat == "Beef") {
                newFood.beef = true;
            } else if (cat == "Eggs") {
                newFood.egg = true;
            } else if (cat == "Fish") {
                newFood.fish = true;
            } else if (cat == "Milk") {
                newFood.milk = true;
            } else if (cat == "Peanuts") {
                newFood.peanuts = true;
            } else if (cat == "Pork") {
                newFood.pork = true;
            } else if (cat == "Shellfish") {
                newFood.egg = true;
            } else if (cat == "Soy") {
                newFood.soy = true;
            } else if (cat == "Tree_Nuts") {
                newFood.treenuts = true;
            } else if (cat == "Vegan") {
                newFood.vegan = true;
            } else if (cat == "Veggie") {
                newFood.vegetarian = true;
            } else if (cat == "Wheat") {
                newFood.wheat = true;
            } else if (cat == "Halal") {
                newFood.halal = true;
            }
        }
        if (type == "j2") {
            j2Food.push(JSON.stringify(newFood));
        } else if (type == "jcl") {
            jclFood.push(JSON.stringify(newFood));
        } else {
            j2Food.push(JSON.stringify(newFood));
            jclFood.push(JSON.stringify(newFood));
        }
    }

    return {
        jclFood: jclFood,
        j2Food: j2Food
    }
}

module.exports = {
    getDiningHallFoods,
    getDiningHallFoodsJ
}