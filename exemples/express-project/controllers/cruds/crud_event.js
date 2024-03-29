const pool = require("../database/db.js");
const axios = require("axios");
const utils = require("../utils/ics_utils");
const fs = require("fs");
const ical = require("ical");
const { start } = require("repl");
const config = JSON.parse(fs.readFileSync("controllers/utils/color_config.json", "utf8"));
const colors = config.colors;
const sql_config = JSON.parse(fs.readFileSync("controllers/config/sql_config.json", "utf-8"));
const SQL = sql_config.sql;
const Teacher = require(__dirname + "/crud_teacher");

// ------------------------------------------------------------------------------------------------------------------ //
// --- SUBS FUNCTIONS -------------------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------------ //

/**
 * function build a Javascript Object for an event, handle the color of the event too.
 * @param title {string} title of the event
 * @param start {string} start date of the event
 * @param end {string} end date of the event
 * @param location {string} location of the event
 * @param id {int} id of the event (database link)
 * @param classe {string} classe (classe name of the event)
 * @param salle salle (classroom name of the event)
 * @returns {{any}} final built-in JS object
 */
function build_event(title, date, start, end, location, id, classe, salle) {
    start = date.toLocaleDateString("se-SV", { timeZone: "Europe/Paris" }) + " " + start;
    end = date.toLocaleDateString("se-SV", { timeZone: "Europe/Paris" }) + " " + end;
    let event = {
        title: title,
        date: date.toLocaleDateString("se-SV", { timeZone: "Europe/Paris" }),
        start: start,
        end: end,
        location: location,
        id: id,
        classe: classe,
        salle: salle,
    };
    event.backgroundColor = "#08CFFB";
    for (let color of colors) {
        if (title.toLowerCase().includes(color.name.toLowerCase()) || color.name.toLowerCase().includes(title.toLowerCase())) {
            event.backgroundColor = color.color;
        }
    }
    return event;
}

/**
 * function send a query to the database to insert discipline entities in herself
 * @param db
 * @param discipline {string} discipline name
 * @param callback {function} callback function (err, result)
 */
function insert_discipline(db, discipline, callback) {
    db.query(
        {
            sql: SQL.insert.discipline,
            timeout: 10000,
            values: [discipline],
        },
        (err, rows, fields) => {
            if (err) callback(err, null);
            callback(null, true);
        }
    );
}

/**
 * function select discipline entitie by query the database with her name in parameters
 * @param db
 * @param discipline {string} discipline name
 * @param callback {function} callback function (err, result)
 */
function select_discipline_by_name(db, discipline, callback) {
    db.query(
        {
            sql: SQL.select.discipline_by_name,
            timeout: 10000,
            values: [discipline],
        },
        (err, rows, fields) => {
            if (err) callback(err, null);
            callback(null, rows[0]);
        }
    );
}

/**
 * function select discipline entitie by query the database with her id in parameters
 * @param id_discipline {int} discipline id
 * @param callback {function} callback function (err, result)
 */
function select_discipline_by_id(id_discipline, callback) {
    pool.getConnection((err, db) => {
        if (err) callback(err, null);
        db.query(
            {
                sql: SQL.select.discipline_by_name,
                timeout: 10000,
                values: [id_discipline],
            },
            (err, rows, fields) => {
                if (err) callback(err, null);
                callback(null, rows[0]);
            }
        );
    });
}

/**
 * function insert an event in the database with all required parameters
 * @param db db pool connection
 * @param discipline {string} discipline name
 * @param niveau {string} level of the classroom
 * @param classe {string} name of the classroom
 * @param salle {string} the classroom
 * @param date {string} date of the event
 * @param start {Date} start date of the event
 * @param end {Date} end date of the event
 * @param enseignant {int} id of the teacher (user) who own this event
 * @param callback {function} callback function (err, result)
 */
function insert_event(db, salle, date, start, end, classe, course, enseignant, callback) {
    /*console.log(
        `INSERT INTO Evenement (salle, date, heure_debut, heure_fin, classe, matiere, enseignant) VALUES (${salle},${date},${start},${end},${classe},${course},${enseignant})`
    );*/
    db.query(
        {
            sql: SQL.insert.event,
            timeout: 10000,
            values: [salle, date, start, end, classe, course, enseignant],
        },
        (err, rows, fields) => {
            if (err) callback(err, null);
            callback(null, true);
        }
    );
}

/**
 * function get the timetable with the given link and parse it in JS readable object
 * @param link {string} the given link
 * @param callback {function} callback function (err, result)
 */
function parse_edt(link, callback) {
    axios
        .get(link, {
            responseType: "blob",
        })
        .then((response) => {
            let data = utils.parseICSURL(response.data, ical);
            callback(null, data);
        });
}

/**
 * Retrieves a specific course from the database.
 *
 * @param {Object} db - The database connection object
 * @param {string} course - The course to retrieve
 * @param {function} callback - The callback function to handle the result
 * @return {void}
 */
function get_course(db, course, callback) {
    db.query(
        {
            sql: SQL.select.course,
            values: [course],
            timeout: 10000,
        },
        (err, rows, fields) => {
            if (err) callback(err, null);
            callback(null, rows[0]);
        }
    );
}

/**
 * function insert a collection of given events in the database by severals db querys
 * @param events {array} collection of events
 * @param id {int} teacher id (found in current session)
 * @param callback {function} callback function (err, result)
 */
function insert_all_events(events, id, callback) {
    pool.getConnection((err, db) => {
        if (err) callback(err, null);
        for (let event of events) {
            let start_houre = new Date(event.start).toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
            let end_houre = new Date(event.end).toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
            let formatted_date = new Date(event.start).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
            let salle = "none";
            let classe = "none";
            let niveau = "none";
            try {
                salle = event.description.val.split("Salle : ")[1];
                salle = salle.split("\n")[0];
            } catch {
                null;
            }
            if (salle == undefined) salle = "none";

            get_course(db, event.title, (err, course) => {
                if (err) callback(err, null);
                if (course == undefined) {
                    course = null;
                } else {
                    course = course.id_mat;
                }
                console.log("\u001b[1;34m [Insertion d'un evenement lancé]");
                insert_event(db, salle, formatted_date, start_houre, end_houre, null, course, id, function (err, result) {
                    console.log("\u001b[1;32m [Insertion d'un evenement reussie]");
                    if (err) callback(err, null);
                });
            });
        }
    });
    callback(null, true);
}

/**
 * Insert all events synchronously.
 *
 * @param {Object} res - the response object
 * @param {Array} events - the list of events to insert
 * @param {number} id - the id to associate with the events
 * @param {Function} callback - the callback function
 * @return {void}
 */
function insert_all_events_sync(events, id, callback) {
    let goal = events.length;
    let counter = 0;
    pool.getConnection((err, db) => {
        for (let event of events) {
            let start_houre = new Date(event.start).toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
            let end_houre = new Date(event.end).toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
            let formatted_date = new Date(event.start).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
            let salle = "none";
            let classe = "none";
            let niveau = "none";
            try {
                salle = event.description.val.split("Salle : ")[1];
                salle = salle.split("\n")[0];
            } catch {
                null;
            }
            if (salle == undefined) salle = "none";

            get_course(db, event.title, (err, course) => {
                if (err) callback(err, null);
                if (course == undefined) {
                    course = null;
                } else {
                    course = course.id_mat;
                }

                insert_event(db, salle, formatted_date, start_houre, end_houre, null, course, id, function (err, result) {
                    counter++;
                    var percent = (counter * 100) / goal;
                    if (counter == goal) {
                        callback(null, true);
                    }
                });
            });
        }
    });
}

/**r
 * function get a collection of all event who contains teacher given id
 * @param id {int} teacher id
 * @param callback {function} callback function (err, result)
 */
function get_events_by_teacher_id(id, callback) {
    pool.getConnection((err, db) => {
        if (err) callback(err, null);
        db.query(
            {
                sql: SQL.select.event_by_teacher_id,
                timeout: 30000,
                values: [id],
            },
            (err, rows, fields) => {
                if (err) throw err;
                let obj = [];
                for (let row of rows) {
                    let title = "none";
                    row.libelle_court != undefined ? (title = row.libelle_court) : null;
                    obj.push(
                        build_event(
                            row.libelle_court,
                            new Date(row.date),
                            row.heure_debut,
                            row.heure_fin,
                            row.salle,
                            row.id_ev,
                            row.classe,
                            row.salle
                        )
                    );
                }
                callback(null, obj);
            }
        );
    });
}

/**
 * Return if teacher available on plage horaire.
 *
 * @param {integer} id_teacher - The id of the teacher
 * @param {string} debut - The begining of the event
 * @param {string} fin - The end of the event
 * @param {string} date - The date of the event
 * @param {function} callback - The callback function to handle the result
 * @return {void}
 */
function teacher_is_available(db, id_teacher, debut, fin, date, callback) {
        db.query(
            {
                sql: SQL.select.teacher_is_available2,
                values: [id_teacher, date, debut, debut, fin, fin, debut, fin, debut, fin, debut, fin],
                timeout: 10000,
            },
            (err, rows) => {
                if(err) callback (err, null);
                callback(null, rows[0]["nb_event"] == 0);
            }
        );
}

// ------------------------------------------------------------------------------------------------------------------ //
// -- MAINS FUNCTIONS -------------------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------------ //

/**
 * Return array of teacher available on a date
 *
 * @param {array} tab_teacher - The id of the teacher
 * @param {string} debut - The begining of the event
 * @param {string} fin - The end of the event
 * @param {string} date - The date of the event
 * @param {function} callback - The callback function to handle the result
 * @return {void}
 */
function all_teachers_available(tab_teacher, debut, fin, date, callback) {

    let res = [];
    pool.getConnection((err, db) => {
        if (err) {callback (err,null)}

        let c = 0;

        for(let i=0; i < tab_teacher.length; i++){
            teacher_is_available(db, tab_teacher[i].id_ens, debut, fin, date, (err, result) => {
                if(result) res.push(tab_teacher[i]);
                c ++;
                if(c == tab_teacher.length) {
                    callback(null, res);
                }
            });

        }
    })
}

/**
 * function insert timetable in the database
 * @param req router paramaters
 * @param res router parameters
 * @param callback {function} callback function (err, result)
 */
function insert_timetable(req, res, callback) {
    parse_edt(req.body.url, (err, result) => {
        let data = [...result];
        insert_all_events(result, req.session.id_ens, (err, result) => {
            if (err) callback(err, null);
            callback(null, true);
        });
    });
}

/**
 * Function to insert a timetable synchronously.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {function} callback - the callback function
 * @return {void}
 */
function insert_timetable_sync(req, res, callback) {
    parse_edt(req.body.url, (err, result) => {
        let data = [...result];
        insert_all_events_sync(result, req.session.id_ens, (err, result) => {
            if (err) callback(err, null);
            callback(null, data);
        });
    });
}

function insertTimetableRoot() {
    path = "controllers/misc/";
    let files = fs.readdirSync(path);
    let c = 0;
    let date = new Date();
    console.log("début du processus");
    handleFile(c, files, date);
    //insert_all_events(obj, id, (err, result) => {});
}

function handleFile(c, files, date) {
    if (c == files.length) {
        console.log("fin du processus.");
        return;
    }
    let file = files[c];
    let obj = utils.parseICSFile(path + file);
    let fullname = file.substring(16);
    let name = fullname.split("_")[0];
    Teacher.getTeacher(name, (err, teacher) => {
        if (teacher != undefined) {
            insert_all_events_sync(obj, teacher.id_ens, (err, result) => {
                if (err) {
                    callback(err, null);
                    console.log("fin du processus.");
                    return;
                }
                let diff = new Date() - date;
                date = new Date();
                console.log(
                    "\u001b[1;33m [Fin d'insertion de l'EDT du professeur : " +
                        name +
                        "]  [" +
                        (c + 1) +
                        "/" +
                        files.length +
                        "] " +
                        diff / 1000 +
                        "s\u001b[0m"
                );
                c++;
                handleFile(c, files, date);
            });
        } else {
            let diff = new Date() - date;
            date = new Date();
            console.log(
                "\u001b[1;31m [Echec de l'insertion du professeur : " +
                    name +
                    "]  [" +
                    (c + 1) +
                    "/" +
                    files.length +
                    "] " +
                    diff / 1000 +
                    "s\u001b[0m"
            );
            c++;
            handleFile(c, files, date);
        }
    });
}

/**
 * function get timetable by querying the sql database
 * @param req router parameters
 * @param res router parameters
 * @param callback {function} callback function (err, result)
 */
function get_teacher_timetable(req, res, callback) {
    get_events_by_teacher_id(req.session.id_ens, (err, result) => {
        if (err) callback(err, null);
        callback(null, result);
    });
}



function get_event_by_id(id_ev,callback){
    pool.getConnection((err, db) => {
        if (err) callback(err, null);
        db.query(
            {
                sql: SQL.select.get_event,
                values: [id_ev],
                timeout: 10000,
            },
            (err, rows, fields) => {
                if (err) callback(err, null);
                callback(null, rows)
            }
        );
    })
}


// ------------------------------------------------------------------------------------------------------------------ //
// --- EXPORTS --------------------------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------------ //

module.exports = {
    insert_all_events,
    insert_timetable,
    get_teacher_timetable,
    insert_timetable_sync,
    insertTimetableRoot,
    get_event_by_id,
    all_teachers_available,
};
