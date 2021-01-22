# ProAssignment

A couple app behaviour that may be misinterpreted as errors:
    DNS Scan:

            ##The reason you may get "execution failed errors" on the report is because you tried to lookup a record incorrectly for a host. e.g. If you are trying to get cname of google.com, this doesn't really make sense as the canonical name of google.com is google.com

            ##Certain DNS records may be unavailable because you may be pointing to a subdomain which could be the reason why certain records aren't returned as expected

            ##While the output for the txt section may seem like random strings, this is NOT an error. To the untrained eye v=spf1**** means nothing, but this is actually for SPF which determines which MX's are allowed to send mail to the target domain. That is an example of what you may encounter in the table

    
    Nmap Scan:

            ##There is form validation on the GUI, but not on the API. While this may seem like an inconsistency this was a purposeful design choice. There were two assumptions made:

                1. If you're accessing an API endpoint directly via a 3rd scripting language, you most likely know what you are doing

                2. If you're accessing the GUI then you probably don't see a terminal to often, and so are therefore unfamiliar with security/network tools

            Therefore we only provide validation on GUI, for new users so they don't screw up the execution of the tird party security tools

            The reason we don't provide outright validation on API, is that as the nmap-node wrapper gets updated with support for new switches/flags, experience users can access these as these get updated. Furthermore, while there's no outloud validation, we quietly remove flags that may cause errors through the wrapper. So actually there is validation, but errors are dropped instead of rejected


    ##There is only one known flaw with the GUI forms, and it's that the "search Host" isn't extensive in terms of it's validation. It's quite time consuming than any other sort of validation, and this isn't a production webapp so I'm not going to bother with that.
    It's especially long when you need to consider different types of addressing and types of paths. 
    
    Therefore only basic checks are in place such as ignoring empty strings etc.
