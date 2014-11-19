//Parse DOB
//STEPS
// Readfile
// turn csv into array
// remove top 2 rows
// turn into array of objects with: 
// 	string to numbers, numbers to strings
// 	write headers
// 	create BBL field
// write each object to mongo collection
var fs = require('fs');
var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient;
var format = require('util').format;
var async = require('async');


var options = {
	source_path: 'reallysimple.csv'
};

//reads filename, returns all the lines ['...', '....']
function fileLines(filename, callback) {
	// var theArray = _.rest(data.split('\r'), 2);
	fs.readFile(filename, 'utf8', function(err, data) {
	// console.log(data);
	callback(data.split('\n'));
  });
}

// input:  [String]
// output: [String]
function removeTopTwoRows(rows) {
	return _.rest(rows, 2);
}
//input: string
//output: [string]
function splitRow(row) {
	return row.split(',');
}

function splitRows(rows) {
	return _.map(rows, splitRow)
}


//input: i (index of for loop), [[]]
//output: {}
function permitConstructor(i, allPermits) {
	var permit = {}
	permit.job = allPermits[i][0];
	permit.doc = allPermits[i][1];
	permit.borough = allPermits[i][2];
	permit.house = allPermits[i][3];
	permit.streetName = allPermits[i][4];
	return permit;
}


//input: [[]]
//output: writes documents to mongoDB
function mongoInsert(thePermits) {
	MongoClient.connect('mongodb://127.0.0.1:27017/test', function(err, db) {
		if(err) throw err;
	
		var q = async.queue(function(task, callback) {
			var documentToBeAdded = task.doc;
	  		db.collection('testing1').insert(documentToBeAdded, function(err, docs) {
				callback();
			});
	  	}, 2)

	  	for (var i = 0; i < thePermits.length; i++) {
	  		q.push({doc: permitConstructor(i, thePermits)}, function(err){
	  			if(err) {
	  				console.log(err);
	  			}
	  		});
	  	}

	  	q.drain = function() {
	  		db.close();
	  	}
	})
}


module.exports = {
	fileLines: fileLines,
	removeTopTwoRows: removeTopTwoRows,
	splitRow: splitRow,
	splitRows: splitRows,
	permitConstructor: permitConstructor,
	mongoInsert: mongoInsert,
}

// // Job #,Doc #,Borough,House #,Street Name,Block,Lot,Bin #,Job Type,Job Status,Job Status Descrp,Latest Action Date,Building Type,Community - Board,Cluster ,Landmarked,Adult Estab,Loft Board,City Owned,Little e,PC Filed,eFiling Filed,Plumbing,Mechanical,Boiler,Fuel Burning,Fuel Storage,Standpipe,Sprinkler,Fire Alarm,Equipment,Fire Suppression,Curb Cut,Other,Other Description,Applicant's First/Last Name,Applicant Professional Title,Applicant License #,Professional Cert,Pre- Filing Date,Paid,Fully Paid,Assigned,Approved,Fully Permitted,Initial Cost,Total Est. Fee,Fee Status,Existing Zoning Sqft,Proposed Zoning Sqft,Horizontal Enlrgmt,Vertical Enlrgmt,Enlargement SQ Footage,Street Frontage,ExistingNo. of Stories,Proposed No. of Stories,Existing Height,Proposed Height,Existing Dwelling Units,Proposed Dwelling Units,Existing Occupancy,Proposed Occupancy,Site Fill,Zoning Dist1,Zoning Dist2,Zoning Dist3,Special District 1,Special District 2,Owner Type,Non-Profit,Owner's First & Last Name,Owner's Business Name ,Owner's  House Street,"City, State, Zip",Owner's  Phone #,Job Description



