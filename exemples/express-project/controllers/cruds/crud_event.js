const pool = require("../database/db.js");
const axios = require("axios");
const utils = require("../utils/ics_utils");
const fs = require("fs");
const ical = require("ical");
const colorConfig = JSON.parse(fs.readFileSync("controllers/utils/color_config.json", "utf-8"));
const colors = colorConfig.colors;
const sql_config = JSON.parse(fs.readFileSync("controllers/config/sql_config.json", "utf-8"));
const SQL = sql_config.sql;
const Teacher = require(__dirname + "/crud_teacher");
const Session = require("../utils/session.js");

// ------------------------------------------------------------------------------------------------------------------ //
// --- SUBS FUNCTIONS -------------------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------------ //

/**
 * Builds an event object with the given title, date, start time, end time, location, id, class, and room.
 *
 * @param {string} title - The title of the event
 * @param {Date} date - The date of the event
 * @param {string} start - The start time of the event
 * @param {string} end - The end time of the event
 * @param {string} location - The location of the event
 * @param {string} id - The id of the event
 * @param {string} classe - The class of the event
 * @param {string} salle - The room of the event
 * @return {Object} The constructed event object
 */
const buildEvent = (title, date, start, end, location, id, classe, salle) => {
    start = date.toLocaleDateString("se-SV", { timeZone: "Europe/Paris" }) + " " + start;
    end = date.toLocaleDateString("se-SV", { timeZone: "Europe/Paris" }) + " " + end;
    date = date.toLocaleDateString("se-SV", { timeZone: "Europe/Paris" });
    let event = {
        title: title,
        date: date,
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
};

/**
 * Inserts a subject into the SQL database.
 *
 * @param {Object} db - The database connection object.
 * @param {string} subject - The subject to be inserted.
 * @param {function} callback - The callback function to handle the result of the insertion.
 * @return {void}
 */
const insertSubjectSQL = (db, subject, callback) => {
    db.query(
        {
            sql: SQL.insert.discipline,
            timeout: 10000,
            values: [subject],
        },
        (err, rows, fields) => {
            if (err) callback(err, null);
            callback(null, true);
        }
    );
};

/**
 * Retrieves a subject from the database based on its name.
 *
 * @param {Object} db - The database connection object.
 * @param {string} discipline - The name of the subject to select.
 * @param {function} callback - The callback function to handle the query result.
 * @return {void}
 */
const selectSubjectByNameSQL = (db, discipline, callback) => {
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
};

/**
 * Retrieves a subject by its ID from the database.
 *
 * @param {number} idSubject - The ID of the subject to retrieve
 * @param {function} callback - The callback function to handle the result
 * @return {void}
 */
const selectSubjectByIDSQL = (idSubject, callback) => {
    pool.getConnection((err, db) => {
        if (err) callback(err, null);
        db.query(
            {
                sql: SQL.select.discipline_by_name,
                timeout: 10000,
                values: [idSubject],
            },
            (err, rows, fields) => {
                if (err) callback(err, null);
                callback(null, rows[0]);
            }
        );
    });
};

/**
 * Inserts an event into the database.
 *
 * @param {string} salle - the room where the event takes place
 * @param {string} date - the date of the event
 * @param {string} start - the start time of the event
 * @param {string} end - the end time of the event
 * @param {string} classe - the class related to the event
 * @param {string} course - the course related to the event
 * @param {string} teacher - the teacher of the event
 * @param {function} callback - the callback function
 * @return {boolean} true if successful, error object if an error occurred
 */
const insertEventSQL = (salle, date, start, end, classe, course, teacher, callback) => {
    pool.getConnection((err, db) => {
        db.query(
            {
                sql: SQL.insert.event,
                timeout: 10000,
                values: [salle, date, start, end, classe, course, teacher],
            },
            (err, rows, fields) => {
                db.release();
                if (err) callback(err, null);
                callback(null, true);
            }
        );
    });
};

/**
 * Downloads a timetable from a given URL using Axios and parses it using ical.js.
 *
 * @param {string} link - The URL of the timetable to download.
 * @param {function} callback - The callback function to execute after the timetable is downloaded and parsed.
 * @return {void} This function does not return anything.
 */
const downloadTimetableFromURL = (link, callback) => {
    axios
        .get(link, {
            responseType: "blob",
        })
        .then((response) => {
            let data = utils.parseICSURL(response.data, ical);
            callback(null, data);
        });
};

/**
 * Retrieves a course from the database and calls the provided callback with the result.
 *
 * @param {Object} db - The database connection object
 * @param {string} course - The course to retrieve
 * @param {Function} callback - The callback function to be called with the result
 * @return {void}
 */
const getCourse = (db, course, callback) => {
    pool.getConnection((err, db) => {
        db.query(
            {
                sql: SQL.select.course,
                values: [course],
                timeout: 10000,
            },
            (err, rows, fields) => {
                db.release();
                if (err) callback(err, null);
                callback(null, rows[0]);
            }
        );
    });
};

/**
 * Executes an array of SQL queries using a connection pool and calls a callback
 * function with an error or a success message.
 *
 * @param {Array<string>} querys - An array of SQL queries to execute.
 * @param {function} callback - A callback function that will be called with an error or a success message.
 * @return {void}
 */
const insertEventsQuerysSQL = (querys, callback) => {
    let l = 1;
    pool.getConnection((err, db) => {
        querys.forEach((query) => {
            if (err) callback(err, null);
            db.query(
                {
                    sql: query.substring(0, query.length - 1),
                    timeout: 10000,
                },
                (err, rows, fields) => {
                    l++;
                    if (l === querys.length) {
                        db.release();
                        callback(null, true);
                    }
                    if (err) callback(err, null);
                }
            );
        });
    });
};

/**
 * Inserts multiple events into the Evenement table in the database.
 *
 * @param {Array} events - An array of events to be inserted.
 * @param {string} id - The ID of the user inserting the events.
 * @param {function} callback - The callback function to be called after the insertion is complete.
 * @return {void}
 */
const insertEventsSQL = (events, id, callback) => {
    const divider = 5;
    let query = `insert into Evenement (salle, date, heure_debut, heure_fin, classe, matiere, enseignant) values `;
    let array = new Array(divider).fill(query);
    let c = 0;

    for (let event of events) {
        let start_houre = new Date(event.start).toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
        let end_houre = new Date(event.end).toLocaleString("sv-SE", { timeZone: "Europe/Paris" });
        let formatted_date = new Date(event.start).toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });
        let salle = "none";
        let classe = null;
        try {
            salle = event.description.val.split("Salle : ")[1];
            salle = salle.split("\n")[0];
        } catch {
            null;
        }
        if (salle == undefined) salle = "none";
        let courseQuery = `SELECT id_mat FROM Ref_Matiere WHERE matiere = "${event.title} LIMIT 1"`;
        array[
            c % divider
        ] += `("${salle}","${formatted_date}","${start_houre}","${end_houre}",${classe},(${courseQuery}),"${id}"),`;
        c++;
    }

    insertEventsQuerysSQL(array, (err, result) => {
        callback(err, true);
    });
};

/**
 * Retrieves events by teacher ID from the database.
 *
 * @param {number} id - The ID of the teacher.
 * @param {function} callback - The callback function to handle the result.
 * @return {void}
 */
const getEventsByTeacherIDSQL = (id, callback) => {
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
                db.release();
                let obj = [];
                for (let row of rows) {
                    obj.push(
                        buildEvent(
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
};

/**
 * Inserts a timetable file SQL.
 *
 * @param {Array} files - The array of files to be inserted.
 * @param {number} c - The starting index of the files array.
 * @return {undefined} This function does not return a value.
 */
const insertTimetableFileSQL = (files, c) => {
    if (c >= files.length) return;
    let array = [];
    let divider = 10;
    for (let i = 0; i < divider; i++) {
        if (c + i < files.length) {
            array.push(files[c + i]);
        }
    }
    let k = 0;
    array.forEach((file) => {
        let obj = utils.parseICSFile("controllers/misc/edt/" + file);
        let fullname = file.substring(16);
        let name = fullname.split("_")[0];
        Teacher.getTeacher(name, (err, teacher) => {
            if (teacher != undefined) {
                insertEventsSQL(obj, teacher.id_ens, (err, result) => {
                    console.log(c + 1 + k + "/" + files.length);
                    k++;
                    if (k == array.length - 1) {
                        insertTimetableFileSQL(files, c + divider);
                    }
                });
            } else {
                k++;
                if (k == array.length - 1) {
                    insertTimetableFileSQL(files, c + divider);
                }
            }
        });
    });
};

/**
 * Retrieves an event from the database by its ID.
 *
 * @param {number} idEvent - The ID of the event to retrieve.
 * @param {function} callback - Callback function to handle the result.
 * @return {void}
 */
const getEventByIDSQL = (idEvent, callback) => {
    pool.getConnection((err, db) => {
        if (err) callback(err, null);
        db.query(
            {
                sql: SQL.select.get_event,
                values: [idEvent],
                timeout: 10000,
            },
            (err, rows, fields) => {
                db.release();
                callback(err, rows);
            }
        );
    });
};

// ------------------------------------------------------------------------------------------------------------------ //
// -- MAINS FUNCTIONS -------------------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------------ //

/**
 * Inserts a timetable into the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} callback - The callback function.
 * @return {void}
 */
const insertTimetableURL = (req, res, callback) => {
    // REQUIRE CONNECTION AND VALIDATION
    Session.pIsValidated(req, res, () => {
        downloadTimetableFromURL(req.body.url, (err, result) => {
            let data = [...result];
            insertEventSQL(result, req.session.id_ens, (err, result) => {
                if (err) callback(err, null);
                callback(null, true);
            });
        });
    });
};

/**
 * Function to insert the timetable root.
 *
 * @param {type} paramName - description of parameter
 * @return {type} description of return value
 */
const insertTimetablesFiles = (req, res, callback) => {
    // REQUIRE CONNECTION AND VALIDATION AS ADMINISTRATOR
    const path = "controllers/misc/edt";
    let files = fs.readdirSync(path);
    p = Promise.resolve();
    insertTimetableFileSQL(files, 0);
    console.log(
        "\u001b[" +
            32 +
            "m" +
            `[EVENTS : "AUTO LAUNCHED PROCESS" - (${new Date().toLocaleString()}) - OK / EVENTS INSERTED]` +
            "\u001b[0m"
    );
};

/**
 * Retrieves the timetable for a teacher.
 *
 * @param {Object} req - the request object
 * @param {Object} res - the response object
 * @param {function} callback - the callback function
 * @return {void}
 */
const getYourTimetable = (req, res, callback) => {
    // REQUIRE CONNECTION AND VALIDATION
    getEventsByTeacherIDSQL(req.session.id_ens, (err, result) => {
        if (err) callback(err, null);
        callback(null, result);
    });
};

/**
 * Retrieves events by ID from the database.
 *
 * @param {number} id_ev - The ID of the event to retrieve
 * @param {function} callback - The callback function to handle the retrieved data or errors
 * @return {void}
 */
const getEventByID = (idEvent, callback) => {
    // REQUIRE NO CONNECTION
    getEventByIDSQL(idEvent, (err, result) => {
        callback(err, result);
    });
};

// ------------------------------------------------------------------------------------------------------------------ //
// --- EXPORTS --------------------------------------------------------------------------------------------------- //
// ------------------------------------------------------------------------------------------------------------ //

module.exports = {
    insertTimetableURL,
    insertTimetablesFiles,
    getYourTimetable,
    getEventByID,
};
