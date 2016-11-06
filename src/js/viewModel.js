/**
 * Created by Joseph on 8/31/2016.
 */
var MAP_KEY = 'AIzaSyCkW6FCwPhwzhiHG48DbjzCFP_1lGXLQWA';
var CLIENT_ID = 'ZWI00VLLOOCDO3KNPL1URSOBTSK3BNUVJYTI3PDMDQES4E2S';
var CLIENT_SECRECT = 'QLCIS5IGUN1QWOW5GLCKBTAKIISEFE3QHTS011R1C0DLI1DP';
var infoWindow = new google.maps.InfoWindow();

var headerHTML = '<h1 class="info-header">%%data</h1>';
var infoHTML = '<p class="info-p">%%data %%data</p>';
var hyperLinkHTML = '<a href="%%data" class="info-hyperlink">%%data</a>';
var imageHTML = '<img src="%%data">';
var filterInputElement = $('#filter-input');

function Location(name, address) {
    var self = this;
    self.name = name;
    self.address = address;
    self.marker = null;
    self.thirdPartyPhotos = null;
    self.thirdPartyData = null;
}

function ListItem(item, visible) {
    this.item = item;
    this.visible = ko.observable(visible);
}

function LocationViewModel() {

    var self = this;
    var currentMarker = null;
    self.listItems = ko.observableArray([
        new ListItem(new Location("Google", "1600 Amphitheatre Pkwy, Mountain View, CA 94043"), true),
        new ListItem(new Location("Shoreline Amphitheatre", "1 Amphitheatre Pkwy, Mountain View, CA 94043"), true),
        new ListItem(new Location("Mozart Foundation Automobile Museum", "1325 Pear Ave, Mountain View, CA 94043"), true),
        new ListItem(new Location("Computer History Museum", "1401 N Shoreline Blvd, Mountain View, CA 94043"), true),
        new ListItem(new Location("Century Cinema 16", "1500 N Shoreline Blvd, Mountain View, CA 94043"), true)

    ]);

    //Filters Locations by whatever is located in the filter input
    self.filter = function () {
        var filterBy = filterInputElement.val();
        for (var i = 0; i < self.listItems().length; i++) {
            if (self.listItems()[i].item.name.substring(0, filterBy.length).toLowerCase() === filterBy.toLowerCase()) {
                self.listItems()[i].visible(true);
                self.listItems()[i].item.marker.setMap(map);
            }
            else {
                self.listItems()[i].visible(false);
                self.listItems()[i].item.marker.setMap(null);
            }
        }
        //If nothing is in the filter input remove filter
        if (filterBy.length === 0) {
            self.removeFilter();
        }
        return true;
    };

    //Makes all list items visible and places all map markers back on map
    self.removeFilter = function () {
        for (var i = 0; i < self.listItems().length; i++) {
            self.listItems()[i].visible(true);
            self.listItems()[i].item.marker.setMap(map);
        }
        filterInputElement.val('');
        infoWindow.close();
    };

    //Gets Markers amd street view image from Google
    self.getMarker = function (name, address, expectedNum) {
        $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address=" + address.replace(/ /g, '+') + MAP_KEY, function (data) {
            var index = findItemInArray(self.listItems, name);
            self.listItems()[index].item.marker = new google.maps.Marker({
                position: {lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng},
                map: map,
                title: name
            });
            self.attachInfoWindow(self.listItems()[index].item.marker);
            self.listItems()[index].item.thirdPartyPhotos = imageHTML.replace('%%data', 'https://maps.googleapis.com/maps/api/streetview?size=300x150' +
            '&location=' + data.results[0].geometry.location.lat + ',' + data.results[0].geometry.location.lng +
            '&heading=200&pitch=-0.76' +
            '&key=' + MAP_KEY);
            //Checks to make sure all response for markers have finished before resizing the map
            numResponse++;
            if (numResponse === expectedNum) {
                var markers = new Array(5);
                for (var i = 0; i < self.listItems().length; i++) {
                    markers[i] = self.listItems()[i].item.marker;
                }
                resizeMap(markers);
            }
        }).fail(function (jqXHR, status, error) {
            self.errorPrompt('Failed to load data from Google please refresh');
        });

    };

    //Gets information for each location from Foursquare
    self.getThirdPartyData = function (name, address) {
        $.ajax({
            method: 'GET',
            url: 'https://api.foursquare.com/v2/venues/search' +
            '?client_id=' + CLIENT_ID +
            '&client_secret=' + CLIENT_SECRECT +
            '&v=20130815 ' +
            '&near=' + "Mountain+View" +
            '&query=' + name.replace(/ /g, '+') +
            '&address' + address.replace(/ /g, '+')
        }).done(function (response) {
            //Places thirdparty data in location and formats using html
            console.log(response);
            var index = findItemInArray(self.listItems, name);
            var info = headerHTML.replace('%%data', response.response.venues[0].name);
            info = info + infoHTML.replace('%%data', 'People here now').replace('%%data', response.response.venues[0].hereNow.count);
            info = info + infoHTML.replace('%%data', 'Check in count').replace('%%data', response.response.venues[0].stats.checkinsCount);
            info = info + hyperLinkHTML.replace('%%data', 'https://foursquare.com/').replace('%%data', 'Provided by Foursquare');
            self.listItems()[index].item.thirdPartyData = info;
        }).fail(function (jqXHR, status, error) {
            self.errorPrompt('Failed to load data from FourSquare please refresh');
        });
    };

    self.attachInfoWindow = function (marker) {
        marker.addListener('click', function () {

            //find the list item that the marker belongs to
            for (var i = 0; i < self.listItems().length; i++) {
                if (marker === self.listItems()[i].item.marker) {
                    self.displayInfoWindow(self.listItems()[i].item);
                    break;
                }
            }
        });
    };

    self.selectMarker = function (element) {
        self.displayInfoWindow(element.item);
    };

    self.displayInfoWindow = function (item) {
        //If the item that is clicked is the same item that is currently selected reset the animation and close the info window
        if (currentMarker === item.marker) {
            self.resetMarkers();
        }
        else {
            currentMarker = item.marker;
            self.resetOtherMarkers();
            infoWindow.setContent(item.thirdPartyPhotos + item.thirdPartyData);
            infoWindow.open(map, item.marker);
            item.marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    };

    self.resetMarkers = function () {
        for (var i = 0; i < self.listItems().length; i++) {
            self.listItems()[i].item.marker.setAnimation(null);
        }
        infoWindow.close();
        currentMarker = null;
    };

    //Removes the animation from all markers so when the user clicks from one marker to another the previous one stops bouncing
    self.resetOtherMarkers = function () {
        for (var i = 0; i < self.listItems().length; i++) {
            self.listItems()[i].item.marker.setAnimation(null);
        }
    };

    var numResponse = 0;
    var numResponseExpected = self.listItems().length;
    for (var i = 0; i < self.listItems().length; i++) {
        self.getMarker(self.listItems()[i].item.name, self.listItems()[i].item.address, numResponseExpected);
        self.getThirdPartyData(self.listItems()[i].item.name, self.listItems()[i].item.address);
    }

    self.errorPrompt = function (error) {
        alert(error);
    };
}

function findItemInArray(array, query) {
    for (var i = 0; i < array().length; i++) {
        if (array()[i].item.name === query) {
            return i;
        }
    }
    return -1;
}

ko.applyBindings(new LocationViewModel());