/*
*
* Author      : Muhammad Hakim Saleh
* Version     : v0.0.1
* File        : create.js
* Description : Initialize MongoDB Database to create collections and indexes
*
*/
"use strict";

const MongoClient = require("mongodb").MongoClient;

const setting = require("./config.json");
const url = setting.url;

let client,conn;

// Create Connection
MongoClient.connect(url)
.then(function(db){
   conn = db;
   client = conn.db(setting.db);

// Create Collection
   return Promise.all([
      client.createCollection("profile"),
      client.createCollection("questions")
   ]);
})
.then(function(res){
   console.log("collections created");

// Create Unique Index for profile
   return client.collection("profile").createIndex("name",{"unique":true,"name":"profile_name"});
})
.then(function(res){
   console.log("collection indexed");

// Insert default questions
   return client.collection("questions").insertMany([
      {"nbr":"1","question":"Savings Amount","answer":[{"value":0,"score":1},{"value":2000,"score":2},{"value":4000,"score":3},{"value":6000,"score":4},{"value":8000,"score":5}]},
      {"nbr":"2","question":"Loan Amount","answer":[{"value":0,"score":5},{"value":2000,"score":4},{"value":4000,"score":3},{"value":6000,"score":2},{"value":8000,"score":1}]}
   ]);
})
.then(function(res){
   console.log("Record(s) inserted",res.insertedCount);
   conn.close();
})
.catch(function(err){
   console.log("got error",err);
   if (conn){
      conn.close();
   }
});
