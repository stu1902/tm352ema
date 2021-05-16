/***********
 * OU TM352 Block 3, TMA03: helpers.js
 * 
 * Available for reuse with OU TM352 EMA
 *
 * To function correctly this file must be placed in a Cordova project and the appropriate plugins installed.
 *
 * Released by Chris Thomson / Stephen Rice: Dec 2020

 ************/

// Execute in strict mode to prevent some common mistakes
"use strict";


/**
 * Convert a Taxi Sharing API order time string to a Date object
 * Format a Date object as a taxi offer time string
 * @param {string} orderTime Time string to convert
 * @returns {Date} Date object for this order time string
 */


/**
 * Get value from an HTML input or default value (with OUCU validation)
 * @param {string} id ID of HTML input to read value from
 * @param {string} defaultValue Value to place in input if empty
 * @returns {string} Value read from input or default value
 */
function getInputValue(id, defaultValue) {
    // Get value from HTML input element
    let value = $("#" + id).val();

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
        let pattern = /^[a-zA-Z]+[0-9]+$/;
        if (!pattern.test(value)) {
            alert("Please enter a valid OUCU");
            return "";
        }
    }

    return value;
}

/**
 * Use the OpenStreetMap REST API without flooding the server.
 * The API has anti-flood protection on it that means we must not submit more than one request per second.
 * This function restricts requests to every five seconds, and caches responses to further reduce requests.
 *
 * v1.1 Chris Thomson / Stephen Rice: Dec 2020
 */
function NominatimService() {
    console.log("Nominatim: Creating service helper (in helpers.js)");

    // PRIVATE VARIABLES AND FUNCTIONS - available only to code inside the function

    let queue = [];
    let cache = {};
    let scheduled = null;

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
        let item = queue.shift();

        // Check for cached data for this address
        if (cache[item.address]) {
            console.log("Nominatim: Data found in cache", cache[item.address]);

            // Callback and schedule the next request immediately as we did not call the API this time
            safeCallback(item, 0);
        } else {
            // Address is not cached so call the OpenStreetMap REST API
            let url =
                "http://nominatim.openstreetmap.org/search/" +
                encodeURI(item.address) +
                "?format=json&countrycodes=gb";

            let onSuccess = function (data) {
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


let nominatim = new NominatimService();
