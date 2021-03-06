// noinspection JSDuplicatedDeclaration,JSJQueryEfficiency,JSUnfilteredForInLoop,JSUnresolvedFunction

/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
"use strict";

// Initialise global variables.
let controller, widgets, clients, order_id, price;
let c_name, c_add, latitude, longitude, oucu, marker;
let widget_id = 0;
let subCost = 0;
let totalCost = 0;
let vatCost = 0;
let costInPounds = 0;
const today = new Date();
let currentOrders = [];
const domIcon = new H.map.DomIcon("<div>&#x274C;</div>");

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

// Create a new instance of the app.
controller = new MegaMaxApp();


function MegaMaxApp() {

    // Pathway to the API endpoints.
    const BASE_URL = `http://137.108.92.9/openstack/api/`;
    // Password hard-coded for app testing
    const PASSWORD = "E3J501IH";

    // Initial call to display widget
    getWidgetData();

    // Retrieve client data ready for processing
    getClientData();


    // Set up a slidedown panel for order displays
    $("#view").hide();
    $(document).ready(function () {
        $("#view").click(function () {
            $("#panel").slideToggle("slow");
        });
    });

    // Display an error alert on any AJAX error.
    $(document).ajaxError(function () {
        alert("An error occurred, please try again.");
    });

    // Initialize the map platform object:
    let platform = new H.service.Platform({
        // API key for HERE Maps
        apikey: "h7p3f-XtP7I5eFjzxjGAD0XepAboo9QGCTb-uXzLhc8"
    });

    // Obtain the default map types from the platform object:
    let defaultLayers = platform.createDefaultLayers();

    // Instantiate (and display) a map object:
    let map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 12,
            center: {lat: 0, lng: 0}
        }
    );

    // Create the default UI:
    let ui = H.ui.UI.createDefault(map, defaultLayers);
    let mapSettings = ui.getControl("mapsettings");
    let zoom = ui.getControl("zoom");
    let scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    let mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);


    function updateMap() {
        function onSuccess(position) {
            console.log("Obtained position", position);
            let point = {
                lng: position.coords.longitude,
                lat: position.coords.latitude,
            };
            map.setCenter(point);
        }

        function onError(error) {
            console.error("Error calling getCurrentPosition", error);
        }

        navigator.geolocation.getCurrentPosition(onSuccess, onError, {
            enableHighAccuracy: true,
        });
    }

    // Update map on startup
    updateMap();

    //Set up a new order
    function setNewOrder(oucu, client_id) {
        function setSuccess(data) {
            let obj = JSON.parse(data);
            if (obj.status === "success") {
                alert("Your order #" + obj.data[0].id + " has been successfully created.");
                order_id = obj.data[0].id;
                c_name = clients.data[client_id - 1].name;
                c_add = clients.data[client_id - 1].address;
                $("#startOrder").hide();
                $("#view").show();
            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        let onSuccess = function (data) {
            longitude = data[0].lon;
            latitude = data[0].lat;
            sleep(3000)
            $.ajax(url, {
                type: "POST",
                data: {OUCU: oucu, password: PASSWORD, client_id: client_id, latitude: latitude, longitude: longitude},
                success: setSuccess
            });
            let point = {
                lng: longitude,
                lat: latitude
            };
            map.setCenter(point);
            marker = new H.map.DomMarker(point, {icon: domIcon});
            map.addObject(marker);
            todaysOrders();
        };
        if (marker) {
            map.removeObject(marker);
        }
        subCost = 0;
        totalCost = 0;
        costInPounds = 0;
        if (oucu) {
            if (client_id) {
                let address = clients.data[client_id - 1].address;
                nominatim.get(address, onSuccess);
            }
        }
        let url = BASE_URL + "orders";
    }

    // Set a delay timer.
    function sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
            currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }

    //Function retrieves client details
    function getClientData() {
        function clientSuccess(data) {
            clients = JSON.parse(data);
            if (clients.status === "success") {
                console.log("Client Data received: ", clients);
            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        let url = BASE_URL + "clients?OUCU=st5527&password=" + PASSWORD;
        $.ajax(url, {type: "GET", data: {}, success: clientSuccess});

    }

    /* FR 1.2 - Navigating the widgets catalogue (with Previous and Next buttons) 
     * and display of widget images, in addition to the description and asking price. 
     */

    //Function retrieves widget details
    function getWidgetData() {
        function widgetSuccess(data) {
            widgets = JSON.parse(data);
            if (widgets.status === "success") {
                console.log("Widget Data received: ", widgets);
            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
            showWidget();
        }

        // AJAX call to API returns widget data
        let url = BASE_URL + "widgets?OUCU=st5527&password=" + PASSWORD;
        $.ajax(url, {type: "GET", data: {}, success: widgetSuccess});
    }

    //Function to display widget picture
    function showWidget() {
        let pic = (widgets.data[widget_id].url);
        let desc = (widgets.data[widget_id].description);
        price = (widgets.data[widget_id].pence_price);
        $("#image").attr("src", pic);
        $("#details").html("<br>" + desc + "<br><hr>Price: " + price + "p");
    }

    // Cycle to the next widget
    function nextWidget() {
        if (widget_id < widgets.data.length - 1) {
            widget_id++;
            showWidget();
        }
    }

    //Cycle to the previous widget
    function previousWidget() {
        if (widget_id > 0) {
            widget_id--;
            showWidget();
        }
    }

    /* FR1.3 Adding the currently displayed widget to the order items, 
     * including the amount and the agreed price.
     */

    function addToOrder(oucu, order_id, widget, quantity, price_pence) {
        function addSuccess(data) {
            let obj = JSON.parse(data);
            if (obj.status === "success") {
                subCost += cost;
                costInPounds = parseFloat((subCost / 100).toFixed(2));
                vatCost = parseFloat((costInPounds * 0.2).toFixed(2));
                totalCost = (costInPounds + vatCost).toFixed(2);
                getOrderItems(order_id);
                $("#price").val("");
                $("#quantity").val("");
            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        let agreedPrice = getInputValue("price", "");
        let cost = quantity * agreedPrice;
        let addUrl = BASE_URL + "order_items";
        $.ajax(addUrl, {
            type: "POST",
            data: {
                OUCU: oucu,
                password: PASSWORD,
                order_id: order_id,
                widget_id: widget,
                number: quantity,
                pence_price: price_pence
            },
            success: addSuccess
        });
    }


    function getOrderItems(order_id) {
        function itemsSuccess(data) {
            let items = JSON.parse(data);
            console.log("items: ", items);
            itemTable(items);
        }

        let itemsUrl = BASE_URL + "order_items?OUCU=st5527&password=" + PASSWORD + "&order_id=" + order_id;
        $.ajax(itemsUrl, {type: "GET", data: {}, success: itemsSuccess});
    }

    /* FR1.4 Display the sum of ordered items and adding 
     * VAT to the agreed price of each of the order items at 20%.
     */
    function itemTable(items) {
        let obj = items.data;
        let text = "";
        text += "<h3>" + c_name + "</h3>";
        text += "<p>" + c_add + "</p>";
        text += "<table border='1'>";
        text += "<tr><th>Widget No.</th><th>Quantity</th><th>Price Each</th><th>Cost</th></tr>"
        for (let x in obj) {
            text += "<tr><td>" + obj[x].widget_id + "</td><td>" + obj[x].number + "</td><td>" + obj[x].pence_price + "</td><td>" + (obj[x].number * obj[x].pence_price) / 100;
            +"</td></tr>";
        }
        text += "</table>";
        text += "<p>Subtotal: ??" + costInPounds + "</p><p>VAT: ??" + vatCost + "</p><p>Total: ??" + totalCost + "</p>";
        text += "<p>Latitude: " + latitude + "  Longitude: " + longitude + "</p>";
        text += "<button id='complete' type='button' onclick='controller.completeOrder()'>Complete Order</button>";

        $("#panel").html(text);
    }

    // Complete an order and reset the app ready for the next order.
    function completeOrder() {
        alert("Thank you for shopping with MegaMax. Your order has been received.");
        $("#panel").html("");
        $("#oucu").val("");
        $("#client_id").val("");
        $("#startOrder").show();
        $("#view").hide();
        $("#panel").hide();
        widget_id = 0;
        showWidget();
    }

    //Create a date string in the same format as JSON data.
    function showDate(today) {
        return today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
    }

    /* FR2.2 When clicking on Place NEW Order to start an empty order, 
     * displaying the orders along the day???s journey with markers,
     * where the location of client???s addresses are used to place the markers. 
     * A red cross icon will mark the current order, any previous orders from the
     * same day will be clustered with each icon showing the number of orders.
     */
    function todaysOrders() {
        let todayUrl = BASE_URL + "orders?OUCU=st5527&password=" + PASSWORD;

        function todaySuccess(data) {
            currentOrders = [];
            let obj = JSON.parse(data);
            if (obj.status === "success") {
                let x;
                for (x = 0; x < obj.data.length; x++) {
                    let string = obj.data[x].date;
                    let sub = string.substr(0, 10);
                    console.log(sub);
                    if (sub === showDate(today)) {
                        let point = {
                            lng: obj.data[x].longitude,
                            lat: obj.data[x].latitude
                        };
                        currentOrders.push(point);
                    }
                }
                let dataPoints = [];
                for (x = 0; x < currentOrders.length; x++) {
                    dataPoints.push(new H.clustering.DataPoint(currentOrders[x].lat, currentOrders[x].lng));
                }
                let clusteredDataProvider = new H.clustering.Provider(dataPoints);
                // Create a layer that includes the data provider and its data points: 
                let layer = new H.map.layer.ObjectLayer(clusteredDataProvider);
                // Add the layer to the map:
                map.addLayer(layer);
            } else if (obj.message) {
                alert(obj.message);
            } else {
                alert(obj.status + " " + obj.data[0].reason);
            }
        }

        $.ajax(todayUrl, {type: "GET", data: {}, success: todaySuccess});
    }


    /* PUBLIC FUNCTIONS
    /* accessible from the view object
     */

    //Call to set a new order
    this.setNewOrder = function () {
        let oucu = getInputValue("oucu", "");
        let client_id = getInputValue("client_id", "");
        setNewOrder(oucu, client_id);
    }

    //FR 1.1 - validation of OUCU.
    /*    this.validate = function () {
            let oucu = getInputValue("oucu", "user1");
            console.log(oucu);
        }*/

    // Cycle to next widget
    this.n_widget = function () {
        nextWidget();
    }

    // Cycle to previous widget
    this.p_widget = function () {
        previousWidget();
    }

    // Call to add item to current order.
    this.addToOrder = function () {
        oucu = getInputValue("oucu", "");
        let orderNum = order_id;
        let widget = widgets.data[widget_id].id;
        let quantity = getInputValue("quantity", "");
        let price_pence = getInputValue("price", widgets.data[widget_id].pence_price);
        addToOrder(oucu, orderNum, widget, quantity, price_pence);
    }

    // Call to complete order.
    this.completeOrder = function () {
        completeOrder();
    }
}