# ProAssignment


NOTE: Mess around with the site first before doing the testing!!!!



IMPORTANT !!!!!!!!!!!!!!!!!!


## YOU NEED TO INSTALL NMAP

    ---> This cannot be done via npm so requires manual installation!

    If you can install it on Windows please do so. I haven't tested it on other systems (except debian, but limited testing)


    1) Using the installers for win/macOS provided install with default settings, or install from https://nmap.org/download.html
    2) Find the path of the executable in the installed folder -- this should be nmap.exe or whatever it is on your system (under the Nmap folder)
    3) Add that path over to the top of server.js where it should have a variable nmap.nmapLocation = "yourPath"

    If you are linux, you can install nmap with most default repos else:
        1) add kali repos to your /etc/sources.list
        2) sudo apt-get update
        3) sudo apt-get install nmap
        4) Find the path of the binary in /bin or wherever it is and set the variable nmap.nmapLocation = "binaryFile" to it

    NOTE: Make sure to you use your respective package manager, i.e. replace apt-get with yum or pacman if needed

    Otherwise:
        use "whereis nmap" to find the location of the binary. Note the path of the binary might be  /usr/bin/nmap as it was in mine for Kali Linux. Therefore the path would have beem nmap.nmapLocation = "/usr/bin/nmap". For kali, it only worked when I pointed to "/usr/bin/" and didn't when "/usr/bin/nmap". This isn't my fault as this node-nmap module was written poorly.

## NOTE if the site still doesn't work. 

    1) If the scan reports scan shows an erros, Shut down the server
    2) Copy contents of backupreports.json to reports.json
    3) Try setting the nmap.nmapLocation = "the/folder/containingnmap/" instead of the path to binary i.ea "the/folder/containingnmap/nmapfile"


## There are detailed instructions on how to install it at nmap.org

    https://nmap.org/download.html






## NOTE: Nmap scans can take sometimes 10 minutes. 

So if your scan request is in "runningScans" you know execution was initated succesfuly. So come back later or view a pre-done scan in the "scan Reports" tab

## NOTE 1: If you didn't install it and you ran the nmap scan. 

    Shutdown the server and copy the contents of backupreports.json to the reports.json

## NOTE 2: Node-nmap module no longer allows -sS and -sT parameters on the same scan. 

While this is done frequently with regular nmap, I've left this open on the form , so that if node-nmap releases an update, it will function correctly

## NOTE 3: The server is listening at http://127.0.0.1:4444/ -- Remember it is listening on port 4444, not 80





## A couple app behaviour that may be misinterpreted as errors:
    DNS Scan:

            ##The reason you may get "execution failed errors" on the report is because you tried to lookup a record incorrectly for a host. e.g. If you are trying to get cname of google.com, this doesn't really make sense as the canonical name of google.com is google.com -- this has changed mostly with validation

            ##Certain DNS records may be unavailable because you may be pointing to a subdomain which could be the reason why certain records aren't returned as expected

            ##While the output for the txt section may seem like random strings, this is NOT an error. To the untrained eye v=spf1**** means nothing, but this is actually for SPF which determines which MX's are allowed to send mail to the target domain. That is an example of what you may encounter in the table

    
    Nmap Scan:

            ##There is form validation on the GUI and API, but the client-side validation is stronger than the server-side validation. While this may seem like an inconsistency this was a purposeful design choice. There were two assumptions made:

                1. If you're accessing an API endpoint directly via a 3rd scripting language, you most likely know what you are doing

                2. If you're accessing the GUI then you probably don't see a terminal to often, and so are therefore unfamiliar with security/network tools

            Therefore we provide better validation on GUI, for new users so they don't screw up the execution of the third party security tools. This isn't too say that there isn't validation for server-side there definitely is. The weaker validation on server-side allows experienced users to harness the power of node-nmap as new parameters are provided through updates, without any need from my part to update the validation definitons



## There are a few known bugs/errors/invalid-behaviours:

    1) There is only one known flaw with the GUI forms, and it's that the "search Host" isn't extensive in terms of it's validation. 
    It's quite time consuming than any other sort of validation, and this isn't a production webapp so I'm not going to bother with that. It's especially long when you need to consider different types of addressing schemes and types of locators/paths. 
    Therefore only basic checks are in place such as ignoring empty strings, and checking for basic attributes of valid hostname etc.
    
    2) The web server may refuse to run because of one of the import modules. This isn't a module I've manually put on, something in my environment is forcefully adding imports to the top of the script that results in errors. I was unable to pinpoint where the issue is exactly, but mayhe your environment won't have this issues

    3) You cannot spam the delete button too fast i.e. < 0.3 seconds due to the previous deletion still working on the previous operation --> Therefore give adequate time for deletion before clicking the next delete button for report. I could have implemented a Queue based system and work of that, but that's long.

    4) NOTE: If you drop the server during execution of a scan, the report will come out mal-formed - this is only an issue for nmap scans as these take quite a long time to execute


## Certain behaviours that you may consider errors, but are NOT:

    1) If you assume that you should have got a 400 code instead of a 200 code, it's likely that either one of two things:

        ##1. We fixed invalid parameters through sanitation -- e.g. eliminating double parameters, invalid parameters etc
        ##2. The request was dropped quiety with no outright error and so instead just returned an emtpy array or something similar


    2) Running JEST cases:
        When running JEST cases, after executing all test casees it will hang. This is NOT an error but a side effect from the fact that the API initiates a asynchronus execution request, and so JEST is waiting on this. There's many scan executions involved in the cases so this could take up to an hour if not more.

        Solution: Once the test cases all finish with positive/negative and you see a yellow message about JEST waiting for open handles, just exit with Ctrl+C


Important!!!!! -- NOTE: I have rolled back on the node-nmap module update, so it should work!

    <!-- 2) Currently a manual update to node-nmap has screwed up a few of the potential switches/flags, and I can't find a stable version that behaves the same way as the version I was running (i.e. I don't know what the version of node-nmap I was using during development) -->

