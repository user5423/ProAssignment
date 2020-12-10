// Now that we have a base page to work with, we need to start building the base systems
// We need to build a function that requests and updates content on the DOM


window.addEventListener("click", event => {
    var resourcePath, eventTarget, eventTargetID;
    const eventDefinitions = {"id-value": "pathToResource"};


    //Event targets are just node interface objects with extended methods for event handling
    eventTarget = event.target;
    // We need to define how the definitions below will work
    eventTargetID = eventTarget.id;


    if ((resourcePath = eventDefinitions[eventTargetID]) == undefined) {
        return null;
    }

    resourcePath = `http://127.0.0.1${resourcePath}`

    fetch(resourcePath)
    .then(response => response.text())
    .then(body =>
      document.getElementById(eventTargetID).innerHTML=body)
})

//We need to decide what we want to build?

//We#re going to build network scanner


//THis need a form to apply information on the location we want to scan



//We then need a place to return the report