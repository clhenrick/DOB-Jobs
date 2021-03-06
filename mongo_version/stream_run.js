var fs = require('fs');
var mongo = require('mongoskin');
var split = require('split');
var async = require('async');

// open database connection
var db = mongo.db("mongodb://localhost:27017/test", {native_parser:true});

//array to stores functions
var arrayOfFunctions = [];

//puts functions in array. one function for each file. 
for (var i = 0; i < 12; i++) {
  
  var months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  var filePath = 'job' + months[i] + '14.csv';

  arrayOfFunctions.push(getSeriesFunction(filePath, 'jobs2014'));

}

//runs the functions in series
async.series(arrayOfFunctions, function(err) {
  if (err) console.log(err);
  console.log('all done!')
  db.close();
});

function getSeriesFunction(filePath, collectionName) {
  return function(callback) {
    putInMongo(filePath, collectionName, function(){
      callback();
    })
  }
}

function putInMongo(filePath, collectionName, done) {
  var counter = 0;
  fs.createReadStream(filePath)
      .pipe(split())
      .on('data', function (line) {
      
       //removes first three lines
       if (counter < 3) {
        counter =  counter + 1;
       } else {

          //create array of fields
          var rowInArray = line.split(',');

           //removes white space from strings
          for (var i = 0;i <rowInArray.length; i++) {
            rowInArray[i] = removeWhiteSpace(rowInArray[i]);
          }

          //creates job -
          var job = jobConstructorForGeojson(rowInArray);
          //inserts into collection
          db.collection(collectionName).insert(job, function(err, result){
            if (err) { console.log (err); }
          })
        }
      })
      .on('end', function(){
        console.log(filePath + ' is done');
        // don't close database when using with async series
        // db.close();
        typeof done === 'function' && done();
      })
}

//input: string
//ouput: date object
function dateParser(date) {
  if (typeof date === 'string') {
    var date_array = date.split('/');
    
    //console logs when date doesn't start with a number to catch errors in the data
    if (/[a-z]/.test(date)) {
      console.log('error in the date field:');
    }

    var year = "20" + date_array[2];
    var month = parseInt(date_array[0], 10) - 1;
    var day = date_array[1];
    return new Date(year, month, day);

  }
  else if (date === 0 || date === '0') {
    return 0;
  } else {

    return 'no date';    
  } 
}

//input: string
//output: string
function removesMoneySign(money) {
  if (money === 0 || money === '0') {
    return 0;
  } else if (typeof money === 'number') {
    return money;
  } else if (typeof money === 'string') {
    return money.replace('$', '');
  } else {
    console.log('the money is not a string or a number');
    return 'undefined';
  }
}

//input: string, string, string
//output: string (10 char)
function bbl(borough, block, lot) {
  var bor;
  var blk = block;
  var lt = lot;
  if (borough === 'MANHATTAN') {
    bor = '1';
  } else if (borough === 'BRONX') {
    bor = '2';
  } else if (borough === 'BROOKLYN') {
    bor = '3';
  } else if (borough === 'QUEENS') {
    bor = '4';
  } else if (borough === 'STATEN ISLAND') {
    bor = '5';
  } else { bor = 'err'; console.log("there's a mistake with the borough name: " + borough );}

  if (block != undefined || lot != undefined) {
    if (block.length > 5 || lot.length > 4) {
    console.log("the block and/or lot are too long")
    } else {
    while (blk.length < 5) {
      blk = '0' + blk;
    }
    while (lt.length < 4) {
      lt = '0' + lt;
    }
    return (bor + blk + lt);
    }
  } else {
    return 'blk and/or lot is undefined';
  } 
}

function removeWhiteSpace(field) {
  if (typeof field === 'string') {
    return field.trim();
  } else {
    return field;
  }
}

//not used currently. slashes are escaped in excel_parse
function addslashes( str ) {
    return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
}

function jobConstructor(jobArray) {
  var job = {}
  job.Job = parseInt(jobArray[0]);
  job.Doc = parseInt(jobArray[1]);
  job.Borough = jobArray[2];
  job.House = jobArray[3];
  job.StreetName = jobArray[4];
  job.Block = parseInt(jobArray[5]).toString();
  job.Lot = parseInt(jobArray[6]).toString();
  job.Bin = parseInt(jobArray[7]);
  job.JobType = jobArray[8];
  job.JobStatus = jobArray[9];
  job.JobStatusDescrp = jobArray[10];
  job.LatestActionDate = dateParser(jobArray[11]);
  job.BuildingType = jobArray[12];
  job.CB = jobArray[13];
  job.Cluster = jobArray[14];
  job.Landmark = jobArray[15];
  job.AdultEstab = jobArray[16];
  job.LoftBoard = jobArray[17];
  job.CityOwned = jobArray[18];
  job.LittleE = jobArray[19];
  job.PCFiled = jobArray[20];
  job.eFilingFiled = jobArray[21];
  job.Plumbing = jobArray[22];
  job.Mechanical = jobArray[23];
  job.Boiler = jobArray[24];
  job.FuelBurning = jobArray[25];
  job.FuelStorage = jobArray[26];
  job.Standpipe = jobArray[27];
  job.Sprinkler = jobArray[28];
  job.FireAlarm = jobArray[29];
  job.Equipment = jobArray[30];
  job.FireSuppression = jobArray[31];
  job.CurbCut = jobArray[32];
  job.Other = jobArray[33];
  job.OtherDescript = jobArray[34];
  job.Applicant = {};
  job.Applicant.Name =  jobArray[35];
  job.Applicant.Title = jobArray[36];
  job.Applicant.License = jobArray[37];
  job.Applicant.ProfessionalCert = jobArray[38];
  job.PreFilingDate = dateParser(jobArray[39]);
  job.Paid = dateParser(jobArray[40]);
  job.FullyPaid = dateParser(jobArray[41]);
  job.Assigned = dateParser(jobArray[42]);
  job.Approved = dateParser(jobArray[43]);
  job.FullyPermitted = dateParser(jobArray[44]);
  job.InitialCost = Number(removesMoneySign(jobArray[45]));
  job.TotalEstFee = Number(removesMoneySign(jobArray[46]));
  job.FeeStatus = Number(removesMoneySign(jobArray[47]));
  job.ExistingZoningSqft = Number(jobArray[48]);
  job.ProposedZoningSqft = Number(jobArray[49]);
  job.HorizontalEnlrgmt = Number(jobArray[50]);
  job.VerticalEnlrgmt = Number(jobArray[51]);
  job.EnlargementSQFootage = Number(jobArray[52]);
  job.StreetFrontage = jobArray[53];
  job.ExistingStories = parseInt(jobArray[54]);
  job.ProposedStories = parseInt(jobArray[55]);
  job.ExistingHeight = Number(jobArray[56]);
  job.ProposedHeight = Number(jobArray[57]);
  job.ExistingDwellingUnits = parseInt(jobArray[58]);
  job.ProposedDwellingUnits = parseInt(jobArray[59]);
  job.ExistingOccupancy = Number(jobArray[60]);
  job.ProposedOccupancy = Number(jobArray[61]);
  job.SiteFill = jobArray[62];
  job.Zoning = {};
  job.Zoning.Dist1 = jobArray[63];
  job.Zoning.Dist2 = jobArray[64];
  job.Zoning.Dist3 = jobArray[65];
  job.Zoning.SDistrict1 = jobArray[66];
  job.Zoning.SDistrict2 = jobArray[67];
  job.Owner = {};
  job.Owner.Type = jobArray[68];
  job.Owner.NonProfit = jobArray[69];
  job.Owner.Name = jobArray[70];
  job.Owner.BusinessName = jobArray[71];
  job.Owner.HouseStreet = jobArray[72];
  job.Owner.CityStateZip = jobArray[73];
  job.Owner.Phone = jobArray[74];
  job.JobDescription = jobArray[75];
  job.bbl = bbl(job.Borough, job.Block, job.Lot);
  
  return job;
}

//this version is 'flat' -- contains no nested. useful for creating geojson
function jobConstructorForGeojson(jobArray) {
  var job = {}
  job.Job = parseInt(jobArray[0]);
  job.Doc = parseInt(jobArray[1]);
  job.Borough = jobArray[2];
  job.House = jobArray[3];
  job.StreetName = jobArray[4];
  job.Block = parseInt(jobArray[5]).toString();
  job.Lot = parseInt(jobArray[6]).toString();
  job.Bin = parseInt(jobArray[7]);
  job.JobType = jobArray[8];
  job.JobStatus = jobArray[9];
  job.JobStatusDescrp = jobArray[10];
  job.LatestActionDate = dateParser(jobArray[11]);
  job.BuildingType = jobArray[12];
  job.CB = jobArray[13];
  job.Cluster = jobArray[14];
  job.Landmark = jobArray[15];
  job.AdultEstab = jobArray[16];
  job.LoftBoard = jobArray[17];
  job.CityOwned = jobArray[18];
  job.LittleE = jobArray[19];
  job.PCFiled = jobArray[20];
  job.eFilingFiled = jobArray[21];
  job.Plumbing = jobArray[22];
  job.Mechanical = jobArray[23];
  job.Boiler = jobArray[24];
  job.FuelBurning = jobArray[25];
  job.FuelStorage = jobArray[26];
  job.Standpipe = jobArray[27];
  job.Sprinkler = jobArray[28];
  job.FireAlarm = jobArray[29];
  job.Equipment = jobArray[30];
  job.FireSuppression = jobArray[31];
  job.CurbCut = jobArray[32];
  job.Other = jobArray[33];
  job.OtherDescript = jobArray[34];
  job.ApplicantName =  jobArray[35];
  job.ApplicantTitle = jobArray[36];
  job.ApplicantLicense = jobArray[37];
  job.ApplicantCert = jobArray[38];
  job.PreFilingDate = dateParser(jobArray[39]);
  job.Paid = dateParser(jobArray[40]);
  job.FullyPaid = dateParser(jobArray[41]);
  job.Assigned = dateParser(jobArray[42]);
  job.Approved = dateParser(jobArray[43]);
  job.FullyPermitted = dateParser(jobArray[44]);
  job.InitialCost = Number(removesMoneySign(jobArray[45]));
  job.TotalEstFee = Number(removesMoneySign(jobArray[46]));
  job.FeeStatus = Number(removesMoneySign(jobArray[47]));
  job.ExistingZoningSqft = Number(jobArray[48]);
  job.ProposedZoningSqft = Number(jobArray[49]);
  job.HorizontalEnlrgmt = Number(jobArray[50]);
  job.VerticalEnlrgmt = Number(jobArray[51]);
  job.EnlargementSQFootage = Number(jobArray[52]);
  job.StreetFrontage = jobArray[53];
  job.ExistingStories = parseInt(jobArray[54]);
  job.ProposedStories = parseInt(jobArray[55]);
  job.ExistingHeight = Number(jobArray[56]);
  job.ProposedHeight = Number(jobArray[57]);
  job.ExistingDwellingUnits = parseInt(jobArray[58]);
  job.ProposedDwellingUnits = parseInt(jobArray[59]);
  job.ExistingOccupancy = Number(jobArray[60]);
  job.ProposedOccupancy = Number(jobArray[61]);
  job.SiteFill = jobArray[62];;
  job.ZoneDist1 = jobArray[63];
  job.ZoneDist2 = jobArray[64];
  job.ZoneDist3 = jobArray[65];
  job.ZoneSDistrict1 = jobArray[66];
  job.ZoneSDistrict2 = jobArray[67];
  job.OwnerType = jobArray[68];
  job.NonProfit = jobArray[69];
  job.OwnerName = jobArray[70];
  job.OwnerBis = jobArray[71];
  job.OwnerAdd1 = jobArray[72];
  job.OwnerAdd2 = jobArray[73];
  job.OwnerPhone = jobArray[74];
  job.JobDescript = jobArray[75];
  job.bbl = bbl(job.Borough, job.Block, job.Lot);
  
  return job;
}


module.exports = {
  putInMongo: putInMongo,
  removeWhiteSpace: removeWhiteSpace,
}

