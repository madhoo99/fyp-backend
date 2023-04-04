// For setup: npm install pg
// Install heroku for db access


const express = require('express')
const app = express()
const port = 8000

const cors = require('cors');

// const FRONTEND_LINK = 'http://localhost:3000';
const FRONTEND_LINK = 'https://borderless-frontend-new.herokuapp.com';

app.use(cors({
    origin: FRONTEND_LINK,
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

async function newDrawing(data, pool) {
  const text = `
    INSERT INTO A_DRAWING (ID, DATAURI, DESCRIPTION, USERID, PROMPT)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING ID
    `;
  const values = [data.id, data.datauri, data.description, data.userId, data.prompt];
  return pool.query(text, values);
}

async function getDrawing(data, pool) {
  const text = `
    SELECT * FROM A_DRAWING
    WHERE USERID = $1
    `;
  const values = [data.userId];
  return pool.query(text, values);
}

async function getUser(data, pool) {
  const text = `SELECT * FROM A_USER WHERE id = $1`;
  const values = [data.userId];
  return pool.query(text, values);
}


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

async function getDrawingCount(pool) {
  const text = `SELECT COUNT(*) FROM A_DRAWING`;
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

// state updater locks
var state1Updated = false;
var state2Updated = false;

// qr ids
var qr_id1 = '';
var qr_id2 = '';

// user_id
var user_id1 = '';
var user_id2 = '';

// user passes
var pass1 = '';
var pass2 = '';

// user emojis
var emoji1 = '';
var emoji2 = '';

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

function setStateStart(QRId) {
  if (QRId === qr_id1) {
    state1 += 1;
  } else {
    state2 += 1;
  }
};

function incrementState(pass) {
  if (pass === pass1) {
    if (state1Updated) {
      return;
    }
    state1 += 1;
    state1Updated = true;
    return;
  }

  if (state2Updated) {
    return;
  }
  state2 += 1;
  state2Updated = true;
};

function resetUpdated(pass) {
  if (pass === pass1) {
    state1Updated = false;
    return;
  }
  state2Updated = false;
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

function getUserIdFromPass(pass) {
  if (pass === pass1) {
    return user_id1;
  }
  return user_id2;
};

function setEmoji(pass, emoji) {
  if (pass === pass1) {
    emoji1 = emoji;
    return;
  }
  emoji2 = emoji;
};

async function getUserData(userId, pool) {
  if (userId === '') {
    return null;
  }
  const getUserData = await getUser({
    userId: userId
  }, pool);
  return getUserData;
}

async function getUserDrawing(userId, pool) {
  if (userId === '') {
    return null;
  }
  const getDrawingResult = await getDrawing({
    userId: userId
  }, pool);
  return getDrawingResult;
}

async function getDrawingUriFromBlob(blob) {
  const drawingDataUri = await new Response(blob).text();
  return drawingDataUri;
}

async function setOpenCVDataAccordingly(data, state, stateOther, userId, userIdOther, emoji, emojiOther) {
  data.state = state;
  data.stateOther = stateOther;
  const pool = new Pool(credentials);

  // get nicknames
  const getUserResult = await getUserData(userId, pool);
  const getUserResultOther = await getUserData(userIdOther, pool);
  if (getUserResult && getUserResult.rows[0].length != 0) {
    data.nickname = getUserResult.rows[0]["nickname"];
  }
  if (getUserResultOther && getUserResultOther.rows[0].length != 0) {
    data.nicknameOther = getUserResultOther.rows[0]["nickname"];
  }

  // get drawings and descriptions
  const getDrawingResult = await getUserDrawing(userId, pool);
  const getDrawingResultOther = await getUserDrawing(userIdOther, pool);
  if (getDrawingResult && getDrawingResult.rows.length != 0) {
    data.drawing = await getDrawingUriFromBlob(getDrawingResult.rows[0]["datauri"]);
    data.description = getDrawingResult.rows[0]["description"];
  }
  if (getDrawingResultOther && getDrawingResultOther.rows.length != 0) {
    data.drawingOther = await getDrawingUriFromBlob(getDrawingResultOther.rows[0]["datauri"]);
    data.descriptionOther = getDrawingResultOther.rows[0]["description"];
  }

  await pool.end();

  data.emoji = emoji;
  data.emojiOther = emojiOther;

  return data;
}

async function setOpenCVData(QRId, data) {
  if (QRId === qr_id1) {
    return setOpenCVDataAccordingly(data, state1, state2, user_id1, user_id2, emoji1, emoji2);
  } else {
    return setOpenCVDataAccordingly(data, state2, state1, user_id2, user_id1, emoji2, emoji1);
  }
}

// function hasTokenAndPassExists(pass) {
//     const token = req.cookies.pass_token;
//   // if token doesn't exist  
//   if (!token) {       
//       return res.sendStatus(403);
//     }
  
//     const data = jwt.verify(token, JWT_SECRET_KEY);
//     const pass = data.pass;

//   // if token does not match either user's token
//     if (pass != pass1 && pass != pass2) {     
//       console.log('pass is not the same');
//       return res
//         .status(400)
//         .setHeader('Access-Control-Allow-Credentials', true)
//         .json(getError('E004'));  // E004: ID is wrong
//       }
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
      // incrementState(state1, state1Updated);
      state1 += 1;
    }
    else if (pass == pass2) {
      console.log('pass 2 matched');
      // incrementState(state2, state2Updated);
      state2 += 1;
    }

    console.log('-------------------------STATE-------------------');
    console.log('state1: ' + state1 + ' state2: ' + state2);
    console.log('-------------------------STATE-------------------');

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
  console.log('in authState GET');
  const token = req.cookies.pass_token;
  if (!token) {       // if token doesn't exist
    return res.sendStatus(403);
  }
  try {
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('no passes matched');
      return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E004'));  // E004: ID is wrong
    }

    incrementState(pass);
    
    //Setting and incrementing states of user
    if (pass == pass1) {
      console.log('pass 1 matched');
      // increment only happens once
      // incrementState(state1, state1Updated);
      currState = state1;
      otherState = state2;
    }
    else if (pass == pass2) {
      console.log('pass 2 matched');
      // increment only happens once
      // incrementState(state2, state2Updated);
      currState = state2;
      otherState = state1;
    }

    console.log('-------------------------STATE-------------------');
    console.log('state1: ' + state1 + ' state2: ' + state2);
    console.log('-------------------------STATE-------------------');

    if (currState > otherState) {     // waiting page
      console.log('waiting on other player');
      return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E005'));      // E005: Waiting on other player
    }

    // token AND state correct
    
    resetUpdated(pass);

    return res
    .status(200)
    .setHeader('Access-Control-Allow-Credentials', true)
    .json({ message: 'all gucci fam' });
    
  } catch {
    console.log('some other error happened');
      return res.sendStatus(403);
    }
});

app.get('/start', async (req, res) => {
  console.log('in start get');
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
    setStateStart(providedId);
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

app.post('/saveDrawing', async (req, res) => {   // save drawing
  // console.log(req.body);
  // ImageDataURI.outputFile(req.body.image, filePath);

  try {
    const token = req.cookies.pass_token;
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('pass is not the same');
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E004'));  // E004: ID is wrong
    }
    const userId = getUserIdFromPass(pass);

    const pool = new Pool(credentials);
    const count = await getDrawingCount(pool);
    var drawingId = parseInt(count.rows[0].count) + 1;
    const createdDrawingResult = await newDrawing({
      id: drawingId,
      datauri: req.body.image,
      description: req.body.description,
      userId: userId
    }, pool);
    const createdDrawingId = createdDrawingResult.rows[0]["id"];
    console.log("Created a drawing with id: " + createdDrawingId);

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'all gucci fam'});

  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }
})

app.get('/saveDrawing', async (req, res) => {   // save drawing
  // console.log(req.body)
  // ImageDataURI.outputFile(req.body.image, filePath);

  try {
    const token = req.cookies.pass_token;
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('pass is not the same');
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E004'));  // E004: ID is wrong
    }
    const userId = getUserIdFromPass(pass);

    const pool = new Pool(credentials);
    const getDrawingResult = await getDrawing({
      userId: userId
    }, pool);
    console.log(getDrawingResult.rows[0]);
    const drawingDataUri = await new Response(getDrawingResult.rows[0]["datauri"]).text();
    // console.log(text);
    ImageDataURI.outputFile(drawingDataUri, 'misc/test.png');
    console.log("retrieved and saved");

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'all gucci fam'});

  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }
})

app.post('/nickname', async (req, res) => {   // save nickname in db
  try {
    const token = req.cookies.pass_token;
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('pass is not the same');
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E004'));  // E004: ID is wrong
    }
    
    console.log(req.body)
    
    const nickName = req.body.nickname;
  
    // DB: Register a new user and get an id, which comes from the RETURNING clause
    
    const pool = new Pool(credentials);
    // get user_id count
    const count = await getUserCount(pool);
    var user_id = parseInt(count.rows[0].count) + 1;
    
      
    const registerResult = await newUser({
      id: String(user_id),
      nickname: String(nickName),
      // fullname: '',
      // age: '',
    }, pool);
    
    const registered_user_id = registerResult.rows[0]["id"];
    console.log("Registered a user with id: " + registered_user_id);
    // console.log(registerResult.rows[0]);
  
    await pool.end();

    if (pass == pass1) {
      user_id1 = registered_user_id;
      console.log("Assigned to user 1");
    }
    else {
      user_id2 = registered_user_id;
      console.log("Assigned to user 2");
    }

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'all gucci fam'});
  }
  
  catch (error) {
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }

  })

app.post('/emoji', async (req, res) => {   // save drawing
  console.log(req.body);
  // ImageDataURI.outputFile(req.body.image, filePath);

  try {
    const token = req.cookies.pass_token;
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('pass is not the same');
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E004'));  // E004: ID is wrong
    }
    setEmoji(pass, req.body.emoji);

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'all gucci fam'});

  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }
})

app.get('/openCVData', async (req, res) => {
  console.log('in GET openCVData');
  try {
    if (!req.query.id) {
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E002'));
    }

    const providedId = req.query.id;
    
    if (doesNotMatchExistingIds(providedId)) {
      console.log('Id does not match existing ids');
      return res
      .status(401)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E004'));
    }

    var data = {
      state: -1,
      stateOther: -1,
      nickname: '',
      nicknameOther: '',
      drawing: '',
      drawingOther: '',
      description: '',
      descriptionOther: '',
      emoji: '',
      emojiOther: ''
    };

    data = await setOpenCVData(providedId, data);

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'All gucci fam', data: data});

  } catch (error) {
      console.log(error);
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E003'));
  }
})

app.get('/guessDrawing', async (req, res) => {   // guess drawing
  try {
    const token = req.cookies.pass_token;
    const data = jwt.verify(token, JWT_SECRET_KEY);
    const pass = data.pass;
    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('pass is not the same');
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E004'));  // E004: ID is wrong
    }
    const userId = getUserIdFromPass(pass);

    const pool = new Pool(credentials);
    const getDrawingResult = await getDrawing({
      userId: userId
    }, pool);
    console.log(getDrawingResult.rows[0]);
    const drawingDesc = await new Response(getDrawingResult.rows[0]["description"]).text();
    await pool.end();
    console.log("Drawing Description: " + drawingDesc);
    // ImageDataURI.outputFile(drawingDataUri, 'misc/test.png');
    console.log("retrieved and saved");
    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'all gucci fam', description: drawingDesc});

  } catch (error) {
    console.log(error);
    return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E003'));
  }
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})