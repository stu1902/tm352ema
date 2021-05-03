/***********
 * OU TM352 Block 3, TMA03: helpers.js
 *
 * To function correctly this file must be placed in a Cordova project and the appopriate plugins installed.
 *
 * Released by Chris Thomson / Stephen Rice: Dec 2020

 ************/

// Execute in strict mode to prevent some common mistakes
"use strict";

/**
 * Format a date object as a string
 * Source: https://stackoverflow.com/a/14638191 (CC BY-SA 4.0)
 * @param {Date} date Date object to format
 * @param {string} format e.g., "yyyy:MM:dd:HH:mm" formats 2017-01-26 5:15pm to "2017:01:26:17:15"
 * @param {boolean} utc Convert to UTC (default is false)
 * @returns {string} Formatted date time string
 */
function formatDate(date, format, utc) {
    var MMMM = [
        "\x00",
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];
    var MMM = [
        "\x01",
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec"
    ];
    var dddd = [
        "\x02",
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday"
    ];
    var ddd = ["\x03", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    function ii(i, len) {
        var s = i + "";
        len = len || 2;
        while (s.length < len) s = "0" + s;
        return s;
    }

    var y = utc ? date.getUTCFullYear() : date.getFullYear();
    format = format.replace(/(^|[^\\])yyyy+/g, "$1" + y);
    format = format.replace(/(^|[^\\])yy/g, "$1" + y.toString().substr(2, 2));
    format = format.replace(/(^|[^\\])y/g, "$1" + y);

    var M = (utc ? date.getUTCMonth() : date.getMonth()) + 1;
    format = format.replace(/(^|[^\\])MMMM+/g, "$1" + MMMM[0]);
    format = format.replace(/(^|[^\\])MMM/g, "$1" + MMM[0]);
    format = format.replace(/(^|[^\\])MM/g, "$1" + ii(M));
    format = format.replace(/(^|[^\\])M/g, "$1" + M);

    var d = utc ? date.getUTCDate() : date.getDate();
    format = format.replace(/(^|[^\\])dddd+/g, "$1" + dddd[0]);
    format = format.replace(/(^|[^\\])ddd/g, "$1" + ddd[0]);
    format = format.replace(/(^|[^\\])dd/g, "$1" + ii(d));
    format = format.replace(/(^|[^\\])d/g, "$1" + d);

    var H = utc ? date.getUTCHours() : date.getHours();
    format = format.replace(/(^|[^\\])HH+/g, "$1" + ii(H));
    format = format.replace(/(^|[^\\])H/g, "$1" + H);

    var h = H > 12 ? H - 12 : H === 0 ? 12 : H;
    format = format.replace(/(^|[^\\])hh+/g, "$1" + ii(h));
    format = format.replace(/(^|[^\\])h/g, "$1" + h);

    var m = utc ? date.getUTCMinutes() : date.getMinutes();
    format = format.replace(/(^|[^\\])mm+/g, "$1" + ii(m));
    format = format.replace(/(^|[^\\])m/g, "$1" + m);

    var s = utc ? date.getUTCSeconds() : date.getSeconds();
    format = format.replace(/(^|[^\\])ss+/g, "$1" + ii(s));
    format = format.replace(/(^|[^\\])s/g, "$1" + s);

    var f = utc ? date.getUTCMilliseconds() : date.getMilliseconds();
    format = format.replace(/(^|[^\\])fff+/g, "$1" + ii(f, 3));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])ff/g, "$1" + ii(f));
    f = Math.round(f / 10);
    format = format.replace(/(^|[^\\])f/g, "$1" + f);

    var T = H < 12 ? "AM" : "PM";
    format = format.replace(/(^|[^\\])TT+/g, "$1" + T);
    format = format.replace(/(^|[^\\])T/g, "$1" + T.charAt(0));

    var t = T.toLowerCase();
    format = format.replace(/(^|[^\\])tt+/g, "$1" + t);
    format = format.replace(/(^|[^\\])t/g, "$1" + t.charAt(0));

    var tz = -date.getTimezoneOffset();
    var K = utc || !tz ? "Z" : tz > 0 ? "+" : "-";
    if (!utc) {
        tz = Math.abs(tz);
        var tzHrs = Math.floor(tz / 60);
        var tzMin = tz % 60;
        K += ii(tzHrs) + ":" + ii(tzMin);
    }
    format = format.replace(/(^|[^\\])K/g, "$1" + K);

    var day = (utc ? date.getUTCDay() : date.getDay()) + 1;
    format = format.replace(new RegExp(dddd[0], "g"), dddd[day]);
    format = format.replace(new RegExp(ddd[0], "g"), ddd[day]);

    format = format.replace(new RegExp(MMMM[0], "g"), MMMM[M]);
    format = format.replace(new RegExp(MMM[0], "g"), MMM[M]);

    format = format.replace(/\\(.)/g, "$1");

    return format;
}

/**
 * Convert a Date object to a Taxi Sharing API order time string
 * @param {Date} date Date object to convert
 * @returns {string} Formatted time string for this date
 */
function convertToOrderTime(date) {
    return formatDate(date, "yyyy:MM:dd:HH:mm");
}

/**
 * Convert a Taxi Sharing API order time string to a Date object
 * Format a Date object as a taxi offer time string
 * @param {string} orderTime Time string to convert
 * @returns {Date} Date object for this order time string
 */
function convertFromOrderTime(orderTime) {
    // e.g. 2020:12:18:14:38
    var pattern1 = /^(\d{4}):(\d{2}):(\d{2}):(\d{2}):(\d{2})$/;
    if (pattern1.test(orderTime)) {
        return new Date(orderTime.replace(pattern1, "$1-$2-$3 $4:$5"));
    }

    // e.g. 2018-12-05 18:09:00
    var pattern2 = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    if (pattern2.test(orderTime)) {
        return new Date(orderTime.replace(pattern2, "$1-$2-$3 $4:$5"));
    }

    // e.g. 2018-12-05 18:09
    var pattern3 = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/;
    if (pattern3.test(orderTime)) {
        return new Date(orderTime.replace(pattern3, "$1-$2-$3 $4:$5"));
    }

    // Feel free to add other converters here if you wish!

    alert("Please enter a date/time in format yyyy:MM:dd:HH:mm");
    // Try to parse value as Date in unknown format
    return new Date(orderTime);
}

/**
 * Get value from an HTML input or default value (with OUCU validation)
 * @param {string} id ID of HTML input to read value from
 * @param {string} defaultValue Value to place in input if empty
 * @returns {string} Value read from input or default value
 */
function getInputValue(id, defaultValue) {
    // Get value from HTML input element
    var value = $("#" + id).val();

    // Check for input elements that don't exist
    if (value === undefined) {
        console.error("Input element #" + id + " does not exist!");
        return undefined;
    }

    // Trim excess spaces
    value = value.trim();

    // Substitute default value if input is blank
    if (value === "") {
        value = defaultValue;
    }

    // Set input element to trimmed/default value
    $("#" + id).val(value);

    // Treat value as OUCU if element ID is "oucu"
    if (id === "oucu") {
        var pattern = /^[a-zA-Z]+[0-9]+$/;
        if (!pattern.test(value)) {
            alert("Please enter a valid OUCU");
            return "";
        }
    }

    return value;
}

/**
 * Use the OpenStreetMap REST API without flooding the server.
 * The API has antiflood protection on it that means we must not submit more than one request per second.
 * This function restricts requests to every five seconds, and caches responses to further reduce requests.
 *
 * v1.1 Chris Thomson / Stephen Rice: Dec 2020
 */
function NominatimService() {
    console.log("Nominatim: Creating service helper (in helpers.js)");

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the function

    var queue = [];
    var cache = {};
    var scheduled = null;

    function scheduleRequest(delay) {
        console.log(
            "Nominatim: Processing next request in " + delay + "ms",
            Object.assign({}, queue)
        );
        scheduled = setTimeout(processRequest, delay);
    }

    function safeCallback(item, delay) {
        try {
            // Callback with cached data
            item.callback(cache[item.address]);
        } finally {
            // Schedule next request even if callback fails
            scheduleRequest(delay);
        }
    }

    function processRequest() {
        // Stop if queue is empty
        if (queue.length === 0) {
            console.log("Nominatim: Queue complete");
            scheduled = null;
            return;
        }

        // Get the next item from the queue
        var item = queue.shift();

        // Check for cached data for this address
        if (cache[item.address]) {
            console.log("Nominatim: Data found in cache", cache[item.address]);

            // Callback and schedule the next request immediately as we did not call the API this time
            safeCallback(item, 0);
        } else {
            // Address is not cached so call the OpenStreetMap REST API
            var url =
                "http://nominatim.openstreetmap.org/search/" +
                encodeURI(item.address) +
                "?format=json&countrycodes=gb";

            var onSuccess = function (data) {
                console.log("Nominatim: Received data from " + url, data);

                // Cache the response data
                cache[item.address] = data;

                // Callback and schedule the next request in 5 seconds time:
                // This avoids flooding the API and getting locked out. 1 second should be
                // enough, but if you have several pages open then you need to wait longer
                safeCallback(item, 5000);
            };

            // Call the OpenStreetMap REST API
            console.log("Nominatim: Sending GET to " + url);
            $.ajax(url, { type: "GET", data: {}, success: onSuccess });
        }
    }

    // PUBLIC FUNCTIONS - available to the view

    // Queued/Cached call to OpenStreetMap REST API
    // address: address string to lookup
    // callback: function to handle the result of the call
    this.get = function (address, callback) {
        // Add the item to the queue
        queue.push({ address: address, callback: callback });
        console.log("Nominatim: Queued request", Object.assign({}, queue));

        // Schedule the next request immediately if not already scheduled
        if (!scheduled) scheduleRequest(0);
    };
}

var nominatim = new NominatimService();
