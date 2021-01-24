const request =  require('supertest');
const app = require('./server');
const { TestScheduler } = require('jest');
const process = require('process');
// const { delete } = require('./server');

app.listen(4444, () => {
    console.log(`Example app listening at http://127.0.0.1:${4444}`)
  })



describe('Testing the finishedScans endpoint', () => {
    test("GET /finishedScans - succeeds", () => {
        return request(app)
        .get('/finishedScans')
        .expect(200);
    });

    test("GET /finishedScans - returns JSON", () => {
        return request(app)
        .get('/finishedScans')
        .expect('Content-type', /json/);

    });

    //THis should succeed as random url parameters should just be ignored
    test("GET /finishedScans - invalid parameter with no invalid key", () => {
        return request(app)
        .get("/finishedScans?q=random")
        .expect(200);
    });

    test("GET /finishedScans - invalid parameter with no value", () => {
        return request(app)
        .get("/finishedScans?fdasfdf")
        .expect(200);   //This is not a 400 as we are just returning an empty [] as a valid response
    });


    test("GET /finishedScans - Chained parameters", () => {
        return request(app)
        .get("/finishedScans?scanname=dnsscan&hostname=google.com")
        .expect(200);   //This is not a 400 as we remove duplicate parameters
    });



})





describe('Testing the /runningScans endpoint', () => {
    test("GET /runningScans - succeeds", () => {
        return request(app)
        .get('/runningScans')
        .expect('Content-type', /json/);
    });

    test("GET /runningScans - returns JSON", () => {
        return request(app)
        .get('/runningScans')
        .expect('Content-type', /json/);

    });

    //THis should succeed as random url parameters should just be ignored
    //TODO: We are going to add ways to select certain scans via url query strings
    test("GET /runningScans - with random parameters", () => {
        return request(app)
        .get("/runningScans?q=random&kb=random")
        .expect(200);
    });


    //THis should succeed as random url parameters should just be ignored
    test("GET /runningScans - invalid parameter with no invalid key", () => {
        return request(app)
        .get("/runningScans?q=random")
        .expect(200);
    });

    test("GET /runningScans - invalid parameter with no value", () => {
        return request(app)
        .get("/runningScans?fdasfdf")
        .expect(200);   //This is not a 400 as we are just returning an empty [] as a valid response
    });


    test("GET /runningScans - Chained parameters", () => {
        return request(app)
        .get("/runningScans?scanname=dnsscan&hostname=google.com")
        .expect(200);   //This is not a 400 as we remove duplicate parameters
    });












})







//"scanType": "nmapscan"
//Our nmap scan already has default params, so even if none are provided we are good
//No need to test for dnsscan as they run using same parameter processor

//Any errors created during the actual execution of the scans is put in the reports

describe('Testing the /networkScanner endpoint', () => {
    test("POST /networkScanner - bare minimum body parameters", () => {
        return request(app)
        .post('/networkScanner')
        .send({
            "host": "google.com",
            "scanType": "nmapscan"
        })
        .expect(200);
    });

    test("POST /networkScanner - url parameters that don't exist", () => {
        return request(app)
        .post('/networkScanner?q=123')
        .send({
            "host": "google.com",
            "scanType": "nmapscan"
        })
        .expect(200);
});

    test("POST /networkScanner - content-type response is JSON", () => {
        return request(app)
        .post('/networkScanner')
        .send({
            "host": "google.com",
            "scanType": "nmapscan"
        })
        .expect('Content-type', /json/);
    });

    test("POST /networkScanner - incorrect scantype", () => {
        return request(app)
        .post('/networkScanner')
        .send({
            "host": "",
            "scanType": "nmapScan"
        })
        .expect(400);
    });

    test("POST /networkScanner - incorrect host", () => {
        return request(app)
        .post('/networkScanner')
        .send({
            "host": "googlecom",
            "scanType": "nmapscan"
        })
        .expect(400);
    });

    test("POST /networkScanner - incorrect host and scantype", () => {
        return request(app)
        .post('/networkScanner')
        .send({
            "host": "googlecom",
            "scanType": "dnsscan21321"
        })
        .expect(400);
    });

    //The reason why we allow "incorrect methods" as 200 is because the nmap node wrapper is basic and only supports a limited
    //number of flags/switches. However, as it updates, what once was considered incorrect will be allowed by the wrapper
    //Furthermore we deal with these errors quietly by disregarding them on the server.js
    test("POST /networkScanner - correct host and scantype + incorrect methods", () => {
        return request(app)
        .post('/networkScanner')
        .send({
            "host": "google.com",
            "scanType": "nmapscan",
            "sT" : true,
            "sR": true, 
        })
        .expect(200);
    });


    
})







describe('Testing the /dnsScanner endpoint', () => {
    test("POST /dnsScanner - no scan parameters ", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "google.com",
            "scanType": "dnsscan"
        })
        .expect(400);
    });

    //We are just ignoring these and only return 400 if the parameters below are insufficient
    test("POST /dnsScanner - url parameters that don't exist", () => {
        return request(app)
        .post('/dnsScanner?q=123')
        .send({
            "host": "google.com",
            "scanType": "dnsscan",
            "A": "true"
        })
        .expect(200);
});

    test("POST /dnsScanner - content-type response is JSON", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "google.com",
            "scanType": "dnsscan"
        })
        .expect('Content-type', /json/);
    });

    test("POST /dnsScanner - incorrect scantype", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "",
            "scanType": "dnsscan"
        })
        .expect(400);
    });

    test("POST /dnsScanner - incorrect host", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "googlecom",
            "scanType": "dnsscan"
        })
        .expect(400);
    });

    test("POST /dnsScanner - incorrect host and scantype", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "googlecom",
            "scanType": "dnsscan21321"
        })
        .expect(400);
    });

    //The reason why we allow "incorrect methods" as 200 is because the nmap node wrapper is basic and only supports a limited
    //number of flags/switches. However, as it updates, what once was considered incorrect will be allowed by the wrapper
    //Furthermore we deal with these errors quietly by disregarding them on the server.js
    test("POST /dnsScanner - correct host and scantype + incorrect methods", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "google.com",
            "scanType": "dnsscan",
            "Afdsa" : true,
            "Afdas": true, 
        })
        .expect(400);
    });

    test("POST /dnsScanner - correct host and scantype + correct methods", () => {
        return request(app)
        .post('/dnsScanner')
        .send({
            "host": "google.com",
            "scanType": "dnsscan",
            "AA" : true,
            "AAAA": true, 
        })
        .expect(200);
    });



    
})












describe('Testing the /deleteReport endpoint', () => {
    
    test("POST /deleteReport - success", () => {
        return request(app)
        .post('/deleteReport')
        .send({"scanname": "dnsscan",
             "timedate": "2021-01-24T11:18:06.946Z",
             "parameters": [["A"]],
             "hostname": "google.com"})
        .expect(200);
    });


    test("POST /deleteReport - JSON content-type", () => {
        return request(app)
        .post('/deleteReport')
        .send({"scanname": "dnsscan",
             "timedate": "2021-01-24T11:18:06.946Z",
             "parameters": [["A"]],
             "hostname": "google.com"})
        .expect('Content-type', /json/);
    });


    test("POST /deleteReport - not enough parameters", () => {
        return request(app)
        .post('/deleteReport')
        .send({
            "host": "google.com",
            "scanType": "dnsscan"
        })
        .expect(400);
    });

    test("POST /deleteReport - empty parameters", () => {
        return request(app)
        .post('/deleteReport')
        .send({})
        .expect(400);
    });

    test("POST /deleteReport - too many parameters", () => {
        return request(app)
        .post('/deleteReport')
        .send({"scanname": "dnsscan",
        "timedate": "something",
        "parameters": "somethingElse",
        "hostname": "google.com",
        "extraParam": "sup"})
        .expect(400);
    });


    test("POST /deleteReport - correct parameter keys + incorrect values", () => {
        return request(app)
        .post('/deleteReport')
        .send({"scanname": "dnsscan",
             "timedate": "something",
             "parameters": "somethingElse",
             "hostname": "google.com"})
        .expect(200);
    });

    test("POST /deleteReport - correct parameter keys + correct values", () => {
        return request(app)
        .post('/deleteReport')
        .send({"scanname": "dnsscan",
             "timedate": "2021-01-24T11:18:06.946Z",
             "parameters": [["AAAA"]],
             "hostname": "google.com"})
        .expect(200);
    })

})







// runningScans

// finishedScans

// networkScanner