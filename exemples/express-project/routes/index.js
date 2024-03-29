let express = require("express");
let router = express.Router();

function isAuthenticated(req, res, next) {
    return !!req.session.nom;
}

function isOnlyAuthenticated(req, res, next) {
    if (req.session.nom) next();
    else res.redirect("/sign_in");
}

function isValide(req, res, next) {
    return req.session.valide;
}

function isRoot(req, res, next) {
    console.log(req.session);
    return true;
}

function is_valide_and_authenticated(req, res, next) {
    if (!isAuthenticated(req, res, next)) {
        res.redirect("/sign_in");
    } else if (!isValide(req, res, next)) {
        console.log(req.session);
        res.redirect("/valide_account");
    } else {
        next();
    }
}

function is_admin(req, res, next) {
    if (!req.session.admin) {
        res.redirect("/sign_in");
    } else {
        next();
    }
}

function is_not_admin(req, res, next) {
    if (req.session.admin) {
        res.redirect("/sign_in");
    } else {
        next();
    }
}

router.get("/", is_valide_and_authenticated, is_not_admin, (req, res, next) => {
    res.render("index");
});
router.get("/sign_in", function (req, res) {
    res.render("sign_in");
});

router.get("/sign_up", function (req, res) {
    res.render("sign_up");
});
router.get("/calendar", is_valide_and_authenticated, is_not_admin, (req, res) => {
    res.locals.nom = req.session.nom;
    res.render("calendar");
});

router.get("/dashboard_admin", is_admin, (req, res) => {
    res.render("dashboard_admin");
});

router.get("/logout", function (req, res, next) {
    // logout logic

    // clear the user from the session object and save.
    // this will ensure that re-using the old session id
    // does not have a logged in user
    req.session.user = null;
    req.session.save(function (err) {
        if (err) next(err);

        // regenerate the session, which is good practice to help
        // guard against forms of session fixation
        req.session.regenerate(function (err) {
            if (err) next(err);
            res.redirect("/");
        });
    });
});

router.get("/valide_account", isOnlyAuthenticated, (req, res) => {
    res.locals.mail = req.session.mail;
    res.render("valide_account");
});

router.get("/root", (req, res) => {
    res.render("root");
});
module.exports = router;
