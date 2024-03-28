const asyncHandler = require("express-async-handler");
const { RequestResponse } = require("./utils/object_engine");

const { getTeacherLike, signIN, signUP, signINAdministrator, getYourTeacher, getTeacher, validateTeacher } = require(__dirname +
    "/cruds/crud_teacher.js");

// ----------------------------------- EXPORTS FUNCTIONS CRUDS RESULT -------------------------------- //

/**
 * Handle the GET request for fetching the teacher information.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.getYourTeacherREQUEST = asyncHandler((req, res) => {
    getYourTeacher(req, res, (err, teachers) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.send(teachers);
        }
    });
});

/**
 * Handles the validation request for a teacher.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.validateTeacherREQUEST = asyncHandler((req, res) => {
    validateTeacher(req, res, (err, result) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

/**
 * Handles the sign-in request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.signINREQUEST = asyncHandler((req, res) => {
    signIN(req, res, (err, result) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

/**
 * Handles the sign-up request.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.signUPREQUEST = asyncHandler((req, res) => {
    signUP(req, res, (err, result) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

/**
 * Handles the sign-in request for administrators.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.signINAdministratorREQUEST = asyncHandler((req, res) => {
    signINAdministrator(req, res, (err, result) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.sendStatus(200);
        }
    });
});

/**
 * Handles the search request for teachers.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 */
exports.searchTeacherREQUEST = asyncHandler((req, res) => {
    getTeacher(req, res, (err, teacher) => {
        if (err) {
            console.error(err);
            res.sendStatus(500);
        } else {
            res.send(teacher);
        }
    });
});
