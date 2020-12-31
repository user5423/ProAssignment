var express = require('express');
const util = require('util')
const nmap = require('node-nmap');
// const { report } = require('process');

// var app = express();
// app.use(express.static('public'));
// app.get('/', req)


var app = express();



function executeNmapScan(params){

    nmap.nmapLocation = "nmap"; //default
    var nmapscan = new nmap.NmapScan('google.com', ['-A', '-sV', '-sU']);

    var host = params["host"];


    nmapscan.on('complete', data =>
        {return data;})

    nmapscan.on('error', data=>
        console.log(data));


    nmapscan.startScan();
}


app.use(express.static('public'))

app.use(express.static("assets"))

app.use(express.static("js"))




app.get("/runningScans", (req, resp) => {
    resp.sendFile("runningScans.html", { root: __dirname});
    console.log(resp);
})


app.get("/scanReports", (req, resp) => {
    resp.sendFile("scanReports.html", { root: __dirname});
    console.log(resp);
})


app.get("/networkScanner", (req, resp) => {
    const nmapMethods = {"PageStart" : `<h3>Network Scanner</h3>
                                        <p>There are numerous tools to help you with you're scan. Since this is a demo site, there isn't an extensive number of supported tools
                                        provided out of the box. However, there are a few good tools included.</p>`,
                                        
                            
                         "FormMethods": {"Scan Technqiues" : {
                                                    "type" : "checkbox",
                                                    
                                                    "formItems" : ["<b>-sT</b> : TCP Connect Scan",
                                                                    "<b>-sS</b> : TCP SYN Scan",
                                                                    "<b>-sU</b> : UDP Connect Scan"]
                                                },

                                        "Port Range": {
                                                    "type" : "radio",
                                                    
                                                    "formItems": ["Default Range (1-1000)",
                                                                "Full Range (1-65535)"]
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

app.post("/submitScan", (req, resp) => {
    console.log(req.body);
    
})

app.get("/hello", (req, resp) =>
    resp.send("hello"))



// app.get("/", (req, resp) => {
//     resp.sendFile("index.html", {root: __dirname});
//     console.log("yup");
// })



app.post("/nmapScan", (req, resp) => {
    return null;
})



app.get("/index", (req, resp) => {
    resp.sendFile('./public/index.html', { root: __dirname });
})


app.listen(4444, () => {
    console.log(`Example app listening at http://127.0.0.1:${4444}`)
  })

// app.post('/netscan', (req, resp) => {
//     var host = req.param["host"];

// })

