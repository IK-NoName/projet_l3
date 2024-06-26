const logger = require(__dirname + "/logger.js");

class DiffusionEngine {
    constructor(absences, matFilter, scheduleFilter, classesFilter, pool) {
        this.absences = absences;
        this.matFilter = matFilter;
        this.scheduleFilter = scheduleFilter;
        this.classesFilter = classesFilter;
        this.pool = pool;
    }

    diffuse(callback) {
        logger.log(logger.BLUE, "START", "Diffusion engine process");
        logger.log(logger.BLUE, "START", "Diffuse absences");
        this.absences.forEach((absence) => {
            let filter = new Filter(
                absence,
                this.matFilter,
                this.scheduleFilter,
                this.classesFilter,
                this.pool
            );
            filter.filter((err, filterResult) => {
                let diffuser = new Diffuser(absence, filterResult, this.pool);
                if (filterResult.length > 0) diffuser.diffuse(callback);
                logger.log(logger.YELLOW, "END", "Diffuse absences", "no teachers found");
                logger.log(logger.GREEN, "SUCCES", "Diffusion engine process");
            });
        });
    }
}

class TypeDefiner {
    constructor(absence) {
        this.absence = absence;
    }

    writetype() {
        if (this.absence.classes > 2) {
            this.absence.type = "CLASS";
        } else {
            this.absence.type = "NORMAL";
        }
        return this.absence;
    }
}

class Filter {
    constructor(absence, matFilter, scheduleFilter, classesFilter, pool) {
        this.absence = absence;
        this.matFilter = matFilter;
        this.scheduleFilter = scheduleFilter;
        this.classesFilter = classesFilter;
        this.pool = pool;
    }

    filter(callback) {
        this.matFilter(this.pool, this.absence, (err, matResult) => {
            if (this.absence.type === "CLASSE") {
                this.classesFilter(this.absence, matresult, (err, classesResult) => {
                    this.scheduleFilter(this.absence, classesResult, (err, scheduleResult) => {
                        callback(err, scheduleResult);
                    });
                });
            } else {
                this.scheduleFilter(this.absence, matResult, (err, scheduleResult) => {
                    callback(err, scheduleResult);
                });
            }
        });
    }
}

class Diffuser {
    constructor(absence, teachers, pool) {
        this.absence = absence;
        this.teachers = teachers;
        this.pool = pool;
    }

    diffuse(callback) {
        let query = new QueryBuilder(this.absence, this.teachers).buildQuery();
        this.pool.getConnection((err, db) => {
            db.query(
                {
                    sql: query,
                    timeout: 10000,
                },
                (err, rows, fields) => {
                    logger.log(logger.GREEN, "SUCCES", "Diffuse absences");
                    callback(err, rows);
                    db.release();
                }
            );
        });
    }
}

class QueryBuilder {
    constructor(absence, teachers) {
        this.absence = absence;
        this.teachers = teachers;
    }

    buildQuery() {
        let query = `insert ignore into Diffusion (ens, absence) value `;
        this.teachers.forEach((teacher) => {
            query += `(${teacher.enseignant}, (select DISTINCT id_abs from Absence where date = '${this.absence.date}' and start = '${this.absence.startHour}' and end = '${this.absence.endHour}' and teacherID = ${this.absence.teacherID} limit 1)),`;
        });
        return query.slice(0, -1);
    }
}

module.exports = { DiffusionEngine };
