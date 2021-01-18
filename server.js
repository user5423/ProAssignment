

var express = require('express');
var fs = require("fs");
const nmap = require('node-nmap');
const dns = require('dns');
const { nextTick } = require('process');
// const util = require('util')
// const { report } = require('process');

var app = express();

app.use(express.static('public'))
app.use(express.static("assets"))
app.use(express.static("js"))

app.use(express.json());


//TODO: We want to change this to {} so to avoid issues with race conditions on list deletion
var runningScans = [];
var finishedScans = getPersistentReports();


app.get("/index", (req, resp) => resp.sendFile('./public/index.html', { root: __dirname }))

app.get("/runningScans", (req, resp) => resp.json(runningScans).send())

app.get("/finishedScans", (req, resp) => resp.json(finishedScans).send())

app.get("/networkScanner", (req, resp) => {
    const nmapMethods = {"PageStart" : `<h3>Network Scanner</h3>
                                        <p>There are numerous tools to help you with you're scan. Since this is a demo site, there isn't an extensive number of supported tools
                                        provided out of the box. However, there are a few good tools included.</p>
                                        <div class="form-group ">
                                            <label for="inputHost">Host (IP address / Hostname):</label>
                                            <input type="text" class="form-control" id="inputHost" aria-describedby="emailHelp" placeholder="Enter Host">
                                            <small id="emailHelp" class="form-text text-muted">Port scanning is not illegal in the UK. But make sure you abide by the rules or ToS of your network and local legislation</small>
                                        </div><br>`,
                                        
                            
                         "FormMethods": {"Scan Technqiues" : {
                                                    "type" : "checkbox",
                                                    "formItems" : ["<b>-sT</b> : TCP Connect Scan",
                                                                    "<b>-sS</b> : TCP SYN Scan",
                                                                    "<b>-sU</b> : UDP Connect Scan"]
                                                },

                                        "Port Range": {
                                                    "type" : "radio",
                                                    "formItems": ["<b>-p1-1000</b> : Default Range (1-1000)",
                                                                "<b>-p-</b> : Full Range (1-65535)"]
                                                },

                                        "Additional Scan Technqiues": {
                                                    "type" :"checkbox",
                                                    "formItems" :["<b>-sV</b> : Service/Version Detection",
                                                                "<b>-sC</b> : Default Nmap Scripts"]      

                                                }
                                            }
                        
    };
    resp.json(nmapMethods).send();
// We need to decide how we are going to create the form
})

app.post("/networkScanner", (req, resp) => {
    try {
        var hostname, params;
        params = processParameters(req);
        hostname = req.body["host"];
        resp.status(200);
        resp.send();
        console.log(hostname);
        console.log(params);
        executeNmapScan(hostname, params);
    }
    catch(err){
        console.log("error nmap");
        if (err == "incorrect_request"){
            resp.status(400);
        } else{
            resp.status(501);
        }
        resp.send(); 
    }

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
    resp.json(dnsMethods).send();
})


app.post("/dnsScanner", (req, resp) => {
    var hostname, params;
    try {
        hostname, params = processParameters(req);
        resp.status(200);
    }
    catch(err){
        if (err == "incorrect_request"){
            resp.status(400);
        } else{
            resp.status(500);
        }
    }

    resp.send();
    executeDnsScan(hostname, params)

})


function processParameters(req){
    var hostname = req.body["host"];
    var scanType = req.body["scanType"];

    if (hostname == undefined || scanType == undefined || !isValidHostname(hostname) || !isSupportedScanType(scanType)){
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
    var supportedScanTypes = ["dnsscan", "nmapscan", "networkScanner"];
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

    var reportObject = logScanAsRunning("nmapscan", hostname, params);
    nmapscan.on('complete', data => {
        transferResultsToFinished(reportObject, data[0]);
        console.log(finishedScans);
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

    try {
    //We are executing multiple scans here, so we need to synchronize the async operations
        for(var j = 0; j < promises.length; j++){
            let result = await promises[j];
            results[params[j]] = result;
        }
    } catch(error){
        console.log(error);
        //TODO: Add deletion here from running list
    }
    
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








app.listen(4444, () => {
    console.log(`Example app listening at http://127.0.0.1:${4444}`)
  })





