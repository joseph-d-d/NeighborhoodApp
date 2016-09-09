/**
 * Created by Joseph on 8/31/2016.
 */
var MAP_KEY = 'AIzaSyCkW6FCwPhwzhiHG48DbjzCFP_1lGXLQWA';
var mapMarkers = [];
var thirdPartyData = [];
var infoWindow = new google.maps.InfoWindow();
var locationModel;
function Marker(address) {
    this.address = address;
}

function Location(name, address) {
    var self = this;
    self.name = name;
    self.address = address;
}

function ListItem(item, visible) {
    this.item = item;
    this.visible = ko.observable(visible);
}

function LocationViewModel() {

    var self = this;
    self.listItems = ko.observableArray([
        new ListItem(new Location("Google", "1600 Amphitheatre Pkwy, Mountain View, CA 94043"), true),
        new ListItem(new Location("Shoreline Amphitheatre", "1 Amphitheatre Pkwy, Mountain View, CA 94043"), true),
        new ListItem(new Location("Mozart Foundation Automobile Museum", "1325 Pear Ave, Mountain View, CA 94043"), true),
        new ListItem(new Location("Computer History Museum", "1401 N Shoreline Blvd, Mountain View, CA 94043"), true),
        new ListItem(new Location("Century Cinema 16", "1500 N Shoreline Blvd, Mountain View, CA 94043"), true)

    ]);
    self.filter = function (listItem) {
        for (var i = 0; i < self.listItems().length; i++) {
            self.listItems()[i].visible(false);
            if (mapMarkers[i].address !== listItem.item.address) {
                mapMarkers[i].marker.setMap(null);
            }
        }
        listItem.visible(true);
    };

    self.removeFilter = function () {
        for (var i = 0; i < self.listItems().length; i++) {
            self.listItems()[i].visible(true);
            mapMarkers[i].marker.setMap(map);
        }
    };

    function getMarker(name, address, expectedNum) {
        $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address=" + address.replace(/ /g, '+') + MAP_KEY, function (data) {
            var tempMarker = new Marker(address);
            tempMarker.marker = new google.maps.Marker({
                position: {lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng},
                map: map,
                title: name
            });
            mapMarkers.push(tempMarker);
            attachInfoWindow(tempMarker.marker);
            numResponse++;
            if (numResponse === expectedNum) {
                resizeMap(mapMarkers);
            }
        });
    }

    function attachInfoWindow(marker) {
        marker.addListener('click', function () {
            infoWindow.setContent("Address ");
            infoWindow.open(map, this);
        });
    }


    var numResponse = 0;
    var numResponseExpected = self.listItems().length;
    for (var i = 0; i < self.listItems().length; i++) {
        getMarker(self.listItems()[i].item.name, self.listItems()[i].item.address, numResponseExpected);
        //getInfoWindow(self.listItems()[i].item.address);

    }


}

locationModel = new LocationViewModel();
ko.applyBindings(locationModel);