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
                           
                            "data-toggle":{"collapse": toggleComponent}
                        };



var currentLoadedPage = "index";


var componentLinkVals = 0;



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
    return null;
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
    var bodyContainer = html2element(`<div class="row"></div>`)

    appendInnerHTML(bodyContainer, "<div class=\"col-12\" style=\"padding-top: 10px;\">");
    bodyContainer.children[0].innerHTML = htmlBio + htmlForm;
    document.getElementById("body").innerHTML = bodyContainer.innerHTML;

    addFormEventListeners();
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

    for (var section in formMethods){
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








// Form Validation:







// Report Methods //            TODO: This section needs ot be finished



//TODO: We want to be able to create a search bar for 
function createRunningReportPage(body){

    //Create default header for webpage
    document.getElementById("body").innerHTML = "";
    var pageHeader = `<h3>Running Scans</h3><br>`;
    appendInnerHTML(document.getElementById("body"), pageHeader);

    // In case there are no scans, we return an error message
    if (body.length == 0){
        var message = `<p> There are no currently running scans detected. To populate this page, you need to initiate a scan.</p><p>We are attempting to detect new submitted scan requests. Are you expecting a scan to be here? It's
        possible that the scan is incredibly fast that it went straight to the finished scans section</p>`;
        var spinner = `<div class="text-center"><div class="spinner-border" role="status"></div></div>`;
        appendInnerHTML(document.getElementById("body"), message);
        appendInnerHTML(document.getElementById("body"), spinner);
        return;
    }

    //If there are running scans

    //We create an empty accordion that will parent the card reports
    var accordion = document.createElement("div");
    accordion.classList.add("accordion");
    accordion.id = "accordion";

    var search2 = `<input type="text" class="form-control" id="inputHost" aria-describedby="emailHelp" placeholder="Enter scan title"><br>`;
    appendInnerHTML(document.getElementById("body"), search2);

    for(var i = 0; i < body.length; i++){
        accordion.appendChild(createRunningReport(body[i]));
    }

    appendInnerHTML(document.getElementById("body"), accordion.outerHTML);

    return null;
}

//TODO: Rename the parameter body to something else more representative
function createFinishedReportPage(body){
    //Create default header for webpage
    document.getElementById("body").innerHTML = "";
    var pageHeader = `<h3>Finished Scans</h3><p>Been waiting a while? Depending on what scan you chose and it's parameters, it can take from a couple of seconds, to even a couple of hours. 
                        However, we've tried to limit what types of scans you have access to, so at the most, it shouldn't take more than ten minutes.</p><br>`;
    appendInnerHTML(document.getElementById("body"), pageHeader);

    // In case there are no scans, we return an error message
    if (body.length == 0){
        var message = `<p> There are no finished scans detected in this current session or in previous sessions. To populate this page, you need to complete a scan.`;
        appendInnerHTML(document.getElementById("body"), message);
        return null;
    }

    //If there are running scans
    //We create an empty accordion that will parent the card reports
    var accordion = document.createElement("div");
    accordion.classList.add("accordion");
    accordion.id = "accordion";

    for (var i = 0; i< body.length; i++){
        //From this runningReport we are going to extend it to a result one
        var runningReport = createRunningReport(body[i]["scan descriptor"]);
        var finishedReport = completeRunningReport(runningReport, body[i]).outerHTML;
        appendInnerHTML(accordion, finishedReport);
    }

    appendInnerHTML(document.getElementById("body"), accordion.outerHTML);

    return null;
}

//This should have a scan results and scan descriptor on body
function completeRunningReport(runningReport, body){
    if (body["scan descriptor"].scanname == "dnsscan"){
        return createScanReport(runningReport, body);
    } else if (body["scan descriptor"].scanname == "nmapscan"){
        return createScanReport(runningReport, body);
    } else {
        console.log("Incorrect report created");
    }
}

//TODO: Make this function into a genericScanReport function
//TODO: Change body parameter to a different name (more representative)
function createScanReport(runningReport, body){
    var  keys1, key, key1, value, value1, j, i;
    //We create an empty table
    var table = html2element(`<table class="table"><tbody></tbody></table>`);
    //For each entry in result we add a new row to the table
    var keys = Object.keys(body["scan results"]);

    for (i = 0; i<keys.length; i++){
        //TODO: Rename key to something else
        key = keys[i];
        value = body["scan results"][key];


        //TODO: Consider rearranigng this to reduce the amount of code
        if (Array.isArray(value) && value.length > 1 && isObject(value[0])) {
            var tableHeaders = Object.keys(value[0]);
            var table1 = html2element(`<table class="table"><thead><tr><th scope="col">${tableHeaders.join(`</th><th scope="col">`)}</th></tr></thead><tbody></tbody></table>`);
            //This assumes that the value is an object containing a key:value 
            for (j = 0; j < value.length; j++){
                var values1 = Object.values(value[j]);
                var row1 = `<tr><td>${values1.join("</td><td>")}</td></tr>`;
                appendInnerHTML(table1.children[1], row1);
            }

        appendInnerHTML(table.children[0], `<tr><th scope="row">${key}</th><td>${table1.outerHTML}</td>`);

        } else if (isObject(value)){
            table1 = html2element(`<table class="table"><tbody></tbody></table>`);
            keys1 = Object.keys(value);

            for (j = 0; j< keys1.length; j++){
                key1 = keys1[j];
                value1 = value[key1];
                row = `<tr><th scope="row">${key1}</th><td>${value1}</td></tr>`;
                appendInnerHTML(table1.children[0], row);
            }
        appendInnerHTML(table.children[0], `<tr><th scope="row">${key}</th><td>${table1.outerHTML}</td>`)

        } else if (Array.isArray(value) && value.length > 1) {
            table1 = html2element(`<table class="table"><tbody></tbody></table>`);
            keys1 = Object.keys(value);

            for (j = 0; j < keys1.length; j++){
                key1 = keys1[j];
                value1 = value[key1];
                row = `<tr><td>${value1}</td></tr>`;
                appendInnerHTML(table1.children[0], row);
            }
            
        appendInnerHTML(table.children[0], `<tr><th scope="row">${key}</th><td>${table1.outerHTML}</td>`)
        
        } else {
            var row = `<tr><th scope="row">${key}</th><td>${value}</td></tr>`;
            appendInnerHTML(table.children[0], row);
        }
    }

    //Now that we have created the table with populated values, we need to merge it with the original running report
    appendInnerHTML(runningReport.children[1].children[0], `<hr><h5>Scan Results</h5>${table.outerHTML}`);
    return runningReport;
}


function createTable(keys, values, rowStructure){
    var table = `<table class="table"><tbody></tbody></table>`;
    for (var j = 0; j< keys.length; j++){
        var key = keys[j];
        var value = values[key];
        var row = rowStructure.replace("{key}", key).replace("{value}", value);
        // `<tr><th scope="row">{key}</th><td>{value}</td></tr>`
        appendInnerHTML(table.children[0], row);
    }
    return table
}











function createRunningReport(scanDescriptor){
    return createReportCardHeader(scanDescriptor);
}

//This takes in the scanDescriptor and creates a html block for it
//TODO: We need to consider all the different data-toggle and data-target values here
//TODO: We need to dynamically assign classes or attributes for js bs4 operations. i.e. words like "one", "two" from stuff like data-target attribute
function createReportCardHeader(scanDescriptor){
    var scanColorCode = {"nmapscan": "background-color:#563d7c",
                         "dnsscan": "background-color:#18AB54",
                         "idsscan": "background-color:#18ABA1"}

    var scanColor = scanColorCode[scanDescriptor.scanname];
    var linkVal = componentLinkVals.toString();
    componentLinkVals += 1;

    //The card header has two components:
        //The title of the card that will always be visible
        //The descriptor of the card that will come below it
    
    //TODO: We need the colours to be dependent on the type of scan. we also need the attributes to by dynamic asweel such as those with values "one", "two"
    //Building the card title structure
    var cardTitle = html2element(`<div class="card-header" id="heading${linkVal}", style="${scanColor}"></div>`);
    //Populating card title data
    cardTitle.innerHTML = `<h2 class="mb-0"></h2>`;
    cardTitle.children[0].innerHTML = `<div class="btn btn-link btn-block text-left text-light" type="button" data-toggle="collapse" data-target="#collapse${linkVal}" aria-expanded="true" aria-controls="collapse${linkVal}" style="text-decoration:none"></div>`;
    cardTitle.children[0].children[0].innerText = `${scanDescriptor.scanname} on ${scanDescriptor.hostname} at ${scanDescriptor.timedate}`;

    //Building the card title description structure
    var scanDescription = html2element(`<div id="collapse${linkVal}" class="collapse" aria-labelledby="heading${linkVal}" data-parent="#accordion"><div class="card-body"></div></div>`)
    scanDescription.innerHTML =`<div class="card-body"></div>`;
    var parameters = scanDescriptor.parameters;
    //Populating title description data
    if (Object.keys(parameters).length > 0){
        scanDescription.children[0].innerHTML = `<h5>Scan Parameters</h5> <b>${parameters.join("</b><b>")}</b> </h5>`;    
    } else {
        scanDescription.children[0].innerHTML = `<h5>Scan Parameters</h5> <b>Default/None</b> </h5>`;
    }

    //Once the two have been built we need merge them
    var card = html2element(`<div class="card"></div>`);
    card.appendChild(cardTitle);
    card.appendChild(scanDescription);

    //It's important to note that the title descriptor is actually a body to the header section
    return card;
}

function createReportCardBody(scanResults){
    //It's important to note that the report body that we are making is actually just an extension of the report body created by the reportCardHeader
    return scanResults;
}










// Responsive methods


//This assumes that all the radio's are false to begin with
function setRadioStatus(element){
    element.value = "true";
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

function toggleComponent(eventTarget){
    //We currenlty have the header, so we want to find it's body
    var cardBody = eventTarget.parentElement.parentElement.nextElementSibling;
    $('#' + cardBody.id).collapse("toggle"); //Using jquery methods provided by bs4
}







// Helper functions

function appendInnerHTML(element, newInnerHTML){
    var originalInnerHTML = element.innerHTML;
    element.innerHTML = originalInnerHTML + newInnerHTML;
}

function html2element(htmlContent){
    var card = document.createElement("dummy");
    card.innerHTML = htmlContent;
    return card.children[0];
}

const isObject = (obj) => {
    return Object.prototype.toString.call(obj) === '[object Object]';
};