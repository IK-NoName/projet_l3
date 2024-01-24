var express = require('express');
var router = express.Router();
var escapeHtml = require('escape-html')

function isAuthenticated (req, res, next) {
  return !!req.session.nom
}

function isOnlyAuthenticated(req,res,next) {
  if(req.session.nom) next();
  else res.redirect("/sign_in");
}

function isValide (req, res, next) {
  return !!req.session.valide;
}

function is_valide_and_authenticated(req, res, next) {
  if(!isAuthenticated(req,res,next)) {
    res.redirect("/sign_in")
  }
  else if(!isValide(req,res,next)) {
    res.redirect("/valide_account");
  }
  else
  {
    next();
  }
}

router.get("/", (req, res, next) => {
  res.redirect("/calendar");
})
router.get("/sign_in", function(req, res) {
  res.render("sign_in");
})

router.get("/sign_up", function(req, res) {
  res.render("sign_up");
})
router.get("/calendar", is_valide_and_authenticated, (req, res) => {
  res.locals.nom = req.session.nom;
  res.render("calendar");
})

router.get('/logout', function (req, res, next) {
  // logout logic

  // clear the user from the session object and save.
  // this will ensure that re-using the old session id
  // does not have a logged in user
  req.session.user = null
  req.session.save(function (err) {
    if (err) next(err)

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err)
      res.redirect('/')
    })
  })
})

router.get("/valide_account", (req, res) => {
  res.locals.mail = req.session.mail
  res.render("valide_account");
})
module.exports = router;
