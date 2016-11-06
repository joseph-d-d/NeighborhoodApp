/**
 * Created by Joseph on 8/31/2016.
 */
var MAP_KEY = 'AIzaSyCkW6FCwPhwzhiHG48DbjzCFP_1lGXLQWA';
var CLIENT_ID = 'ZWI00VLLOOCDO3KNPL1URSOBTSK3BNUVJYTI3PDMDQES4E2S';
var CLIENT_SECRECT = 'QLCIS5IGUN1QWOW5GLCKBTAKIISEFE3QHTS011R1C0DLI1DP';


var headerHTML = '<h1 class="info-header">%%data</h1>';
var infoHTML = '<p class="info-p">%%data %%data</p>';
var hyperLinkHTML = '<a href="%%data" class="info-hyperlink">%%data</a>';
var imageHTML = '<img src="%%data">';

function Errors() {
    var self = this;
    self.fourSquareErrorCalled = false;
    self.googleErrorCalled = false;
    self.fourSquareError = function (error) {
        if (self.fourSquareErrorCalled === false) {
            self.errorPrompt(error);
            self.fourSquareErrorCalled = true;
        }
    };

    self.googleError = function (error) {
        if (self.googleErrorCalled === false) {
            self.errorPrompt(error);
            self.googleErrorCalled = true;
        }
    };

    self.errorPrompt = function (error) {
        alert(error);
    };
}

var errorNotification = new Errors();

function Location(name, address) {
    var self = this;
    self.name = name;
    self.address = address;
    self.marker = null;
    self.thirdPartyPhotos = null;
    self.thirdPartyData = null;
}

function LocationViewModel() {

    var self = this;
    var currentMarker = null;
    self.filterInput = ko.observable('');
    self.locationList = ko.observableArray([
        new Location("Google", "1600 Amphitheatre Pkwy, Mountain View, CA 94043"),
        new Location("Shoreline Amphitheatre", "1 Amphitheatre Pkwy, Mountain View, CA 94043"),
        new Location("Mozart Foundation Automobile Museum", "1325 Pear Ave, Mountain View, CA 94043"),
        new Location("Computer History Museum", "1401 N Shoreline Blvd, Mountain View, CA 94043"),
        new Location("Century Cinema 16", "1500 N Shoreline Blvd, Mountain View, CA 94043")

    ]);

    //Makes all list items visible and places all map markers back on map
    self.removeFilter = function () {
        for (var i = 0; i < self.locationList().length; i++) {
            if (self.locationList()[i].marker !== null) {
                self.locationList()[i].marker.setVisible(true);
            }
        }
        self.filterInput('');
        infoWindow.close();
    };

    //Filters Locations by whatever is located in the filter input
    self.filteredLocations = ko.computed(function () {
        //If nothing is in the filter input remove filter
        if (!self.filterInput()) {
            self.removeFilter();
            return self.locationList();
        }
        else {
            var filtered = ko.utils.arrayFilter(self.locationList(), function (location) {
                return location.name.toLowerCase().indexOf(self.filterInput().toLowerCase()) !== -1;
            });
            for (var index = 0; index < self.locationList().length; index++) {
                self.locationList()[index].marker.setVisible(false);
            }
            for (var i = 0; i < filtered.length; i++) {
                filtered[i].marker.setVisible(true);
            }
            return filtered;
        }
    });


    //Gets Markers amd street view image from Google
    self.getMarker = function (name, address, expectedNum) {
        $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address=" + address.replace(/ /g, '+') + MAP_KEY, function (data) {
            var index = findItemInArray(self.locationList, name);
            self.locationList()[index].marker = new google.maps.Marker({
                position: {lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng},
                map: map,
                title: name
            });
            self.attachInfoWindow(self.locationList()[index].marker);
            self.locationList()[index].thirdPartyPhotos = imageHTML.replace('%%data', 'https://maps.googleapis.com/maps/api/streetview?size=300x150' +
            '&location=' + data.results[0].geometry.location.lat + ',' + data.results[0].geometry.location.lng +
            '&heading=200&pitch=-0.76' +
            '&key=' + MAP_KEY);
            //Checks to make sure all response for markers have finished before resizing the map
            numResponse++;
            if (numResponse === expectedNum) {
                var markers = new Array(5);
                for (var i = 0; i < self.locationList().length; i++) {
                    markers[i] = self.locationList()[i].marker;
                }
                resizeMap(markers);
            }
        }).fail(function (jqXHR, status, error) {
            errorNotification.googleError('Failed to load data from Google please refresh');
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
            var index = findItemInArray(self.locationList, name);
            var info;
            if (response.response.venues[0].name !== undefined) {
                info = headerHTML.replace('%%data', response.response.venues[0].name);
            }
            else {
                info = headerHTML.replace('%%data', 'Name Could Not Loaded');
            }
            if (response.response.venues[0].hereNow.count !== undefined) {
                info = info + infoHTML.replace('%%data', 'People here now').replace('%%data', response.response.venues[0].hereNow.count);
            }
            else {
                info = info + infoHTML.replace('%%data', 'Could not load number of people here');
            }
            if (response.response.venues[0].stats.checkinsCount !== undefined) {
                info = info + infoHTML.replace('%%data', 'Check in count').replace('%%data', response.response.venues[0].stats.checkinsCount);
            }
            else {
                info = info + infoHTML.replace('%%data', 'Could not load number of checkins');
            }
            info = info + hyperLinkHTML.replace('%%data', 'https://foursquare.com/').replace('%%data', 'Provided by Foursquare');
            self.locationList()[index].thirdPartyData = info;
        }).fail(function (jqXHR, status, error) {
            errorNotification.fourSquareError('Failed to load data from FourSquare please refresh');
        });
    };

    self.attachInfoWindow = function (marker) {
        marker.addListener('click', function () {
            //find the list item that the marker belongs to
            for (var i = 0; i < self.locationList().length; i++) {
                if (marker === self.locationList()[i].marker) {
                    self.displayInfoWindow(self.locationList()[i]);
                    break;
                }
            }
        });
    };

    self.selectMarker = function (element) {
        self.displayInfoWindow(element);
    };

    self.displayInfoWindow = function (location) {
        //If the item that is clicked is the same item that is currently selected reset the animation and close the info window
        if (currentMarker === location.marker) {
            self.resetMarkers();
        }
        else {
            currentMarker = location.marker;
            self.resetOtherMarkers();
            infoWindow.setContent(location.thirdPartyPhotos + location.thirdPartyData);
            infoWindow.open(map, location.marker);
            map.setCenter(currentMarker.getPosition());
            location.marker.setAnimation(google.maps.Animation.BOUNCE);
        }
    };

    self.resetMarkers = function () {
        for (var i = 0; i < self.locationList().length; i++) {
            self.locationList()[i].marker.setAnimation(null);
        }
        infoWindow.close();
        currentMarker = null;
    };

    //Removes the animation from all markers so when the user clicks from one marker to another the previous one stops bouncing
    self.resetOtherMarkers = function () {
        for (var i = 0; i < self.locationList().length; i++) {
            self.locationList()[i].marker.setAnimation(null);
        }
    };

    var numResponse = 0;
    var numResponseExpected = self.locationList().length;
    for (var i = 0; i < self.locationList().length; i++) {
        self.getMarker(self.locationList()[i].name, self.locationList()[i].address, numResponseExpected);
        self.getThirdPartyData(self.locationList()[i].name, self.locationList()[i].address);
    }


}

function findItemInArray(array, query) {
    for (var i = 0; i < array().length; i++) {
        if (array()[i].name === query) {
            return i;
        }
    }
    return -1;
}

