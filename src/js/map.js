/**
 * Created by Joseph on 8/30/2016.
 */
var map;
var infoWindow;
var bounds;

function initMap(){
    var geoCords = [];
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.414653, lng: -122.078533},
        zoom: 15
    });
    infoWindow = new google.maps.InfoWindow();
    ko.applyBindings(new LocationViewModel());
}

function mapError() {
    alert('Google Maps failed to load, refresh page');
}

function resizeMap(markers) {
    bounds = new google.maps.LatLngBounds();
    for(var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].getPosition());
    }

}

window.onresize = function() {
    map.fitBounds(bounds);
};
