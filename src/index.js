// For setup: npm install pg
// Install heroku for db access


const express = require('express')
const app = express()
const port = 8000

const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:3000',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    credentials: true
}));

// app.options('*', cors({
//   origin: 'http://localhost:3000'
// }))

const { getError } = require('./error.js');

var Mutex = require('async-mutex').Mutex;

const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
app.use(cookieParser());

var crypto = require("crypto");


// Connecting to Heroku server
// ----------------------------

const { Pool, Client } = require("pg");

const credentials = {
  user: "hfmzrrdpbaplzk",
  host: "ec2-44-206-204-65.compute-1.amazonaws.com",
  database: "d10ror0sgbld5e",
  password: "609028af0da480bf9c1a6f6d2d8ad479821a0ed3fd5060a78720c060971f3e7b",
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  }
};

// // Connect with a connection pool.

// async function poolDemo() {
//   const pool = new Pool(credentials);
//   const now = await pool.query("SELECT NOW()");
//   await pool.end();

//   return now;
// }

// // Connect with a client.

// async function clientDemo() {
//   const client = new Client(credentials);
//   await client.connect();
//   const now = await client.query("SELECT NOW()");
//   await client.end();

//   return now;
// }

// // CRUD functions

async function newUser(user, pool) {
  const text = `
    INSERT INTO A_USER (ID, NICKNAME, FULLNAME, AGE)
    VALUES ($1, $2, $3, $4)
    RETURNING ID
    `;
  const values = [user.id, user.nickname, user.fullname, user.age];
  return pool.query(text, values);
}

// async function getUser(userId, pool) {
//   const text = `SELECT * FROM A_USER WHERE id = $1`;
//   const values = [userId];
//   return pool.query(text, values);
// }


// // We do not need updatePerson details yet ----

// // async function updatePersonName(personId, fullname, pool) {
// //   const text = `UPDATE people SET fullname = $2 WHERE id = $1`;
// //   const values = [personId, fullname];
// //   return pool.query(text, values);
// // }

// async function removeUser(userId, pool) {
//   const text = `DELETE FROM people WHERE id = $1`;
//   const values = [userId];
//   return pool.query(text, values);
// }


// // Use a self-calling function so we can use async / await.

// (async () => {
//   const poolResult = await poolDemo();
//   console.log("Time with pool: " + poolResult.rows[0]["now"]);

//   const clientResult = await clientDemo();
//   console.log("Time with client: " + clientResult.rows[0]["now"]);

//   const pool = new Pool(credentials);

//     // Register a new user and get an id, which comes from the RETURNING clause
//   const registerResult = await newUser({
//       id: "3",
//       nickname: "Avenger",
//       fullname: "John Doe",
//       age: "30",
//     }, pool);
    
//     const userId = registerResult.rows[0]["id"];
//     console.log("Registered a user with id: " + userId);
  
//     await pool.end();
// })();

async function getUserCount(pool) {
  const text = `SELECT COUNT(*) FROM A_USER`;
  const values = [];
  return pool.query(text, values);
}

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(express.json());
//app.use(bodyParser.urlencoded({ extended: true }))

const fs = require('fs');

const ImageDataURI = require('image-data-uri');
const filePath = 'misc/data.png';
const frontendURL = 'some-link';

const JWT_SECRET_KEY = 'wh34ryn394r8c7ry802n39urc820r-un289r2cyr2y3r9c23r2u3kwodk3urgqqq]h9e93220fwdmwdwbfe980231nmz00qskzzvvbnex8rnsxq[mqqmkv9iww0';

// these state variables represent where each player is at. 
var state1 = 0;
var state2 = 0;

// qr ids
var qr_id1 = '';
var qr_id2 = '';

// user_id
var user_id1 = '';
var user_id2 = '';

// user passes
var pass1 = '';
var pass2 = '';

var first = true;

const QRmutex = new Mutex(); // creates a shared mutex instance
const startMutex = new Mutex();

function hasGameStarted() {
  return ((state1 > 0) && (state2 > 0));
};

function isSlotTaken(QRId) {
  if (QRId === qr_id1) {
    if (state1) {
      return true;
    }
  } else {
    if (state2) {
      return true;
    }
  }
  return false;
};

function setState(QRId) {
  if (QRId === qr_id1) {
    state1 += 1;
  } else {
    state2 += 1;
  }
};

function setPass(QRId, userPass){
  if (QRId === qr_id1) {
    pass1 = userPass;
  } else {
    pass2 = userPass;
  }
}

function getRandomStringId() {
  return crypto.randomBytes(20).toString('hex');
};

function doesNotMatchExistingIds(qr_id) {
  return ((qr_id != qr_id1) && (qr_id != qr_id2));
};

// function passNotInSession(pass1, pass2) {
//   return (())
// }

// Link to OpenCV
// --------------

app.get('/QR', async (req, res) => {
  console.log('in QR get');
  if (hasGameStarted()) {
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E001'));
  } else {
    // const pool = new Pool(credentials);
    // const count = await getUserCount(pool);
    // var id = parseInt(count.rows[0].count);

    var qr_id = '';
    const release = await QRmutex.acquire(); // acquires access to the critical path
    if (!first) {
      first = true;
      qr_id2 = getRandomStringId();
      qr_id = qr_id2;
    } else {
      first = false;
      qr_id1 = getRandomStringId();
      qr_id = qr_id1;
    }
    release();

    finalURL = frontendURL + '?id=' + String(qr_id);
    result = {url : finalURL};
    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(result);
  }
})

// Link to Frontend
// ----------------

app.get('/auth', (req, res) => {
  console.log('in auth GET');
  const token = req.cookies.pass_token;
  if (!token) {       // if token doesn't exist
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;

    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('pass is not the same');
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E004'));  // E004: ID is wrong
    }

    //Incrementing states of user
    if (pass == pass1) {
      console.log('pass 1 matched');
      state1 += 1;
    }
    else if (pass == pass2) {
      console.log('pass 2 matched');
      state2 += 1;
    }

    return res
    .status(200)
    .setHeader('Access-Control-Allow-Credentials', true)
    .json({message: 'all gucci fam'});
    // Almost done
  } catch {
      return res.sendStatus(400);
    }
});

app.get('/authState', async (req, res) => {
  const token = req.cookies.pass_token;
  if (!token) {       // if token doesn't exist
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E004'));  // E004: ID is wrong
    }
    
    //Setting and incrementing states of user
    if (pass == pass1) {
      state1 += 1;
      currState = state1;
      otherState = state2;
    }
    else if (pass == pass2) {
      state2 += 1;
      currState = state2;
      otherState = state1;
    }


    if (currState > otherState) {     // waiting page
      return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E005'));      // E005: Waiting on other player
    }
    // token AND state correct
    return res
    .status(200)
    .setHeader('Access-Control-Allow-Credentials', true)
    .json({ message: 'all gucci fam' });
    
    

  } catch {
      return res.sendStatus(403);
    }
});

app.get('/start', async (req, res) => {
  console.log('in QR get');
  // if (hasGameStarted()) {
  //   return res
  //     .status(400)
  //     .json(getError('E001'));
  // }
  try {
    if (!req.query.id) {
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E002'));
    }

    const release = await startMutex.acquire();
    providedId = String(req.query.id);
    if (doesNotMatchExistingIds(providedId)) {
      release();
      return res
      .status(401)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E004'));
    }
    if (isSlotTaken(providedId)) {
      release();
      return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E001'));
    }
    setState(providedId);
    release();

    const userPass = getRandomStringId();
    setPass(providedId, userPass);
    const token = jwt.sign({ pass: userPass }, JWT_SECRET_KEY);     // Signed user pass to generate encrypted token
    return res
      .cookie("pass_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'all gucci fam'});
  } catch (error) {
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }
})

app.post('/save', (req, res) => {   // save drawing
  console.log(req.body)
  ImageDataURI.outputFile(req.body.image, filePath);
  res.send("all good")
})

app.post('/nickname', async(req, res) => {   // save nickname in db
  try {
    console.log(req.body)
    const nickName = req.body.nickname;
  
    // DB: Register a new user and get an id, which comes from the RETURNING clause
    
      const pool = new Pool(credentials);
      // get user_id count
      const count = await getUserCount(pool);
      var user_id = parseInt(count.rows[0].count);
      
      const registerResult = await newUser({
        id: String(user_id+1),
        nickname: String(nickName),
        // fullname: '',
        // age: '',
      }, pool);
      
      const registered_user_id = registerResult.rows[0]["id"];
      console.log("Registered a user with id: " + registered_user_id);
      // console.log(registerResult.rows[0]);
    
      await pool.end();
      return res
        .status(200)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json({message: 'all gucci fam'});
  } catch (error){
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }

  })


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})