/**
 * Created by Joseph on 8/30/2016.
 */
var map;

function initMap(){
    var geoCords = [];
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.414653, lng: -122.078533},
        zoom: 15
    });
}

function resizeMap(markers) {
    var bounds = new google.maps.LatLngBounds();
    for(var i = 0; i < markers.length; i++) {
        bounds.extend(markers[i].marker.getPosition());
    }
    map.fitBounds(bounds);
}