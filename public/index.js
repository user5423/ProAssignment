// Now that we have a base page to work with, we need to start building the base systems
// We need to build a function that requests and updates content on the DOM

//Setting global variables
const eventToGetRequest = {"runningScans": "/runningScans",
                            "finishedScans": "/finishedScans",
                            // "scanReports": "/scanReports",
                            "networkScanner": "/networkScanner",
                            "dnsScanner": "/dnsScanner",
                            "index": "/index"};

const eventToPostRequest = {"submitScanForm": nsubmitScanForm};

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
    } else if ((resourcePath = eventToPostRequest[eventTargetID]) != undefined) {
        nsubmitScanForm(currentLoadedPage);
    } else {
        checkDomEvents(eventTarget);
        console.log("This event id isn't registered");
    }
    return null;
})


//TODO-F: Maybe repurpose this function to take parameters so that it isn't hardcoded
function addFormEventListeners(){
    var elementsToListen, element;
    elementsToListen = document.getElementsByTagName("input");
    for (var i = 0; i < elementsToListen.length; i++){
        element =  elementsToListen[i];
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
    return null;
}




// Parsing Methods //


function jsonParse(response){ return response.json();}

function htmlParse(response){ return response.text();}









//Dom Manipulation and Checking Methods //



function checkDomEvents(eventTarget){
    var key, value;
    for(key in domEventDefinitions){
        for (value in domEventDefinitions[key]){
            if (key == "class"){
                if (eventTarget.classList.contains(value)){
                    domEventDefinitions[key][value](eventTarget);
                }
            } else if (eventTarget.getAttribute(key) == value) {
                domEventDefinitions[key][value](eventTarget);
                return true;
            }
        }
    }
    return false;
}


function updateDomByGetRequest(eventTargetID, resourcePath){
    // if (currentLoadedPage != eventTargetID){
    //     return false;
    // }
    resourcePath = `http://127.0.0.1:4444${resourcePath}`;

    fetch(resourcePath)
    .then(response => {
        if (!(response.ok || response.redirected)){
            throw Error(response.status);
        }
        return response;
    })
    .then(response => responseHandlingDefinitions[eventTargetID][0](response))
    .then(body => {
        responseHandlingDefinitions[eventTargetID][1](body);
    }).catch(error => {
        processFetchError(error);
    });



    return null;
}


function updateBody(body){
    var parser = new DOMParser();
    var htmlDoc = parser.parseFromString(body, 'text/html');
    document.getElementById("body").innerHTML = htmlDoc.getElementById("body").innerHTML;
}


function processFetchError(error){
    // If ther error is not a number there was a networking issue
    console.log(error);
    if (isNaN(error)){
        // document.getElementById("body").innerHTML = `<h4>There was a networking issue that caused the request to fail. This could have been anything from a disconnect to failed DNS lookup</h4>`;
        document.getElementById("body").innerHTML = `<h4>We detected a networking error of some sort - this could be anything from the server being down to a unresolved DNS request</h4>`;
    }
    else {
        if (error[0] == "4"){
            document.getElementById("body").innerHTML = `<h4>We detected a ${error} code - that means that the method you provided wasn't supported </h4>`;
        } else if (error[0] == "5"){
            document.getElementById("body").innerHTML = `<h4>We detected a ${error} code - that means that the server encountered a problem during processing the request</h4>`;
        } else {
            document.getElementById("body").innerHTML = `<h4>We detected an unusual that wasn't a 4xx or 5xx error</h4>`;
        }
    }

}




// Form Methods //
function nsubmitScanForm(){
    var input, label, item, hostInput, formGroupCollection, formItemCollection, i, j, formSearch;
    var formJson = {};

    //Every scan has a host input, so we can hardcode this in
    hostInput = document.getElementById("inputHost").value;
    formJson["host"] = hostInput;

    //This gets the active checkboxes and radioboxes
    formGroupCollection = document.getElementsByClassName("form-group");

    var isValid = true;

    //Iterating over each formgroup
    for (i = 0; i < formGroupCollection.length; i++){
        var formGroup = formGroupCollection[i];
        var isRequired = formGroup.classList.contains("required")
        
        
        formItemCollection = formGroup.getElementsByClassName("form-check");
        formSearch = formGroup.getElementsByClassName("form-control");
        //We first start by checking where we have a formSearch or formItemCollection
        if (formSearch.length != 0){
            input = formGroup.getElementsByTagName("input")[0];
            label = formGroup.getElementsByTagName("label")[0];
            formSearch = formSearch[0];
            //We start by checking that it isn't empty
            if (isValidHostname(formSearch)){
                formJson["host"] = input.value
            }
            else {
                isValid = false;
            }

        } else {
            // If we are dealing with a formItemCollection - i.e. a bunch of checboxes and radioboxes
            console.log(formItemCollection[i]);
            if (isRequired){
                if (!isValidItemGroup(formGroup)){
                    isValid = false;
                    continue;
                }
            }

            console.log(formItemCollection.length);
            //We iterate of them
            for (j=0; j < formItemCollection.length; j++){
                item = formItemCollection[j];
                input = item.children[0];
                label = item.children[1];

                console.log(input.value);
                if ((item.classList.contains("form-check") == true)){
                        if (input.value == "true"){
                            formJson[label.getElementsByTagName("b")[0].innerText] = input.value;
                        }
                    }
                    else {
                        isValid = false;
                    }
                }
            }
        }

    if (isValid == false){
        return null;
    }


    formJson.scanType = currentLoadedPage;
    console.log("yo");
    console.log(JSON.stringify(formJson));

    fetch(`http://127.0.0.1:4444/${currentLoadedPage}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json',},
        body: JSON.stringify(formJson),
    }).then(response => {
        if (!(response.ok || response.redirected)){
            throw Error(response.status);
        }

        var submit = document.getElementById("submitScanForm");
        submit.parentNode.replaceChild(html2element(`<div id="submitScanForm" class="btn btn-success">Submitted!</div>`), submit);
        return response;
    }).catch(error => {
        processFetchError(error);
    });
    
    //Here we will want to reset the page
    setTimeout(updateDomByGetRequest, 1000, currentLoadedPage, `/${currentLoadedPage}`);



    }


function isValidItemGroup(checkboxGroup){
    checkboxGroup = checkboxGroup.getElementsByTagName("input");
    for(var i = 0; i < checkboxGroup.length; i++){
        if (checkboxGroup[i].value == "true") {
            insertMessage(checkboxGroup[0].parentElement.parentElement, `<div class="feedback val-success">You selected at least one value<div>`);
            // appendInnerHTML(checkboxGroup[0].parentElement.parentElement,`<div class="feedback val-success">You selected at least one value<div>`);
            return true;
        }
    }
    insertMessage(checkboxGroup[0].parentElement.parentElement, `<div class="feedback val-error">You need to select at least one value<div>`);
    // appendInnerHTML(checkboxGroup[0].parentElement.parentElement,`<div class="feedback val-error">You need to select at least one value<div>`);
    return false;
}

function insertMessage(node, message){
    try {
        if (node.lastChild.classList.contains("feedback")){
            node.lastChild.innerHTML = message;
        } else {
            // appendInnerHTML(node,`<div class="feedback val-error">You need to select at least one value<div>`);
            appendInnerHTML(node, message);
        }
    } catch(err){
        // appendInnerHTML(node,`<div class="feedback val-error">You need to select at least one value<div>`);
        appendInnerHTML(node, message);
    }
}



function isValidHostname(formSearch){
    if (formSearch.value != ""){
        addSuccessMessage(formSearch, `Correct hostname`);
        return true;
    }
    addErrorMessage(formSearch, `Please enter a valid hostname!`)
    return false;
}

function addSuccessMessage(formSearch, message){
    insertMessage(formSearch.parentElement, `<div class="feedback val-success">${message}<div>`);
}

function addErrorMessage(formSearch, message){
    insertMessage(formSearch.parentElement, `<div class="feedback val-error">${message}<div>`);
}


function createScanPage(body){
    var htmlBio, htmlForm, bodyContainer;
    // TODO fomalize howe we add html together
    htmlBio = createBio(body["PageStart"]);
    htmlForm = createForm(body["FormMethods"]);
    bodyContainer = html2element(`<div class="row"></div>`)

    appendInnerHTML(bodyContainer, "<div>");
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
    var item, itemType, itemCounter, sectionCounter, section;
    var formElement, formGroup, formItemHTML, i, isRequired;

    formElement = document.createElement("form");
    // formElement = html2element(`<form`)
    itemCounter = 0, sectionCounter = 0;

    for (section in formMethods){
        itemType = formMethods[section]["type"];
        isRequired = formMethods[section]["required"];
        formGroup = html2element(`<div class="form-group ${isRequired}"><p><b>${section}</b></p></div>`);

        // With item type we can decide checkbox

        for (i = 0; i < formMethods[section]["formItems"].length; i++){
            item = formMethods[section]["formItems"][i];
            formItemHTML = `<div class="form-check"><input class="form-check-input" type="${itemType}" value="false" id="defaultCheck${itemCounter}" name="section${++sectionCounter}" >
                            <label class="form-check-label" for="defaultCheck${++itemCounter}">${item}</label></div>`;
            appendInnerHTML(formGroup, formItemHTML);
        }

        appendInnerHTML(formElement, formGroup.outerHTML);
        appendInnerHTML(formElement, "<br>")
    }

    // Replaced button with div in order to fix behaviour bug that was caused by bs4's javascript code
    appendInnerHTML(formElement, `<div id="submitScanForm" class="btn btn-primary">Submit</div>`)
    return formElement.outerHTML;
}



// Report Methods //            TODO: This section needs ot be finished




//TODO: Finish or remove a functional search bar
function createRunningReportPage(body){
    var pageHeader, message, spinner, accordion, i;
    //Create default header for webpage
    document.getElementById("body").innerHTML = "";
    pageHeader = `<h3>Running Scans</h3><br>`;
    appendInnerHTML(document.getElementById("body"), pageHeader);
    console.log(body);
    // In case there are no scans, we return an error message
    if (body.length == 0){
        message = `<p> There are no currently running scans detected. To populate this page, you need to initiate a scan.</p><p>We are attempting to detect new submitted scan requests. Are you expecting a scan to be here? It's
                        possible that the scan is incredibly fast that it went straight to the finished scans section</p>`;
        spinner = `<div class="text-center"><div class="spinner-border" role="status"></div></div>`;
        appendInnerHTML(document.getElementById("body"), message+spinner);
        return null;
    }

    //We create an empty accordion that will parent the card reports
    accordion = html2element(`<div class="accordion" id="accordion"></div>`);
    for(i = 0; i < body.length; i++){
        accordion.appendChild(createRunningReport(body[i]));
    }

    appendInnerHTML(document.getElementById("body"), accordion.outerHTML);
    return null;
}

//TODO: Rename the parameter body to something else more representative
function createFinishedReportPage(body){
    var runningReport, finishedReport, message, pageHeader, accordion, i;
    //Create default header for webpage
    document.getElementById("body").innerHTML = "";
    pageHeader = `<h3>Finished Scans</h3><p>Been waiting a while? Depending on what scan you chose and it's parameters, it can take from a couple of seconds, to even a couple of hours. 
                        However, I've tried to limit what types of scans you have access to, so at the most, it shouldn't take more than ten minutes.</p>
                    <p>While you are waiting why don't you take a look at the below scans by clicking on the scan titles, and look at their respective results</p><br>`;
    appendInnerHTML(document.getElementById("body"), pageHeader);

    // In case there are no scans, we return an error message
    if (body.length == 0){
        message = `<p> There are no finished scans detected in this current session or in previous sessions. To populate this page, you need to complete a scan.`;
        appendInnerHTML(document.getElementById("body"), message);

    } else {
        //We create an empty accordion that will parent the card reports
        accordion = html2element(`<div class="accordion" id="accordion"></div>`);
        for (i = 0; i< body.length; i++){
            //From this runningReport we are going to extend it to a result one
            runningReport = createRunningReport(body[i]["scan descriptor"]);
            finishedReport = completeRunningReport(runningReport, body[i]).outerHTML;
            appendInnerHTML(accordion, finishedReport);
        }

        appendInnerHTML(document.getElementById("body"), accordion.outerHTML);
    }
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

//Adds a scan report to a original pre-existing running report card
function createScanReport(runningReport, scanObject){
    var key, resultKeys, value, row, table, table1, i;
    table = html2element(`<table class="table"><tbody></tbody></table>`);
    //For each entry in result we add a new row to the table
    resultKeys = Object.keys(scanObject["scan results"]);

    for (i = 0; i < resultKeys.length; i++){    
        key = resultKeys[i], value = scanObject["scan results"][key] 

        if (Array.isArray(value) && value.length > 1 && isObject(value[0])) {
            table1 = createNestedObjectTable(value)
            appendInnerHTML(table.children[0], `<tr><th scope="row">${key}</th><td>${table1.outerHTML}</td>`);

        } else if (isObject(value)){
            table1 = createTable(value, `<tr><th scope="row">{key}</th><td>{value}</td></tr>`)
            appendInnerHTML(table.children[0], `<tr><th scope="row">${key}</th><td>${table1.outerHTML}</td>`)

        } else if (Array.isArray(value) && value.length > 1) {
            table1 = createTable(value, `<tr><td>{value}</td></tr>`)          
            appendInnerHTML(table.children[0], `<tr><th scope="row">${key}</th><td>${table1.outerHTML}</td>`)
        
        } else {
            row = `<tr><th scope="row">${key}</th><td>${value}</td></tr>`;
            appendInnerHTML(table.children[0], row);
        }
    }

    //Now that we have created the table with populated values, we need to merge it with the original running report
    appendInnerHTML(runningReport.children[1].children[0], `<hr><h5>Scan Results</h5>${table.outerHTML}`);
    return runningReport;
}

//This creates a table where the parameters input format is key:value items
function createTable(values, rowStructure){
    var key, keys, row, value, table;
    table = html2element(`<table class="table"><tbody></tbody></table>`);
    keys = Object.keys(values);
    for (var j = 0; j < keys.length; j++){
        key = keys[j], value = values[key];
        row = rowStructure.replace("{key}", key).replace("{value}", value);
        appendInnerHTML(table.children[0], row);
    }
    return table
}

//This creates a table where the parameters input format is key:value items
function createNestedObjectTable(values){
    var tableHeaders, table, values1, rows, j;
    tableHeaders = Object.keys(values[0]);
    table = html2element(`<table class="table"><thead><tr><th scope="col">${tableHeaders.join(`</th><th scope="col">`)}</th></tr></thead><tbody></tbody></table>`);
    for (j = 0; j < values.length; j++){
        values1 = Object.values(values[j]);
        rows = `<tr><td>${values1.join("</td><td>")}</td></tr>`;
        appendInnerHTML(table.children[1], rows);
    }
    return table
}











function createRunningReport(scanDescriptor){return createReportCardHeader(scanDescriptor);}


//The card header has two components:
    //The title of the card that will always be visible
    //The descriptor of the card that will come below it

//This takes in the scanDescriptor and creates a html block for it
//TODO: We need to consider all the different data-toggle and data-target values here
//TODO: We need to dynamically assign classes or attributes for js bs4 operations. i.e. words like "one", "two" from stuff like data-target attribute
function createReportCardHeader(scanDescriptor){
    var scanColor, scanColorCode, linkVal;
    scanColorCode = {"nmapscan": "background-color:#563d7c",
                     "dnsscan": "background-color:#18AB54",
                     "idsscan": "background-color:#18ABA1"}

    scanColor = scanColorCode[scanDescriptor.scanname];
    linkVal = String(componentLinkVals++);

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






// Responsive Component methods

//This assumes that all the radio's are false to begin with
function setRadioStatus(element){
    var elements, i;
    element.value = "true";
    elements = document.getElementsByName(element.name);
    for (i = 0; i< elements.length; i++){
        if(elements[i].value == "true" && elements[i] != element) {
            elements[i].value = "false";
        }
    }
}

function setCheckboxStatus(element){
    if (element.value == "true"){
        element.value = "false";
    } else {
        element.value = "true";
    }
}

function toggleComponent(eventTarget){
    //We currenlty have the header, so we want to find it's body
    var cardBody = eventTarget.parentElement.parentElement.nextElementSibling;
    $('#' + cardBody.id).collapse("toggle"); //Using jquery methods provided by bs4
}


// Helper dom functions

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