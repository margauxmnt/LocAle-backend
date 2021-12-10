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

  const user = await userModel.findOne({email: email.toLowerCase()})
  
    if(user){
      if(bcrypt.compareSync(req.body.password, user.password)){
        res.json({token: user.token, error: ''})
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
      let saveUser = await newUser.save()

      res.json({token: saveUser.token, error: ''})
    }else res.json({error: 'Vous avez déjà un compte.'})
  }else res.json({error: 'Pseudo déjà pris.'})  
})


router.get('/add-To-Wishlist/:beerId/:token', async (req, res) => {
  const user = await userModel.findOne({token: req.params.token})
  // on l'ajoute en wishlist 
})

router.get('/remove-To-Wishlist/:beerId/:token', async (req, res) => {
  const user = await userModel.findOne({token: req.params.token})
  // on retire de la wishlist
})

module.exports = router;

