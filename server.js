

var express = require('express');
var fs = require("fs");
const nmap = require('node-nmap');
const dns = require('dns');
const { nextTick } = require('process');

var app = express();

app.use(express.static('public'))
app.use(express.static("assets"))
app.use(express.static("js"))

app.use(express.json());


//TODO: We want to change this to {} so to avoid issues with race conditions on list deletion
var runningScans = [];
var finishedScans = getPersistentReports();


app.get("/index", (req, resp) => resp.sendFile('./public/index.html', { root: __dirname }))

app.get("/runningScans", (req, resp) => {
    var filteredScans = getFilteredScans(req.query, runningScans, "runningScan");
    resp.type = "json";
    resp.status = 200;
    resp.json(filteredScans);
})

app.get("/finishedScans", (req, resp) => {
    var filteredScans = getFilteredScans(req.query, finishedScans, "finishedScan");
    resp.type = "json";
    resp.status = 200;
    resp.json(filteredScans);
})

app.post("/deleteReport", (req, resp) => {
    //So we need to have a valid object to search for
    try {
        for (var i =0; i < finishedScans.length; i++){
            if (JSON.stringify(finishedScans[i]["scan descriptor"]) == JSON.stringify(Object(req.body))){
                finishedScans.splice(i, 1);
            }
        }
        writeFinishedScansToFile();
        resp.json({"status": 200}); 
    }
    catch(err){
        resp.status(400);
        resp.json({"status": "error"}); 
        return;
    }
})


app.get("/networkScanner", (req, resp) => {
    const nmapMethods = {"PageStart" : `<h3>Network Scanner</h3>
                                        <p>There are numerous tools to help you with you're scan. Since this is a demo site, there isn't an extensive number of supported tools
                                        provided out of the box. However, there are a few good tools included.</p>
                                        <p><b>Unfortunately a new version of node-nmap has broken scans containing -sV and -sC, so do not use those options</b></p>
                                        <div class="form-group ">
                                        <label for="inputHost">Host (IP address / Hostname):</label>
                                        <input type="text" class="form-control" id="inputHost" aria-describedby="emailHelp" placeholder="Enter Host">
                                        <div class="valid-feedback">Looks good!</div>
                                        <!--<small id="emailHelp" class="form-text text-muted">Port scanning is not illegal in the UK. But make sure you abide by the rules or ToS of your network and local legislation</small>-->
                                        </div><br>
                                        
                                        `,
                                        
                            
                         "FormMethods": {"Scan Technqiues" : {
                                                    "type" : "checkbox",
                                                    "required": "required",
                                                    "formItems" : ["<b>-sT</b> : TCP Connect Scan",
                                                                    "<b>-sS</b> : TCP SYN Scan",
                                                                    "<b>-sU</b> : UDP Connect Scan"]
                                                },

                                        "Port Range": {
                                                    "type" : "radio",
                                                    "required": "required",
                                                    "formItems": ["<b>-p1-1000</b> : Default Range (1-1000)",
                                                                "<b>-p-</b> : Full Range (1-65535)"]
                                                },

                                        "Additional Scan Technqiues": {
                                                    "type" :"checkbox",
                                                    "required": "optional",
                                                    "formItems" :["<b>-sV</b> : Service/Version Detection",
                                                                "<b>-sC</b> : Default Nmap Scripts"]      

                                                }
                                            }
                        
    };
    resp.type('json');
    resp.status(200);
    resp.json(nmapMethods);
})

app.post("/networkScanner", (req, resp) => {
    try {
        var hostname, params;
        params = processParameters(req);
        hostname = req.body["host"];
        resp.json({"status": 200}); 
    }
    catch(err){
        resp.status(400);
        resp.type('json');
        resp.json({"status": "error"}); 
        return;
    }
    
    executeNmapScan(hostname, params);

})


app.get("/dnsScanner", (req, resp) => {
    const dnsMethods = {"PageStart" : `<h3>DNS Scanner</h3>
                                        <p>Using OS resolver libraries we are able to query for many different DNS records. Unfortunately,
                                        due to not knowing what environment our suite is running on, we chose not to implement unix tools
                                        such as dig.</p>
                                        <div class="form-group ">
                                            <label for="inputHost">Host (IP address / Hostname):</label>
                                            <input type="text" class="form-control" id="inputHost" aria-describedby="emailHelp" placeholder="Enter Host">
                                            <small id="emailHelp" class="form-text text-muted">Please make sure to point correctly, i.e. if you mean to point to the parent domain
                                            than do that instead of pointing to a subdomain such as "www"</div><br>`,                              
                            
                         "FormMethods": {"Record Types" : {
                                                    "type" : "checkbox",
                                                    "required": "required",
                                                    "formItems" : ["<b>A</b> : IPv4 Address",
                                                                    "<b>AAAA</b> : IPv6 Address",
                                                                    "<b>CNAME</b> : Canonical Name Records",
                                                                    "<b>MX</b> : Mail Exchange Records",
                                                                    "<b>NS</b> : Name Server Records",
                                                                    "<b>TXT</b> : Text Records",
                                                                    "<b>SOA</b> : Start of Authority Records"
                                                                ]
                                                }
                                            }
    };
    resp.type('json');
    resp.status(200);
    resp.json(dnsMethods);
})


app.post("/dnsScanner", (req, resp) => {
    try {
        var hostname, params;
        params = processParameters(req);
        if ((params = validateParams(params, "dnsscan")) == false){
            throw Error("Not a single valid param, so we are exiting scan");
        }
        hostname = req.body["host"];
        resp.status(200);
    }
    catch(err){
        resp.status(400);
        resp.type('json');
        resp.json({"status": "error"}); 
        return;

    }
    
    resp.send();
    executeDnsScan(hostname, params);
})







function validateParams(params, scanname){
    var definitions = { "dnsscan" : ["A", "AAAA", "CNAME", "MX", "SOA", "TXT", "NS"],
                        "nmapscan" : ["-sT", "-sU", "-sV", "-p-", "-p1-1000", "-sV", "-sC"]};

    params = Object.values(params);
    var newSet = new Set();
    if (definitions[scanname] != undefined){
        for(var i = 0; i< params.length; i++){
            if (definitions[scanname].includes(params[i])){
                newSet.add(params[i]);
            }
        }
    }

    params = Array.from(newSet);
    if (params.length == 0){
        return false;
    }
    return params;
  }





function getFilteredScans(filterObj, arrRef, arrName){
    // console.log(arrRef);
    var filteredScans = [];
    var foundScan = true;
    var filterKeys = Object.keys(filterObj);
    var filterKey;
    // console.log(filterKeys);
    for (var i =0; i< arrRef.length; i++){
        foundScan = true;
        for (var j = 0; j < filterKeys.length; j++){
            filterKey = filterKeys[j];
            try {
                if (arrName == "finishedScan"){
                    if (arrRef[i]["scan descriptor"][filterKey] != filterObj[filterKeys[j]]){
                        foundScan = false;
                        break;            
                    }
                } else if (arrName == "runningScan"){
                    if (arrRef[i][filterKey] != filterObj[filterKeys[j]]){
                        foundScan = false;
                        break;   
                    }
                }

            } catch(err){
                foundScan = false;
                break;
            }
        }

        // console.log(foundScan);
        if (foundScan == true){
            filteredScans.push(arrRef[i]);
        }

    }
    return filteredScans;

}



function processParameters(req){
    // console.log(req.body);
    var hostname = req.body["host"];
    var scanType = req.body["scanType"];

    if (hostname == undefined || scanType == undefined || !isValidHostname(hostname) || !isSupportedScanType(scanType)){
        // return;
        throw Error("incorrect_request");
    } 
    
    var formKeys = Object.keys(req.body);
    var params = [];
    for(var i = 0; i < formKeys.length; i++){
        var paramSwitch = formKeys[i];
        if (paramSwitch != "host" && paramSwitch != "scanType"){
            params.push(paramSwitch);
        }
    }
    return hostname, params;
}


function isSupportedScanType(scanType){
    var supportedScanTypes = ["dnsscan", "dnsScanner", "nmapscan", "networkScanner"];
    if (supportedScanTypes.includes(scanType)){
        return true;
    }
    return false;
}

//TODO: Make this function more extensive
function isValidHostname(hostname){
    //In order to be a valid IP address or domain we need at least one period
    if (hostname.includes(".")){
        return true;
    }
    return false;
}




//TODO: change from array to dictionary as there may be issues if multiple users were using this and the position shifted
function executeNmapScan(hostname, params){
    nmap.nmapLocation = "./Nmap/nmap.exe"; //default
    var nmapscan = new nmap.NmapScan(hostname, params);
    // console.log("executing nmap scan");
    // console.log(params);

    var reportObject = logScanAsRunning("nmapscan", hostname, params);

    nmapscan.on('complete', data => {
        // console.log(data);
        transferResultsToFinished(reportObject, data[0]);
    }).on('error', data => {
        // TODO: Change to deletion
        transferResultsToFinished(reportObject, data[0]);
    });

    nmapscan.startScan();

    return null;
}

// TODO: We need to update this with the neccessary code to change from arrayPosition to reportObject for transferResultsToFinished()
async function executeDnsScan(hostname, params){
    var arrayPosition = logScanAsRunning("dnsscan", hostname, params);
    var promises = [];
    var promise, param;
    var results = {};


    for(var i = 0; i < params.length; i++) {
        param = params[i];
        promise = dns.promises.resolve(hostname, param).then((result) => {
            if (result != undefined){
                return result;
            }
            return "Scan was unable to complete successfully";
            
        }).catch(error => {return "Scan was unable to complete successfully";});

        promises.push(promise);
    }

    
    //We are executing multiple scans here, so we need to synchronize the async operations
    for(var j = 0; j < promises.length; j++){
        let result = await promises[j];
        results[params[j]] = result;
    }

        //TODO: Add deletion here from running list
    
    transferResultsToFinished(arrayPosition, results);
    return null;
}






//TODO: Move from array position to a map with hash IDs - avoids issues of race conditions
function transferResultsToFinished(reportObject, data){
    var arrayPosition = runningScans.indexOf(reportObject);
    var scanDescriptor = runningScans.splice(arrayPosition,1)[0];

    var scanResult = {"scan descriptor": scanDescriptor,
                      "scan results": data };

    finishedScans.push(scanResult);
    // console.dir(finishedScans);
    writeScanResultsToFile(scanResult);

    return null;
}


//TODO: We want to add datetime to the form
//Logs the scan as running and returns position in array
function logScanAsRunning(scanname, hostname, params){
    var runningScanReport = {"scanname": scanname,
                             "timedate": new Date(),
                             "hostname" :hostname,
                             "parameters":[params]};

    runningScans.push(runningScanReport);
    return runningScanReport;
}

function getPersistentReports(){
    const data = fs.readFileSync("./reports.json") 
    
    try {
        var temp = JSON.parse(data);
    } catch(err){
        console.log(err);
        temp = [];
    }
    return temp;
}




function writeScanResultsToFile(scanResults){
    fs.readFile("reports.json", (err, data) =>{
        if (err) {
            console.log(err);
        }
        else {

            //In case the JSON file is corrupted or malformed, we reset it
            try{
                var reports = JSON.parse(data);
            } catch(err){
                reports = [];
            }
            reports.push(scanResults);
            finishedScans = reports;
        }

        fs.writeFile("reports.json", JSON.stringify(reports, null, 4), (err) =>{
            if (err) {console.log(err);}})
        
    });

}

function writeFinishedScansToFile(){
    fs.writeFile("reports.json", JSON.stringify(finishedScans, null, 4), (err) =>{
        if (err) {console.log(err);}})
        
}




module.exports = app;



app.listen(4444, () => {
    console.log(`GWI Toolkit listening at http://127.0.0.1:${4444}`);
  })





