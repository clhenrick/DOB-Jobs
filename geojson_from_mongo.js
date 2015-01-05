//get geoJSON from query
var fs = require('fs');
var mongo = require('mongoskin');
var db = mongo.db('mongodb://localhost:27017/test', {native_parser:true});


db.collection('jobs').find({CB: "304"}).toArray(function (err, items) {
  if (err) {
    console.log(err); 
  } else {
    console.log('number of jobs: ' + items.length);
      //turns polygon into featureCollection 
    var featureCollection = toFeatureCollection(items);
    var stringCollection = JSON.stringify(featureCollection);
    fs.writeFile('bushwick_jobs_2014.geojson', stringCollection, function(err){
      if (err) throw err;
      db.close();
      console.log('done writing file');
    });
  }
})

//generates geoJSON Feature Collections
//input: array of polygons
//output: geoJSON object
function toFeatureCollection(arrayOfPolygons) {
    var featureCollection = {
        "type": "FeatureCollection",
        "features": []
    };

    for (var i = 0; i < arrayOfPolygons.length; i++) {

        featureCollection.features.push(assembleFeature(arrayOfPolygons[i]));

    };    

    return featureCollection;
}

//assembles one feature. used by toFeatureCollection
function assembleFeature(polygon) {
    var feature = {};
    feature['type'] = "Feature";
    feature.properties = polygon;
    feature.properties.OwnerName = polygon.Owner.Name;
    feature.properties.OwnerBis = polygon.Owner.BusinessName;
    // feature.properties._id = polygon._id;
    feature.geometry = {};
    feature.geometry['type'] = polygon.loc['type'];
    feature.geometry.coordinates = polygon.loc.coordinates;

    return feature;
}

