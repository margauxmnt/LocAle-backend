var express = require('express');
const beerModel = require('../model/beers');
const noteModel = require('../model/notes');
const userModel = require('../model/users');
var router = express.Router();
const userModel = require('../model/users');

var bcrypt = require('bcrypt');
var uid2 = require('uid2');

var userModel = require('../model/users')


router.post('/add-note', async (req, res) => {
  /*
   * le backend reçois ce qu'il faut pour créer un nouveau model de note
   * ajoute cette note en DB et ajoute en clé étrangère dans l'utilisateur
   * 
   * côté front la note sera ajoutée dans le store de redux
   */

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

  let result = false
  let user = null
  let error = []
  let token = null
  
  if(req.body.signInEmail == ''
  || req.body.signInPassword == ''
  ){
    error.push('champs vides')
  }

  if(error.length == 0){
    user = await userModel.findOne({
      email: req.body.email
    })
  
    
    if(user){
      if(bcrypt.compareSync(req.body.password, user.password)){
        result = true
        token = user.token
      } else {
        result = false
        error.push('mot de passe incorrect')
      }
      
    } else {
      error.push('email incorrect')
    }
  }

  res.json({result, user, error, token})
})

  
  /* 
   * le back reçois un email et un password
   * cherche dans la DB si l'email correspond à un utilisateur
   

  if(req.body.email === 'mat@gmail'){

    
     * Si Oui check si le password correspond 
     * -- Si oui renvoi les données de l'utilisateur
     * -- Si non renvoi d'un message d'erreur
     

    if(req.body.password === 123) res.json({message: true, user: {}})

    else res.json({message: false, text: 'mot de passe incorrect'})
  }
  else res.json({message: false, text: 'email incorrect'})
})*/


router.post('/sign-up', async function(req,res,next){

  let error = []
  let result = false
  let saveUser = null
  let token = null

  const data = await userModel.findOne({
    email: req.body.email
  })

  if(data != null){
    error.push('utilisateur déjà présent')
  }

  if(req.body.pseudo == ''
  || req.body.email == ''
  || req.body.password == ''
  ){
    error.push('champs vides')
  }


  if(error.length == 0){

    var hash = bcrypt.hashSync(req.body.password, 10);
    var newUser = new userModel({
      pseudo: req.body.pseudo,
      email: req.body.email,
      insert_date: new Date(),
      password: hash,
      token: uid2(32),
    })
  
    saveUser = await newUser.save()
  
    
    if(saveUser){
      result = true
      token = saveUser.token
    }
  }


  res.json({result, saveUser, error})
})

  /*let pseudo = req.body.pseudo,
      email = req.body.email,
      password = req.body.password;

   * Le back reçois un pseudo un email et un password
   * recherche si l'utilisateur n'existe pas déjà
   * s'il n'existe pas encore renvoie true avec les données de l'utilisateur
   * sinon message d'erreur 
   

  if(pseudo && email && password) res.json({message: true, user: {}})
  else res.json({message: false, text: 'info manquante'})*/


router.get('/get-user-infos', async (req, res) => {
  //récupération du token de l'utilisateur depuis le front
  //let userToken = req.query.token;
  let userToken = "XAL39AFZCGMyhLD6Quw11nXJHggbrm4A";

  //récupération des infos de l'utilisateur en BDD
  let userInfos = await userModel.find({token: userToken}).populate({path: 'notes', populate: {path:'beer'} });

  userToken == "XAL39AFZCGMyhLD6Quw11nXJHggbrm4A" ?
      res.json({ message: true, user: userInfos }) :
      res.json({ message: false })
})

module.exports = router;

