const asyncHandler = require("express-async-handler");
const { insertProposition, getProposedTeacher, acceptProposition, getYourReplace, getTeacherReplace } = require(__dirname + "/cruds/crud_proposition.js");
const Session = require(__dirname + "/utils/session.js");

// ----------------------------------- EXPORTS FUNCTIONS CRUDS RESULT -------------------------------- //

/**
 * Add teacher in the proposition list.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @return {void}
 */
exports.insertPropositionREQUEST = asyncHandler((req, res) => {
    Session.pIsValidated(req, res, () => {
        insertProposition(req, res, (err, result) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    });
});

/**
 * Get all the teacher who propose on an absence.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @return {void}
 */
exports.getProposedTeacherREQUEST = asyncHandler((req, res) => {
    Session.pIsAdministrator(req, res, () => {
        getProposedTeacher(req, res, (err, result) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    });
});

/**
 * Function to handle accepting a proposition by a teacher.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @return {void}
 */
exports.acceptPropositionREQUEST = asyncHandler((req, res) => {
    Session.pIsValidated(req, res, () => {
        acceptProposition(req, res, (err, result) => {
            if (err) {
                res.sendStatus(500);
            } else {
                res.sendStatus(200);
            }
        });
    });
});

exports.getYourReplaceREQUEST = asyncHandler((req, res) => {
    Session.pIsAdministrator(req, res, () => {
        getYourReplace(req, res, (err, result) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    });
});

exports.getTeacherReplaceREQUEST = asyncHandler((req, res) => {
    Session.pIsValidated(req, res, () => {
        getTeacherReplace(req, res, (err, result) => {
            if (err) {
                console.error(err);
                res.sendStatus(500);
            } else {
                res.send(result);
            }
        });
    });
});
