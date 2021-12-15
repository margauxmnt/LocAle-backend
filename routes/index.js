var express = require('express');
var router = express.Router();
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const beerModel = require('../model/beers');
const userModel = require('../model/users');
const sellerModel = require('../model/sellers');
const noteModel = require('../model/notes');


router.get('/deletenotes', async (req, res) =>{
  await noteModel.deleteMany()
})


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

  const user = await userModel.findOne({token: req.query.token}).populate('wishlist');

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
    
    user ?
      res.json({ message: true, breweries : localBreweries, user: user, text: 'utilisateur connecté' }) :
      res.json({ message: true, breweries : localBreweries, text: "pas d'utilisateur" })
  } else res.json({ message: false, text: 'geoloc non acceptée' })
})


router.get('/get-beers/:breweryId', async (req, res) => {
  let breweryId = req.params.breweryId
  
  let sellers = await sellerModel.find({type: 'brewery'}).populate('stock');
  let beers = await beerModel.find().populate({path: 'notes', populate: {path:'owner'} });

  let stock;
  sellers.forEach(el => {
    if(el.id === breweryId) stock = el.stock
  })

  const beerWithNote = [];
  beers.forEach(el => {
    stock.forEach(e => {
      if(e.id === el.id) beerWithNote.push(el)
    })
  })

  res.json({beers: beerWithNote})
})


router.get('/get-sellers/:position/:id', async (req, res) => {

  const position = JSON.parse(req.params.position)
  const sellerOk = [];
  const sellers = await sellerModel.find().populate('stock').exec();

  for (let i = 0; i < sellers.length; i++) {
    const d = getDistanceFromLatLonInKm(position.latitude, position.longitude, sellers[i].latitude, sellers[i].longitude)

    if(d <= 26){ // si c'est à moins de 20 km
      sellers[i].stock.forEach(el => {
        if (el.id === req.params.id) sellerOk.push(sellers[i])
      })
    }    
  }

  res.json({ sellers: sellerOk })
})


router.get('/get-beers-n-notes', async (req, res) => {

  const breweries = await sellerModel.find({type: 'brewery'}).populate('stock');
  const beers = await beerModel.find().populate('notes');

  let datas = [];
  breweries.forEach((el, i) => datas.push({key: i, id: el.id, name: el.name, icon: ""}))
  beers.forEach((el, i) => {
    let brewery;
    breweries.forEach(e => {
      e.stock.forEach(ele => {
        if(ele.id === el.id) brewery = e.name;
      })
    })
    let avg = 0;
    el.notes.forEach(e => avg += e.note);
    if(el.notes !== 0) avg = avg / el.notes.length;
    datas.push({key: (i + breweries.length), id: el.id, name: el.name, icon: "", note: avg, brewery: brewery});
  })

  res.json(datas)
})


// récupère uniquement une bière via son ID 
router.get('/get-beer/:id', async (req, res) => {
  const beer = await beerModel.findById(req.params.id).populate({path: 'notes', populate: {path:'owner'} });
  res.json(beer);
})

// récupère uniquement une brasserie via son ID
router.get('/get-brewery/:id', async (req, res) => {
  const brewery = await sellerModel.findById(req.params.id);
  res.json(brewery)
})

// récupérer la brasserie qui a cette bière en stock 
// (quand on revient de la page bière vers la page liste)
router.get('/get-brewery-from-beer/:beerId', async (req, res) => {
  const brewery = await sellerModel.find({type: 'brewery'}).populate('stock')
  let selectBrewery;
  brewery.forEach(el => {
    el.stock.forEach(e => {
      if(e.id === req.params.beerId) selectBrewery = el
    })
  })
  
  res.json(selectBrewery)
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

router.get('/add-beer', async (req, res) => {
  const newBeer = new beerModel({
    name: "la Grand Cru Triple",
    slogan: "Doublement céréalée, triplement épicée... Simplement complexe ! La Grand Cru Triple vous fera voyager le temps d’une gorgée.",
    alcool: 9,
    type: 'Triple',
    picture: 'https://www.lasoyeuse.fr/wp-content/uploads/2020/06/GC-triple-1.jpg'
  })
  const beer = await newBeer.save()
  res.json({beer})
})

router.get('/add-brewery', async (req, res) => {
  const beer1 = await beerModel.findById('61ba074285b8a53fb6ed31b0')
  const beer2 = await beerModel.findById('61ba0789f6edad55bc485726')
  const beer3 = await beerModel.findById('61ba07ebd999a57f857ea300')
  const beer4 = await beerModel.findById('61ba082d88775e5c063d32dc')
  const beer5 = await beerModel.findById('61ba08d2d085926fc89cb253')
  const beer6 = await beerModel.findById('61ba09336dd04912599fcab3')
  const beer7 = await beerModel.findById('61ba099072f6ea2832a60635')
  const beer8 = await beerModel.findById('61ba09e30083d24b9927a5f7')
  const newSeller = new sellerModel({
    type: 'shop',
    name: "La Chaume",
    description: "",
    adress: "44 Gd Rue de Vaise, 69009 Lyon",
    latitude: 45.773807012370696,
    longitude: 4.808436001096112,
    website: 'http://www.lachaume-fromagerie.fr/',
    stock: [beer1.id, beer2.id, beer3.id, beer4.id, beer5.id, beer6.id, beer7.id, beer8.id],
    pictures: [],
    hours: [
      {
        day: 0,
        openings: '10h - 13h'
      },
      {
        day: 1,
        openings: '9h - 19h'
      },
      {
        day: 2,
        openings: '9h - 14h / 16h - 19h'
      },
      {
        day: 3,
        openings: '9h - 14h / 16h - 19h'
      },
      {
        day: 4,
        openings: '9h - 14h / 16h - 19h'
      },
      {
        day: 5,
        openings: '9h - 19h'
      },
      {
        day: 6,
        openings: '9h - 19h'
      },
    ]
  })
  const seller = await newSeller.save();
  res.json({seller})
})



module.exports = router;
