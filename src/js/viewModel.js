/**
 * Created by Joseph on 8/31/2016.
 */
var MAP_KEY = 'AIzaSyCkW6FCwPhwzhiHG48DbjzCFP_1lGXLQWA';
var infoWindow = new google.maps.InfoWindow();
var locationModel;
var filterInputElement = $('#filter-input');

function Location(name, address, marker, thirdPartyData) {
    var self = this;
    self.name = name;
    self.address = address;
    self.marker = marker;
    self.thirdPartData = thirdPartyData;
}

function ListItem(item, visible) {
    this.item = item;
    this.visible = ko.observable(visible);
}

function LocationViewModel() {

    var self = this;
    self.listItems = ko.observableArray([
        new ListItem(new Location("Google", "1600 Amphitheatre Pkwy, Mountain View, CA 94043", null, null), true),
        new ListItem(new Location("Shoreline Amphitheatre", "1 Amphitheatre Pkwy, Mountain View, CA 94043", null, null), true),
        new ListItem(new Location("Mozart Foundation Automobile Museum", "1325 Pear Ave, Mountain View, CA 94043", null, null), true),
        new ListItem(new Location("Computer History Museum", "1401 N Shoreline Blvd, Mountain View, CA 94043", null, null), true),
        new ListItem(new Location("Century Cinema 16", "1500 N Shoreline Blvd, Mountain View, CA 94043", null, null), true)

    ]);

    self.filter = function () {
        var filterBy = filterInputElement.val();
        for(var i = 0; i < self.listItems().length; i++){
            if(self.listItems()[i].item.name.substring(0,filterBy.length).toLowerCase() === filterBy.toLowerCase()){
                self.listItems()[i].visible(true);
                self.listItems()[i].item.marker.setMap(map);
            }
            else {
                self.listItems()[i].visible(false);
                self.listItems()[i].item.marker.setMap(null);
            }
        }
        if(filterBy.length === 0){
            self.removeFilter();
        }
        console.log("Filtered");
        return true;
    };

    self.removeFilter = function () {
        for (var i = 0; i < self.listItems().length; i++) {
            self.listItems()[i].visible(true);
            self.listItems()[i].item.marker.setMap(map);
        }
        filterInputElement.val('');
    };

    self.getMarker = function(name, address, expectedNum) {
        $.getJSON("https://maps.googleapis.com/maps/api/geocode/json?address=" + address.replace(/ /g, '+') + MAP_KEY, function (data) {
            var index = findItemInArray(self.listItems, name);
            self.listItems()[index].item.marker = new google.maps.Marker({
                position: {lat: data.results[0].geometry.location.lat, lng: data.results[0].geometry.location.lng},
                map: map,
                title: name
            });
            attachInfoWindow(self.listItems()[index].item.marker);
            numResponse++;
            if (numResponse === expectedNum) {
                var markers = [];
                for(var i = 0; i < self.listItems().length; i++){
                    markers.push(self.listItems()[i].item.marker)
                }
                resizeMap(markers);
            }
        });
    };

    self.getThirdPartyData = function(name, address){

    };

    function attachInfoWindow(marker) {
        marker.addListener('click', function () {
            infoWindow.setContent("Address ");
            infoWindow.open(map, this);
        });
    }

    self.selectMarker = function(element){
        infoWindow.open(map, element.item.marker);
    };

    var numResponse = 0;
    var numResponseExpected = self.listItems().length;
    for (var i = 0; i < self.listItems().length; i++) {
        self.getMarker(self.listItems()[i].item.name, self.listItems()[i].item.address, numResponseExpected);

    }
}

function findItemInArray(array, query){
    for(var i = 0; i < array().length; i++){
        if(array()[i].item.name === query){
            return i;
        }
    }
    return -1;
}

locationModel = new LocationViewModel();
ko.applyBindings(locationModel);