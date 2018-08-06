/*
*
* Author      : Muhammad Hakim Saleh
* Version     : v0.0.1
* File        : api.js
* Description : Router API for profile processing
*
*/
const express = require("express");
const MongoClient = require('mongodb').MongoClient;

module.exports = function(dependencies){
   const router  = express.Router();
   const url     = dependencies.url;

/*
*  Function: computeScore
*  Parameter: userData : contains information about user profile and answer selection
*             res      : response object to send back respond to client
*             conn     : MongoDB connection from caller function
*  Description: Compute User Profile after record is saved or user profile being queried
*/
   const computeScore = function(userData,res,conn){
      let client,scoreMap;
   // Get scoring info from question table

      client = conn.db(dependencies.db);
      client.collection("questions").find({}).toArray()
      .then(function(data){
         let scoreMap  = {};
         let userScore = 0;
         let userProfile = "D";
         data.forEach(obj=>{
            scoreMap[`q${obj.nbr}`] = {};
            obj.answer.forEach(answer=>{
               scoreMap[`q${obj.nbr}`][`${answer.value}`] = answer.score;
            }); 
         });

         userData.answer.forEach((answer,idx)=>{
            userScore += scoreMap[`q${idx+1}`][`${answer}`];
         });

         if (userScore >= 4){ userProfile = "C"; }        
         if (userScore >= 6){ userProfile = "B"; }        
         if (userScore >= 8){ userProfile = "A"; }

         conn.close();
         res.json({
            "name":userData.name,
            "profile":userProfile
         });
         
      })
      .catch(function(err){
         if (conn){
            conn.close();
         }
         return res.status(500).json({ "error": true,"msg":err });
      });  
   };

/*
*  Function: getQuestions
*  Parameter: req  : request object from client
*             res  : response object to send back respond to client
*  Description: Retrieve all questions
*/
   const getQuestions = function(req,res){
      let client,conn;
   // Get scoring info from question table

      MongoClient.connect(url)
      .then(function(db){
         conn = db;
         client = conn.db(dependencies.db);
         return client.collection("questions").find({}).toArray();
      })
      .then(function(data){
         let retVal = data.map((obj)=>{
            return {
               "id":`q${obj.nbr}`,
               "question":obj.question,
                "answer":obj.answer.map(answer=>answer.value)
            }
         });
         console.log(retVal);
         res.json(retVal);
      })
      .catch(function(err){
         if (conn){
            conn.close();
         }
         return res.status(500).json({ "error": true,"msg":err });
      });       
   };

/*
*  Function: saveUserProfile
*  Parameter: req  : request object from client
*             res  : response object to send back respond to client
*  Description: Save user profile into database. Existing data will be overwrite. Require POST method from client
*/
   const saveUserProfile = function(req,res){
      let client,conn,cont;
      const questionCount = dependencies.questionCount;
      cont = true;
      for (let i=1; i<= questionCount; i++){
         if (!req.body[`q${i}`]){ cont = false }
      }

      if (req.body.user && cont){
         let userData = {
            "name":req.body.user,
            "answer":[]
         };

         for (let i=1; i<= questionCount; i++){
            userData.answer.push(req.body[`q${i}`]);
         }

         MongoClient.connect(url)
         .then(function(db){
            conn = db;
            client = conn.db(dependencies.db);
            return client.collection("profile").findOneAndReplace({"name":userData.name},userData,{"upsert":true,"returnNewDocument":true});
         })
         .then(function(result){            
            computeScore(userData,res,conn);  
         })
         .catch(function(err){
            if (conn){
               conn.close();
            }
            return res.status(500).json({ "error": true,"msg":err });
         });  
      }
      else{
         res.status(500).json({"msg":"Unable to save. Incomplete Record"});
      }
   };

/*
*  Function: getUserProfile
*  Parameter: req  : request object from client
*             res  : response object to send back respond to client
*  Description: Retrieve user profile from database.
*/
   const getUserProfile = function(req,res){
      const user = req.params.user;
      let client,conn;
      MongoClient.connect(url)
      .then(function(db){
         conn = db;
         client = conn.db(dependencies.db);
         return client.collection("profile").findOne({"name":user});
      })
      .then(function(result){
         if (result){
            computeScore(result,res,conn); 
         }
         else{
            return res.status(500).json({ "msg":"Invalid User" });
         }
      })
      .catch(function(err){
         if (conn){
            conn.close();
            return res.status(500).json({ "msg":"Invalid User" });
         }
      });      
   };   

   router.post("/saveUserProfile",saveUserProfile);
   router.get("/getUserProfile/:user",getUserProfile);
   router.get("/getQuestions/",getQuestions);
   return router;
};

