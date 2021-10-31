const grabMenu = require('./grabMenu.js');
// const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
// const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
// const serviceAccount = require("./plan-your-dine-firebase-adminsdk-9xve9-f27aa4313f.json");
// const { testElement } = require('domutils');
// initializeApp({
//     credential: cert(serviceAccount)
// });
// const db = getFirestore();

async function scrapeMenus() {
    const timeRef = await db.collection('Restaurants').doc('LastUpdated');
    const timeDoc = await timeRef.get();
    const lastUpdated = timeDoc.data().time.toDate();
    lastUpdated.setHours(0, 0, 0, 0);
    const timeNow = new Date();
    timeNow.setHours(0, 0, 0, 0);
    if (timeNow > lastUpdated) {
        await timeRef.set({
            time: new Date()
        });
        
        // set the menus for each Restaurants
        const kinsRef = await db.collection('Restaurants').doc('Kins');
        let kinsFood = await grabMenu.getDiningHallFoods("http://hf-food.austin.utexas.edu/foodpro/shortmenu.aspx?sName=University+Housing+and+Dining&locationNum=03&locationName=Kins+Dining&naFlag=1");
        // console.log(kinsFood);
        await kinsRef.set({
            foods: kinsFood
        });
        
        let jFood = await grabMenu.getDiningHallFoodsJ("http://hf-food.austin.utexas.edu/foodpro/shortmenu.aspx?sName=University+Housing+and+Dining&locationNum=12&locationName=Jester+Dining%3a+J2+%26+JCL&naFlag=1");
        
        const jclRef = await db.collection('Restaurants').doc('JCL');
        await jclRef.set({
            foods: jFood.jclFood
        });

        const j2Ref = await db.collection('Restaurants').doc('J2');
        await j2Ref.set({
            foods: jFood.j2Food
        });
    }
}

