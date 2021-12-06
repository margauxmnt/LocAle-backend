var express = require('express');
var router = express.Router();

router.post('/add-note', async (req, res) => {
  let note = req.body.note
  let comment = req.body.comment
  let token = req.body.token
  let beer = req.body.beer

  /*
   * le backend reçois ce qu'il faut pour créer un nouveau model de note
   * ajoute cette note en DB et ajoute en clé étrangère dans l'utilisateur
   * 
   * côté front la note sera ajoutée dans le store de redux
   */

  if(note && comment && token && beer) res.json({message: true})
  else res.json({message: false})
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
