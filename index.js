const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mysql = require('mysql');
const nodemailer = require('nodemailer');
var hbs = require('nodemailer-express-handlebars');
var firebase = require('firebase/app');
require('firebase/auth');
require('firebase/database');
var cors = require('cors');


  var firebaseConfig = {
    apiKey: "null",
    authDomain: "rapid-sms.firebaseapp.com",
    databaseURL: "https://rapid-sms.firebaseio.com",
    projectId: "rapid-sms",
    storageBucket: "rapid-sms.appspot.com",
    messagingSenderId: "null",
    appId: "1:null:web:nul",
    measurementId: "G-null"
  };

    firebase.initializeApp(firebaseConfig);

function sendSMS(code, tel) {

    tel = tel.toString();
    if(tel.length==9){
      tel = 0+tel;
    }

 var id = Math.random().toString(36).substring(2, 4) + Math.random().toString(36).substring(2, 4); // Generate random id to notify sms service

 firebase.database().ref('info').set({
    id: id,
    msg: code,
    tel: tel  
  });

}



var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'null@gmail.com',
    pass: 'null'
  }
});


var handlebarsOptions = {
  viewEngine: {
      extName: '.hbs',
      partialsDir: './template/',
      layoutsDir: './template/',
      defaultLayout: '',
  },
  viewPath: './template/',
  extName: '.hbs'
}

transporter.use('compile', hbs(handlebarsOptions));

function sendEmail(userEmail,username) {

var mailOptions = {
  from: 'null@gmail.com',
  to: userEmail,
  subject: 'Confirmer votre Adresse-email',
  template: 'confirmation',
  context: {
    username: username,
  }
};

transporter.sendMail(mailOptions, function(error, info){
  if (error) {
    console.log(error);
  } else {
    console.log('Email sent: ' + info.response);
  }
});

}
// parse application/json
app.use(bodyParser.json());
 
//create database connection
const conn = mysql.createConnection({
  multipleStatements: true,
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'null'
});
 
//connect to database
conn.connect((err) =>{
  if(err) throw err;
  console.log('Mysql Connected...');
});

// login  _____________________________________________________________________________________________________________


// registration  _____________________________________________________________________________________________________________
 




app.post('/api/setFavorite',(req, res) => {

    let getItems = "SELECT favorite FROM users WHERE email_address='"+req.body.email_address+"'";
    let items; // all items to add
    let itemID = req.body.id.toString();
    if (itemID=== undefined) {
        itemID = '1';
      }
    let getItemsQuery = conn.query(getItems,(err, results) => {
            console.log(req.body.email_address);
      console.log(results);
    let favoriteItems = results[0].favorite; 
    if(err) throw err;

    if (results.length==1) {

    if(favoriteItems!=null && favoriteItems!='' ){
    
    favoriteItems = results[0].favorite.split(',');    // split and convert to array
          let isFavorite = favoriteItems.includes(itemID);         
    if (isFavorite) {                                             // if item do exist then remove
          favoriteItems.splice( favoriteItems.indexOf(itemID), 1 );    // search and remove item
          favoriteItems = favoriteItems.toString();
          console.log(favoriteItems);
          items = favoriteItems;
    }

    if (!isFavorite) { 
              console.log(favoriteItems);                                       
    items = favoriteItems+','+itemID;
    }
    }

    

    let setItems = "UPDATE users SET favorite='"+items+"' WHERE email_address='"+req.body.email_address+"'";
    let updateItems = conn.query(setItems,(err, results) => {
    if(err) throw err;
          res.send(JSON.stringify({"status": 200}));
    })
}
    });
});



    app.post('/api/getFavorite',(req, res) => {
    console.log('getFavorite email : ' + req.body.email_address);                          

    let getItems = "SELECT favorite FROM users WHERE email_address='"+req.body.email_address+"'";
    let query = conn.query(getItems, (err, results) => {
    if(err) throw err;
    console.log(results[0].favorite);

  if (results.length==1) {
  if(results[0].favorite!=null){

    var favoriteItems = results[0].favorite.toString();  
    let itemsID = results[0].favorite.split(',');    // split and convert to array

    let favorites = "SELECT * FROM offres WHERE id IN ("+favoriteItems+")";
    let getItemsQuery = conn.query(favorites,(err, results) => {
    if(err) throw err;
          res.send(JSON.stringify({"status": 200, 'response': results, "itemsID": itemsID}));
    })
  }
  }
  else{
    res.send(JSON.stringify({"status": 400, "error": 'no_items'}));
  }
});
});
 

app.use(cors());


app.get('/api/getOffres',(req, res) => {

  let sql = "SELECT * FROM offres"
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "data": results}));
  });
});



app.post('/api/addOffre',(req, res) => {

  if(req.body.form.infructueux==true){req.body.form.infructueux=1} else {req.body.form.infructueux=0}
  if(req.body.form.type=="Appels d'offres"){req.body.form.type=1} else {req.body.form.type=0}
    req.body.form.date_limite = req.body.form.date_limite.substring(0, 10);
    req.body.form.date_parution = req.body.form.date_parution.substring(0, 10);

    console.log(req.body.form);
    let data = {titre: req.body.form.titre, description: req.body.form.description, wilaya: req.body.form.wilaya, date_parution: req.body.form.date_parution, date_limite: req.body.form.date_limite, url: req.body.form.url, url_infructuosite: req.body.form.url_infructuosite, type: req.body.form.type, infructueux: req.body.form.infructueux};
    let sql = "INSERT INTO offres SET ?";

    let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null}));
  });
});


app.post('/api/deleteOffre',(req, res) => {

// delete all selected offres
  req.body.data.forEach(element => {

  console.log('element id = '+ element.id);
  let sql = "DELETE FROM offres WHERE id="+element.id
  let query = conn.query(sql, (err, results) => {
    if(err) throw err;
  });
});
    res.send(JSON.stringify({"status": 200, "error": null}));
});


app.post('/api/updateOffre',(req, res) => {
  
  if(req.body.form.infructueux==true){req.body.form.infructueux=1} else {req.body.form.infructueux=0}
  if(req.body.form.type=="Appels d'offres"){req.body.form.type=1} else {req.body.form.type=0}
    req.body.form.date_limite = req.body.form.date_limite.substring(0, 10);
    req.body.form.date_parution = req.body.form.date_parution.substring(0, 10);

    let data = {titre: req.body.form.titre, description: req.body.form.description, wilaya: req.body.form.wilaya, date_parution: req.body.form.date_parution, date_limite: req.body.form.date_limite, url: req.body.form.url, url_infructuosite: req.body.form.url_infructuosite, type: req.body.form.type, infructueux: req.body.form.infructueux};
    let sql = "UPDATE offres SET ? WHERE id="+req.body.form.id;
    let query = conn.query(sql, data,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null}));
  });
});



app.post('/api/adminlogin',(req, res) => {

    let info=[req.body.info.username];
    console.log(info)
    let check = "SELECT * FROM admins WHERE username= ?";
    let query = conn.query(check, info,(err, results) => {
    if(err) throw err;
    if(results.length == 1){
    res.send(JSON.stringify({"status": 200, "error": null, "info": results}));
    }
    else {
    res.send(JSON.stringify({"error": 404}));
    }
  });
});


app.post('/api/getid',(req, res) => {
  
  let email=[req.body.email];
  let sql = "SELECT id,survey FROM users WHERE email_address=  ?"
  let query = conn.query(sql, email,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "results": results}));
  });
});


app.post('/api/submitSurvey',(req, res) => {
  let insert;
  let id=[req.body.id];
  let get = "SELECT userID FROM survey WHERE userID = ?";
  let getQuery = conn.query(get, id,(err, results) => {
    if(err) throw err;
      console.log(results.length);

    if(results.length==1){
    insert = "UPDATE survey SET ? WHERE userID = ?";
    let review = {userID: req.body.id, service: req.body.review.service, costs: req.body.review.costs, suggestion: req.body.review.suggestion};
    let insertQuery = conn.query(insert, review,(err, results) => {
    if(err) throw err;
    });

    updateSurvey = "UPDATE users SET survey=1 WHERE id = ?";
    let updateSurveyState = conn.query(updateSurvey, id,(err, results) => {
    if(err) throw err;
  });

    }
    else {
    insert = "INSERT INTO survey SET ?";
    let review = {userID: req.body.id, service: req.body.review.service, costs: req.body.review.costs, suggestion: req.body.review.suggestion};
    let insertQuery = conn.query(insert, review,(err, results) => {
    if(err) throw err;
  });

    updateSurvey = "UPDATE users SET survey=1 WHERE id = ?";
    let updateSurveyState = conn.query(updateSurvey, id,(err, results) => {
    if(err) throw err;
  });
    }
  });
});


app.post('/api/getStats',(req, res) => {
  
let suggestions = "SELECT suggestion, timestamp, id FROM survey WHERE suggestion!=''";
let sql =`
SET @total_users = (SELECT id FROM users ORDER BY id DESC LIMIT 1);
SET @surveys = (SELECT COUNT( * ) FROM survey);
SET @used_tokens = (SELECT COUNT( * ) FROM tokens WHERE state=1);
SET @total_offres = (SELECT COUNT( * ) FROM offres WHERE type=1);
SET @offres_infructueux = (SELECT COUNT( * ) FROM offres WHERE infructueux=1);
SET @total_consultations = (SELECT COUNT( * ) FROM offres WHERE type=1); 
SET @service = (SELECT AVG(service) FROM survey); 
SET @cost = (SELECT AVG(costs) FROM survey);
SELECT @total_users AS total_users, @surveys AS surveys, @used_tokens AS used_tokens, @total_offres AS total_offres, @offres_infructueux AS offres_infructueux, @total_consultations AS total_consultations, @service AS service, @cost AS cost`;
  let query = conn.query(sql,(err, stats) => {
    if(err) throw err;

 let query = conn.query(suggestions,(err, suggestions) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "stats": stats, "suggestions": suggestions}));
  });
 });
});



//Server listening
let port = 3002
app.listen(port,() =>{
  console.log('Server started on port '+port+'...');
});