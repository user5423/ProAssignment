

const formMethods = {"Scan Technqiues" : {
    "checkbox" : ["<b>-sT</b> : TCP Connect Scan",
                    "<b>-sS</b> : TCP SYN Scan",
                    "<b>-sU</b> : UDP Connect Scan"]
 },

"Port Range": {
    "radio": ["<p>Default Range (1-1000)</p>",
              "<p>Full Range (1 -65535)</p>"]
 },

"Additional Scan Technqiues": {
    "checkbox": ["<b>-sV</b> : Service/Version Detection",
                 "<b>-sC</b> : Default Nmap Scripts"]      

}
};


// So first we loop throught each form section
var formElement = document.createElement("form")
var itemCounter = 0;
for(var section in formMethods) {

    var formGroup = document.createElement("div")
    formGroup.setAttribute("class", "form-group")


    for (var item in section){
        itemCounter += 1;

        if (item == "checkbox" || item == "radio"){
            var formItem = `
                <div class="form-check">
                    <label class="form-check-label" for="defaultCheck${itemCounter}">
                    ${item}
                    </label>
                    <input class="form-check-input" type="${section}" value="" id="defaultCheck${itemCounter}">
                </div>`;

            appendInnerHTML(formGroup, formItemHTML);
        } else {
            console.log("We didn't process this")
        }
}

    var value = formMethods[key];
    
    
}

function appendInnerHTML(element, newInnerHTML){
    originalInnerHTML = element.innerHTML;
    element.innerHTML = originalInnerHTML + "\n" + newInnerHTML;
}