const express = require('express');
const session = require('express-session');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./key.json');
const app = express();

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

var passwordHash = require('password-hash');


// Initialize Firebase
initializeApp({
    credential: cert(serviceAccount)
});
const db = getFirestore();
app.set("view engine","ejs");

app.use(express.static('public'));

// Generate a random secret key
const generateSecretKey = () => {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
};

const actualSecretKey = generateSecretKey();
app.use(session({
    secret: actualSecretKey,
    resave: false,
    saveUninitialized: true
}));

// Serve static files from a directory (e.g., HTML files)
app.use(express.static(__dirname));



// LOGIN PAGE
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/log.html');
});  

app.post('/signin_verify', function(req, res) {
    var inputData = req.body;
    var name = inputData.Name;
    var roll = inputData.roll;
    var email = inputData.email;
    var password = passwordHash.generate(inputData.password1);
    var hostel = inputData.hostel;
    var room = inputData.room;
    
    // Check if the email is already present in the Firestore collection
    db.collection('bbsdf')
        .get()
        .then((querySnapshot) => {
             
                // Email is not present, add data to the Firestore collection
                db.collection('bbsdf')
                    .add({
                        
                    })
                    .then((docRef) => {
                        console.log('Document written with ID: ', docRef.id);
                        res.render('signin_success', {});
                    })
                    .catch((error) => {
                        console.error('Error adding document: ', error);
                        res.status(500).send('An error occurred while adding the document.');
                    });
            
        })
        .catch((error) => {
            console.error('Error checking for existing email: ', error);
            res.status(500).send('An error occurred while checking for existing email.');
        });
});


app.get('/suc', function(req, res) {
    res.sendFile(__dirname + '/suc.html');
});  

app.get('/a', function(req, res) {
    res.sendFile(__dirname + '/a.html');
}); 


// USER LOGIN ROUTE
app.post('/user_login', function (req, res, next) {
    const email = req.body.email;
    const password = req.body.password;
    db.collection('complaint')
      .where('Email', '==', email)
      .get()
      .then((docs) => {
        if (docs.empty) {
          return Promise.reject('Please Signin to continue'); // Reject with an error message
        }
        const user = docs.docs[0].data();
        // Verify the password
        if (passwordHash.verify(password, user.Password)) {
          // Password is correct, set session variables
          req.session.email = user.Email;
          req.session.name = user.Name;
          req.session.password = user.Password;
          kmail = user.Email;
          kame = user.Name;
          kassword = user.Password;

          // Continue with retrieving complaints or other actions
          const complaintPromises = docs.docs.map((doc) => {
            return doc.ref
              .collection('Complaint')
              .get()
              .then((each) => {
                const complaints = each.docs.map((complaintDoc) => {
                  return complaintDoc.data().Complaint;
                });
                return complaints;
              });
          });

          return Promise.all(complaintPromises);
        } else {
          return Promise.reject('Incorrect Password'); // Reject with an error message
        }
      })
      .then((complaintsData) => {
        complaintsArray = complaintsData.flat(); // Update the global variable

        // After setting kmail and kame, redirect to '/index'
        res.redirect('/index');
      })
      .catch((error) => {
        console.error('Error:', error);

        // Send the error response here
        res.status(500).send(error); // Send the error message as the response
      });
});



// USER LOGIN PAGE ROUTES

