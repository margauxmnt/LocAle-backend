var express = require('express');
const beerModel = require('../model/beers');
const noteModel = require('../model/notes');
const userModel = require('../model/users');
var router = express.Router();

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


router.post('/sign-in', (req, res) => {

  /* 
   * le back reçois un email et un password
   * cherche dans la DB si l'email correspond à un utilisateur
   */

  if(req.body.email === 'mat@gmail'){

    /* 
     * Si Oui check si le password correspond 
     * -- Si oui renvoi les données de l'utilisateur
     * -- Si non renvoi d'un message d'erreur
     */

    if(req.body.password === 123) res.json({message: true, user: {}})

    else res.json({message: false, text: 'mot de passe incorrect'})
  }
  else res.json({message: false, text: 'email incorrect'})
})


router.post('/sign-up', (req, res) => {
  let pseudo = req.body.pseudo,
      email = req.body.email,
      password = req.body.password;

  /*
   * Le back reçois un pseudo un email et un password
   * recherche si l'utilisateur n'existe pas déjà
   * s'il n'existe pas encore renvoie true avec les données de l'utilisateur
   * sinon message d'erreur 
   */

  if(pseudo && email && password) res.json({message: true, user: {}})
  else res.json({message: false, text: 'info manquante'})
})

module.exports = router;
