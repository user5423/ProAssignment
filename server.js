var express = require('express');
const util = require('util')
const nmap = require('node-nmap');
const dns = require('dns');
// const { report } = require('process');

var app = express();

app.use(express.static('public'))
app.use(express.static("assets"))
app.use(express.static("js"))

app.use(express.json());

var runningScans = [];
var finishedScans = [];

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
    var formKeys = Object.keys(req.body);

    var hostname = req.body["host"];

    var params = [];

    for(var i = 0; i < formKeys.length; i++){
        var paramSwitch = formKeys[i];
        if (paramSwitch != "host" && paramSwitch != "scanType"){
            params.push(paramSwitch);
        }
    }
    executeNmapScan(hostname, params);

    resp.send();
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

    resp.json(dnsMethods).send();
})



app.post("/dnsScanner", (req, resp) => {
    console.log(req.body);
    //Here we will grab the formKeys
    var formKeys = Object.keys(req.body);

    var hostname = req.body["host"];

    var params = [];

    for(var i = 0; i < formKeys.length; i++){
        var paramSwitch = formKeys[i];
        if (paramSwitch != "host" && paramSwitch != "scanType"){
            params.push(paramSwitch);
        }
    }
    executeDNSScan(hostname, params)

    resp.send();
    //We will then iterate and perfrom
    return null;
})



//TODO: change from array to dictionary as there may be issues if multiple users were using this and the position shifted
function executeNmapScan(hostname, params){
    nmap.nmapLocation = "nmap"; //default
    var nmapscan = new nmap.NmapScan(hostname, params);

    var arrayPosition = logScanAsRunning("nmapscan", hostname, params);

    nmapscan.on('complete', data => {
        var scanDescriptor = runningScans.splice(arrayPosition, 1);
        finishedScans.push({"scan descriptor": scanDescriptor,
                            "scan results": data });
        console.log(finishedScans);
    }).on('error', data => {
        // console.log(data); // TODO: change this so that it reflects in finished scan reports as an error
        var scanDescriptor = runningScans.splice(arrayPosition, 1);
        finishedScans.push({"scan descriptor": scanDescriptor,
                            "scan results": data });
    });

    nmapscan.startScan();
}


function executeDNSScan(hostname, params){
    var arrayPosition = logScanAsRunning("dnsscan", hostname, params);

    var results = {};
    
    for(var i = 0; i< params.length; i ++) {
        // console.log(param);
        var param = params[i];
        dns.resolve(hostname, param, (err, ret) => {
            if (ret == true){
                results[param] = ret;
    
            }
            // console.log(ret);
            results[param] = ret;
        })
    }
    
    console.log(results);
    return null;
}





//Logs the scan as running and returns position in array
function logScanAsRunning(scanname, hostname, params){
    runningScans.push({[scanname] : [hostname, params]});
    return runningScans.length -1;
}



app.listen(4444, () => {
    console.log(`Example app listening at http://127.0.0.1:${4444}`)
  })





