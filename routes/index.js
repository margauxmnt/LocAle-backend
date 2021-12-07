var express = require('express');
var router = express.Router();
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const beerModel = require('../model/beers');
const userModel = require('../model/users');
const sellerModel = require('../model/sellers');
const noteModel = require('../model/notes');


function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1); 
  var a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ; 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


router.get('/get-breweries', async (req, res) => {

    /* Le backend reçois la position de l'utilisateur et le token s'il est déjà connecté
   * Si la position est valide on recherche dans la base de donnée les revendeurs de type brasserie
   * en fonction de la position de l'utilisateur on ne renvoie que les brasserie à moins de 20 km
   * - Si l'utilisateur est connecté, on renvoie ses données
   * - Sinon si la geoloc est ok on renvoie les brasseries
   * - sinon message d'erreur
   */

  //récupération de la position de l'utilisateur depuis le front
  let position = JSON.parse(req.query.position);
  if (position) {
    //récupération des brasseries de la base de données
    let breweries = await sellerModel.find({ type: "brewery" });
    let localBreweries = [];
    // calcul des brasseries à moins de 20 kms de l'utilisateur
    for (let i = 0; i < breweries.length; i++) {
      const d = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, breweries[i].latitude, breweries[i].longitude);
      if (d <= 25) {
        localBreweries.push({brewerie: breweries[i], distance: d});
      }
    };
    //tri du tableau des brasseries de la plus proche à la moins proche
    localBreweries.sort((a, b) => a.distance - b.distance);

    // ci-dessous condition token à modifier lors de l'intégration de la connection de l'utilisateur
    req.query.token == 15115 ?
      res.json({ message: true, breweries : localBreweries, user: {}, text: 'utilisateur connecté' }) :
      res.json({ message: true, breweries : localBreweries, text: "pas d'utilisateur" })
  } else res.json({ message: false, text: 'geoloc non acceptée' })
})


router.get('/get-beers', async (req, res) => {
  let brewery = req.query.brewery

  /**le backend reçois un nom de brasserie
   * retrouve dans la DB la brasserie en question 
   * regarde dans les bières de la brasserie et les renvoie au front
   * renvoie les notes dans redux
   */

  brewery ? res.json({ message: true, beers: [], notes: [] }) : res.json({ message: false })
})


router.get('/get-sellers/:position/:id', async (req, res) => {

  const position = JSON.parse(req.params.position)
  const sellerOk = [];
  const sellers = await sellerModel.find().populate('stock');


  for (let i = 0; i < sellers.length; i++) {
    const d = getDistanceFromLatLonInKm(position.latitude, position.longitude, sellers[i].latitude, sellers[i].longitude)
    
    if(d <= 20){ // si c'est à moins de 20 km
      sellers[i].stock.forEach(el => {
        if (el.id === req.params.id) sellerOk.push(sellers[i])
      })
    }    
  }

  /**le backend reçois la position de l'utilisateur et la bière sélectionnée
   * récupère dans la DB tout les revendeurs, les trie en fonction de ceux qui ont la bière en stock
   * renvoie au front ces vendeurs en question 
   */

  res.json({ sellers: sellerOk })
})


router.get('/get-beers-n-notes', (req, res) => {

  /**récupère en DB les bières et les notes 
   * les renvoies au front 
   */

  res.json({ message: true, beers: [], notes: [] })
})




// --- ROUTE POUR AJOUTER EN DB --- //


// router.get('/update-brewery', async (req, res) => {
//   const seller = await sellerModel.findOne({name: 'DEMI-LUNE Brasserie'});
//   const beers = await beerModel.find();
//   beers.forEach(el => seller.stock.push(el.id))
//   await seller.save();
//   res.json({seller})
// })

// router.get('/add-note', async (req, res) => {
//   const user = await userModel.findOne({pseudo: 'Matetlot'})
//   const beer = await beerModel.findOne({name: 'Promenade des Tuileries'})

//   const newNote = new noteModel({
//     note: 3, 
//     comment: 'Une super bière de caractère.',
//     owner: user.id,
//     beer: beer.id,
//   })
//   user.notes.push(newNote.id)
//   beer.notes.push(newNote.id)

//   await user.save();
//   await beer.save();
//   await newNote.save();

//   res.json({newNote})
// })

// router.get('/add-user', async (req, res) => {
//   const newUser = new userModel({
//     pseudo: 'Matetlot',
//     token: uid2(32),
//     email: 'mat@gmail.com',
//     password: bcrypt.hashSync('admin', 10),
//     insert_date: new Date,
//   })
//   const user = newUser.save()
//   res.json({user})
// })

// router.get('/add-beer', async (req, res) => {
//   const newBeer = new beerModel({
//     name: "l'Iconoclaste",
//     slogan: "L’amertume est prononcée comme il se doit et les saveurs tournent autour des agrumes.",
//     alcool: 5.6,
//     type: 'Indian Pale Ale',
//     picture: 'https://www.domainedumanchot.com/wp-content/uploads/2021/01/LICONOCLASTE-Biere-du-MANCHOT.jpg'
//   })
//   const beer = await newBeer.save()
//   res.json({beer})
// })

// router.get('/add-brewery', async (req, res) => {
//   const beer1 = await beerModel.findById('61ac6550e1cc446be11f5230')
//   const beer2 = await beerModel.findById('61ac6550e1cc446be11f5230')
//   const beer3 = await beerModel.findById('61ac6484ea5d3f555016db0a')
//   const beer4 = await beerModel.findById('61ac64302f7879254145d955')
//   const newSeller = new sellerModel({
//     type: 'shop',
//     name: "VSOP Gourmet",
//     description: "",
//     adress: "35 Rue du Pont, 69390 Vernaison",
//     latitude: 45.6476243,
//     longitude: 4.8123745,
//     website: 'http://www.vsop-gourmet.fr/',
//     stock: [beer1.id, beer2.id, beer3.id, beer4.id],
//     pictures: [],
//     hours: [
//       {
//         day: 0,
//         openings: '10h - 12h'
//       },
//       {
//         day: 1,
//         openings: 'Fermé'
//       },
//       {
//         day: 2,
//         openings: '9h - 12h30 / 15h30 - 19h'
//       },
//       {
//         day: 3,
//         openings: '9h - 12h30 / 15h30 - 19h'
//       },
//       {
//         day: 4,
//         openings: '9h - 12h30 / 15h30 - 19h'
//       },
//       {
//         day: 5,
//         openings: '9h - 12h30 / 15h30 - 21h'
//       },
//       {
//         day: 6,
//         openings: '9h - 13h / 15h30 - 19h'
//       },
//     ]
//   })
//   const seller = await newSeller.save();
//   res.json({seller})
// })



module.exports = router;
