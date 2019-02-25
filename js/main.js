/*
    Feel free to put your custom js here.
  */

/********************  Variables ******************************/

let neighborhood_names;
let dataffor;
let afforonce = false;
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
let onlyDoOnce = false;
let className = ".color-key";
let distanciaMax = 0,
  distanciaMin = 700000000;
let distanceShowing = false;
let safetyShowing = false;
let afforabilityShowing = false;
let crimesMax = 0,
  crimesMin = 700000;
let sumCrimes = 0;
let affor = {};
let afforMax = 0,
  afforMin = 7000000;
let neighborhoodArray = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];
let manhattan = [],
  bronx = [],
  brooklyn = [],
  queens = [],
  statenisland = [];
/* *************************************************************** */

$(document).ready(function () {
  $("#distanceBtn").prop("disabled", true);
  $("#safetyBtn").prop("disabled", true);




  /************************* Distance **************************** */
  neighborhood_names = getData("https://data.cityofnewyork.us/api/views/xyye-rtrs/rows.json?accessType=DOWNLOAD");
  neighborhood_names.then(function (data) {

    names = data["data"];
    let coordenadas = [];
    let dataHeat = [];
    let latIndex, lonIndex, lat, lng;
    /* for (let i in names) {
      let coords = names[i][8];
      lonIndex = coords.indexOf("(");
      latIndex = coords.indexOf("40.");
      lat = coords.substring(latIndex, latIndex + 13);
      lng = coords.substring(lonIndex + 1, lonIndex + 13);
      coordenadas.push([parseFloat(lat, 10), parseFloat(lng, 10), names[i][10]]);
      var latLng = new google.maps.LatLng(parseFloat(lat, 10), parseFloat(lng, 10));
      dataHeat.push(latLng);
    } */



  });
  /* ******************************************************** */

  /***************************** Safety *********************** */

  crimes_ny = getData("https://data.cityofnewyork.us/resource/9s4h-37hy.json?cmplnt_fr_dt=2015-12-31");
  crimes_ny.then(function (data) {
    console.log(data);
    setTimeout(function () {
      for (let index in data) {
       let coordinates =  new google.maps.LatLng(data[index].lat_lon.coordinates[1], data[index].lat_lon.coordinates[0])
       let neigh = data[index].boro_nm;
       puntosCrimenes.push([coordinates, neigh ]);
      }
      //crimes();
    }, 3000);
  })
  /* ********************************************************* */
  /* Affordable */
  housing_by_building = getData("https://data.cityofnewyork.us/api/views/hg8x-zxpr/rows.json?accessType=DOWNLOAD");
  housing_by_building.then(function (data) {
    let sum = 0;
    let datos = data.data;
    console.log(datos);
    for (let i in datos) {
      let value = parseFloat(datos[i][33], 10);
      let neighborhood = datos[i][15];

      if (neighborhood == "Manhattan") {
        neighborhood = "1";
      } else if (neighborhood == "Bronx") {
        neighborhood = "2";
      } else if (neighborhood == "Brooklyn") {
        neighborhood = "3";
      } else if (neighborhood == "Queens") {
        neighborhood = "4";
      } else if (neighborhood == "Staten Island") {
        neighborhood = "5";
      } else {
        console.log("error");
      }

      neighborhood += datos[i][19].substring(3, 5);
      sum += value;
      if (value != 0) {

        if (typeof affor[neighborhood] === "undefined") {
          affor[neighborhood] = value;
        } else {
          affor[neighborhood] += value;
        }

      }
    }
    console.log("sum all low income: " + sum);
    console.log(affor);
  });
  /* ************************************************************************* */
  /******************** EVENTS **************************************/



  $("#distanceBtn").click(function () {
    distanceShowing = safetyShowing = afforabilityShowing = false;
    document.getElementById("census-variable").value = "select-option";
    document.getElementById('data-caret').style.display = 'none';
    document.getElementById('data-box2').style.display = 'none';
    map.data.setStyle(styleFeature);
    $(".color-key").css({
      "display": "none"
    });
    document.getElementById('census-min').textContent = " ";
    document.getElementById('census-max').textContent = " ";


  });

  $("#safetyBtn").click(function () {

  });

  $("#CSVdistance").click(function () {
    $("#distanceExport").table2csv({

    });

  });

  /******************** EVENTS **************************************/
});

/********************* Get the data *********************************/
function getData(URL) {
  return new Promise((resolve, reject) => {
    $.getJSON(URL, function (data) {}).done(function (data) {
      resolve(data);
    });
  });
}

/* ******************************************************************** */
function calculateDistanceAndStuff() {

  //Create marker of NYU
  var marker = new google.maps.Marker({
    position: {
      lat: 40.730610,
      lng: -73.935242,
    },
    map: map,
    title: 'NYU Stern School of Business',
    animation: google.maps.Animation.DROP,
  });
  /* *****************************************************/

  map.data.forEach(function (feature) {



    let distanciaPolig; //Distance of polygon from NYU
    let gaGeom = feature.getGeometry(); //Getting geometry form GeoJSON
    let contains = true; // We first assume polygon is habitable
    let poly = gaGeom.getAt(0).getArray(); // For polygons we just get array
    let multiGaGeom = gaGeom.getArray(); // For multiPoligons we get array and have to do some more things
    let boroCD = feature.getProperty("BoroCD"); // The Neihbourhood and district number for each;

    if ((boroCD % 100) >= 26) { // If the district number is greater than 26, is not habitable

      map.data.remove(feature); // We remove it

    } else {

      feature.setProperty("Affordability", affor[feature.getProperty("BoroCD")]);
      if (feature.getProperty("Affordability") < afforMin) {
        afforMin = feature.getProperty("Affordability");
      }
      if (feature.getProperty("Affordability") > afforMax) {
        afforMax = feature.getProperty("Affordability");
      }

      let neigh = feature.getProperty("Neigbourhood");
      

      if (poly.length == 1) { //If it's multypoligon
        feature.setProperty("Type", "MultiPolygon");
        let polygon;
        let auxpol = [];

        /* For: adding polygons to array  */
        for (let i in multiGaGeom) {

          let aux = gaGeom.getAt(i).getArray();
          let polyIn = aux[0].getArray();
          polygon = new google.maps.Polygon({
            paths: polyIn
          });
          auxpol.push(polygon);

        }
        listMultiPolygons.push([auxpol, feature.getProperty("BoroCD")]);
        
        if(neigh == "Manhattan"){
          manhattan.push([auxpol, feature.getProperty("BoroCD")]);
        } else if(neigh == "Bronx"){
          bronx.push([auxpol, feature.getProperty("BoroCD")]);
        } else if(neigh == "Brooklyn"){
          brooklyn.push([auxpol, feature.getProperty("BoroCD")]);
        } else if(neigh == "Queens"){
          queens.push([auxpol, feature.getProperty("BoroCD")]);
        } else if(neigh == "Staten Island"){
          statenisland.push([auxpol, feature.getProperty("BoroCD")]);
        } else{
          console.log("Error Name not found at " + BoroCD);
        }
 
        /* *************************************************** */

        let centermid = polygonCenter(polygon); // It returns the center of polygon in latLNG;
        distanciaPolig = getDistance(nyuLat, nyuLng, centermid.lat(), centermid.lng()); // We get the distance
        distance.push([distanciaPolig, feature.getProperty("BoroCD")]);

        if (distanciaPolig < distanciaMin) {
          distanciaMin = distanciaPolig;
        }
        if (distanciaPolig > distanciaMax) {
          distanciaMax = distanciaPolig;
        }

        feature.setProperty("Distance", distanciaPolig);
      } else {
        feature.setProperty("Type", "Polygon");
        let polygon = new google.maps.Polygon({
          paths: poly
        });

        listPolygons.push([polygon, feature.getProperty("BoroCD")]); //We add it to the list
        if(neigh == "Manhattan"){
          manhattan.push([polygon, feature.getProperty("BoroCD")]);
        } else if(neigh == "Bronx"){
          bronx.push([polygon, feature.getProperty("BoroCD")]);
        } else if(neigh == "Brooklyn"){
          brooklyn.push([polygon, feature.getProperty("BoroCD")]);
        } else if(neigh == "Queens"){
          queens.push([polygon, feature.getProperty("BoroCD")]);
        } else if(neigh == "Staten Island"){
          statenisland.push([polygon, feature.getProperty("BoroCD")]);
        } else{
          console.log("Error Name not found at " + BoroCD);
        }
        let centermid = polygonCenter(polygon); //We get the center in latLng

        distanciaPolig = getDistance(nyuLat, nyuLng, centermid.lat(), centermid.lng()); // We get the distance
        distance.push([distanciaPolig, feature.getProperty("BoroCD")]);


        if (distanciaPolig < distanciaMin) {
          distanciaMin = distanciaPolig;
        }
        if (distanciaPolig > distanciaMax) {
          distanciaMax = distanciaPolig;
        }

        feature.setProperty("Distance", getDistance(nyuLat, nyuLng, centermid.lat(), centermid.lng()));

      }

    }

    if (distance.length == 59) { // If it has finished calculating all distances
      console.log("dist Finishes");
      $("#distanceBtn").prop("disabled", false);
      // We move to crimes
      populateDistanceTable();
    }

  });
}

function crimes() {


  map.data.forEach(function (feature) {

    let type = feature.getProperty("Type");
    let contains;
    let gaGeom = feature.getGeometry(); //Getting geometry form GeoJSON
    let poly = gaGeom.getAt(0).getArray(); // For polygons we just get array
    let multiGaGeom = gaGeom.getArray(); // For multiPoligons we get array and have to do some more things
    feature.setProperty("Crimes", 0);

    if (type == "Polygon") {

      let polygon = new google.maps.Polygon({
        paths: poly
      });

      for (let punto in puntosCrimenes) {
        contains = google.maps.geometry.poly.containsLocation(puntosCrimenes[punto], polygon);
        if (contains) {
          feature.setProperty("Crimes", feature.getProperty("Crimes") + 1);
        }
      }

    } else {

      let polygon;

      for (let i in multiGaGeom) {
        let aux = gaGeom.getAt(i).getArray();
        let polyIn = aux[0].getArray();
        polygon = new google.maps.Polygon({
          paths: polyIn
        });
        for (let punto in puntosCrimenes) {
          contains = google.maps.geometry.poly.containsLocation(puntosCrimenes[punto], polygon);
          if (contains) {
            feature.setProperty("Crimes", feature.getProperty("Crimes") + 1);
          }
        }
      }

    }

    if (feature.getProperty("Crimes") < crimesMin) {
      crimesMin = feature.getProperty("Crimes");
    }
    if (feature.getProperty("Crimes") > crimesMax) {
      crimesMax = feature.getProperty("Crimes");
    }

    sumCrimes += feature.getProperty("Crimes");
    if (sumCrimes >= 994) {
      $(".animationload").fadeOut();
      console.log("Crimes Finish");
    }

  });

  $("#safetyBtn").prop("disabled", false);

}



/* ************** Function to calculate center of each district *********** */

function polygonCenter(poly) {
  var lowx, highx, lowy, highy, lats = [],
    lngs = [],
    vertices = poly.getPath();

  for (var i = 0; i < vertices.length; i++) {
    lngs.push(vertices.getAt(i).lng());
    lats.push(vertices.getAt(i).lat());
  }

  lats.sort();
  lngs.sort();
  lowx = lats[0];
  highx = lats[vertices.length - 1];
  lowy = lngs[0];
  highy = lngs[vertices.length - 1];
  center_x = lowx + ((highx - lowx) / 2);
  center_y = lowy + ((highy - lowy) / 2);
  return (new google.maps.LatLng(center_x, center_y));
}

/* ***************************************************************************** */

/* Calculate distance between two points */

var rad = function (x) {
  return x * Math.PI / 180;
};

var getDistance = function (p1lat, p1lng, p2lat, p2lng) {
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

function getMediumDistance(distance) {
  let sum = 0;
  for (let i in distance) {
    sum += distance[i][0];
  }
  sum = sum / distance.length;
  return sum;
}

function mergeSort(arr) {
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
function merge(left, right) {
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

function changeOption() {
  let value = document.getElementById("census-variable").value;
  if (value == "Distance") {
    distances();
  }
  if (value == "Safety") {
    safety();
  }
  if (value == "Affordability") {
    Affordability();
  }

}

function distances() {
  $("." + $('#colors').attr('class')).css({
    "display": "flex"
  });
  distanceShowing = true;
  safetyShowing = false;
  afforabilityShowing = false;

  $('#colors').removeClass($('#colors').attr('class')).addClass('color-key');

  document.getElementById('census-min').textContent =
    Math.round((distanciaMin / 1000) * 100) / 100 + "Km";
  document.getElementById('census-max').textContent =
    Math.round((distanciaMax / 1000) * 100) / 100 + "Km";

  map.data.setStyle(function (feature) {


    var delta = (feature.getProperty('Distance') - distanciaMin) /
      (distanciaMax - distanciaMin);

    var high = [5, 69, 54]; // color of smallest datum
    var low = [151, 83, 34];
    let color = [];
    for (var i = 0; i < 3; i++) {
      // calculate an integer color based on the delta
      color[i] = (high[i] - low[i]) * delta + low[i]; //FF0063
    }

    var outlineWeight = 0.5,
      zIndex = 1;
    let id = feature.getProperty('OBJECTID');
    if (id >= 100) {
      outlineWeight = zIndex = 2;
    }
    return {
      fillColor: "#FF0063",
      strokeWeight: outlineWeight,
      strokeColor: "white",
      fillOpacity: 1 - delta,
      zIndex: zIndex,
    };

  });
}

function safety() {
  $("." + $('#colors').attr('class')).css({
    "display": "flex"
  });

  $('#colors').removeClass($('#colors').attr('class')).addClass('color-key2');
  safetyShowing = true;
  distanceShowing = false;
  afforabilityShowing = false;

  document.getElementById('census-min').textContent =
    Math.floor(crimesMin);
  document.getElementById('census-max').textContent =
    Math.floor(crimesMax);

  map.data.setStyle(function (feature) {

    var delta = (feature.getProperty('Crimes') - crimesMin) /
      (crimesMax - crimesMin);


    var outlineWeight = 0.5,
      zIndex = 1;
    let id = feature.getProperty('OBJECTID');
    if (id >= 100) {
      outlineWeight = zIndex = 2;
    }
    return {
      fillColor: "#33FFFC",
      strokeWeight: outlineWeight,
      strokeColor: "white",
      fillOpacity: delta,
      zIndex: zIndex,
    };

  })

}

function Affordability() {

  $("." + $('#colors').attr('class')).css({
    "display": "flex"
  });
  $('#colors').removeClass($('#colors').attr('class')).addClass('color-key3');
  safetyShowing = false;
  distanceShowing = false;
  afforabilityShowing = true;
  var low = [5, 69, 54]; // color of smallest datum
  var high = [151, 83, 34];
  document.getElementById('census-min').textContent =
    Math.floor(afforMin);
  document.getElementById('census-max').textContent =
    Math.floor(afforMax);

  map.data.setStyle(function (feature) {


    var delta = (feature.getProperty('Affordability') - afforMin) /
      (afforMax - afforMin);

    var color = [];
    for (var i = 0; i < 3; i++) {
      // calculate an integer color based on the delta
      color[i] = (high[i] - low[i]) * delta + low[i];
    }


    var outlineWeight = 0.5,
      zIndex = 1;
    let id = feature.getProperty('OBJECTID');
    if (id >= 100) {
      outlineWeight = zIndex = 2;
    } //12E900
    return {
      fillColor: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)',
      strokeWeight: outlineWeight,
      strokeColor: "white",
      fillOpacity: 0.75,
      zIndex: zIndex,
    };


  })


}

function populateDistanceTable() {
  distance = mergeSort(distance);

  for (let i = 0; i < 10; i++) {
    let data = ` `;
    let BoroCD = distance[i][1];
    let name = "";
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
    let distancia = Math.round((distance[i][0] / 1000) * 100) / 100;
    BoroCD = BoroCD % 100;

    data += `<tr>
    <th scope="row">${i+1}</th>
    <td>${name}</td>
    <td>${BoroCD}</td>
    <td>${distancia}</td>
  </tr>
    `

    console.log(data);
    $("#distanceTable").append(data);

  }

  $("#distanceTable").append(`</tbody>`);
}