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

var controller, order, widgets, clients, order_id, price;
var c_name, c_add, latitude, longitude, coords, oucu;
var widget_id = 0;
var subCost = 0;
var totalCost = 0;
var vatCost = 0;
var costInPounds = 0;
//Set today's date as a constant.
const today = new Date();
var currentOrders = [];

// Wait for the deviceready event before using any of Cordova's device APIs.
// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!
    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
}

controller = new MegaMaxApp();


function MegaMaxApp() {

    // Pathway to the API endpoints.
    const BASE_URL = "http://137.108.92.9/openstack/api/";
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

    // Initialize the map platform object:
    var platform = new H.service.Platform({
        // API key for HERE Maps
        apikey: "h7p3f-XtP7I5eFjzxjGAD0XepAboo9QGCTb-uXzLhc8"
    });

    // Obtain the default map types from the platform object:
    var defaultLayers = platform.createDefaultLayers();

    // Instantiate (and display) a map object:
    var map = new H.Map(
        document.getElementById("mapContainer"),
        defaultLayers.vector.normal.map,
        {
            zoom: 12,
            center: { lat: 52.407886, lng: -4.057142 }
        }
    );

    // Create the default UI:
    var ui = H.ui.UI.createDefault(map, defaultLayers);
    var mapSettings = ui.getControl("mapsettings");
    var zoom = ui.getControl("zoom");
    var scalebar = ui.getControl("scalebar");
    mapSettings.setAlignment("top-left");
    zoom.setAlignment("top-left");
    scalebar.setAlignment("top-left");
    // Enable the event system on the map instance:
    var mapEvents = new H.mapevents.MapEvents(map);
    // Instantiate the default behavior, providing the mapEvents object:
    new H.mapevents.Behavior(mapEvents);

    //Set up a new order
    function setNewOrder(oucu, client_id) {
        function setSuccess(data) {
            var obj = JSON.parse(data);
            if (obj.status === "success") {
                alert("Your order #" + obj.data[0].id + " has been successfully created.");
                order_id = obj.data[0].id;
                c_name = clients.data[client_id - 1].name;
                c_add = clients.data[client_id - 1].address;
                $("#startOrder").hide();
                $("#view").show();

            }
        }

        var onSuccess = function (data) {
            longitude = data[0].lon;
            latitude = data[0].lat;
            sleep(3000)
            $.ajax(url, { type: "POST", data: { OUCU: oucu, password: PASSWORD, client_id: client_id, latitude: latitude, longitude: longitude }, success: setSuccess });
            var point = {
                lng: longitude,
                lat: latitude
            };
            map.setCenter(point);
            var marker = new H.map.Marker(point);
            map.addObject(marker);
            todaysOrders();
        }
        totalCost = 0;
        costInPounds = 0;
        var address = clients.data[client_id - 1].address;
        nominatim.get(address, onSuccess);
        var url = BASE_URL + "orders";
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
            }
        }
        var url = BASE_URL + "clients?OUCU=st5527&password=" + PASSWORD;
        $.ajax(url, { type: "GET", data: {}, success: clientSuccess });

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
            }
            showWidget();
        }
        // AJAX call to API returns widget data
        var url = BASE_URL + "widgets?OUCU=st5527&password=" + PASSWORD;
        $.ajax(url, { type: "GET", data: {}, success: widgetSuccess });
    }

    //Function to display widget picture
    function showWidget() {
        var pic = (widgets.data[widget_id].url);
        var desc = (widgets.data[widget_id].description);
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
            var obj = JSON.parse(data)
            if (obj.status === "success") {
                subCost += cost;
                costInPounds = parseFloat((subCost / 100).toFixed(2));
                vatCost = parseFloat((costInPounds * 0.2).toFixed(2));
                totalCost = costInPounds + vatCost;
                getOrderItems(order_id);
                $("#price").val("");
                $("#quantity").val("");
            }
        }
        var agreedPrice = getInputValue("price", "");
        var cost = quantity * agreedPrice;
        var addUrl = BASE_URL + "order_items";
        $.ajax(addUrl, { type: "POST", data: { OUCU: oucu, password: PASSWORD, order_id: order_id, widget_id: widget, number: quantity, pence_price: price_pence }, success: addSuccess });
    }


    function getOrderItems(order_id) {
        function itemsSuccess(data) {
            var items = JSON.parse(data);
            console.log("items: ", items);
            itemTable(items);
        }
        var id = order_id;
        var itemsUrl = BASE_URL + "order_items?OUCU=st5527&password=" + PASSWORD + "&order_id=" + id;
        $.ajax(itemsUrl, { type: "GET", data: {}, success: itemsSuccess });
    }

    /* FR1.4 Display the sum of ordered items and adding 
     * VAT to the agreed price of each of the order items at 20%.
     */
    function itemTable(items) {
        var obj = items.data;
        var text = "";
        text += "<h3>" + c_name + "</h3>";
        text += "<p>" + c_add + "</p>";
        text += "<table border='1'>";
        text += "<tr><th>Widget No.</th><th>Quantity</th><th>Price Each</th><th>Cost</th></tr>"
        for (var x in obj) {
            text += "<tr><td>" + obj[x].widget_id + "</td><td>" + obj[x].number + "</td><td>" + obj[x].pence_price + "</td><td>" + (obj[x].number * obj[x].pence_price) / 100; +"</td></tr>";
        }
        text += "</table>";
        text += "<p>Subtotal: £" + costInPounds + "</p><p>VAT: £" + vatCost + "</p><p>Total: £" + totalCost + "</p>";
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
        var fullDate = today.getFullYear() + '-' + ('0' + (today.getMonth() + 1)).slice(-2) + '-' + ('0' + today.getDate()).slice(-2);
        return fullDate;
    }

    /* FR2.2 When clicking on Place NEW Order to start an empty order, 
     * displaying the orders along the day’s journey with markers,
     * where the location of client’s addresses are used to place the markers. 
     */
    function todaysOrders() {
        var todayUrl = BASE_URL + "orders?OUCU=st5527&password=" + PASSWORD;
        function todaySuccess(data) {
            currentOrders = [];
            var obj = JSON.parse(data);
            console.log(obj);
            if (obj.status === "success") {
                for (var x = 0; x < obj.data.length; x++) {
                    var string = obj.data[x].date;
                    var sub = string.substr(0, 10);
                    console.log(sub);
                    if (sub == showDate(today)) {
                        var point = {
                            lng: obj.data[x].longitude,
                            lat: obj.data[x].latitude
                        }
                        currentOrders.push(point);
                    }

                }
                for (var x = 0; x < currentOrders.length; x++) {
                    var marker = new H.map.Marker(currentOrders[x]);
                    map.addObject(marker);
                }
            }
        }
        $.ajax(todayUrl, { type: "GET", data: {}, success: todaySuccess });
    }



    /* PUBLIC FUNCTIONS
    /* accessable from the view object
     */

    //Call to set a new order
    this.setNewOrder = function () {
        var oucu = getInputValue("oucu", "");
        var client_id = getInputValue("client_id", "");
        setNewOrder(oucu, client_id);
    }

    //FR 1.1 - validation of OUCU.
    this.validate = function () {
        var oucu = getInputValue("oucu", "user1");
        console.log(oucu);
    }

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
        var orderNum = order_id;
        var widget = widgets.data[widget_id].id;
        var quantity = getInputValue("quantity", "");
        var price_pence = getInputValue("price", widgets.data[widget_id].pence_price);
        addToOrder(oucu, orderNum, widget, quantity, price_pence);
    }

    // Call to complete order.
    this.completeOrder = function () {
        completeOrder();
    }
}