/*
    Feel free to put your custom js here.
  */

  /********************  Variables ******************************/

 let neighborhood_names;
 let ny_districts_shapes;
 let crimes_ny;
 let housing_by_building;
 var map;
 var markerCluster;
 var markers;
 let center = [];
 let distance = [];
 let nyuLat = 40.730610;
 let nyuLng = -73.935242;
 let mediumDistance;
 let borosDistance = [];
 let borosCrime = [];
 let puntosCrimenes = [];
 let polygons = [];
 let listPolygons = [];
 let listMultiPolygons = [];
 let lowIncome = [];
 let crimenes = [];
 /* *************************************************************** */

 $(document).ready(function(){
  $("#distanceBtn").prop("disabled",true);
  $("#safetyBtn").prop("disabled",true);

  
 
  /************************* Distance **************************** */
  neighborhood_names = getData("https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD");
  neighborhood_names.then(function (data) {
    var marker = new google.maps.Marker({
      position: {
        lat: 40.730610,
        lng: -73.935242
      },
      map: map,
      title: 'NYU Stern School of Business'
    });

    map.data.loadGeoJson("https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/nycd/FeatureServer/0/query?	where=1=1&outFields=*&outSR=4326&f=geojson");

 

    names = data["data"];
    let coordenadas = [];
    let dataHeat = [];
    let latIndex, lonIndex, lat, lng;
    for (let i in names) {
      let coords = names[i][8];
      lonIndex = coords.indexOf("(");
      latIndex = coords.indexOf("40.");
      lat = coords.substring(latIndex, latIndex + 13);
      lng = coords.substring(lonIndex + 1, lonIndex + 13);
      coordenadas.push([parseFloat(lat, 10), parseFloat(lng, 10), names[i][10]]);
      var latLng = new google.maps.LatLng(parseFloat(lat, 10), parseFloat(lng, 10));
      dataHeat.push(latLng);
    }
  
  map.data.setStyle(function(feature) {
      var BoroCD = feature.getProperty('BoroCD');
      var color;
      
      let gaGeom = feature.getGeometry();
      //let poly = new google.maps.Polygon({paths:gaGeom.getAt(0).getArray()});
      let contains = false;
      let poly = gaGeom.getAt(0).getArray();
      let multiGaGeom = gaGeom.getArray();
      
      
      if(poly.length == 1){
        let polygon;
        let auxpol = [];
        
         for(let i in multiGaGeom){
           let aux = gaGeom.getAt(i).getArray();
           let polyIn = aux[0].getArray();
            polygon = new google.maps.Polygon({paths:polyIn});
          

           for(let latLng in dataHeat ){
            contains = google.maps.geometry.poly.containsLocation(dataHeat[latLng], polygon);
            
            

            if(contains == true){
              break;
            }
         } 
          if(contains){
            break;
          }
          
         }

         if(contains == false){
           
          map.data.remove(feature);
          
        } else {
          for(let i in multiGaGeom){
            let aux = gaGeom.getAt(i).getArray();
            let polyIn = aux[0].getArray();
            polygon = new google.maps.Polygon({paths:polyIn});
            auxpol.push(polygon);
            }
          listMultiPolygons.push([auxpol, feature.getProperty("BoroCD")]);
          let centermid= polygonCenter(polygon);
          center.push(feature.getProperty("BoroCD"));
          center.push(centermid);
          distance.push([getDistance(nyuLat, nyuLng, centermid.lat(), centermid.lng()), feature.getProperty("BoroCD")]);
          

        }
         
      } else{

        let polygon = new google.maps.Polygon({paths:poly});
        
        
  
           for(let latLng in dataHeat ){
           contains = google.maps.geometry.poly.containsLocation(dataHeat[latLng], polygon);
           
           if(contains == true){
             break;
           }
        } 
        
        if(contains == false){
           
          map.data.remove(feature);
        } else {
          listPolygons.push([polygon, feature.getProperty("BoroCD")]);
          let centermid = polygonCenter(polygon);
          center.push(feature.getProperty("BoroCD"));
          center.push(centermid);
          distance.push([getDistance(nyuLat, nyuLng, centermid.lat(), centermid.lng()), feature.getProperty("BoroCD")]);
          
        }
      }
      
      if(distance.length == 59){
        console.log("dist Finishes");
        $("#distanceBtn").prop("disabled",false);
        distance = mergeSort(distance);
        const middle = Math.floor(distance.length / 2) // get the middle item of the array rounded down
        distance = distance.slice(0, middle) //
        for(let i in distance){
          borosDistance.push(distance[i][1]);
        }
        
      }
      

     
      
      if(BoroCD >= 100 && BoroCD <200){
        color = "red";
      } else if(BoroCD >= 200 && BoroCD <300){
        color = "green";
      } else if(BoroCD >= 300 && BoroCD <400){
        color = "yellow";
      } else if(BoroCD >= 400 && BoroCD <500){
        color = "black";
      }
      else {
        color = "blue";
      }
      return {
        fillColor: color,
        strokeWeight: 0.3,
        strokeColor: "white",
      };
  })
  
  
  
  
    map.data.addListener('mouseover', function (event) {
      document.getElementById('districtNumber').textContent = event.feature.getProperty('BoroCD');
    });

  }); 
  /* ******************************************************** */
  
/***************************** Safety *********************** */

crimes_ny = getData("https://data.cityofnewyork.us/resource/9s4h-37hy.json?cmplnt_fr_dt=2015-12-31");
crimes_ny.then(function(data){
  
  
    for( let index in data){
      puntosCrimenes.push(new google.maps.LatLng(data[index].lat_lon.coordinates[1], data[index].lat_lon.coordinates[0]));
    }
  
    
    setTimeout(function() {
      console.log(listPolygons);
      console.log(listMultiPolygons);
    for(let poly in listPolygons){
      
      crimenes.push([0, listPolygons[poly][1]]);
      for(let punto in puntosCrimenes){
        contains = google.maps.geometry.poly.containsLocation(puntosCrimenes[punto], listPolygons[poly][0]);
        if(contains == true){
          crimenes[crimenes.length-1][0]+=1;
        }
      }
    }

    for(let poly in listMultiPolygons){
      crimenes.push([0, listMultiPolygons[poly][1]]);
      for(let subpoly in listMultiPolygons[poly][0]){
        for(let punto in puntosCrimenes){
          contains = google.maps.geometry.poly.containsLocation(puntosCrimenes[punto], listMultiPolygons[poly][0][subpoly]);
          if(contains == true){
            crimenes[crimenes.length-1][0]+=1;
          }
        }
      }
    }
    crimenes = mergeSort(crimenes);
    /* const middle = Math.floor(distance.length / 2) // get the middle item of the array rounded down
    crimenes = crimenes.slice(0, middle) // */
      for(let i in crimenes){
        borosCrime.push(crimenes[i][1]);
      }
      $("#safetyBtn").prop("disabled",false); 
  },2000);
      
  
   
})
/* ********************************************************* */
/* Affordable */
 housing_by_building = getData("https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.json?accessType=DOWNLOAD");
 housing_by_building.then(function(data){
   for(let i in data){

   }
 });
/* ************************************************************************* */
  /******************** EVENTS **************************************/
  

  $("#clean").click(function () {
    markerCluster.clearMarkers();
  });

  $("#search").click(function () {
    markerCluster.addMarkers(markers);
  });

  $("#distanceBtn").click(function () {
    map.data.setStyle(function(feature){
      let index = borosDistance.indexOf(feature.getProperty("BoroCD"));
      if( index != -1){
        let opacity = 6 * (1.0/index) ;
        return {
          fillColor: "#FF0063",
          strokeWeight: 0.2,
          strokeColor: "white",
          fillOpacity: opacity,
        };
      } else {
        return{
          fillColor: "white",
          strokeWeight: 0,
        }
      }
    })
  });

  $("#safetyBtn").click(function () {
    map.data.setStyle(function(feature){
      let index = borosCrime.indexOf(feature.getProperty("BoroCD"));
      if( index != -1){
        let opacity = 6 * (1.0/index) ;
        return {
          fillColor: "#33FFFC",
          strokeWeight: 0.2,
          strokeColor: "white",
          fillOpacity: opacity,
        };
      } else {
        return{
          fillColor: "white",
          strokeWeight: 0,
        }
      }
    })
  });

 /******************** EVENTS **************************************/
 });

/********************* Get the data *********************************/
function getData(URL) {
   return new Promise((resolve, reject) => {
     $.getJSON(URL, function (data) {
     }).done(function (data) {
       resolve(data);
     });
   });
  }

  /* ******************************************************************** */
 /* ************** Function to calculate center of each district *********** */

 function polygonCenter(poly) {
  var lowx, highx, lowy, highy, lats = [], lngs = [], vertices = poly.getPath();

  for(var i=0; i<vertices.length; i++) {
    lngs.push(vertices.getAt(i).lng());
    lats.push(vertices.getAt(i).lat());
  }

  lats.sort();
  lngs.sort();
  lowx = lats[0];
  highx = lats[vertices.length - 1];
  lowy = lngs[0];
  highy = lngs[vertices.length - 1];
  center_x = lowx + ((highx-lowx) / 2);
  center_y = lowy + ((highy - lowy) / 2);
  return (new google.maps.LatLng(center_x, center_y));
}

/* ***************************************************************************** */

/* Calculate distance between two points */

var rad = function(x) {
  return x * Math.PI / 180;
};

var getDistance = function(p1lat, p1lng, p2lat, p2lng) {
  var R = 6378137; // Earth’s mean radius in meter
  var dLat = rad(p2lat - p1lat);
  var dLong = rad(p2lng - p1lng);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rad(p1lat)) * Math.cos(rad(p2lat)) *
    Math.sin(dLong / 2) * Math.sin(dLong / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d; // returns the distance in meter
};

function getMediumDistance(distance){
  let sum = 0;
  for(let i in distance){
    sum += distance[i][0];
  }
  sum = sum/distance.length;
  return sum;
}

function mergeSort (arr) {
  if (arr.length === 1) {
    // return once we hit an array with a single item
    return arr
  }

  const middle = Math.floor(arr.length / 2) // get the middle item of the array rounded down
  const left = arr.slice(0, middle) // items on the left side
  const right = arr.slice(middle) // items on the right side

  return merge(
    mergeSort(left),
    mergeSort(right)
  )
}

// compare the arrays item by item and return the concatenated result
function merge (left, right) {
  let result = []
  let indexLeft = 0
  let indexRight = 0

  while (indexLeft < left.length && indexRight < right.length) {
    if (left[indexLeft][0] < right[indexRight][0]) {
      result.push(left[indexLeft])
      indexLeft++
    } else {
      result.push(right[indexRight])
      indexRight++
    }
  }

  return result.concat(left.slice(indexLeft)).concat(right.slice(indexRight))
}


/* ************************************** */