// ----------------------------------------------------------------------------------------------------------------------------//
// --- DOM ELEMENTS -----------------------------------------------------------------------------------------------------------//
// ----------------------------------------------------------------------------------------------------------------------------//

const result_element = document.querySelector("#result");
const calendar_element = document.getElementById("calendar");
const absence_form = document.getElementById("add_absence");
const reader = document.getElementById("scan_code");
const scan_button = document.getElementById("scan_qr_code");
const close_scanner = document.getElementById("close_scanner");
const render_region = document.getElementById("reader__scan_region");
const loading = document.querySelector(".loading");
const start_absence = absence_form.querySelector(".start_absence");
const end_absence = absence_form.querySelector(".end_absence");
const reason = absence_form.querySelector(".reason");
const submit = absence_form.querySelector(".submit_form");
const close_form = absence_form.querySelector("#close_form");

// ----------------------------------------------------------------------------------------------------------------------------//
// ----GLOBALS VARIABLES ------------------------------------------------------------------------------------------------------//
// ----------------------------------------------------------------------------------------------------------------------------//
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-analytics.js";
import {
    getMessaging,
    getToken,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-messaging.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCOzvsswCcrRK5NN23oxfgUleDMZWaNwfg",
    authDomain: "rdp-app-3a69f.firebaseapp.com",
    projectId: "rdp-app-3a69f",
    storageBucket: "rdp-app-3a69f.appspot.com",
    messagingSenderId: "217948061515",
    appId: "1:217948061515:web:a8b171efeb3a0cd47bb2ce",
    measurementId: "G-8XYWBLJYLH",
};

// Initialize Firebase
const fapp = initializeApp(firebaseConfig);
const analytics = getAnalytics(fapp);
const messaging = getMessaging(fapp);
getToken(messaging, {
    vapidKey:
        "BGR65wxzminlK4tibzjEUwMYpsr85LDWMv8mw7roN-rM0p_JtJNe_68LYoP6beYcJfcpwuBFENmjfPyvf2w_b5w",
})
    .then((currentToken) => {
        if (currentToken) {
        } else {
            // Show permission request UI
            console.log("No registration token available. Request permission to generate one.");
            // ...
        }
    })
    .catch((err) => {
        console.log("An error occurred while retrieving token. ", err);
        // ...
    });

function requestPermission() {
    console.log("Requesting permission...");
    Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
            console.log("Notification permission granted.");
        }
    });
}

requestPermission();

const scanner = new Html5QrcodeScanner("reader", {
    qrbox: qrboxFunction,
    fps: 60,
});

const ec = new EventCalendar(calendar_element, {
    view: "timeGridWeek",
    events: [],
    locale: "fr",
    firstDay: 1,
    slotMinTime: "06:00:00",
    slotMaxTime: "21:00:00",
});

var global_event = {};

// ----------------------------------------------------------------------------------------------------------------------------//
// --- FUNCTIONS --------------------------------------------------------------------------------------------------------------//
// ----------------------------------------------------------------------------------------------------------------------------//

/**
 * format a time to display it in time fields form
 * @param {Date} time base date to extract hour in it
 * @return {string} formatted date
 */
function format_time(time) {
    let hour = time.getHours();
    hour < 10 ? (hour = "0" + hour) : null;

    let minute = time.getMinutes();
    minute < 10 ? (minute = "0" + minute) : null;
    return hour + ":" + minute;
}

/**
 * function handle sucess of qr code scanning
 * @param {string} result link of the qr code
 */
function success(result) {
    let obj = {
        url: result,
    };
    scanner.clear();
    reader.classList.add("hide");

    axios
        .post("sql/event/insert_timetable", obj, {
            timeout: 6000000,
        })
        .then((response) => {
            get_timetable();
            loading.classList.add("hide");
        });
}

/**
 * function hancle qr code scan error
 * @param {Error} err
 */
function error(err) {
    console.error(err);
}

/**
 * function set the qr code GUI, need to call whene initialize the qrcode
 * @param {number} viewfinderWidth
 * @param {number} viewfinderHeight
 * @returns
 */
function qrboxFunction(viewfinderWidth, viewfinderHeight) {
    let minEdgePercentage = 0.7; // 70%
    let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
    let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
    return {
        width: qrboxSize,
        height: qrboxSize,
    };
}

/**
 * A JavaScript function that fetches timetable from the server and adds each returned event to the EventCalendar instance `ec`
 *
 * This function makes a GET request to the "/sql/event/get_timetable" endpoint using axios.
 * Upon successful request, the function logs the data from the response and adds each event from the response data to the calendar.
 *
 * The function does not take any parameters and does not explicitly return anything.
 *
 * Note: This function uses the EventCalendar instance `ec` which should be defined before calling this function.
 */

/**
 * get the timtable to RDP API
 */

function get_timetable() {
    axios.get("sql/event/get_timetable").then((response) => {
        for (let event of response.data) {
            event.start = new Date(event.start);
            event.end = new Date(event.end);
            ec.addEvent(event);
        }
    });
}

/**
 * resize calendar with the current window size
 */
function resize_calendar() {
    if (window.innerWidth < 800) {
        ec.setOption("view", "timeGridDay");
    } else {
        ec.setOption("view", "timeGridWeek");
    }
}

// ----------------------------------------------------------------------------------------------------------------------------//
// --- FUNCTIONS CALLS --------------------------------------------------------------------------------------------------------//
// ----------------------------------------------------------------------------------------------------------------------------//

get_timetable();

// ----------------------------------------------------------------------------------------------------------------------------//
// --- EVENTES LISTENERS ------------------------------------------------------------------------------------------------------//
// ----------------------------------------------------------------------------------------------------------------------------//

scan_button.addEventListener("click", () => {
    scanner.render(success, error);
    reader.classList.remove("hide");
});
close_scanner.addEventListener("click", () => {
    scanner.clear();
    reader.classList.add("hide");
});

submit.addEventListener("click", function () {
    axios
        .post("sql/absence/insert/", { id_event: global_event.id, motif: reason.value })
        .then((response) => {
            axios.post("sql/absence/filtre/", { ev: global_event }).then((response) => {
                console.log(response.data);
            });
        });
});

close_form.addEventListener("click", () => {
    absence_form.classList.add("hide");
});

window.onload((e) => {
    resize_calendar();
});

window.onresize((e) => {
    resize_calendar();
});
