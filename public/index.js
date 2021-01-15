// Now that we have a base page to work with, we need to start building the base systems
// We need to build a function that requests and updates content on the DOM

//Setting global variables
const eventToGetRequest = {"runningScans": "/runningScans",
                            "scanReports": "/scanReports",
                            "networkScanner": "/networkScanner",
                            "dnsScanner": "/dnsScanner",
                            "index": "/index"};

const eventToPostRequest = {"submitScanForm": submitScanForm};

const responseHandlingDefinitions = {"networkScanner": [jsonParse, createScanPage],
                                    "dnsScanner": [jsonParse, createScanPage],
                                    "index": [htmlParse, updateBody],
                                    "runningScans": [jsonParse, createFinishedReportPage],
                                    "finishedScans": [jsonParse, createFinishedReport]};


var domEventDefinitions = {"type": {"radio": setRadioStatus,
                                    "checkbox": setCheckboxStatus},
                           "class": {"card": toggleAccordionVisibility}
                        };



var currentLoadedPage = "index";


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


function checkDomEvents(eventTarget){
    for(var key in domEventDefinitions){
        for (var value in domEventDefinitions[key]){
            if (key == "class"){
                if (eventTarget.classList.contains(value)){
                    domEventDefinitions[key][value](eventTarget);
                }
            }
            else if (eventTarget[key] == value) {
                domEventDefinitions[key][value](eventTarget);
                return true;
            }
        }

    }
    return false;
}


function jsonParse(response){ return response.json();}

function htmlParse(response){ return response.text();}


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
            console.log("wtf");
        }
    }
}


function createFinishedReportPage(body){
    // In case there are no scans
    if (body.length == 0){
        var message = `<h4>No Completed Reports</h4><br><p> There were no completed scans detected, be that in this session, or previous sessions.</p>
         <p>To populate this page, please select one of the scanning operations, and wait until completion before returning here</p>`
        document.getElementById("body").innerHTML = message;
        return;
    }

    var reports = {};
    for(var i = 0; i < body.length; i++){
        reports[i] = createRunningReport(body[i]);

    }




}




//TODO: CHeck that scanType and hostname are pulling from the right array/obj ref/indexes
function createRunningReport(body){
    console.dir(body);
    var scanDescriptor = body["scan descriptor"];
    var scanResults = body["scan results"];
    console.log(Object.keys(scanDescriptor));
    var scanType = Object.keys(scanDescriptor[0])[0];
    var hostname = Object.keys(scanDescriptor[0])[1];
    var datetime = 0; //TODO: Add datetime to the scan submit


    //Let's create the accordion
    var accordion = document.createElement("div");
    accordion.classList.add("accordion");
    accordion.id = "accordion";

    //First we create the scan title for the card
    var card = document.createElement("div");
    card.class = "card-header";
    card.id = "headingOne" // TODO: We need to make this dynamic

    //Building the card title
    var cardTitle = document.createElement("div");
    cardTitle.innerHTML = "<h2 class=\"mb-0\"></h2>";
    cardTitle.children[0].innerHTML = `<div class="btn btn-link btn-block text-left text-light" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne" style="text-decoration:none"></div>`;
    cardTitle.children[0].children[0].innerText = `${scanType} on ${hostname} at ${datetime}`;

    //Building card body

    //Scan description
    var scanDescription = document.createElement("dummy");
    scanDescription.innerHTML = `<div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="accordion"><div class="card-body"></div></div>`;
    scanDescription = scanDescription.children[0];

    //TODO: Add custom code for the parameters
    if (scanDescriptor[0]["nmapscan"][1].length > 0){
        scanDescription.innerHTML = `<h5>Scan Parameters</h5> <b>${scanDescriptor.join("</b><b>")}</b> </h5>\n<hr>`;
    } else {
        scanDescription.innerHTML = `<h5>Scan Parameters</h5> <b>Default</b> </h5>\n<hr>`;
    }

    //Scan results
    var scanResultHTML = document.createElement("dummy");
    scanResultHTML.innerHTML = `<table class="table"><tbody></tbody></table>`;
    scanResultHTML = scanResultHTML.innerHTML;
    
    var scanResultKeys = Object.keys(scanDescriptor[0])[0];
    for (var i = 0; i< scanResults; i++){
        // if //scanResults
        // appendInnerHTML(scanResultsHTML.children[0].children[0], `<tr><th scope="row">${}</th><td>${}</td></tr>`);

    }

    return null;
}

function createFinishedReport(){
    //
    return null;
}


function toggleAccordionVisibility(eventTarget){
    return null;
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



