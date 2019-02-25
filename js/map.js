
  function onGoogleMapResponse(){
   
    map = new google.maps.Map(document.getElementById('googleMapContainer'), {
      center: {lat: 40.730610, lng: -73.935242},
      zoom: 11,
      styles:[
    {
        "featureType": "landscape.man_made",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f7f1df"
            }
        ]
    },
    {
        "featureType": "landscape.natural",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#d0e3b4"
            }
        ]
    },
    {
        "featureType": "landscape.natural.terrain",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.business",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "poi.medical",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#fbd3da"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#bde6ab"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffe15f"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#efd151"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "black"
            }
        ]
    },
    {
        "featureType": "transit.station.airport",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "color": "#cfb2db"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#a2daf2"
            }
        ]
    }
]
    });
    map.data.loadGeoJson("https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?	where=1=1&outFields=*&outSR=4326&f=geojson");
    map.data.addListener('mouseover', mouseInToRegion);  
    map.data.addListener('mouseout', mouseOutOfRegion);
    map.data.setStyle(styleFeature);
    
}

function mouseInToRegion(e) {
    // set the hover state so the setStyle function can change the border
    let id = e.feature.getProperty('OBJECTID');
    let name;
    let BoroCD = e.feature.getProperty('BoroCD');
    if (BoroCD >= 100 && BoroCD < 200) {
        name = "Manhattan";
    } else if (BoroCD >= 200 && BoroCD < 300) {
        name = "Bronx";
    } else if (BoroCD >= 300 && BoroCD < 400) {
        name = "Brooklyn";
    } else if (BoroCD >= 400 && BoroCD < 500) {
        name = "Queens";
    } else {
        name = "Staten Island";
    }

    let type = "";
    let value = 0;
    if(distanceShowing){
        type = "Distance";

        value = e.feature.getProperty('Distance');
        var percent = (value - distanciaMin) /
                (distanciaMax - distanciaMin) * 100;
                

    document.getElementById('data-box2').style.display = 'block';
    value = Math.round((value/1000) * 100) / 100 + "Km";
    document.getElementById('data-caret').style.display = 'block';
    
    }

    else if(safetyShowing){
        type = "Crimes";
        value = e.feature.getProperty('Crimes');
        var percent = (value - crimesMin) /
                (crimesMax - crimesMin) * 100;
                
    document.getElementById('data-box2').style.display = 'block';
    document.getElementById('data-caret').style.display = 'block';
    
    }

    else if(afforabilityShowing){
        type = "Low Income";
        value = e.feature.getProperty('Affordability');
        var percent = (value - afforMin) /
                (afforMax - afforMin) * 100;
                
    document.getElementById('data-box2').style.display = 'block';
    document.getElementById('data-caret').style.display = 'block';
    
    }

    document.getElementById('data-box').style.display = 'block';
        
    document.getElementById('data-label').textContent =  name;
    document.getElementById('data-value').textContent = "District " + e.feature.getProperty('BoroCD')%100;
    
    document.getElementById('data-label2').textContent =  type;
    document.getElementById('data-value2').textContent =   value;

    document.getElementById('data-caret').style.paddingLeft = percent + '%';



    e.feature.setProperty('OBJECTID', parseFloat(id,10)+1000);
  }

  function mouseOutOfRegion(e) {
    // reset the hover state, returning the border to normal
    let id = e.feature.getProperty('OBJECTID');
    e.feature.setProperty('OBJECTID', parseFloat(id,10)-1000);
  }

  function styleFeature(feature){

    var BoroCD = feature.getProperty('BoroCD');
    var color;

    

    var outlineWeight = 0.5, zIndex = 1;
    var outlineWeight = 0.5, zIndex = 1;
    let id = feature.getProperty('OBJECTID');
    if (id >= 100) {
      outlineWeight = zIndex = 2;
    }

    if (BoroCD >= 100 && BoroCD < 200) {
      feature.setProperty("Neigbourhood", "Manhattan");
      
      color = "red";
    } else if (BoroCD >= 200 && BoroCD < 300) {
      color = "green";
      feature.setProperty("Neigbourhood", "Bronx");
    } else if (BoroCD >= 300 && BoroCD < 400) {
      color = "yellow";
      feature.setProperty("Neigbourhood", "Brooklyn");
    } else if (BoroCD >= 400 && BoroCD < 500) {
      color = "black";
      feature.setProperty("Neigbourhood", "Queens");
    } else if(BoroCD >= 500 && BoroCD < 600) {
      color = "blue";
      feature.setProperty("Neigbourhood", "Staten Island");
    } else {
        console.log("Error setting names at " + BoroCD);
    }
    
    //Last element on features
    if(BoroCD == 210){
      if(onlyDoOnce == false){
      calculateDistanceAndStuff();
      onlyDoOnce = true;
      }
    }

    return {
      fillColor: color,
      strokeWeight: 0.3,
      strokeWeight: outlineWeight,
      strokeColor: '#fff',
      zIndex: zIndex,
    };
  }

  
  
  