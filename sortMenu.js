const database = require('./database.js');
const db = database.db;

async function rankUser(user, userId) {
    let rankKin = 0;
    let rankJCL = 0;
    let rankJ2 = 0;
    let prefs = user.prefs;
    let ogTypes = ["beef", "egg", "fish", "milk", "peanuts", "pork", "shellfish", "soy", "treenuts", "vegan", "vegetarian", "wheat", "halal"]
    let ogPrefs = [];
    let menuKin = [];
    let menuJCL = [];
    let menuJ2 = [];

    for (let k = 0; k < prefs.length; k++) {
        if (ogTypes.includes(prefs[k])) {
            ogPrefs.push(prefs[k]);
        }
    }
    
    //---------------------------------------------------------
    // get the actual data from DB for kins and parse
    const kinsRef = await db.collection('Restaurants').doc('Kins');
    const kinsDoc = await kinsRef.get();
    const kinsFood = kinsDoc.data().foods;
    for (let i = kinsFood.length - 1; i >= 0; i--) {
        let foodItem = JSON.parse(kinsFood[i]);
        for (let j = 0; j < ogPrefs.length; j++) {
            // see if the dish matches one of the category
            if (foodItem[ogPrefs[j]]) {
                rankKin++;
                // console.log("\nRemoving because contains: " + ogPrefs[j]);
                // console.log(kinsFood[i]);
                kinsFood.splice(i, 1);
                break;
            }
        }
    }

    for (let i = 0; i < kinsFood.length; i++) {
        let foodItem = JSON.parse(kinsFood[i]);
        for (let j = 0; j < prefs.length; j++) {
            // see if string contain
            if (foodItem.name.toLowerCase().includes(prefs[j].toLowerCase())) {
                rankKin += 5;
                if (!menuKin.includes(foodItem.name)) menuKin.push(foodItem.name);

                // console.log("\nAdding point because contains: " + prefs[j]);
                // console.log(kinsFood[i]);
                break;
            }
        }
    }

    //---------------------------------------------------------
    // get the actual data from DB for jcl and parse
    const jclRef = await db.collection('Restaurants').doc('JCL');
    const jclDoc = await jclRef.get();
    const jclFood = jclDoc.data().foods;
    for (let i = jclFood.length - 1; i >= 0; i--) {
        let foodItem = JSON.parse(jclFood[i]);
        for (let j = 0; j < ogPrefs.length; j++) {
            // see if the dish matches one of the category
            if (foodItem[ogPrefs[j]]) {
                rankJCL++;
                // console.log("\nRemoving because contains: " + ogPrefs[j]);
                // console.log(jclFood[i]);
                jclFood.splice(i, 1);
                break;
            }
        }
    }

    for (let i = 0; i < jclFood.length; i++) {
        let foodItem = JSON.parse(jclFood[i]);
        for (let j = 0; j < prefs.length; j++) {
            // see if string contain
            if (foodItem.name.toLowerCase().includes(prefs[j].toLowerCase())) {
                rankJCL += 5;
                if (!menuJCL.includes(foodItem.name)) menuJCL.push(foodItem.name);
                // console.log("\nAdding point because contains: " + prefs[j]);
                // console.log(jclFood[i]);
                break;
            }
        }
    }

    //---------------------------------------------------------
    // get the actual data from DB for j2 and parse
    const j2Ref = await db.collection('Restaurants').doc('J2');
    const j2Doc = await j2Ref.get();
    const j2Food = j2Doc.data().foods;
    for (let i = j2Food.length - 1; i >= 0; i--) {
        let foodItem = JSON.parse(j2Food[i]);
        for (let j = 0; j < ogPrefs.length; j++) {
            // see if the dish matches one of the category
            if (foodItem[ogPrefs[j]]) {
                rankJ2++;
                // console.log("\nRemoving because contains: " + ogPrefs[j]);
                // console.log(j2Food[i]);
                j2Food.splice(i, 1);
                break;
            }
        }
    }

    for (let i = 0; i < j2Food.length; i++) {
        let foodItem = JSON.parse(j2Food[i]);
        for (let j = 0; j < prefs.length; j++) {
            // see if string contain
            if (foodItem.name.toLowerCase().includes(prefs[j].toLowerCase())) {
                rankJ2 += 5;
                if (!menuJ2.includes(foodItem.name)) menuJ2.push(foodItem.name);
                // console.log("\nAdding point because contains: " + prefs[j]);
                // console.log(j2Food[i]);
                break;
            }
        }
    }

    let itemKins = menuKin[Math.floor(Math.random()*menuKin.length)];
    let itemJCL = menuJCL[Math.floor(Math.random()*menuJCL.length)];
    let itemJ2 = menuJ2[Math.floor(Math.random()*menuJ2.length)];

    let diningHalls = [
        {
            name: "Kins",
            rank: rankKin,
            item: itemKins
        },
        {
            name: "J2",
            rank: rankJ2,
            item: itemJ2
        },
        {
            name: "JCL",
            rank: rankJCL,
            item: itemJCL
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

    // you don't reaaaaaaaaaaaaaaaaally need to store it if you reallly think about it, but... it's cooler and memory is cheap!
    const userRef = await db.collection('Users').doc(userId);
    await userRef.update({
        rankingKin: rankKin,
        rankingJCL: rankJCL,
        rankingJ2: rankJ2,
        menuKin: menuKin,
        menuJCL: menuJCL,
        menuJ2: menuJ2
    });
    
    return diningHalls;
}

module.exports = {
    rankUser
}