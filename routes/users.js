var express = require('express');
const beerModel = require('../model/beers');
const noteModel = require('../model/notes');
const userModel = require('../model/users');
var router = express.Router();

var bcrypt = require('bcrypt');
var uid2 = require('uid2');

router.post('/add-note', async (req, res) => {

  const user = await userModel.findOne({token: req.body.token}).populate('notes')
  const beer = await beerModel.findById(req.body.beerId).populate('notes')

  const newNote = new noteModel({
    note: req.body.note,
    comment: req.body.comment,
    date: new Date,
    owner: user.id,
    beer: beer.id,
  })
  const saveNote = await newNote.save()

  user.notes.push(saveNote.id);
  await user.save()
  beer.notes.push(saveNote.id);
  await beer.save()

  res.json(saveNote)
})


router.post('/sign-in', async function(req,res,next){
  
  const email = req.body.email

  const user = await userModel.findOne({email: email.toLowerCase()}).populate('wishlist')
  
    if(user){
      if(bcrypt.compareSync(req.body.password, user.password)){
        res.json({token: user.token, error: '', wishlist: user.wishlist})
      } else res.json({error: 'Mot de passe incorrect.'})      
    } else res.json({error: 'Pas de compte avec cette adresse.'})
})


router.post('/sign-up', async function(req,res,next){

  const email = req.body.email
  
  const user = await userModel.findOne({email: email.toLowerCase()})
  const userByPseudo = await userModel.findOne({pseudo: req.body.pseudo})

  if(!userByPseudo){
    if(!user){
      const newUser = new userModel({
        pseudo: req.body.pseudo,
        email: email.toLowerCase(),
        insert_date: new Date(),
        password: bcrypt.hashSync(req.body.password, 10),
        token: uid2(32),
      })
      const saveUser = await newUser.save()

      res.json({token: saveUser.token, error: '', password: saveUser.password, email: saveUser.email})
    }else res.json({error: 'Vous avez déjà un compte.'})
  }else res.json({error: 'Pseudo déjà pris.'})  
})


router.get('/add-To-Wishlist/:beerId/:token', async (req, res) => {
  const user = await userModel.findOne({token: req.params.token}).populate('wishlist');

  let message = 'Bière ajoutée dans les favorites !';
  let add = false;
  let indice;

  
  user.wishlist.forEach((el, i) => {
    if(el.id === req.params.beerId) {
      add = true;
      indice = i;
    }
  })

  if(add){
    user.wishlist.splice(indice, 1);
    message = 'Bière retirée.';
  }else user.wishlist.push(req.params.beerId)

  await user.save()
  res.json({message, wishlist: user.wishlist})
})



router.get('/get-user-infos', async (req, res) => {
  //récupération des infos de l'utilisateur en BDD
  let userInfos = await userModel.findOne({token: req.query.token}).populate({path: 'notes', populate: {path:'beer'} });

  userInfos ?
      res.json({ message: true, user: userInfos }) :
      res.json({ message: false })
})

module.exports = router;

