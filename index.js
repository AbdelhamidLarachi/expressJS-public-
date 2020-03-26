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
    apiKey: "AIzaSyCJspcGFWTVoMurYiq5F7nh4O3K57iT6dM",
    authDomain: "rapid-sms.firebaseapp.com",
    databaseURL: "https://rapid-sms.firebaseio.com",
    projectId: "rapid-sms",
    storageBucket: "rapid-sms.appspot.com",
    messagingSenderId: "235969149846",
    appId: "1:235969149846:web:d824d6ffaea450d1d03bb7",
    measurementId: "G-1JFTH3PD9V"
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
    user: 'feelmystyle711@gmail.com',
    pass: 'Larachi711Youtube'
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
  from: 'feelmystyle711@gmail.com',
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
  database: 'offres_telecom'
});
 
//connect to database
conn.connect((err) =>{
  if(err) throw err;
  console.log('Mysql Connected...');
});

// login  _____________________________________________________________________________________________________________


app.post('/api/login',(req, res) => {
  let email_check = "SELECT email_address FROM users WHERE email_address='"+req.body.email_address+"'";
  let pswd_match = "SELECT * FROM users WHERE email_address='"+req.body.email_address+"' AND pswd ='"+req.body.password+"'";

  let mail_query = conn.query(email_check,(err, results) => {
    if(err) throw err;
    if (results.length == 0){
          res.send(JSON.stringify({"status": 301, "header": "Verifier vos informations", "error": "Cet adresse e-mail n'existe pas!"}));
    }
    else {
        let pswd_query = conn.query(pswd_match,(err, results) => {
              if(err) throw err;
              if (results.length == 0){
          res.send(JSON.stringify({"status": 301, "header": "Verifier vos informations", "error": "Mot de passe incorrect!"}));
    }
    else {
    	      if (results[0].subscription_length>0){
    	      	 res.send(JSON.stringify({"status": 200, "error": null, "message": 'logged_in', "response": results}));
}
else {
          res.send(JSON.stringify({"status": 300, "header": "Abonnement Expiré", "error": "Vous devez recharcher votre abonnement!"}));

}
    }

});
    }
  });
});
 


// registration  _____________________________________________________________________________________________________________

 
 app.post('/api/register',(req, res) => {


  let get_token = "SELECT * FROM tokens WHERE token='"+req.body.voucher+"'";
  let email_check = "SELECT email_address FROM users WHERE email_address='"+req.body.email_address+"'";

  let mail_query = conn.query(email_check,(err, results) => {
    if(err) throw err;
    if (results.length > 0){
          res.send(JSON.stringify({"error": 400, "header": "Adresse-email déja utilisé!", "body": "Avez-vous déja un compte?"}));
    }
   
else {
let get_token_query = conn.query(get_token,(err, results) => {
    if(err) throw err;

if (results.length <= 0){
          res.send(JSON.stringify({"error": 303, "header": 'Voucher Incorrect', "body": "Vous devez entrer un voucher valide afin de s'inscrire!"}));
      }
 else if (results.length > 0){
      if (results[0].state==1){
          res.send(JSON.stringify({"error": 304, "header": 'Voucher Expiré', "body": "Ce voucher a été expiré ou déja utilisé!"}));
      }
      if (results[0].state==0){

    let sql = "UPDATE tokens SET state="+1+" WHERE token='"+req.body.voucher+"'";
    let query = conn.query(sql, (err) => {
    if(err) throw err;
  });

    let token_length = results[0].length;
    let data = {username: req.body.username, fonction: req.body.fonction, organisation: req.body.organisation, tel: req.body.tel, email_address: req.body.email_address, pswd: req.body.password, subscription_length: token_length};
    let insert_data = "INSERT INTO users SET ?";
    let insert_data_query = conn.query(insert_data, data,(err, results) => {
    if(err) throw err;
          sendEmail(req.body.email_address, req.body.username);
          res.send(JSON.stringify({"status": 200, "error": null, "length": token_length, "message": 'User_registred!', "response": results}));
  });

}
}

});
}
    })

});


app.post('/api/checkMail',(req, res) => {

  let email_check = "SELECT email_address FROM users WHERE email_address='"+req.body.email_address+"'";

  let mail_query = conn.query(email_check,(err, results) => {
    if(err) throw err;
    if (results.length > 0){
          res.send(JSON.stringify({"status": 400}));
    }
   
else {
          res.send(JSON.stringify({"status": 200}));

}
    })
});
    


 app.post('/api/sendSMS',(req) => {

  var vkey = Math.random().toString(36).substring(2, 5) + Math.random().toString(36).substring(2, 5); // Generate vkey
  let get_last_vkey = "SELECT vkey FROM users WHERE tel='"+req.body.tel+"' AND vkey IS NOT NULL";
  let requestSMS = "UPDATE users SET vkey='"+vkey+"', verified="+0+" WHERE tel='"+req.body.tel+"' OR email_address='"+req.body.email+"'";

if (req.body.newKey) {

  let requestSMSQuery = conn.query(requestSMS,(err, results) => {
    if(err) throw err;
        sendSMS(vkey, req.body.tel);
     })
}
else {

 let vkeyQuery = conn.query(get_last_vkey,(err, results) => {
    if(err) throw err;
    if (results.length > 0){
        sendSMS(results[0].vkey, req.body.tel);
    }
   
else {

  let requestSMSQuery = conn.query(requestSMS,(err, results) => {
    if(err) throw err;
        sendSMS(vkey, req.body.tel);
     })
    }
  })

}

});




app.post('/api/verify',(req, res) => {
  let vkey_check = "SELECT email_address FROM users WHERE vkey='"+req.body.vkey+"'";
  var email_verify;


  if (req.body.newPhone!=null) {
      email_verify = "UPDATE users SET verified="+1+", tel='"+req.body.newPhone+"' WHERE vkey='"+req.body.vkey+"'";
  }
  else {
      email_verify = "UPDATE users SET verified="+1+" WHERE vkey='"+req.body.vkey+"'";
  }

  let vkey_check_query = conn.query(vkey_check,(err, results) => {
    if(err) throw err;
if (results.length > 0){
  let email_verify_query = conn.query(email_verify,(err, results) => {
    if(err) throw err;
          res.send(JSON.stringify({"status": 200}));
    })
}
    else {
          res.send(JSON.stringify({"status": 400}));

    }
    })
});


app.post('/api/checkSentCode',(req, res) => {
   let info=[req.body.tel, req.body.vkey];
   let sql = "SELECT tel, vkey FROM offres WHERE tel = ? AND vkey = ?"
   let query = conn.query(sql, info, (err, results) => {
    if(err) throw err;
    if(results.length>0){
    res.send(JSON.stringify({"status": 200, "error": null}));
    }
else {
    res.send(JSON.stringify({"status": 404, "error": 'code incorrect'}));
    }
  });
});
 

app.post('/api/subscribtion',(req, res) => {
  let subscribtion_length = "SELECT subscription_length, tel FROM users WHERE email_address='"+req.body.email_address+"'";

  let subscribtion_length_query = conn.query(subscribtion_length,(err, results) => {
    if(err) throw err;
    if (results[0].subscription_length > 0){
          res.send(JSON.stringify({"status": 200, "length": results[0].subscription_length, "tel": results[0].tel}));
    }
else {
          res.send(JSON.stringify({"status": 400}));

}
    })
});

app.post('/api/recharge',(req, res) => {
    let get_token = "SELECT * FROM tokens WHERE token='"+req.body.voucher+"'";


  let get_token_query = conn.query(get_token,(err, results) => {
    if(err) throw err;

    if (results.length>0){
    let tokenLength = results[0].length;

    if (results[0].state==0){          // success

    let use_token = "UPDATE tokens SET state="+1+" WHERE token='"+req.body.voucher+"'";
    let use_token_query = conn.query(use_token,(err, results) => {
    if(err) throw err;
    })

    let getTokenLength = "SELECT subscription_length FROM users WHERE email_address='"+req.body.email_address+"'";

    let getTokenLength_query = conn.query(getTokenLength,(err, results) => {
    if(err) throw err;
    let sub_length = tokenLength + results[0].subscription_length;
    let extend_sub = "UPDATE users SET subscription_length="+sub_length+" WHERE email_address='"+req.body.email_address+"'";
    let extend_sub_query = conn.query(extend_sub,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, 'error': null}));
    })    
  })
}

else {         // used token
    res.send(JSON.stringify({"error": 401, "header": 'Voucher Expiré', "error_description": "Ce voucher a été expiré ou déja utilisé!"}));

}
}
    else if (results.length==0){         // incorrect token
    res.send(JSON.stringify({"error": 301, "header": 'Voucher Incorrect', "error_description": "Vous devez entrer un voucher valide!"}));

}
    })
});





app.post('/api/setPassword',(req, res) => {
  console.log(req.body.tel)
      let setPassword = "UPDATE users SET pswd='"+req.body.newPassword+"' WHERE email_address='"+req.body.email_address+"' AND pswd='"+req.body.oldPassword+"'";
  
  if(req.body.tel!=null && req.body.tel != undefined && req.body.tel != ''){
    setPassword = "UPDATE users SET pswd='"+req.body.newPassword+"' WHERE tel="+req.body.tel;
}

  let updateQuery = conn.query(setPassword,(err, results) => {
      console.log(setPassword)
    if(err) throw err;
          res.send(JSON.stringify({"status": 200}));
    })
});




app.post('/api/setFavorite',(req, res) => {
              console.log('setFavorite email : ' + req.body.email_address);                                 

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
        console.log('toString');
    var favoriteItems = results[0].favorite.toString();  
            console.log('to Split');
    let itemsID = results[0].favorite.split(',');    // split and convert to array

    let favorites = "SELECT * FROM offres WHERE id IN ("+favoriteItems+")";
    let getItemsQuery = conn.query(favorites,(err, results) => {
    if(err) throw err;
    console.log('offre ID is :' + results[0].id);
          res.send(JSON.stringify({"status": 200, 'response': results, "itemsID": itemsID}));
    })
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
  
  console.log('user email from getid = ' + req.body.email);
  let email=[req.body.email];
  let sql = "SELECT id,survey FROM users WHERE email_address=?"
  let query = conn.query(sql, email,(err, results) => {
    if(err) throw err;
    res.send(JSON.stringify({"status": 200, "error": null, "results": results}));
  });
});


app.post('/api/submitSurvey',(req, res) => {
  let insert;
  let get = "SELECT userID FROM survey WHERE userID="+req.body.id;
  let getQuery = conn.query(get,(err, results) => {
    if(err) throw err;
      console.log(results.length);

    if(results.length==1){
    insert = "UPDATE survey SET ? WHERE userID="+req.body.id;
    let review = {userID: req.body.id, service: req.body.review.service, costs: req.body.review.costs, suggestion: req.body.review.suggestion};
    let insertQuery = conn.query(insert, review,(err, results) => {
    if(err) throw err;
    });

    let id=[req.body.id];
    updateSurvey = "UPDATE users SET survey=1 WHERE id=?";
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

    let id=[req.body.id];
    updateSurvey = "UPDATE users SET survey=1 WHERE id=?";
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