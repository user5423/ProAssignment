// Now that we have a base page to work with, we need to start building the base systems
// We need to build a function that requests and updates content on the DOM

//Setting global variables
const eventToGetRequest = {"runningScans": "/runningScans",
                            "finishedScans": "/finishedScans",
                            // "scanReports": "/scanReports",
                            "networkScanner": "/networkScanner",
                            "dnsScanner": "/dnsScanner",
                            "index": "/index"};

const eventToPostRequest = {"submitScanForm": submitScanForm};

const responseHandlingDefinitions = {"networkScanner": [jsonParse, createScanPage],
                                    "dnsScanner": [jsonParse, createScanPage],
                                    "index": [htmlParse, updateBody],
                                    "runningScans": [jsonParse, createRunningReportPage],
                                    "finishedScans": [jsonParse, createFinishedReportPage]};


var domEventDefinitions = {"type": {"radio": setRadioStatus,
                                    "checkbox": setCheckboxStatus},
                           "class": {"card": toggleAccordionVisibility},
                            "data-toggle":{"collapse": toggleComponent}
                        };



var currentLoadedPage = "index";




// Event listeners




//Explain decision to use click event listener
window.addEventListener("click", event => {
    var resourcePath, eventTarget, eventTargetID;

    //Event targets are just node interface objects with extended methods for event handling
    eventTarget = event.target;
    // We need to define how the definitions below will work
    eventTargetID = eventTarget.id;

    if ((resourcePath = eventToGetRequest[eventTargetID]) != undefined) {
        updateDomByGetRequest(eventTargetID, resourcePath);
        currentLoadedPage = eventTargetID;
    } 
    
    else if ((resourcePath = eventToPostRequest[eventTargetID]) != undefined) {
        submitScanForm(currentLoadedPage);
    }
    else {
        checkDomEvents(eventTarget);
        console.log("This event id isn't registered");
    }

})



//TODO-F: Maybe repurpose this function to take parameters so that it isn't hardcoded
function addFormEventListeners(){
    var elementsToListen = document.getElementsByTagName("input");
    for (var i = 0; i < elementsToListen.length; i++){
        var element =  elementsToListen[i];
        if(element.type == 'radio'){ 
            element.addEventListener("click", setRadioStatus(this));
        }
        else if (element.type == "checkbox"){
            console.log("set");
            element.addEventListener("click", setCheckboxStatus(this));
        } else {
            console.log("nothing");
        }
    }
}




// Parsing Methods //








function jsonParse(response){ return response.json();}

function htmlParse(response){ return response.text();}











//Dom Manipulation and Checking Methods //












function checkDomEvents(eventTarget){
    console.log(eventTarget);
    for(var key in domEventDefinitions){
        for (var value in domEventDefinitions[key]){
            if (key == "class"){
                if (eventTarget.classList.contains(value)){
                    domEventDefinitions[key][value](eventTarget);
                }
            }
            else if (eventTarget.getAttribute(key) == value) {
                domEventDefinitions[key][value](eventTarget);
                return true;
            }
        }

    }
    return false;
}


function updateDomByGetRequest(eventTargetID, resourcePath){
    resourcePath = `http://127.0.0.1:4444${resourcePath}`;
    try {
        fetch(resourcePath)
        .then(response => responseHandlingDefinitions[eventTargetID][0](response))
        .then(body => {
            responseHandlingDefinitions[eventTargetID][1](body);
        })

    } catch(err) {
        console.log(err);
        document.getElementsById("body").innerHTML = "<b>We were unable to load the page</b>";
    }   

}


function updateBody(body){
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(body, 'text/html');
    document.getElementById("body").innerHTML = htmlDoc.getElementById("body").innerHTML;
}










// Form Methods //









//TODO: We need to implement both server side and client side implementation
function submitScanForm(){
    //First we need to compile the form
    var formJson = {};
    var input, label, item;

    //Every scan has a host input, so we can hardcode this in
    var hostInput = document.getElementById("inputHost").value;
    formJson["host"] = hostInput;

    //This gets the active checkboxes and radioboxes
    var formCheckCollection = document.getElementsByClassName("form-check");
    for(var i = 0; i < formCheckCollection.length; i++){
        item = formCheckCollection[i];
        input = item.children[0];
        label = item.children[1];

        if (item.classList.contains("form-check") == true){
            if (input.value == "true"){
                formJson[label.getElementsByTagName("b")[0].innerText] = input.value;
            }
        }
        else {
            formJson[label.innerText] = input.value;
        }
        formJson.scanType = currentLoadedPage;
    }

    console.log(JSON.stringify(formJson));
    try {
        fetch(`http://127.0.0.1:4444/${currentLoadedPage}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json',},
            body: JSON.stringify(formJson),
        })
    }
    catch(err) {
        console.log("Unable to submit scan request");
    }
}

function createScanPage(body){
    // TODO fomalize howe we add html together
    var htmlBio = createBio(body["PageStart"]);
    var htmlForm = createForm(body["FormMethods"]);

    var bodyContainer = document.createElement("div");
    bodyContainer.setAttribute("class", "row");

    appendInnerHTML(bodyContainer, "<div class=\"col-9\" style=\"padding-top: 10px;\">");
    bodyContainer.children[0].innerHTML = htmlBio + htmlForm;
    
    document.getElementById("body").innerHTML = bodyContainer.innerHTML;

    addFormEventListeners();
    

}


function createBio(htmlString){
    var divElement = document.createElement("div");
    divElement.innerHTML = htmlString;
    return divElement.outerHTML;
}

function createForm(formMethods){ 
    var formElement = document.createElement("form");
    var itemCounter = 0;
    var sectionCounter = 0;
    var item;

    for(var section in formMethods) {
        sectionCounter += 1;
        var formGroup = document.createElement("div");
        formGroup.setAttribute("class", "form-group");
        formGroup.innerHTML = `<p><b>${section}</b></p>`;      
        var itemType = formMethods[section]["type"];

        for (var i = 0; i< formMethods[section]["formItems"].length; i++){
            item = formMethods[section]["formItems"][i];
            itemCounter += 1;
            var formItemHTML = `
                <div class="form-check">
                    <input class="form-check-input" type="${itemType}" value="false" id="defaultCheck${itemCounter}" name="section${sectionCounter}" >
                    <label class="form-check-label" for="defaultCheck${itemCounter}">${item}</label>
                </div>`;

            appendInnerHTML(formGroup, formItemHTML);
        }

        appendInnerHTML(formElement, formGroup.outerHTML);
        appendInnerHTML(formElement, "<br>")
    }

    // Replaced button with div in order to fix behaviour bug that was caused by bs4's javascript code
    appendInnerHTML(formElement, `<div id="submitScanForm" class="btn btn-primary">Submit</div>`)


    return formElement.outerHTML;
}

function appendInnerHTML(element, newInnerHTML){
    var originalInnerHTML = element.innerHTML;
    element.innerHTML = originalInnerHTML + newInnerHTML;
}






// Form Validation:














// Report Methods //            TODO: This section needs ot be finished







//TODO: Finish this function
function createRunningReportPage(body){
    //We first create an empty accordion that will parent the card reports
    var accordion = document.createElement("div");
    accordion.classList.add("accordion");
    accordion.id = "accordion";


    console.log(body);
    console.log("yo")
    // In case there are no scans
    if (body.length == 0){
        var message = `<h4>No Running Scans</h4><br><p> There are no currently running scans detected. To populate this page, you need to initiate a scan.`
        document.getElementById("body").innerHTML = message;
        return;
    }
    //If there are running scans
    var reports = [];
    for(var i = 0; i < body.length; i++){
        reports[i] = createRunningReport(body[i]);
        accordion.appendChild(reports[i]);

    }
    console.log(reports);
    document.getElementById("body").innerHTML = accordion.outerHTML;
}

function createFinishedReportPage(body){return body;}



// Example json report for a finished scan. A running scan, only contains the "scan descriptor" key
// 
// [
//     {
//         "scan descriptor": {
//             "scanname": "dnsscan",
//             "timedate": "2021-01-15T17:53:37.497Z",
//             "hostname": "google.com",
//             "paramaters": [
//                 [
//                     "A",
//                     "AAAA",
//                     "CNAME"
//                 ]
//             ]
//         },
//
//         "scan results": {
//             "A": [
//                 "216.58.213.14"
//             ],
//             "AAAA": [
//                 "2a00:1450:4009:816::200e"
//             ],
//             "CNAME": "Scan was unable to complete successfully"
//         }
//     }
// ]



//TODO: CHeck that scanType and hostname are pulling from the right array/obj ref/indexes
function createRunningReport(body){
    
    //We get the resources from the above variable
    // var scanDescriptor = body["scan descriptor"];   //This describes the scan - i.e. scan type, time, hostname, parameters
    // var scanResults = body["scan results"];         //This contains the results of the scan
    console.log("hmm");
    console.log(body);
    var scanDescriptor = body;

    //Let's create the accordion
    // var accordion = document.createElement("div");
    // accordion.classList.add("accordion");
    // accordion.id = "accordion";

    //TODO: Color needs to be dependent on the scan type
    //First we create the scan title for the card
    var card = document.createElement("dummy");
    card.innerHTML = `<div class="card-header" id="headingOne" style="background-color:#563d7c">`; // TODO: We need to make this dynamic headingOne
    card = card.children[0];

    //TODO: Move from a static cardNumber value to dynamic -- NOTE: We need to consider that these might not be contiguous after we delete some of the reports
    var reportCardDescriptor = createReportCardHeader(scanDescriptor, 0);

    return reportCardDescriptor;

}
    //NOTE: We are going to ignore this for now
    //TODO: Fix, finish and move the below code over to the createfinishedReport function

    // //Scan results
    // var scanResultHTML = document.createElement("dummy");
    // scanResultHTML.innerHTML = `<table class="table"><tbody></tbody></table>`;
    // scanResultHTML = scanResultHTML.innerHTML;
    
    // var scanResultKeys = Object.keys(scanDescriptor[0])[0];
    // for (var i = 0; i< scanResults; i++){
    //     // if //scanResults
    //     // appendInnerHTML(scanResultsHTML.children[0].children[0], `<tr><th scope="row">${}</th><td>${}</td></tr>`);

    // }

    // return null;
// }


//This is used by both running scans and finished scans
//This takes in the scanDescriptor and create a html block for it
//TODO: We need to consider all the different data-toggle and data-target values here
//TODO: We need to dynamically assign classes or attributes for js bs4 operations. i.e. words like "one", "two" from stuff like data-target attribute
function createReportCardHeader(scanDescriptor, cardNumber){
    //The card header has two components:

        //The title of the card that will always be visible

        //The descriptor of the card that will come below it
    console.log(scanDescriptor)
    var scanname = scanDescriptor.scanname;
    var timedate = scanDescriptor.timedate;
    var hostname = scanDescriptor.hostname;
    var parameters = scanDescriptor.parameters;
    
    //Building the card title structure
    var cardTitle = document.createElement("dummy");
    cardTitle.innerHTML = `<div class="card-header" id="headingOne", style="background-color:#563d7c"></div>`;
    cardTitle = cardTitle.children[0];
    //Populating card title data
    cardTitle.innerHTML = `<h2 class=\"mb-0\"></h2>`;
    cardTitle.children[0].innerHTML = `<div class="btn btn-link btn-block text-left text-light" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne" style="text-decoration:none"></div>`;
    cardTitle.children[0].children[0].innerText = `${scanname} on ${hostname} at ${timedate}`;



    //Building the card title description structure
    var scanDescription = document.createElement("dummy");
    scanDescription.innerHTML = `<div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordion"><div class="card-body"></div></div>`;
    scanDescription = scanDescription.children[0]; //The above three lines is to create the above parent

    scanDescription.innerHTML =`<div class="card-body"></div>`;



    //Populating title description data
    if (parameters.length > 0){
        scanDescription.children[0].innerHTML = `<h5>Scan Parameters</h5> <b>${parameters.join("</b><b>")}</b> </h5>\n<hr>`;    
    } else {
        scanDescription.children[0].innerHTML = `<h5>Scan Parameters</h5> <b>Default/None</b> </h5>\n<hr>`;
    }

    //Once the two have been built we need merge them
    var card = document.createElement("div")
    card.classList.add("card");
    card.appendChild(cardTitle);
    card.appendChild(scanDescription);


    //It's important to note that the title descriptor is actually a body to the header section

    return card;
}

function createReportCardBody(scanResults){
    //It's important to note that the report body that we are making is actually just an extension of the report body created by the reportCardHeader
    return scanResults;
}







//TODO: Finish this function
function createFinishedReport(){
    return null;
}

function toggleAccordionVisibility(eventTarget){
    return null;
}

function toggleComponent(eventTarget){
    //We currenlty have the header, so we want to find it's body
    console.log(eventTarget);
    console.log(eventTarget.parentElement.parentElement.nextElementSibling);
    var cardBody = eventTarget.parentElement.parentElement.nextElementSibling;
    $('#' + cardBody.id).collapse("toggle");

}






// Form item methods //








//They all start as false 
//This assumes that when they click it
function setRadioStatus(element){
    element.value = "true";
    console.log(element);
    console.log(element.id);
    console.log(element.name);
    var elements = document.getElementsByName(element.name);
    for (var i = 0; i< elements.length; i++){
        if(elements[i].value == "true" && elements[i] != element) {
            elements[i].value = "false";
        }
    }
}

function setCheckboxStatus(element){
    if (element.value == "true"){
        element.value = "false";
    }
    else {
        element.value = "true";
    }
}

