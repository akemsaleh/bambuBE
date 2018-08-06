/*
*
* Author      : Muhammad Hakim Saleh
* Version     : v0.0.1
* File        : index.js
* Description : Main script for the project
*
*/

const path = require("path");
const express = require("express");
const bodyParser =  require("body-parser");

const app = express();
const setting = require("./config.json");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


const defaultPage = function(req,res){
   res.send("Bambulife BE Engineer Test");
};

app.use("/api",require("./api")(setting));
app.get("/",defaultPage);

app.listen(setting.port,function(){
   console.log(`Server listening to port ${setting.port}`);
});
