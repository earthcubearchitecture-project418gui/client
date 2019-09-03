/*
Changes needed on installation of this code:
UCAR will need its own Leaflet token, I registered the one you see as prestotoken

The path of the JSON schema files is wired-in to buildCatMenu()
paths pointing at earthcube.isti.com need to point to new host (wherever that is)

External Javascript libraries used
jquery-3.3.1.js
jquery-ui.js"
jquery-confirm.min.js	// for alert/dialogue boxes
prettyprint.js 			// for formatting the JSON output for inspection
jquery.scrollTo.min.js	// for scrolling to page top when category changes
https://unpkg.com/leaflet@1.4.0/dist/leaflet.js // for spatial data leaflet maps
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
There are essentially 3 big loops in this application

#1 : function whatzit() used to build the UI by walking through the schema for the selected form type (dataset or organization)
The schemas are retrieved into schemaOrg and schemaData from https://earthcube.isti.com/schema/organizations.json (path has to change on delivery)
and https://earthcube.isti.com/schema/dataset.json. Once the schemas are in place we process them with schemaGroups resulting in the two
files used to build the GUI expSchemaD and expSchemaO. We also generate two "empty" javascript objects (again, one for dataset and one for 
organizations OrganizationsSkeleton and DataSkeleton) to hold the output JSON. A copy of the appropriate skeleton is used to control loop #3
The expSchema? objects are process and the GUI is built, making a single, empty instance of each array defined and tagging created fields with
either the ID of the schema element (for unique scalars) or with HTML custom properties to identify the origin/ancestry of the field

#2 : function populateGUI() when an input file is selected, the JSON within is read and the HTML forms are searched for matches to the 
corresponding label/value pairs. When arrays are encountered and additional instances are needed the GUI +/- buttons that were generated
in loop #1 are triggered to replicate the HTML Divs for each array instance.

#3 : function fabJSON() walking the minimal/skeletal schema instance (OrganizationsSkeleton or DataSkeleton) we find HTML input elements
that contain the values called-out in the skeleton. These values are the set in the skeleton and the boilerplate JSON definitions are appended
(see boilerPlate()) - the completed outputJSON object is then packaged and sent to the host-side validation code  
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

*/
var currImport;	// where an opened file contents lives
var currExport;	// where our skeletal schema instance lives - where changes are updated
var ourmapbox;
var ourmappoly;
var mapInst={};		// where each multigen object in spatial data registers its id property and the Leaflet object
var markInst={};	// using same index as mapInst, this holds the marker/polygon/box objects for the corresponding map
var mapIncrId=0;
var mapInputChange=false;
// prestodigital issued token for Leaflets - UCAR needs one of their own
var prestotoken = "pk.eyJ1IjoicHJlc3RvZGlnaXRhbCIsImEiOiJjanJ6YXJiaGcxNnJhM3ltbGg1a3ZpMHAyIn0.6BZEN6LKCOsVgMjMT5Srjw";
var validationResults=""; // where returned object describing errors is found
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// This is fundamentally a single-page website, all panels that are presented are either DIVs or FORMs that are shown/hidden
// depending on the circumstances. There is an opening/landing page, and the main (working) page with "panels" (forms) to represent the different
// categories and the output JSON inspection panel for copy/paste. 
//
// the main working page is fully responsive thanks to Ruth Ritter's HTML/CSS classes and elements
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var thePage;					// current page we're on
var arrayDepth=0;
var tld;
var theSchema,schemaO,schemaD;	// current schema
var expSchemaO;					// organization output from schemaGroups - reduced (simplified) schema that is walked to build the UI
var expSchemaD;					// dataset output from schemaGroups - reduced (simplified) schema that is walked to build the UI
var schemaName="";				// name of the schema from which the currently present UI was built
//
// these are the ID's of the DIVs that initially populate the menubar, maininfo and ContactContent are mock-ups of the original responsive
// formatting and need to be removed. editForm is grown by adding the names of the detected categories from the schema 
var editForm=["startover","setup"]; // form ID of the categories
var currForm=1;					// which form is currently visible, this is an index into editForm[] used for NEXT/PREV buttons and left/right cursor arrows
var activeColm=0;				// 0::left 1::right used to alternate left/right column in see <div id="TEXTINPUT in neworg.htm
var noGen=false;					// if true then don't generate HTML
var diagOutput=false;	// category labels on pages
// mimetype reference can occur in either dataset or organization schema (for now) so we include definitions here
// the dropdown menu is built during initialization within the neworg.htm file as a (hidden) template that is cloned/instantiated
// whenever a mimetype is encountered in the schema 
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// two empty skeletal JSON objects for output
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var DataSkeleton={};
var OrganizationsSkeleton={};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
// the filetypes array holds the user-friendly string of each recognized filetypes
// the mimetypes array matches 1:1 with filetypes, this is the actual string that wants to go in the JSON output

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// outputJSON is where the JSON representing the GUI values is built.
// it starts out as either DataSkeleton or OrganizationsSkeleton and gets populated from the HTML elements where field were entered
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var outputJSON = {};

// outputJSONx needs to be deleted, it was for development
var outputJSONx = {
	"schema": "dataset",
	"doc": {
	"@context": {
		"@vocab": "http://schema.org/",
		"re3data": "http://example.org/re3data/0.1/",
		"earthcollab": "https://library.ucar.edu/earthcollab/schema#",
		"geolink": "http://schema.geolink.org/1.0/base/main#",
		"geolink-vocab": "http://schema.geolink.org/1.0/voc/local#",
		"vivo": "http://vivoweb.org/ontology/core#",
		"dcat": "http://www.w3.org/ns/dcat#",
		"dbpedia": "http://dbpedia.org/resource/",
		"geo-upper": "http://www.geoscienceontology.org/geo-upper#"
	},
	"@type": "Dataset",
	"@id": "http://opencoredata.org/id/dataset/00cd2c07-ff21-4ceb-8595-c6572eda55e9",
	"additionalType": [
		"http://schema.geolink.org/1.0/base/main#Dataset",
		"http://vivoweb.org/ontology/core#Dataset"
	],
	"name": "LNWB Ch07 Water Management - Agricultural water use - data",
	"alternateName": "NE15_AlexanderB",
	"url": "http://opencoredata.org/id/dataset/00cd2c07-ff21-4ceb-8595-c6572eda55e9",
	"description": "Overview: Agricultural water use includes the irrigation of croplands and the water needs of dairy farms.",
	"version": "v1.2.5",
	"isAccessibleForFree": "truex",
	"keywords": "ocean acidification, OA, Dissolved Organic Carbon, DOC, bacterioplankton respiration, pCO2, carbon dioxide",
	"license": "http://creativecommons.org/licenses/by/4.0/",
	"citation": ["Fake Citation Here"],
	"includedInDataCatalog": {
		"@id": "https://www.hydroshare.org",
		"url": "http:\/\/www.bco-dmo.org\/datasets"
	},
	"distribution": [
		{
			"@type": "DataDownload",
			"contentUrl": "https://www.hydroshare.org/hsapi/resource/8f361f21f9884c4b883a7b9d723155bc/",
			"encodingFormat": "application/zip"
		},
		{
			"@type": "DataDownload",
			"contentUrl": "https://www.hydroshare.org/hsapi/resource/jjadfs89e4jjzx74jdjd784j",
			"encodingFormat": "text/csv"
		}
	],
	"provider": {
		"@id": "https://www.hydroshare.org",
		"@type": "Organization",
		"additionalType": "http://schema.geolink.org/1.0/base/main#Organization",
		"legalName": "Biological and Chemical Oceanography Data Management Office",
		"name": "BCO-DMO",
		"url": "https://www.hydroshare.org"
	},
	"publisher": {
		"@id": "https://csdco.umn.edu/",
		"@type": "Organization",
		"description": "Continental Scientific Drilling Coordination Office",
		"name": "CSDCO",
		"url": "https://csdco.umn.edu/"
	},
	"creator": [
		{
			"@id": "http://lod.bco-dmo.org/id/person-role/472036",
			"@type": "Role",
			"additionalType": "http://schema.geolink.org/1.0/base/main#Participant",
			"roleName": "Principal Investigator",
			"url": "http://lod.bco-dmo.org/id/person-role/472036",
			"creator": {
				"@id": "https://www.bco-dmo.org/person/51317",
				"@type": "Person",
				"additionalType": "http://schema.geolink.org/1.0/base/main#Person",
				"name": "Dr. Uta Passow",
				"givenName": "Uta",
				"familyName": "Passow",
				"url": "https://www.bco-dmo.org/person/51317",
				"identifier": {
					"@type": "PropertyValue",
					"additionalType": [
						"http://schema.geolink.org/1.0/base/main#Identifier",
						"http://purl.org/spar/datacite/Identifier"
					],
					"propertyID": "http://purl.org/spar/datacite/orcid",
					"url": "https://orcid.org/0000-0003-2591-5293",
					"value": "0000-0003-2591-5293"
				}
			}
		},
		{
			"@id": "http://lod.bco-dmo.org/id/person-role/472036",
			"@type": "Role",
			"additionalType": "http://schema.geolink.org/1.0/base/main#Participant",
			"roleName": "Author",
			"url": "http://lod.bco-dmo.org/id/person-role/472036",
			"creator": {
				"@id": "https://www.bco-dmo.org/person/51317",
				"@type": "Person",
				"additionalType": "http://schema.geolink.org/1.0/base/main#Person",
				"name": "Eric Lingerfelt",
				"givenName": "Eric",
				"familyName": "Lingerfelt",
				"url": "https://www.bco-dmo.org/person/51317",
				"identifier": {
					"@type": "PropertyValue",
					"additionalType": [
						"http://schema.geolink.org/1.0/base/main#Identifier",
						"http://purl.org/spar/datacite/Identifier"
					],
					"propertyID": "http://purl.org/spar/datacite/orcid",
					"url": "https://orcid.org/0000-0003-2591-5293",
					"value": "0000-0003-2591-5293"
				}
			}
		}
	],
	"spatialCoverage": [
		{
			"@type": "Place",
			"name": "Falling Water Falls [3PP40] vertebrate fauna dataset",
			"geo": [{
				"@type": "GeoCoordinates",
				"latitude": 35.6166667,
				"longitude": -92.8666667
			}]
		},
		{
			"@type": "Place",
			"name": "Falling Water Falls [3PP40] vertebrate fauna dataset",
			"geo": [{
				"@type": "GeoShape",
				"box": "40.027658595465056,-105.29682689638565,39.9874239672697,-105.2250743410458",
				"polygon": "-149.8727,-17.45 -149.8727,34.407 -64.6353,34.407 -64.6353,-17.45 -149.8727,-17.45"
			}]
		}
	],
	"variableMeasured": [
		{
			"@type": "PropertyValue",
			"@id": "https://www.bco-dmo.org/dataset-parameter/665789",
			"description": "Number identifying the cruise.",
			"name": "target_pCO2",
			"unitText": "parts per million (ppm)",
			"url": "https://www.bco-dmo.org/dataset-parameter/665789"
		},
		{
			"@id": "https://www.bco-dmo.org/dataset-parameter/665785",
			"@type": "PropertyValue",
			"additionalType": "https://library.ucar.edu/earthcollab/schema#Parameter",
			"description": "Experiment identifier",
			"unitText": "unitless",
			"url": "https://www.bco-dmo.org/dataset-parameter/665785",
			"name": "experiment"
		},
		{
			"@id": "https://www.bco-dmo.org/dataset-parameter/665786",
			"@type": "PropertyValue",
			"additionalType": "https://library.ucar.edu/earthcollab/schema#Parameter",
			"description": "Site the water for the experiment came from",
			"unitText": "unitless",
			"url": "https://www.bco-dmo.org/dataset-parameter/665786",
			"name": "site"
		},
		{
			"@id": "https://www.bco-dmo.org/dataset-parameter/665787",
			"@type": "PropertyValue",
			"additionalType": "https://library.ucar.edu/earthcollab/schema#Parameter",
			"description": "Latitude where water samples were collected; north is positive.",
			"unitText": "decimal degrees",
			"url": "https://www.bco-dmo.org/dataset-parameter/665787",
			"name": "latitude"
		},
		{
			"@id": "https://www.bco-dmo.org/dataset-parameter/665788",
			"@type": "PropertyValue",
			"additionalType": "https://library.ucar.edu/earthcollab/schema#Parameter",
			"description": "Longitude where water samples were collected; west is negative.",
			"unitText": "decimal degrees",
			"url": "https://www.bco-dmo.org/dataset-parameter/665788",
			"name": "longitude"
		},
		{
			"@id": "https://www.bco-dmo.org/dataset-parameter/665789",
			"@type": "PropertyValue",
			"additionalType": "https://library.ucar.edu/earthcollab/schema#Parameter",
			"description": "Bottle identifier",
			"unitText": "unitless",
			"url": "https://www.bco-dmo.org/dataset-parameter/665789",
			"name": "bottle_number"
		},
		{
			"@id": "https://www.bco-dmo.org/dataset-parameter/665790",
			"@type": "PropertyValue",
			"additionalType": "https://library.ucar.edu/earthcollab/schema#Parameter",
			"description": "Dissolved organic carbon additions.",
			"unitText": "unitless",
			"url": "https://www.bco-dmo.org/dataset-parameter/665790",
			"name": "doc_addition"
		}
	]
	,
	"measurementTechnique": ["Shimadzu TOC-V Analyzer"]
}
};
////////////////////////////////////////////////////////////////////////////////////////////
//
// here are the user-friendly MIME type equivalents
// this array and its companion "mimetypes' are used to present the right set of names to the user
// their order is must remain identical, as entry 0 in one points at entry 0 in the other
// the value from "filetypes" is used in the dropdown menus (select items) and when the outputJSON is built
// the fabJSON code needs to substitute the "mimetypes" equivalent for JSON
////////////////////////////////////////////////////////////////////////////////////////////
var filetypes= [
	"HTML File (*.html)",
	"Plain Text File (*.txt)",
	"Comma Separated Values (*.csv)",
	"Rich Text Format (*.rtf)",
	"Portable Document Format (*.pdf)",
	"Encapsulated Postscript (*.eps)",
	"Postscript (*.ps)",
	"Microsoft Word (*.doc, *.docx)",
	"Microsoft Powerpoint (*.ppt, *.pptx)",
	"Microsoft Excel (*.xls, *.xlsx)",
	"TIFF Image (*.tiff)",
	"PNG Image (*.png)",
	"JPEG Image (*.jpg, *.jpeg)",
	"GIF Image (*.gif)",
	"SVG Image (*.svg)",
	"Windows Media Video (*.wmv)",
	"Quicktime Movie (*.mov)",
	"MPEG-4 Video (*.mpg4, *.mp4)",
	"AVI Video (*.avi)",
	"ZIP Compressed (*.zip)",
	"TAR Compressed (*.tar)",
	"GZIP TAR (*.tgz)",
	"HDF5 (*.h5)",
	"NetCDF4 (*.nc)",
	"Other"
	];
var mimetypes= [
    "text/html",
    "text/plain",
    "text/csv",
    "application/rtf",
    "application/pdf",
    "application/postscript",
    "application/postscript",
    "application/msword",
    "application/powerpoint",
    "application/excel",
    "image/tiff",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/svg+xml",
    "video/x-ms-wmv",
    "video/quicktime",
    "video/mp4",
    "video/x-msvideo",
    "application/zip",
    "application/x-gzip",
    "application/x-gzip",
    "application/x-hdf5",
    "application/x-netcdf4",
    ""
  ];
var boilerOrg = {
 	"@context": {
        "@vocab": "http://schema.org/",
        "gdx": "https://geodex.org/voc/",
        "datacite": "http://purl.org/spar/datacite/",
        "geolink": "http://schema.geolink.org/1.0/base/main#",
        "re3data": "http://example.org/re3data/0.1/",
        "ecrwg": "http://example.org/ecrwg/0.1/"
    }
};
var boilerData = {
 	"@context": {
  		"@vocab": "http://schema.org/",
  		"re3data": "http://example.org/re3data/0.1/",
  		"earthcollab": "https://library.ucar.edu/earthcollab/schema#",
		"geolink": "http://schema.geolink.org/1.0/base/main#",
		"geolink-vocab":"http://schema.geolink.org/1.0/voc/local#",
		"vivo": "http://vivoweb.org/ontology/core#",
        "dcat":"http://www.w3.org/ns/dcat#",
        "dbpedia": "http://dbpedia.org/resource/",
    		"geo-upper": "http://www.geoscienceontology.org/geo-upper#"
 	}
};

///////////////////////////////////////////////////////////////////////////////////////////

function makeTheCall(queryString) {
    var destinationUrl = "https://www.prestodigital.net/ISTIfinal/";
$.get( destinationUrl+queryString, function( data ) {
  var text = data; console.log(data);
});
  }
/*
function makeTheCall(queryString) {
//    var destinationUrl = "https://www.bco-dmo.org/";
    var destinationUrl = "https://prestodigital.net/";
    $.ajax({
      type: 'GET',
      url: destinationUrl + queryString,

      dataType: 'json', // use json only, not jsonp

      crossDomain: true, // tell browser to allow cross domain.
      success: successResponse,
      error: failureFunction
    });
  }
  successResponse = function(data) {
  alert("read it fine");
  //functionality goes here;
  }

  failureFunction = function(data) {
  //functionality goes here;
  alert("file not found");
  }
 */ 
////////////////////////////////////////////////////////////////////////////////////////////
// import * as instantiator from 'json-schema-instantiator';

/*
import * as instantiator from './instantiator.js';

document.addEventListener('DOMContentLoaded', function () {
  const input = document.querySelector('#input');
  const output = document.querySelector('#output');
  const button = document.querySelector('#generate')
  
  button.addEventListener('click', e => {
    const instance = instantiator.instantiate(JSON.parse(input.value), { defaultOnArray: true });
    console.log({instance});
    output.value = JSON.stringify(instance, undefined, 2);
  });
});
*/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// when data is "imported" from website or local file we need to pick-off the field/value pairs and place the value in the
// corresponding inputs in the form (when category/section/fieldid matches) - if no match is found then the location
// of the field/value pair needs to be remembered and saved (invisibly) so that it can re combined with the
// data from the form when export-to-json takes place. Not yet implemented, but looks like placing such field/value pairs
// most logically should be in hidden input fields in the UI so that a common search through it can extract such items
// when time comes to build the JSON output
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// in order to save a file to the computer's local file system we must create it and then download it from the host
// Use javascript library jquery-confirm to facilitate these dialogs/alerts
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function saveLocalFile()
	{
	$.confirm({
    boxWidth: '33%',
    useBootstrap: false,
    title: 'Save Edits As:',
    //
    // content field is currently (dummy placeholder text) HTML that is human-readable confirmation of what the file is
    // to be replaced with the JSON under construction. This "content:" argument needs to be replaced with the text content
    // generated by scraping the UI, extracting field/value pairs and formatting the results a JSONLD string
    //
    content: '' +
    '<form action="" class="formName">' +
    '<div class="form-group">' +
    '<label>Filename of this set</label>' +
    '<input type="text" placeholder="Enter local filename to save to" class="name form-control" required />' +
    '</div>' +
    '</form>',
    buttons: {
        formSubmit: {
            text: 'Save',
            btnClass: 'btn-blue',
            action: function () {
                var name = this.$content.find('.name').val();
                if(!name){
                    $.alert({ boxWidth: '33%', useBootstrap:false, content:'<strong style="font-size: 16px;">Please provide a valid name</strong>'});
                    return false;
                }
                // put up an informative alert showing where the saved data was written
                $.alert({ boxWidth: '33%', useBootstrap:false, title:'Work saved to Downloads', content:'<strong style="font-size: 16px;">File saved as ' + name+".json</strong>"});
  				downloadJSON(JSON.stringify(outputJSON),name+".json","application/json"); // data written in javascript object outputJSON contents              
            }
        },
        cancel: function () {
            //close
        },
    },
    onContentReady: function () {
        // bind to events
        var jc = this;
        this.$content.find('form').on('submit', function (e) {
            // if the user submits the form by pressing enter in the field.
            e.preventDefault();
            jc.$$formSubmit.trigger('click'); // this precipitates the file I/O by triggering button click on the submit for the field
        });
    }
});
}
/////////////////////////////////////////////////////////////////////////////
/* development sanity check of confirm dialogue - kept as a comment in case other instances might be needed
function testconfirm()
	{
		jQuery.confirm({
		useBootstrap:false,
		boxWidth:'20%',
		title: 'Please Confirm!',
		content: 'Do you wish to delete this child and all its data?',
		buttons: {
			confirm: function () {
				console.log('Confirmed!');
			},
			cancel: function () {
//				console.log('Canceled!');
			}
		}
	});
	}
*/
////////////////////////////////////////////////////////////////////////////////////////////
// On startup, confirm that the File API is present
// File API is the FileReader functionality used to access local file system and retrieve interim work files
////////////////////////////////////////////////////////////////////////////////////////////
if (window.File && window.FileReader && window.FileList && window.Blob) {
 // alert('filereader defined and usable');
 var dumb=0;
} else {
  alert('File APIs are not fully supported by your browser. Please use Chrome or other "modern" browser');
}
function readSingleFile(evt) { // incoming arg must be filelist object
    f = evt; 

    if (f) {
      var r = new FileReader();
      r.onload = function(e) { 
		currImport = JSON.parse(e.target.result);
		if( (schemaName=="Dataset" && currImport["@type"]!="Dataset") || 
			(schemaName!="Dataset" && currImport["@type"]=="Dataset") ) 
				{
                $.alert({ boxWidth: '33%', useBootstrap:false, title:'JSON file incompatible with this form!', content:'<strong style="font-size: 16px;">Select JSON file matching your dataset/organization selection</strong>'});
				return;
				}
		$("li#EnterData").text(schemaName+" : "+f.name);	// header is data/organization :: filename we opened
		populateGUI(currImport);	// read values from imported JSON, plunk them into GUI where they belong
		currForm=2;		// set the index into editForm, main category will be displayed
		showForm(currForm); // move to the first (main) form after loading data
//
// this was development code to open a new browser window to display file read contents
// this is where the json from local file or remote website is parsed and it's contents
// are transferred into the waiting HTML form we built from the schema
//
// For now, we inhale the selected text document and display it in a new browser window to confirm functionality
//
/*
development output 
		var newWindow=window.open("");
		newWindow.document.write("<title>"+evt.name+"</title><div>"+contents+"</div>");
        // diagnostic output to the console on file statistics
        console.log( "Got the file.n" 
              +"name: " + f.name + "n"
              +"type: " + f.type + "n"
              +"size: " + f.size + " bytesn"
              + "starts with: " + contents.substr(1, contents.indexOf("n"))
        );
*/
       }
      r.readAsText(f);
    } else { 
      alert("Failed to load file");
    }
  }
////////////////////////////////////////////////////////////////////////////////////////////
// give local data, this function creates an anchor tag click target, then triggers it to perform the local data -> local file system transfer
// this is the monkey-motion needed to actually create the transfer Blob for download
function downloadJSON(data, filename, type) {
   var file = new Blob([data], {type: type});
   if (window.navigator.msSaveOrOpenBlob) // IE10+
       window.navigator.msSaveOrOpenBlob(file, filename);
   else { // Others
       var a = document.createElement("a"),
               url = URL.createObjectURL(file);
       a.href = url;
       a.download = filename;
       document.body.appendChild(a);
       a.click();
       setTimeout(function() {
           document.body.removeChild(a);
           window.URL.revokeObjectURL(url);
       }, 0);
   }
}
//////////////////////////////////////////////////////////////////////////
// trim down the schema to the information used to build UI elements 
// thanks to ISTI Alex McNurlan for this code
//////////////////////////////////////////////////////////////////////////
/*
function schemaGroups(schema,groups)
	{
	let keys = Object.keys(groups);
	let res = {};
	keys.forEach(k => res[k] = groups[k].map(i => ({[i]: schema.properties[i]}) ).reduce((acc, n) => ({...acc, ...n}), {}) );
	return res;
	}
	*/
////////////////////////////////////////////////////////////////////////////////////////////
// create a new HTML form element for a category "thecat" in the present schema
// and append it to the UI being built 
//
// this creates headline and instructions for the category, and the columns instance
// 
////////////////////////////////////////////////////////////////////////////////////////////
function genHTMLcat(thecat,theInstructions)
	{
	if(noGen) return;	// debugging
	activeColm=0;	// new categories start with left column filling
	// copy the hidden template form from the bottom of the html file
	var inject = $("form#CATEGORY_NAME").clone(true); // make a copy of the form template
	$(inject).attr("id",thecat);	// set the ID of the form to the category
	$("#MainInfo").append(inject);	// append this category form template to the HTML
	var inplace = "form#"+thecat;
	if(diagOutput)
		$(inplace).find("h2.formHead").text("("+schemaName+") Category: "+thecat);	// see "Category" and schema name and category name
	else 
		$(inplace).find("h2.formHead").text(thecat);	// just see category name
	$(inplace).css("display","block");
	$(inplace).find("div.instructions").text(theInstructions);	// hide this element as its content has no use in this context
	if(theInstructions=="") $(inplace).find("div.instructions").css("display","none");
	var cdata = $("#MULTIGEN").clone(true); // make a copy of the two column div as well
	// the default from the template is multigen with buttons
	$(cdata).find(".wholeColumn").css("display","none"); // no buttons or SubHead
	$(cdata).removeAttr("id").removeClass("multigen");	// no bounding box 
	$(cdata).css("display","block");
	inplace = $(inplace).find(".instructions").after(cdata);
	// add dyno class, the for "id" and make the form visible
	$(inplace).addClass("dyno").css("display","block").find("h2.formHead").text("("+schemaName+") Category: "+thecat);
	}
////////////////////////////////////////////////////////////////////////////////////////////
// inject a new section into the HTML (array, object) display information line
////////////////////////////////////////////////////////////////////////////////////////////
function genHTMLcomment(thepath,thesect)	// thepath is the HTML element ID after which we add this, thesect is the name
	{
	if(noGen) return;	// debugging
	activeColm=0;	// new sections start with left column filling 0::left column receives new elements, 1::right column receives elements
	var inject = $("div#COMMENT").clone(true);	// new sections are clones of the template
	$(inject).removeAttr("id").css("display","block").find("legend").text(thesect);
	if($("#"+thepath+" .leftColumn:last fieldset").children().length!=0)
		{
		var newsct = $("div#NEWSECT").clone(true);
		$(newsct).removeAttr("id").css("display","block").find("legend").text(thesect);
		$("#"+thepath+" .theColumns:last").after(newsct);
		}
// end new
	else 
		$(inject).insertBefore("#"+thepath+" .leftColumn:last");
	}
////////////////////////////////////////////////////////////////////////////////////////////
// inject a new section into the HTML (array, object)
////////////////////////////////////////////////////////////////////////////////////////////
function genHTMLsect(thepath,thesect)	// thepath is the HTML element ID after which we add this, thesect is the name
	{
	return;
	if(noGen) return;	// debugging
	activeColm=0;	// new sections start with left column filling 0::left column receives new elements, 1::right column receives elements
//	var inject = $("div#NEWSECT").clone(true);	// new sections are clones of the template
//	$(inject).removeAttr("id").css("display","block").find("legend").text(thesect);
//	$("#"+thepath).append(inject);
	$("#"+thepath).append("<div class='instructions'><p>"+thesect+"</p></div");
	}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// inject a new dropdown into the HTML (array, object) mimetypes are the only current user of dropdown menu
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function genHTMLdropdown(thepath,
						theid,
						thelabel,
						thehelp,
						theexamp)
	{
	if(noGen) return;	// debugging
	var formid="form#"+thepath[0];
	var inject = $("div#MIMEPICKER").clone(true);	// new dropdowns are clones of the template
	$(inject).removeAttr("id").css("display","block");
	if(theexamp!="undefined")	// if there IS an example, append it to the help (description) text in the 'title' attribute
		$(inject).attr("title",theid+" :: "+thehelp+"  Example: "+theexamp);
	else 
		$(inject).attr("title",theid+" :: "+thehelp);
	var tlabel=theid;	// in case there is no label specified, use the field id as its label
	if(typeof thelabel!="undefined") tlabel = thelabel; // if "thelabel" holds something, use it as field label
	$(inject).find("label").text(tlabel); //make the input element visible, add the label
	if(activeColm==0)	// reference activeColm as a toggle to put the menu/field into the left or right column fieldset
		addHere=$(formid).find("div.leftColumn fieldset:last");
	else 
		addHere=$(formid).find("div.rightColumn fieldset:last");
	$(addHere).append(inject);	// insert the html input element into the DOM
	activeColm = (activeColm+1)&1; // activeColm toggles between 0 and 1, even fields go in left, odd go in right
	}
/////////////////////////////////////////////////////////////////////////////////////////////////
// At the end of every "limb" in the schema, there is an input "leaf" that has a text input field
/////////////////////////////////////////////////////////////////////////////////////////////////
function genHTMLinput(	thepath,	// path to this node in the active expschema file
						theid,		// fieldname - JSON id
						thetype,	// string, bool, number
						thelabel,	// field label appears below text input
						thehelp,	// tooltip field help from description field
						theexamp,	// tooltip example text
						thevalue)	// if non-blank this is the default value preset into text input field (greyed-out)
	{
	if(noGen) return;	// debugging
	var useAtPrefix=false;	// if true then this field id needs an ampersand prefix
	var addHere;	// where in the DOM we will insert the resulting HTML element
	
	var shid = thepath[0].replace(" ","_");	// since HTML element IDs cannot have embedded spaces
	var formid="form#"+shid; // first item in path is the category name (used for HTML id)

	if(thetype=="array")	// no id, must be an array string instance, no id, combine all instances later
		{
		var inject = $("div#TEXTINPUT").clone(true);	// duplicate this hidden html element for insertion into the body of the page
		$(inject).find("label").remove();
		$(inject).removeAttr("id").attr("title","Enter this instance value").css("display","block");
		activeColm=0;	// depending on activeColm put the data in the left or right column fieldset
		addHere=$(formid).find("div.leftColumn fieldset:last");
		$(addHere).append(inject);	// insert the html input element into the DOM
		return;
		}

	if(theid.indexOf("@")>=0) // if theid contains an @ symbol we remove it
		{
		useAtPrefix=true;	// and remind ourselves that the field id really has an @ prefix
		theid=theid.replace("@","");	// remove it since we're going to use field id as HTML element ID, which cannot contain "@"
		}
	if((thetype!="string")&&(thetype!="boolean")&&(thetype!="number")&&(thetype!="const"))
		{
		alert("I do not know how to build type "+thetype); // confusion if we got here with something other than one of those
		return;
		}
	var inject = $("div#TEXTINPUT").clone(true);	// duplicate this html element (hidden) to insert it into the body of the page

	// fullpath attribute is the full path into the schema hierarchy of this particular node
	$(inject).attr("id",theid).attr("fullpath",arrayValue(thepath,theSchema,true)+"."+theid); // arrayValue returns the string, not the object
	if(typeof thehelp=="undefined") thehelp = "none available"; // cover edge-case of incomplete help/description fields in the schema
	if(theexamp!="undefined")	// if there IS an example, append it to the help (description) text in the 'title' attribute
		$(inject).attr("data-html",true).attr("title",thehelp+"\nExample: "+theexamp+"\nJSON::"+theid);
	else 
		$(inject).attr("data-html",true).attr("title",thehelp+"\nJSON::"+theid);

	if(useAtPrefix)	// flag this element's ID as really needing an ampersand as the first character - when output to JSON
		$(inject).addClass("atPrefix");	// input field gets atPrefix class added in order to remind ourselves the id needs "@" prefix before JSON output

	var tlabel=theid;	// in case there is no label specified, use the field id as its label
	if(typeof thelabel!="undefined") tlabel = thelabel; // if "thelabel" holds something, use it as field label

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// it is my grammatical understanding that only the first letter of a sentence is capitalized, this commented-out logic enforced that
// but Eric is of the persuasion that all words in a sentence are capitialized, so the schema content wins is not "rectified"
//	if(thelabel=="PLACEHOLD") tlabel = theid;	// another variation of incomplete schema editing, us the ID for label if it's missing in schema
//	var tcase = tlabel.toLowerCase();	//force all labels to be lower case with only the first letter of first word capitalized ('Your name' NOT 'Your Name')
//	tlabel = tcase.substr(0,1).toUpperCase()+tcase.substr(1);	// capitalize the first word
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

	$(inject).css("display","block").find("label").text(tlabel); //make the input element visible, add the label

	if(activeColm==0)	// depending on activeColm put the data in the left or right column fieldset
		addHere=$(formid).find("div.leftColumn fieldset:last");
	else 
		addHere=$(formid).find("div.rightColumn fieldset:last");

	if(thevalue!="undefined")	// if the schema specifies a 'default' value for this field then put it in
		{
		$(inject).find("input").val(thevalue).css("opacity","50%");
		}

	if(useAtPrefix)
		{
		if(theid=="type") $(addHere).closest(".theColumns").attr("at_type",thevalue);
		if(theid=="id") $(addHere).closest(".theColumns").attr("at_id",thevalue);
		$(inject).find("label").text("@"+theid); //show the actual constant field id as the descriptive label
		console.log("label "+theid+" of "+thetype+" needs @ prefix");
		return;
		}

/*
	if(thetype=="const") // "const" fields are setup as readonly and colored green so that they're unmistakable
		{
		$(inject).find("input").prop("readonly",true).css("color","#999999");
		}
*/

	$(addHere).append(inject);	// insert the html input element into the DOM
	activeColm = (activeColm+1)&1; // activeColm toggles between 0 and 1, even fields go in left, odd go in right
	}
////////////////////////////////////////////////////////////////////////////////////////////
// returns (from the obj schema) the node whose path is in st
// st="main.description"
////////////////////////////////////////////////////////////////////////////////////////////
function myValue(st, obj) {
    return st.replace(/\[([^\]]+)]/g, '.$1').split('.').reduce(function(o, p) { 
        return o[p];
    }, obj);
}
////////////////////////////////////////////////////////////////////////////////////////////
// getpath::true returns string of path to the current end "leaf" node
// getpath::false returns a "pointer" object to the "leaf" node
////////////////////////////////////////////////////////////////////////////////////////////
function arrayValue(st, obj,getpath) {
    var xt=st[0];
    for(var i=1;i<st.length;i++)
    	xt+="."+st[i];
    	if(getpath==true) return xt;
    	return xt.replace(/\[([^\]]+)]/g, '.$1').split('.').reduce(function(o, p) { 
        return o[p];
    }, obj);
}
////////////////////////////////////////////////////////////////////////////////////////////
/*
memberOf, sameAs

5.5.4. anyOf
5.5.4.1. Valid values
This keyword's value MUST be an array. This array MUST have at least one element.
Elements of the array MUST be objects. Each object MUST be a valid JSON Schema.
5.5.4.2. Conditions for successful validation
An instance validates successfully against this keyword if it validates successfully against at least one schema defined by this keyword's value.
5.5.5. oneOf
5.5.5.1. Valid values
This keyword's value MUST be an array. This array MUST have at least one element.
Elements of the array MUST be objects. Each object MUST be a valid JSON Schema.
5.5.5.2. Conditions for successful validation

An instance validates successfully against this keyword if it validates successfully against exactly one schema defined by this keyword's value.

oneOf means it must validate against only one of the schemas.
*/


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Re-entrant function takes the input expSchema (organization or dataset), a string of the javascript object <path> to the item <key>
// this function ends-up calling itself as we discover elements and walk down into the schema
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function whatzit(whichSchema,path,key)
	{
			console.log("whatzit() "+path+":"+key);

			var lpath= arrayValue(path,whichSchema,false)[key]; // arrayValue() 3rd param false returns the object
/*
			if(typeof lpath=="undefined") // does this field look genuine?
				{
				lpath=arrayValue(path,whichSchema,false)["anyOf"];
				if(typeof lpath=="undefined") // does this field look genuine? are we lost?
					{
					// use the key as the label and description for these cases
					console.log("%c%s","background:orange", thesekeys[j]);
					console.log("missing type, title, description for "+thesekeys[j]);
					}
				else // process anyOf
					{
					for(var j=0;j<lpath.length;j++)
						{
						whatzit(whichSchema,path,"anyOf");
						}
					return;
					}
				}
			else
				{
				// some nodes (like constant) have no "type"
*/				if(typeof lpath=="object" && typeof lpath.type=="undefined")
					{
					// generate input field for "constants" but disallow any input into them
					// they may want to be invisible so as not to confuse user, but they should
					// be here in the HTML so that we pick them up to include in the proper position
					// when the output JSON is generated.
					genHTMLinput(path,key,"const",lpath.const,"constant value required for this object type","",lpath.const);
					console.log("Const: "+key+" "+lpath.const);
					return;
					}
				switch(lpath.type)
//				switch(typeof lpath)
					{
					case 'boolean':
						{
						var inject = $("div#CHECKBOX").clone(true); // make a copy of the form template
						$(inject).attr("id",key).css("display","block").find("label").text(lpath.title);	// only boolean we know of so far is isAccessibleForFree
						$(inject).attr("title",lpath.description);
						var formid = "form#"+path[0];
						$(formid).prop("checked",true);
						if(activeColm==0)	// depending on activeColm put the data in the left or right column fieldset
							addHere=$(formid).find("div.leftColumn fieldset:last");
						else 
							addHere=$(formid).find("div.rightColumn fieldset:last");
						$(addHere).append(inject);	// insert the html input element into the DOM
						activeColm = (activeColm+1)&1; // activeColm toggles between 0 and 1, even fields go in left, odd go in right
						break;
						}
					case 'string':
					case 'number':
						{
						if(typeof lpath.format!="undefined")
							{
							if(lpath.format=="MimeType")
								{
								// generate an input field that is connected to an instance of the mimetype dropdown menu
								genHTMLdropdown(path,key,lpath.title,lpath.description,lpath.example);
								break;
								}
							}
						genHTMLinput(path,key,lpath.type,lpath.title,lpath.description,lpath.example,lpath.default);
						break;
						}
					case 'const':
						{
						console.log("type :: const");
						return;
						break;
						}
					case 'object':
						{
						var wpath = path;
						wpath.push(key);
						wpath.push("properties");
						var okeys = Object.keys(lpath.properties);
						console.log("type :: object");
//	2/1 replaced with next line					genHTMLsect(path[0],"Object: "+key);
//						genHTMLsect(path[0],"Object: "+key+" : "+lpath.title+" : "+lpath.description);
//						$("#main .leftColumn fieldset").append("<h3 class='multigenSubHead'>"+key+"</p>");
/*
In order to properly label each object (which may have it's own @id constant) we see if we have both columns
full, if not we place an empty text input in the right column

then we add an h3 text to the left column and an empty one to the right column


						if($("#"+path[0]+" .rightColumn fieldset").children().length!=$("#"+path[0]+" .leftColumn fieldset").children().length)
							$("#"+path[0]+" .rightColumn fieldset").append("<div style='visibility:hidden'><input type='text'><label>+++</label></div>");
						$("#"+path[0]+" .leftColumn fieldset").append("<div><h3 class='AddASubhead'>"+key+"</p></div>");
						$("#"+path[0]+" .rightColumn fieldset").append("<div style='visibility:hidden'><h3 class='AddASubhead'>---</p></div>");
//						debugger;
*/
						if(arrayDepth)
							var inject = $("div#NEW_OBJECT").clone(true); // make a copy of the form template
						else
							var inject = $("div#NEWSECT").clone(true); // make a copy of the form template
						activeColm=0;	// depending on activeColm put the data in the left or right column fieldset
						$(inject).removeAttr("id").css("display","block");
						$(inject).find("legend:first").css("display","block").text(key);
						if(arrayDepth)
							{
							addHere=$("#"+path[0]).find(".theColumns:last");
							$(addHere).append(inject);	// insert the html input element into the DOM
							}
						else 
							{
							$("form#"+path[0]).append(inject);
							}
						for(var i=0;i<okeys.length;i++)
							{
							whatzit(whichSchema,wpath,okeys[i]);
							}
						break;
						}
					case 'array':
						{
	/*
						if($("#MainInfo form:last .leftColumn fieldset").children().length==0)
							{
							$("#MainInfo form:last .instructions:first").next("div").remove();// delete existing columns
							}
*/
						var t1 = "Delete this "+key+" instance.";
						var t2 = "Add another "+key+" instance.";
						var wpath = path;
						wpath.push(key);
						wpath.push("items");
						console.log("type :: array "+path+" "+key);
//						genHTMLsect(path[0],"Array instance of: "+key);
						var tpt = theSchema[path[0]][path[1]]; // the schema node where we pickup the array instance description
//						genHTMLsect(path[0],key+" :: "+ tpt["description"]);
						var insert=$("#MULTIGEN").clone(true);	// arrays have instances of the template
						$(insert).css("display","block").attr("id",key).attr("whichArray",key);
						$(insert).find(".multigenSubHead").text(key);
						$(insert).find(".delinst").attr("title",t1);
						$(insert).find(".addinst").attr("title",t2);
						$(insert).find(".instructions").text(tpt.description);
						if(tpt.description=="") $(insert).find(".instructions").css("display","none");
						else $(insert).find(".instructions").css("display","block");
						$("form#"+path[0]).append(insert);
						// not sure why I need to do this, the multigen class is in the template...
						$(insert).addClass("multigen");
						$(insert).find(".wholeColumn").css("display","block");
						// need underscore version of id for this
						var smst = path[0].replace(" ","_");
						var formid="#"+smst;
						var fpath=arrayValue(path,theSchema,true)+"."+key; // arrayValue returns the string, not the object
						if(typeof lpath.items.properties=="undefined")
							{
							if(typeof lpath.items.anyOf == "undefined")
								{
								if(typeof lpath.items["type"]=="string")
									{
									genHTMLinput(path,key,lpath.type,lpath.title,lpath.description,lpath.example,lpath.default);
									return;
									}
								else 
									{
									console.log("%c%s%c = %c%s","background:orange", path, "all:inherit;", "background:yellow;font-style: italic;", key);
									console.log("no properties for array "+path+" "+key);	
									return;
									}
								}
							// there IS an anyOf element
							// this is absolete code since spatial data where it was used is now hand-coded
							var theprops=lpath.items.anyOf;
							activeColm=0;	// each instance starts in left column
							for(var i=0;i<theprops.length;i++)
								{
								whatzit(whichSchema,wpath,theprops[i]);
								// add +/- here one for each instance
								}
							break;
							}
						var theprops=Object.keys(lpath.items.properties);
						wpath.push("properties");
						activeColm=0;	// each instance starts with left
						arrayDepth++;
						for(var i=0;i<theprops.length;i++)
							{
							whatzit(whichSchema,wpath,theprops[i]);
							// add +/- here one for each instance
							}
						arrayDepth--;
						break;
						}
					default:
						{
						var tcon=typeof lpath.const;
						if(tcon =="undefined")
							{ // tcon is string for const
							console.log("type not handled "+path+"  "+lpath);
							break;
							}
						// for const field
						genHTMLinput(path,key,tcon,"Constant Value","","",lpath.const); // pass along the value to pre-fill the input
						break;
						}
					}
					
/*				}*/
			}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// these fields were lifted from the dataset-example-canonical.json filetypes
//
// it's unclear if these are common to ALL datasets or not.
// if so: here is where we add the boiler plate to the outputJSON structure
// if NOT: how/where/why would this items be modified?
/////////////////////////////////////////////////////////////////////////////////////////////////////////
function boilerPlate()
	{
	// for datasets
	if(typeof outputJSON["@context"]!="object")
		outputJSON["@context"]={"@vocab":"http://schema.org/"};
	if(schemaName=="Dataset")
		{
// @context object
		outputJSON["@context"]["r3data"]="http://example.org/re3data/0.1/";
		outputJSON["@context"]["earthcollab"]="https://library.ucar.edu/earthcollab/schema#";
		outputJSON["@context"]["geolink"]="http://schema.geolink.org/1.0/base/main#";
		outputJSON["@context"]["geolink-vocab"]="http://schema.geolink.org/1.0/voc/local";
		outputJSON["@context"]["vivo"]="http://vivoweb.org/ontology/core#";
		outputJSON["@context"]["dcat"]="http://www.w3.org/ns/dcat#";
		outputJSON["@context"]["dbpedia"]="http://dbpedia.org/resource/";
		outputJSON["@context"]["geo-upper"]="http://www.geoscienceontology.org/geo-upper#";
// end @context object
//
// in order to get even the simplest JSON to validate I added these artifical presets
// If these don't appear in the UI then how/where/to-what are they assigned?
//
		outputJSON["includedInDataCatalog"]["url"]="http://www.wtf.com";
		outputJSON["includedInDataCatalog"]["@id"]="http://www.wtf.com";
		outputJSON["url"]="http://www.wtf.com";
		outputJSON["@id"]="http://www.wtf.com";
		outputJSON.provider["@id"]="http://www.wtf.com";
		outputJSON.provider["url"]="http://www.wtf.com";
		outputJSON.publisher["@id"]="http://www.wtf.com";
		outputJSON.publisher["url"]="http://www.wtf.com";
		}
	else 
		{
// @context object
		outputJSON["@context"]["gdx"]="https://geodex.org/voc/";
		outputJSON["@context"]["datacite"]="http://purl.org/spar/datacite/";
		outputJSON["@context"]["geolink"]="http://schema.geolink.org/1.0/base/main#";
		outputJSON["@context"]["re3data"]="http://example.org/re3data/0.1/";
		outputJSON["@context"]["ecrwg"]="http://example.org/ecrwg/0.1/";
// end @context object
		outputJSON["@type"] = "Service";
		outputJSON["@id"] = "https://www.wtf.com";
		outputJSON.url="https://www.wtf.com";
		outputJSON.keywords="ss,yy";
		}
	}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// attempt at forcing Leaflet.js map containers to refresh/retile, otherwise browser window must be resized in order to do so
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function bigHack()
	{
	setTimeout(function(){ var fixit=Object.keys(mapInst); for(var i=0;i<fixit.length;i++)
			{
			mapInst[fixit[i]].invalidateSize();
			}
	 	}, 2000);
	}
////////////////////////////////////////////////////////////////////////////////////////////
// given the reduced schema (thanks Alex) this is where we walk through and build the UI
function showSchema(expWhich) // expWhich is the reduced schema for Orgs or Datasets
	{
	var objLoc;
	
	// when we switch between org<>data schemas we need to rebuild editForm (the breadcrumbs menu)
	// this needs to be pruned when the maininfo and ContactContent example forms are no longer displayed
	editForm=["startover","setup"]; // Default/Debug editForm category defaults
	currForm=1;	// index into editForm
	ncats = Object.keys(expWhich); // ncats are the names of the categories
	$("#MainInfo form[id=makeJSON]").nextAll().remove();	// remove existing dynamic forms, that's just about everything on the main working page
	var menuit = $("#L2EnterData .breadcrumb_L2:first").clone(true);
	$("#L2EnterData li:nth-child(4)").nextAll().remove(); // preserve startover and setup menu items
//	$("#L2EnterData .breadcrumb_del:last").after(menuit);	// 
	for(i=0;i<ncats.length;i++) // for each category in the current schema
		{
//
// 2/6 test replace space underscore here
//
		ncats[i]=ncats[i].replace(" ","_");
//
		thistxt= ncats[i];	// the name of this category
		if(ncats[i]=="spatialcoverage")
			{
			var copyspatial = $("#SPATIAL").clone(true);
			$("#MainInfo").append(copyspatial);	// append this category form template to the HTML
			$(copyspatial).attr("id","spatialcoverage").css("display","block");
			$(copyspatial).find(".geocoordinate").attr("id","geocoord1").css("display","block");
			$(copyspatial).find(".geoshape").attr("id","geoshape1").css("display","block");
			editForm.push("spatialcoverage"); // we have created another category form, add to the known list editForm
			var menuit = $("#L2EnterData .breadcrumb_L2:first").clone(true);
			$(menuit).text("spatialcoverage");
			$("#L2EnterData").append(menuit);	// 
			$("#L2EnterData").append('<li class="breadcrumb_del"><i class="fa fa-angle-right"></i></li>');	// 
			continue;	// we copied a full HTML section, no need to built it, move on the next category
			}
		var theInst = expWhich[thistxt].description;	// if the category has description element then show it
		if(typeof theInst == "undefined")
			theInst = "";	// no description so leave it blank
		else 
			theInst = theInst.description;
		var smshtxt = thistxt.replace(" ","_");	// since we use category for HTML element ID, this name cannot contain a space
		thiscat=expWhich[thistxt];	// the node in the schema of this category
		thesekeys=Object.keys(thiscat);	// the number of keys in this category
		console.log("\n\nCATEGORY:"+thistxt);	// category name
		// this is where we add the names of the detected categories in this schema to the breadcrumbs menu bar
//	$("#L2EnterData .breadcrumb_del:last").after(menuit);	// 
	var menuit = $("#L2EnterData .breadcrumb_L2:first").clone(true);
	$(menuit).text(smshtxt);
	$("#L2EnterData").append(menuit);	// 
	$("#L2EnterData").append('<li class="breadcrumb_del"><i class="fa fa-angle-right"></i></li>');	// 
		genHTMLcat(smshtxt,theInst);	// generate a new, empty instance of the category form
		editForm.push(smshtxt); // we have created another category form, add to the known list editForm
		for(j=0;j<thesekeys.length;j++)	// process each root item in this category
			{
			objLoc = [ncats[i]];
			whatzit(expWhich,objLoc,thesekeys[j]);
			}
		}
	// all categories in the current schema have been built into the UI, time to display the first category
	pruner();
	showForm(currForm);
	$("#MainInfo").css("display","block");
	// let's now add the makeJSON menu item
	var menuit = $("#L2EnterData .breadcrumb_L2:first").clone(true);
	$(menuit).text("makeJSON");
	$("#L2EnterData").append(menuit);	// 
	editForm.push("makeJSON"); // we have created another category form, add to the known list editForm
	}
///////////////////////////////////////////////////////////////////////////
// on startup we scan the selected schema and build the category menu
// from those defined in the schema
///////////////////////////////////////////////////////////////////////////
function simpRead(theFile)
	{
    $.get(theFile, function(data)
    	{
        return data;
    	}, "text");
	}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// in order to duplicate a javascript object (and it's deep contents) we need myInterativeCopy()
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function myInterativeCopy(src)
	{
	let target = {};
	for (let prop in src)
		{
		if (src.hasOwnProperty(prop))
			{
			target[prop] = src[prop];
			}
		}
	return target;
	}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GENERATE OUTPUT JSON (javascript object) by scraping GUI and copying the values
// the objToupdate is either DataSkeleton or OrganizationsSkeleton, empty skeleton schema instances generated by instantiater
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function fabJSON(objToupdate)	// input is the javascript object into which we add values
	{
	var thefab = objToupdate;
	var outElems = Object.keys(thefab);
	for(var i = 0;i<outElems.length;i++)	// for each root-level element of a schema instance
		{
		if(outElems[i].indexOf("@")>=0)	// names with @prefix need more attention
			{
			thefab[outElems[i]]="Where could this value be stored/retrieved?";
			continue;
			}
		if( (typeof thefab[outElems[i]]=="string") || (typeof thefab[outElems[i]]=="boolean") )
			{
			thefab[outElems[i]]=$("#"+outElems[i]+" input").val();
			continue;
			}
		if(typeof thefab[outElems[i]]!="object")
			{
			alert("non object "+outElems[i]);
			continue;
			}
		if(outElems[i]=="spatialCoverage")	// special collating sequence needed to go from GUI->JSON
			{
			// for each spatial data object instance in the GUI we build the JSON elements
			var theGeos=$("#MainInfo div[class^='geo']"); // we need the #MainInfo prefix to avoid including the template as well
			for(var j=0;j<theGeos.length;j++)
				{
				if(j>0)	// 1st instance uses the original declaration, others need a duplicate created
					{
					thefab[outElems[i]][j]=myInterativeCopy(thefab[outElems[i]][0]);
					thefab[outElems[i]][j]["geo"]=[{}];	// we'll be setting new values for this
					}
				if($(theGeos[j]).hasClass("geocoordinate"))
					{
					thefab[outElems[i]][j]["@type"]="Place";
					thefab[outElems[i]][j]["name"]=$.trim($(theGeos[j]).find(".GeoName").val());
					thefab[outElems[i]][j]["geo"]["@type"]="GeoCoordinates";
					thefab[outElems[i]][j]["geo"]["latitude"]=$.trim($(theGeos[j]).find(".GeoLat").val());
					thefab[outElems[i]][j]["geo"]['longitude']=$.trim($(theGeos[j]).find(".GeoLon").val());
					}
				else
					{
					thefab[outElems[i]][j]["@type"]="Place";
					thefab[outElems[i]][j].name=$.trim($(theGeos[j]).find(".GeoName").val());
					thefab[outElems[i]][j]["geo"]["@type"]="GeoShape";
					thefab[outElems[i]][j]["geo"]["box"]=$.trim($(theGeos[j]).find(".GeoBox").val());
					thefab[outElems[i]][j]["geo"]['polygon']=$.trim($(theGeos[j]).find(".GeoPoly").val());
					}
				}
			continue;
			}
		for(var j=0;j<thefab[outElems[i]].length;j++) // j is index into which array instance
			{
			var elemkey=Object.keys(thefab[outElems[i]]); // the keys of one of this array's child element
			for(var k=0;k<elemkey.length;k++)	// for each element of this child instance
				{
				var wid=elemkey[k];
				if(wid.indexOf("@")>=0)	// name of this array is @ prefixed
					{
					thefab[outElems[i]][j]="Where could this value be stored/retrieved?";
					continue;
					}
				for(var l=0;l<thefab[outElems[i]].length;l++)
					{
					if(outElems[l].indexOf("@")>=0) continue;
					thefab[outElems[i]][outElems[l]] = $("#"+outElems[l]);
					}
//				fabJSON(thefab[outElems[i]][j]);
/*
				var tval=$("#"+outElems[i]+" input")[j]; // find the jth instance of an input in div #currentElement

				if( (elemkey.length==1) && (thefab[outElems[i]]=="") )	// empty array
					thefab[outElems[i]][j]=$(tval).val();
				else 
					thefab[outElems[i]].push($(tval).val());
*/
				}
			}
		}
	return(thefab);
	}
////////////////////////////////////////////////////////////////////////////////////////////
// prototype JSON import is in exampImport
// this function takes values from a JSON string of label/values and finds/fills-in the GUI
//
// there's a special case for spatialCoverage since the fashion in which these values are
// presented in the GUI is not as they appear in the JSON string
////////////////////////////////////////////////////////////////////////////////////////////
function populateGUI(whichObj)
	{
	// to match-up a field name with the GUI we need to be sure that we're referencing the correct instance of that name
	// we do this by finding the column div that has the at_type property of the same value as last seen in the import JSON 
	var objtype="";	// this is the last encountered "@type":"xyz" encountered in JSON 
	var exampKeys=Object.keys(whichObj);
	for(var i=0; i<exampKeys.length;i++)
		{
		var thistype = typeof whichObj[exampKeys[i]];
		switch (thistype)
			{
/*
			case "boolean":
				{
				console.log("boolean value "+exampKeys[i]+" : "+whichObj[exampKeys[i]]);
				$("#"+exampKeys[i]+" input").val(whichObj[exampKeys[i]]);
				break;
				}
*/
			case "string":
				{
				if(exampKeys[i].indexOf("@")>=0) // element names with @ prefix are special
					{
					console.log("IGNORED: "+exampKeys[i]+" :: "+whichObj[exampKeys[i]]);
					continue;
					}
				//
				// Is this string really a checkbox?
				//
				if($("#"+exampKeys[i]).find("input").attr("type")=="checkbox")
					{
					if(whichObj[exampKeys[i]]=="true")
						$("#"+exampKeys[i]).find("input").prop("checked",true);
					else 
						$("#"+exampKeys[i]).find("input").prop("checked",false);
					}
				console.log("string value "+exampKeys[i]+" : "+whichObj[exampKeys[i]]);
				//
				// if an element with @ prefix (@type for example) makes it this far it's currently ignored
				//
//				if(exampKeys[i].indexOf("@")<0) // element names without @ prefix are plunked into the GUI
					$("#"+exampKeys[i]+" input:first").val(whichObj[exampKeys[i]]);
//				else 
//					console.log("IGNORED @ "+objtype+" "+exampKeys[i]+" :: "+whichObj[exampKeys[i]]);
				break;
				}
			case "object":
				{
				// is it an object or an array?
				var olen = whichObj[exampKeys[i]].length;
				if(olen == undefined)	// meaning that it's not an array 
					{
					var objitems = Object.keys(whichObj[exampKeys[i]]);
					for(var j=0;j<objitems.length;j++)
						{
						console.log("object value "+exampKeys[i]+" : "+[objitems[j]]+" == "+whichObj[exampKeys[i]][objitems[j]]);
						}
					}
				else 
					{
					console.log("Array name: "+exampKeys[i]+" has "+olen+" instances");
//					if(exampKeys[i]=="category") debugger;
					if(exampKeys[i].indexOf("@")>=0)
						{
/*
						if(exampKeys[i]=="@type")
							{
							if(whichObj[exampKeys[i]].length>1) continue; // @type=xxx expected @type =["xx","yy","zz","xx"] is not
							objtype = whichObj[exampKeys[i]].replace("@","");	// save type without the @ for comparison with at_type property in GUI
							continue;
							}
*/						console.log("IGNORE "+exampKeys[i]);
						continue; // will handle these cases once the rest are processed
						}
					for(var j=0;j<olen;j++)	// for each instance of this array element
						{
						var instkeys = Object.keys(whichObj[exampKeys[i]][j]); // instance variables
						//
						// all the add/delete instance logic is in the +/- buttons in the GUI for array elements
						// when we're importing data into the GUI, we "click" the add button (+) in order to create 
						// an additional instance in the GUI to hold the incoming array data for this next entry
						//
						if(j!=0)	// first (0th) instance uses the original HTML element we created
							$("#"+exampKeys[i]+":last").find(".addinst").trigger("click"); // make a new instance
						//
						// spatial import data requires special handling
						//
						if(exampKeys[i]=="spatialCoverage")
							{ // olen = number of points, instkeys will be @type,"name","geo"
							var pntinfo = whichObj[exampKeys[i]];
							var pnttype = pntinfo[j]["geo"][0]["@type"];
							var pntname = pntinfo[j].name;
							if(pnttype=="GeoCoordinates") // pick-off the name/lat/lon and set corresponding GUI fields
								{
								var pntlat = pntinfo[j]["geo"][0].latitude;
								var pntlon = pntinfo[j]["geo"][0].longitude;
								$("#spatialcoverage .geocoordinate .GeoName:last").val(pntname);
								$("#spatialcoverage .geocoordinate .GeoLat:last").val(pntlat+"\n");
								$("#spatialcoverage .geocoordinate .GeoLon:last").val(pntlon+"\n");
								}
							else 
								{
								var pntbox = pntinfo[j]["geo"][0].box.replace(/ /g,",");
								var pntpoly = pntinfo[j]["geo"][0].polygon.replace(/ /g,",");
								$("#spatialcoverage .geoshape .GeoName:last").val(pntname);
								$("#spatialcoverage .geoshape .GeoBox:last").val(pntbox+"\n");
								$("#spatialcoverage .geoshape .GeoPoly:last").val(pntpoly+"\n");
								}	//
							// there's only one instance of "#spatialcoverage" so
							// $("#spatialcoverage .geocoordinate") and $("#spatialcoverage .geoshape") hold the values
							continue;
							}
						for(var k=0;k<instkeys.length;k++)	// for each element in the new instance
							{
							if(typeof whichObj[exampKeys[i]][j]=="string") // handle array values that have no field name in schema
								{
								$("[whicharray="+exampKeys[i]+"]:last").find("input").val(whichObj[exampKeys[i]][j]);
								}
							else 
								{
								if(instkeys[k]=="additionalType")
									{ console.log("additionalType value ignored: "+whichObj[exampKeys[i]][j]); continue; }
								if( (instkeys[k]=="fileFormat") || (instkeys[k]=="encodingFormat"))
									{
									var friendly = filetypes[mimetypes.indexOf(whichObj[exampKeys[i]][j][instkeys[k]])];
									$("#"+exampKeys[i]+" select:last").val(friendly);
									}
								else 
									{
									if(instkeys[k].indexOf("@")>=0)
										{
										if(instkeys[i]!="@type") continue;
										objtype = whichObj[exampKeys[i]][j][instkeys[k]].replace("@","");	// save type without the @ for comparison with at_type property in GUI
										continue;
										}
									if(objtype!="")
										$("div[at_type="+objtype+"] #"+exampKeys[i]+":last").find("#"+instkeys[k]+" input").val(whichObj[exampKeys[i]][j][instkeys[k]]);
									else 
//										$("#"+exampKeys[i]+":last").find("#"+instkeys[k]+" input").val(whichObj[exampKeys[i]][j][instkeys[k]]);
										$("[whicharray="+exampKeys[i]+"]:last").find("#"+instkeys[k]+" input").val(whichObj[exampKeys[i]][j][instkeys[k]]);
									}
								}
							}
						}
					}
				break;
				}
			default:
				console.log("unexpected type "+exampKeys[i]+" : "+thistype);
				break;
				}
		}
	}
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function schemaGroups(schema, groups) {
  var keys = Object.keys(groups);
  var res = {};
  keys.forEach(function (k) {
    return res[k] = groups[k].map(function (i) {
      return _defineProperty({}, i, schema.properties[i]);
    }).reduce(function (acc, n) {
      return _objectSpread({}, acc, n);
    }, {});
  });
  return res;
}
////////////////////////////////////////////////////////////////////////////////////////////
function buildCatMenu()
	{
	const schemaOrg = getFile('https://earthcube.isti.com/schema/organizations.json');
	const schemaData = getFile('https://earthcube.isti.com/schema/dataset.json');
	const exampImport = getFile("dataset_example_canonical_fixed.json"); // for development, probably should delete this
//	const schemaOrg = getFile('organizations.json');
//	const schemaData = getFile('schema/dataset.json');
	Promise.all([schemaOrg,schemaData,exampImport]).then(gotFiles);
	}
function gotFiles(files)
	{
	schemaO=files[0];	// the full organization schema
	schemaD=files[1];	// the full dataset schema
	exampImport=files[2];	// test file, probably should delete this
	expSchemaO=schemaGroups(schemaO,schemaO.groups);	// this is the "condensed" organizations schema used to build the UI
	expSchemaD=schemaGroups(schemaD,schemaD.groups);	// this is the "condensed" dataset schema used to build the UI
	OrganizationsSkeleton=instantiate(schemaO,{ defaultOnArray: true });			// build an organizations schema instance for output
	DataSkeleton=instantiate(schemaD,{ defaultOnArray: true });					// build a dataset schema instance for output
	}	
function getFile(file) {
  return fetch(file)
    .then(res => {
      if (!res.ok) { return Promise.reject("Failed with status : " + res.status + " | " + res.statusText); }
      return res.json();
    })
    .catch(err => console.log(err));
}

function getGroups(schema) {
  return schema['groups'];
}

//Retrieves parts of schema that match with 
/**
* @param {object} schema Should be full schema json
* @param {object} groups Object that contains arrays of keys. 
*    Will search schema for properties with keys, will place subsection of schema into return object.
*/
function generateSchemaFromGroups(schema, groups) {
  subSchemas = {};

  for (let group in groups) {
    subSchemas[group] = {};

    for (let k of groups[group]) {
      subSchemas[group][k] = schema.properties[k];
    }
  }
  return subSchemas;
}

function createOption(text) {
  const t = document.createTextNode(text);
  const e = document.createElement('option');
  e.appendChild(t);
  return e;
}
////////////////////////////////////////////////////////////////////////////////////////////////////
// if we WERE to use localStorage instead of actual file system, this code could manage the get/put 
////////////////////////////////////////////////////////////////////////////////////////////////////
/*
function seeLocalFiles()
	{
	var i,thskey,allfiles="";
	for(i=0;i<localStorage.length;i++)
		{
		thskey=localStorage.key(i);
		if(thskey.indexOf(".UCARtemp")>0)
			{
			if(i!=0) allfiles+=",";
			allfiles+=thskey.replace(".UCARtemp","");
			}
		}
	return allfiles;
	}
function putLocalFile(filename,content)
	{
	localStorage.setItem(filename+".UCARtemp",content);
	}
function getLocalFile(filename)
	{
	return localStorage.getItem(filename+".UCARtemp");
	}
function deleteLocalFile(filename)
	{
	localStorage.removeItem(filename+".UCARtemp");
	}
*/
////////////////////////////////////////////////////////////////////////////////////////////
// remove any instructions that are un-used
function pruner()
	{
	var telem="";
	var thinst = $("div.instructions");
	var rmi = 0;
	for(rmi=0;rmi<thinst.length;rmi++)
		{
		telem=thinst[rmi];
		if($.trim(telem.textContent)=="") $(thinst[rmi]).css("display","none");
		}
	thinst = $("legend");
	for(rmi=0;rmi<thinst.length;rmi++)
		{
		telem=thinst[rmi];
		if($.trim(telem.textContent)=="") $(thinst[rmi]).css("display","none");
		}
	}
////////////////////////////////////////////////////////////////////////////////////////////
// given an index into editForm (the names of the categories or pages other than landing)
////////////////////////////////////////////////////////////////////////////////////////////
function showForm(which)
	{
//	console.log("Show Form: "+which);
	hideForms();
	// show the selected form
	if(editForm[which]!="startover")
		{
		if(editForm[which]=="setup")	// setup menu item really turns on/off two forms InitSetup and AddCat
			{
			$("form[id=InitSetup]").show();
//			$("form[id=AddCat]").show();	// not implemented yet so don't show it
			}
		else 
			$("form[id="+editForm[which]+"]").show();
		}
$('body').scrollTo({ top:00, left:0}, 500);
//	if(which>=2)
//		{
//		which=which-1;
		$("#L2EnterData li").removeClass("youRhere"); // remove "current item" color from all list items
		var titm=$("#L2EnterData .breadcrumb_L2")[which];
		$(titm).addClass("youRhere");
//		}
	// set the "current" menu item color highlighting this form name 
	}
function hideForms()	// hide all forms whose IDs are in editForm[]
	{
	var i;
	for(i=0;i<editForm.length;i++)
		{
		if(editForm[i]=="startover")
			continue;	// there is no startover form so just ignore this
		if(editForm[i]=="setup")
			{
			$("form[id=InitSetup]").hide();
			$("form[id=AddCat]").hide();
			}
		else 
			$("form[id="+editForm[i]+"]").hide();
		}
	}
/* unused, probably should delete
function goForms()
	{
	hideForms();
	currForm=0;
	showForm(currForm);
	}
*/
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// once the page is loaded/ready here is where we actually start building the dynamic UI/Forms/etc
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
$(document).ready(function(){
thePage=$(location).attr("href");	// get path of current page
var theLast = thePage.lastIndexOf("/");	// everything after that is the filename of this page
thePage = thePage.substring(theLast+1);	// no just the filename is in thePage
////////////////////////////////////////////////////////////////////////////////////////////
// enable tooltips for everything, set them right-justified above the <input> field
////////////////////////////////////////////////////////////////////////////////////////////
if(thePage=="neworg.htm")
	{
	$( document ).tooltip(
		{
//		tooltipClass: "ui-tooltip"
		position: { my: "right bottom", at: "right top+18" }
		});
	}
$(".uitooltip").css("width","600px;");
////////////////////////////////////////////////////////////////////////////////////////////
/*
 var xcord=box.split(","); if(xcord.length<4) return;
	L
*/
//$("form#spatialcoverage :input").on("input", function(evt)
$(":input").on("input", function(evt)
	{
//	if(evt.currentTarget.parentNode.getAttribute("fullpath").indexOf("spatial")<0) return;
// classes geocoordinate or geoshape have tinst parameter which is index into mapInst which holds leaflet map object returned
	if(evt.currentTarget.className.indexOf("Geo")<0) return;
	console.log(evt.currentTarget.className+" : "+$(evt.currentTarget).closest(".multigen").attr("tinst"));
	switch(evt.currentTarget.className)
		{
		case "GeoBox":
			{
			// wait until we have two pairs of lat/lon then draw that box
			var tmap = $(evt.currentTarget).closest(".multigen").attr("id");	// index into xxx to find Leaflet object of this instance
			var bcord = $("#"+tmap).find("input.GeoBox").val();
			var bvals = bcord.split(",");
			if(bvals.length!=4) break;
			var bound = [];
			bound[0]=[bvals[0],bvals[1]];
			bound[1]=[bvals[2],bvals[3]];
			if(markInst[tmap]!=undefined)
				mapInst[tmap].removeLayer(markInst[tmap]);
			markInst[tmap]=L.rectangle(bound,{color:"green",weight:1}).addTo(mapInst[tmap]);
			mapInst[tmap].fitBounds(bound);
			bigHack();
			break;
			}
		case "GeoPoly":
			{
			// join completed pairs and draw that (ignore extra unpaired data)
			var tmap = $(evt.currentTarget).closest(".multigen").attr("id");	// index into xxx to find Leaflet object of this instance
			var rawt = $("#"+tmap).find("textarea.GeoPoly").val();
			var bvals = rawt.split(",");
			var thepoly = [];
			if(bvals.length<6) break;	// we need at least a triangle shape
			for(var ii=0;ii<bvals.length;ii=ii+2)
				{
				thepoly.push([bvals[ii],bvals[ii+1]]);
				}
			if(markInst[tmap]!=undefined)
				mapInst[tmap].removeLayer(markInst[tmap]);
			markInst[tmap]=L.polygon(thepoly).addTo(mapInst[tmap]);
			mapInst[tmap].fitBounds(thepoly);
			bigHack();
			break;
			}
		case "GeoLat":
		case "GeoLon":
			{ // combine (non-blank) lat/lon and draw the point
			var tmap = $(evt.currentTarget).closest(".multigen").attr("id");	// index into xxx to find Leaflet object of this instance
			var blat = parseFloat($("#"+tmap).find("input.GeoLat").val());
			var blon = parseFloat($("#"+tmap).find("input.GeoLon").val());
			if(isNaN(blat) || isNaN(blon)) break; // we need to numbes, lat and lon to set the mapview
			var mobj = [blat, blon];	// build the lat/lon array for setView
			mapInst[tmap].setView(mobj);	// reposition the map 
			if(markInst[tmap]!=undefined)
				mapInst[tmap].removeLayer(markInst[tmap]);
			markInst[tmap]= L.marker(mobj).addTo(mapInst[tmap]);
			bigHack();
			break;
			}
		default:
			{ // name, elevation
			break;
			}
		}
	});
////////////////////////////////////////////////////////////////////////////////////////////
$("#Maininfo").hide();	// turn off the Maininfo collection of forms while we build the GUI from the schema
buildCatMenu();	// this fetches the schema files, builds the skeletal JSON output objects and condensed schema for GUI building
currForm=1;	// form #0 is the "Start Over" function, you have to select it from the menu, you can't fall into it using arrow keys
theSchema = expSchemaO;	// build the organization UI

setTimeout(function(){ schemaName="Organization"; theSchema = expSchemaO; showSchema(expSchemaO); hideForms(); }, 1500);
setTimeout(function(){ showForm(currForm); $("#Maininfo").show(); }, 2500);
	$(".L2nav").fadeIn(1000);
/////////////////////////////////////////////////////////////////////////////////////
// using the values from dataset mimetype we build the drop-down menu for later use
/////////////////////////////////////////////////////////////////////////////////////
for(var i=0;i<filetypes.length;i++)
	{
	$("#MIMEPICKER option:last").after("<option>"+filetypes[i]+"</option>");
	}
////////////////////////////////////////////////////////////////////////
// ARRAY delete instance button handler
////////////////////////////////////////////////////////////////////////
$(document).on('click','.delinst',function(whodoo)
	{
	var dupafter = $(this).closest(".multigen");	// find the parent of this array element
	var thisarray = $(dupafter).attr("whicharray");	// get the name of this array
	if( ($("[whicharray="+thisarray+"]").length<2) && !$(dupafter).hasClass("geocoordinate") & !$(dupafter).hasClass("geoshape") )
		{
		// cannot delete all, need to leave one
// we silently do nothing when delete button is clicked on last element         $.alert({ boxWidth: '33%', useBootstrap:false, title:'Cannot delete the last instance', content:'<strong style="font-size: 16px;">Need at least one instance</strong>'});
		return;
		}
	if($(dupafter).hasClass("geocoordinate")||$(dupafter).hasClass("geoshape")) // remove the leftlets map object as well
		{
		var remID = $(dupafter).attr("id");
		if(Object.keys(markInst).length)	// if we have any markers we need to remove them first
			{
			var remMark = markInst[remID]; 			// get the layer object from markInst, delete it first
			mapInst[remID].removeLayer(remMark);	// remove the marker layer
			delete markInst[remID];					// delete the marker instance from collection of marker layers
			}
		mapInst[remID].remove();	// remove the map from Leaflet active list
		delete mapInst[remID];		// delete the map instance from our collection of active maps
		$(dupafter).remove();		// remove the HTML map object instance
		}
	else
		{ 
		$(dupafter).remove();							// remove the del button
//		alert("delete this instance of "+$(whodoo.currentTarget).attr("fullpath"));
//		console.log("delinst");
		}
	});
////////////////////////////////////////////////////////////////////////
// ARRAY add instance button handler
////////////////////////////////////////////////////////////////////////
$(document).on('click','.addinst',function(whodoo)
	{
//    $.alert({ boxWidth: '33%', useBootstrap:false, title:'Add array instance', content:'<strong style="font-size: 16px;">(under construction)</strong>'});
//    return;
	var dupafter = $(this).closest(".multigen");
	var dupthis = $(dupafter).clone(true);
	$(dupthis).insertAfter(dupafter);
	if($(dupthis).hasClass("geocoordinate")||$(dupthis).hasClass("geoshape")) // setup the Leaflets map object
		{//////////////////////////////////////////////////////////////////////////////////////////////////////
		var dynoID="mID"+mapIncrId;		// auto-increment serial# assigned as ID of the instance (.multigen) HTML object
		var mapID="mapID"+mapIncrId;	// auto-increment serial# assigned as ID of the div holding the map for this instance
		mapIncrId++;	// both the UI .multigen instance and the leaflet map div in it share the sequence # for readability

		$(dupthis).attr("id",dynoID);				// .multigen elements have unique (incremental) ids
		if($(dupthis).hasClass("geocoordinate")) $("#"+dynoID).find(".mapGeoCoord").attr("id",mapID);
		else $("#"+dynoID).find(".mapGeoShape").attr("id",mapID);

		mapInst[dynoID]=L.map(mapID).setView([40.035244,-105.243749], 13);	// create the leaflet instance, save reference in mapInst
		var thisMap=mapInst[dynoID];
		
		// apply the default boiler plate to the map for credits
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.streets',
			accessToken: 'pk.eyJ1IjoicHJlc3RvZGlnaXRhbCIsImEiOiJjanJ6YXJiaGcxNnJhM3ltbGg1a3ZpMHAyIn0.6BZEN6LKCOsVgMjMT5Srjw'
		}).addTo(thisMap);

		// add an example of a bounding box (like we'll be using) to the map - somewhere in Denver
//		var bound= [[39.73371170373402,-105.00527300620882],[39.736871660106125, -105.00287034299636]];
//		L.rectangle(bound,{color:"red", weight:1}).addTo(thisMap);

		thisMap.on('click',function(e){ourMapClick(e,thisMap);});	// add a click on test handler, pass along the .multigen element id
		bigHack();
		}//////////////////////////////////////////////////////////////////////////////////////////////////////
	});
///////////////////////////////////////////////////////////////
// no longer used
// keyboard up/down/left/right cursor key event handler
///////////////////////////////////////////////////////////////
/*

$(document).keydown(function(event){    
    var key = event.which;                
            switch(key) {
              case 37:
                  // Key left. PREVIOUS handling
				hideForms();
				currForm--;
				if(currForm<1)currForm=editForm.length-1;
				showForm(currForm);
                  break;
              case 38:
                  // Key up - currently ignored
                  break;
              case 39:
                  // Key right. NEXT handling
					hideForms();
					currForm++;
					if(currForm==editForm.length) currForm=1;
					showForm(currForm);
                  break;
              case 40:
                  // Key down - currently ignored
                  break;
        }   
  });
*/
  ///////////////////////////////////////////////////////////////
$("xli a").on("click",function(titem)
	{
	titem.stopPropagation();
	console.log($(this).text()+" "+$(this).text().length);
	});
$("li.arrowscale").on("click",function(titem)
	{
//	titem.stopPropagation();
//	$(".L1nav").css("display","block");
//	$(".L2nav").css("display","none");
//	$(".L2nav").hide();	// 2/21
//	$(".L1nav").fadeIn(1000);	// 2/21
//	alert("enter data");
	//console.log($(this).text()+" "+$(this).text().length);
	});
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// PROCESS VALIDATION RESULTS THAT WERE PLACED IN validationResults - FLAG FIELDS IN ERROR IN THE GUI
// $("#TARGET input").addClass("valError");
// $("#TARGET .errorCopy").css("val","the error message").css("display","block");
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/*

Here's an example of what the validator returns

validation.Results.errors looks like, this is the anticipated structure
of the results (as I recall Alex said that there were other optional formats)

As you can see, a large number of these errors (16-27) report on spatialCoverage
the syntax for the "dataPath" field is /sectionName/sectionInstance/subsectionName/subsectionInstance

validationResults
{errors: Array(30), additionalErrors: Array(1), valid: false}
additionalErrors: [false]errors: Array(30)
0: {keyword: "const", dataPath: "/@type", schemaPath: "#/properties/%40type/const", params: {…}, message: "should be equal to constant"}
1: {keyword: "format", dataPath: "/@id", schemaPath: "#/properties/%40id/format", params: {…}, message: "should match format "uri""}
2: {keyword: "type", dataPath: "/isAccessibleForFree", schemaPath: "#/properties/isAccessibleForFree/type", params: {…}, message: "should be boolean"}
3: {keyword: "format", dataPath: "/includedInDataCatalog/@id", schemaPath: "#/properties/includedInDataCatalog/properties/%40id/format", params: {…}, message: "should match format "uri""}
4: {keyword: "format", dataPath: "/includedInDataCatalog/url", schemaPath: "#/properties/includedInDataCatalog/properties/url/format", params: {…}, message: "should match format "uri""}
5: {keyword: "format", dataPath: "/distribution/0/contentUrl", schemaPath: "#/properties/distribution/items/properties/contentUrl/format", params: {…}, message: "should match format "uri""}
6: {keyword: "format", dataPath: "/distribution/0/encodingFormat", schemaPath: "#/properties/distribution/items/properties/encodingFormat/format", params: {…}, message: "should match format "MimeType""}
7: {keyword: "format", dataPath: "/provider/@id", schemaPath: "#/properties/provider/properties/%40id/format", params: {…}, message: "should match format "uri""}
8: {keyword: "format", dataPath: "/provider/url", schemaPath: "#/properties/provider/properties/url/format", params: {…}, message: "should match format "uri""}
9: {keyword: "format", dataPath: "/publisher/@id", schemaPath: "#/properties/publisher/properties/%40id/format", params: {…}, message: "should match format "uri""}
10: {keyword: "format", dataPath: "/publisher/url", schemaPath: "#/properties/publisher/properties/url/format", params: {…}, message: "should match format "uri""}
11: {keyword: "format", dataPath: "/creator/0/@id", schemaPath: "#/properties/creator/items/properties/%40id/format", params: {…}, message: "should match format "uri""}
12: {keyword: "format", dataPath: "/creator/0/url", schemaPath: "#/properties/creator/items/properties/url/format", params: {…}, message: "should match format "uri""}
13: {keyword: "format", dataPath: "/creator/0/creator/@id", schemaPath: "#/properties/creator/items/properties/creator/properties/%40id/format", params: {…}, message: "should match format "uri""}
14: {keyword: "format", dataPath: "/creator/0/creator/url", schemaPath: "#/properties/creator/items/properties/creator/properties/url/format", params: {…}, message: "should match format "uri""}
15: {keyword: "format", dataPath: "/creator/0/creator/identifier/url", schemaPath: "#/properties/creator/items/properties/creator/properties/identifier/properties/url/format", params: {…}, message: "should match format "uri""}

16: {keyword: "required", dataPath: "/spatialCoverage/0/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/0/required", params: {…}, message: "should have required property '@type'"}
17: {keyword: "required", dataPath: "/spatialCoverage/0/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/0/required", params: {…}, message: "should have required property 'latitude'"}
18: {keyword: "required", dataPath: "/spatialCoverage/0/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/0/required", params: {…}, message: "should have required property 'longitude'"}
19: {keyword: "required", dataPath: "/spatialCoverage/0/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/1/required", params: {…}, message: "should have required property '@type'"}
20: {keyword: "required", dataPath: "/spatialCoverage/0/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/1/required", params: {…}, message: "should have required property 'polygon'"}
21: {keyword: "anyOf", dataPath: "/spatialCoverage/0/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf", params: {…}, message: "should match some schema in anyOf"}
22: {keyword: "required", dataPath: "/spatialCoverage/1/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/0/required", params: {…}, message: "should have required property '@type'"}
23: {keyword: "required", dataPath: "/spatialCoverage/1/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/0/required", params: {…}, message: "should have required property 'latitude'"}
24: {keyword: "required", dataPath: "/spatialCoverage/1/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/0/required", params: {…}, message: "should have required property 'longitude'"}
25: {keyword: "required", dataPath: "/spatialCoverage/1/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/1/required", params: {…}, message: "should have required property '@type'"}
26: {keyword: "required", dataPath: "/spatialCoverage/1/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf/1/required", params: {…}, message: "should have required property 'polygon'"}
27: {keyword: "anyOf", dataPath: "/spatialCoverage/1/geo/0", schemaPath: "#/properties/spatialCoverage/items/properties/geo/items/anyOf", params: {…}, message: "should match some schema in anyOf"}

28: {keyword: "format", dataPath: "/variableMeasured/0/@id", schemaPath: "#/properties/variableMeasured/items/properties/%40id/format", params: {…}, message: "should match format "uri""}
29: {keyword: "format", dataPath: "/variableMeasured/0/url", schemaPath: "#/properties/variableMeasured/items/properties/url/format", params: {…}, message: "should match format "uri""}length: 30__proto__: Array(0)valid: false__proto__: Object

*/
/////////////////////////////////////////////////////////////////////////////////////////////////////////
function processValidation()
	{
	if(validationResults.errors == null)
		{
        $.alert({ boxWidth: '33%', useBootstrap:false, content:'<strong style="font-size: 16px;">Validation passed, no errors detected</strong>'});
		 return;
		 }
	for(var i=0;i<validationResults.errors.length;i++)
		{
		var thepath = validationResults.errors[i].dataPath;
		if(thepath=="/creator/0/url") debugger;
		if(thepath.indexOf("@")>=0)
			{
			console.log("VALIDATION FAIL: "+thepath);
			continue;	// for now, needs to be properly handled
			}
		var htarg = thepath.replace("/","");
		if(htarg.indexOf("/")>0) // so we have the creator/0/creator/@id syntax
			{
			var wherepath=htarg.split("/");	// includedInDataCatalog/@id becomes wherepath[0]includedInDataCatalog wherepath[1]@id

			if($("legend:contains('"+wherepath[0]+"')"))	// can we find the section with that name?
				{
				if(wherepath.length==2)
					{
					$("#"+wherepath[0]).find("input ");
					var thisguy=$("legend:contains('"+wherepath[0]+"')").parent().parent().find("div#url input");
					$(thisguy).addClass("valError");
					$(thisguy).parent().find("p.errorCopy").css("display","block");
					$(thisguy).parent().find("p.errorCopy").text(validationResults.errors[i].message);
					}
				else	// must indicate an instance like distribution/0/contentUrl
					{
					var thisguy = $("[whicharray="+wherepath[0]+"]")[wherepath[1]];
					$(thisguy+" [title="+wherepath[2]+"]").find("input").addClass("valError");
					$(thisguy+" [title="+wherepath[2]+"]").find("p.errorCopy").css("display","block");
					$(thisguy+" [title="+wherepath[2]+"]").find("p.errorCopy").text(validationResults.errors[i].message);
					}
				}
			else
				{
				debugger;
				}
			}
		else 
			{
			if(htarg.indexOf("@")>=0)
				{
				console.log("VALIDATION FAIL: "+thepath);
				continue;
				}
			if($("#"+htarg)!="undefined")
				{
				$("#"+htarg+" input").addClass("valError");
				$("#"+htarg+" .errorCopy").css("display","block");
				$("#"+htarg+" .errorCopy").text(validationResults.errors[i].message);
				} // end of root-level scalar field
			}
		} // end of process each error
	}
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// SPATIAL DATA MAP HANDLING
/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////
// BUTTON HANDLERS - bottom-of-screen buttons and others
/////////////////////////////////////////////////////////////////////////////////////////////////////////
$("a#LearnMore").on("click",function(titem)
	{
	var win = window.open('https://www.earthcube.org/group/project-418/', '_blank');
	if (win) {
		//Browser has allowed it to be opened
		win.focus();
	} else {
		//Browser has blocked it
    $.alert({ boxWidth: '33%', useBootstrap:false, title:'Additional Earthcube Information', content:'<strong style="font-size: 16px;">Please allow popups for this website</strong>'});
//		alert('Please allow popups for this website');
	}
	});
/////////////////////////////////////////////////////////////////////////////////////////////////////////
$("#SaveFile").on("click",function(titem)
	{
	saveLocalFile();
	});
////////////////////////////////////////////////////////////////////////////////////////////
$("#Validate").on("click",function(titem)
	{
/*
determine if doing dataset or organization
(assume current JSON output javascript object is outputJSON
post to https://earthcube.isti.com/api/validate_standard
*/
// clear existing errors and hide the explanations
$("input.valError").removeClass("valError");	// remove red outline from value(s) in error
$(".errorCopy").css("display","none"); // hide all error-explanation text fields
outputJSON = fabJSON(outputJSON);	// our outputJSON is the original skeleton with values populated from the GUI
//boilerPlate();	// it's unclear if these should over-ride like items in outputJSON or visa/versa
var mywrap = { "schema":"dataset","doc":outputJSON};	// Alex says this JSON needs to be wrapped like this to pass validation
var theAjax = $.ajax({
	url: 'https://earthcube.isti.com/api/validate_standard',
	type: 'POST',
	data: JSON.stringify(mywrap),
	dataType: 'json',
	processData: false,
	contentType: 'application/json',
	success:(function (data) {
		validationResults=data;	// the returned error summary from the host-side validator
		processValidation();	// go and match-up errors with the GUI fields that caused them
		}),
	});
	
/* development code - class "valFail" was added to the breadcrumbs/menu to show red in menu as a failed category
	if(currForm>3)
		{
		var xz=$("#L2EnterData li")[currForm-3];
		$(xz).addClass("valFail");
		}
*/
	});
////////////////////////////////////////////////////////////////////////////////////////////
$("#OpenFile").on("click",function(titem)
	{
	openLocal(this);
	console.log("open file");
	});
function openLocal(xarg) // xarg in the blob instance number in the investments section to upload statement
	{
	$(xarg).parent().append('<input type="file" accept=".txt,.json" id="fileinput" style="position:absolute; top:0; left:0; opacity:.5;"/>');
	$("input[type=file][id=fileinput]").trigger("click");
document.getElementById('fileinput').addEventListener('change', function(){
    var file = this.files[0];

    console.log(file.size+" bytes "+file.name);
    openDoc(file);
    $("#fileinput").remove();
}, false);
	setTimeout(function() { $("#fileinput").remove(); },15000);
	}
function openDoc(file)
	{
	var data=readSingleFile(file);
	}
////////////////////////////////////////////////////////////////////////////////////////////
// the org/data button alternates between showing the organization and the dataaset form
////////////////////////////////////////////////////////////////////////////////////////////
$("#OrgData").on("click",function(titem)
	{
	if(schemaName=="Dataset") // use showSchema to build the form for the selection
		{ // current display was of Dataset, now show Organization
		$("#L1 #EnterData").text("Organizations");	// name above the menu UI
		//
		// before we close the dataset form(s) we need to properly shut-down the Leaflet maps
		//
		var mkys = Object.keys(mapInst);	// for all the existing map objects (if any)
		for(var ri=0;ri<mkys.length;ri++)
			{
			var tinst=mapInst[mkys[ri]];	// retrieve this leaflet map object
			tinst.remove();		// dispose of the Leaflet object			
			}
		mapInst={};	// start with empty object, add maps as we need them
		schemaName="Organization"; theSchema = expSchemaO; showSchema(expSchemaO); // build the UI for Organizations
		outputJSON = OrganizationsSkeleton;	// empty JSON object for the output values
		}
	else 
		{
		outputJSON = DataSkeleton;	// empty JSON object for the output values
		$("#L1 #EnterData").text("Dataset"); // name above the UI
		schemaName="Dataset"; theSchema = expSchemaD; showSchema(expSchemaD); // build the UI for Datasets
////////////////////////////////////////////////////////////////////////////////////////////
// Create the Leaflet.js map objects if we're doing dataset
////////////////////////////////////////////////////////////////////////////////////////////

// setup the map for the GeoCoordinate (single point) display
		var dynoID="mID"+mapIncrId;		// auto-increment serial# assigned as ID of the instance (.multigen) HTML object
		var mapID="mapID"+mapIncrId;	// auto-increment serial# assigned as ID of the div holding the map for this instance
		mapIncrId++;	// both the UI .multigen instance and the leaflet map div in it share the sequence # for readability

		$("div.geocoordinate").attr("id",dynoID);				// .multigen elements have unique (incremental) ids
		$("#"+dynoID).find(".mapGeoCoord").attr("id",mapID);	// find map div for this instance and assign its ID
		mapInst[dynoID]=L.map(mapID).setView([40.035244,-105.243749], 13);	// create the leaflet instance, save reference in mapInst
		var thisMap=mapInst[dynoID];
		
		// apply the default boiler plate to the map for credits
		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.streets',
			accessToken: 'pk.eyJ1IjoicHJlc3RvZGlnaXRhbCIsImEiOiJjanJ6YXJiaGcxNnJhM3ltbGg1a3ZpMHAyIn0.6BZEN6LKCOsVgMjMT5Srjw'
		}).addTo(thisMap);

		// add an example of a bounding box (like we'll be using) to the map - somewhere in Denver
//		var bound= [[39.73371170373402,-105.00527300620882],[39.736871660106125, -105.00287034299636]];
//		L.rectangle(bound,{color:"red", weight:1}).addTo(thisMap);

		thisMap.on('click',function(e){ourMapClick(e,thisMap);});	// add a click on test handler, pass along the .multigen element id
		mapInst[dynoID].invalidateSize();

//set the map for the GeoShape (box or polygon) display
		var dynoID="mID"+mapIncrId;		// an ever-incremented id assigned to the instance (.multigen) object
		var mapID="mapID"+mapIncrId;	// an ever-incremented id assigned to the div holding the map
		mapIncrId++;

		$("div.geoshape").attr("id",dynoID);
		$("#"+dynoID).find(".mapGeoShape").attr("id",mapID);	// find map div for this instance and give it unique name
		mapInst[dynoID]=L.map(mapID).setView([39.7645187,-104.9951935], 10);
		var thatMap=mapInst[dynoID];

		L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.streets',
			accessToken: 'pk.eyJ1IjoicHJlc3RvZGlnaXRhbCIsImEiOiJjanJ6YXJiaGcxNnJhM3ltbGg1a3ZpMHAyIn0.6BZEN6LKCOsVgMjMT5Srjw'
		}).addTo(thatMap);
		
		// adding a test data polygon in Denver
		var tll = [
		[[39.782514, -104.994279],
		[39.783676, -104.994283],
		[39.783697, -104.992647],
		[39.78251, -104.992636],
		[39.782514, -104.994279]]];
//		L.polygon(tll).addTo(thatMap);
		thatMap.on('click',function(e){ourMapClick(e,thatMap);});	// add a click on test handler
		bigHack();
/* 13th and mariposa lincoln park boundary
var bound= [[39.73371170373402,-105.00527300620882],[39.736871660106125, -105.00287034299636]];
L.rectangle(bound,{color:"green", weight:1}).addTo(ourmappoly) */

		}
	hideForms();
	currForm=1;	// index into editForm, which category is currently displayed
	showForm(currForm);
	});
////////////////////////////////////////////////////////////////////////////////////////////
/* how to draw polygon on mymap object
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(mymap);


L.polygon([
[39.782514, -104.994279],
[39.783676, -104.994283],
[39.783697, -104.992647],
[39.78251, -104.992636],
[39.782514, -104.994279]
]).addTo(xxx);
*/
////////////////////////////////////////////////////////////////////////////////////////////
// handle clicks on one of the leaflet maps////////////////////////////////////////////////////////////////////////////////////////////
// we need mutation detection on the lat/lon fields so we can reposition the marker
////////////////////////////////////////////////////////////////////////////////////////////
//var popup = L.popup();
function ourMapClick(evt,whodat)
	{
	var whichOne = whodat._container.id;	// id of the map, a clue to which instance we're in
	var theInst = "#"+whichOne.replace("ap","");	// convert mapID to mID so we know name of parent HTML element instance 
    if($(whodat._container).hasClass("mapGeoCoord"))	// click on a box (GeoCoordinate) map location
    	{
    	var thisLL = (evt.latlng);
    	$(theInst).find(".GeoLat").val(thisLL.lat);
    	$(theInst).find(".GeoLon").val(thisLL.lng);
    	// remove existing layers, we're adding a new point
    	var mindex = theInst.replace("#","");	// index into mapInst or markInst has no leading #
    	if(markInst[mindex]!=undefined)
    		mapInst[mindex].removeLayer(markInst[mindex]);
    	markInst[mindex]= L.marker([thisLL.lat,thisLL.lng]).addTo(whodat);
/*
    	whodat.eachLayer(function(layer) {
    		whodat.removeLayer(layer);
    		});
*/
    	return;
    	}
    	var tll = evt.latlng.lat+","+evt.latlng.lng+",";
     	var curtxt=$(theInst).find("textarea.GeoPoly").val()+"\n"+tll;
    	$(theInst).find("textarea.GeoPoly").val(curtxt);
/*
    popup
        .setLatLng(evt.latlng)
        .setContent("You clicked the map"+whodat+" at " + evt.latlng.toString())
        .openOn(whodat);
*/
	}
////////////////////////////////////////////////////////////////////////////////////////////
// next/previous work like left/right cursor control keys
////////////////////////////////////////////////////////////////////////////////////////////
$(".arrowright").on("click",function(titem)
	{
	hideForms();
	currForm++;
	if(currForm==editForm.length) currForm=1;
	showForm(currForm);
//	console.log("next");
	});
////////////////////////////////////////////////////////////////////////////////////////////
// makeJSON formatting options
////////////////////////////////////////////////////////////////////////////////////////////
$("#Raw").on("click",function(titem)
	{
	$(".JSONstring").html(JSON.stringify(outputJSON));
	});
////////////////////////////////////////////////////////////////////////////////////////////
$("#Pretty").on("click",function(titem)
	{
	$(".JSONstring").html(prettyPrint(outputJSON,{maxDepth:7}));
	});
////////////////////////////////////////////////////////////////////////////////////////////
$(".arrowleft").on("click",function(titem)
	{
	hideForms();
	currForm--;
	if(currForm<1)currForm=editForm.length-1;
	showForm(currForm);
//	console.log("previous");
	});
////////////////////////////////////////////////////////////////////////////////////////////
// use text of the clicked-upon list item to select which form (category) is to be displayed
////////////////////////////////////////////////////////////////////////////////////////////
$("#L2EnterData li").on("click",function(titem)
	{
	// using text value of the li that was clicked, match it to an index in editForm to
	// determine which editForm item is the selection, that index value is the form "number"
	currForm = editForm.indexOf(titem.currentTarget.textContent);
	if(currForm!=0)	// if NOT the startover button
		{
		showForm(currForm);
		return;
		}
	// confirm that the user really wants to discard all data and start over
		jQuery.confirm({
		useBootstrap:false,
		boxWidth:'20%',
		title: 'Please Confirm!',
		content: 'Do you wish to start over and delete all current data?',
		buttons: {
			confirm: function () {
				console.log('Confirmed!');
			},
			cancel: function () {
				console.log('Canceled!');
			}
		}
	});
	});
////////////////////////////////////////////////////////////////////////////////////////////
$(".GeoBox,.GeoPoly,.GeoLat,.GeoLon").focus(function(evt){
console.log(evt);
if($(evt.currentTarget).hasClass("GeoLat")||$(evt.currentTarget).hasClass("GeoLon"))
	{
	$(this).trigger("input");
	}
else 
	{
	$(this).trigger("input");
	}
});
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
// show the breakcrumbs (L2nav) menu line, hide the L1 options
////////////////////////////////////////////////////////////////////////////////////////////
/*
there is no longer something called this 2/21
$("li#EnterData").on("click",function(titem)
	{
//	titem.stopPropagation();
//	$(".L1nav").css("display","none");
//	$(".L2nav").css("display","block");
	$(".L1nav").hide();
	$(".L2nav").fadeIn(1000);
	});
*/

});