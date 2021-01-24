const os = require("os");
const {exec} = require("child_process");

var operatingSystem = os.platform();


switch(operatingSystem) {
    case "win32":
        exec("start nmap-7.91-setup.exe", (err, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`;
                printError();
            }
            
        });
        break

    case "darwin":
        exec("chmod + x")
        "chmod +x"
}


function printError(){
    console.log(`The installation may have failed. Please check that the file is executable before attempting again.
    
    If not please go to https://nmap.org/download.html and install
    the respective download for your operating system. It is super simple and they are have GUI installers for
    windows and mac. For linux users, you know what you are doing, so:
            1. make sure that nmap is contained in a repository that is in /etc/sources.list
            2. using your respective package manager "sudo apt-get install nmap -yy
            
    If you are still finding difficulty there are instructions on the nmap website that will help you.`)
};