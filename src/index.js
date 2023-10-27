// For setup: npm install pg
// Install heroku for db access

// trigger server restart 1


const express = require('express')
const app = express()
const port = (process.env.NODE_ENV === "production") ? process.env.PORT : 8000;

const cors = require('cors');

// To change to localhost, comment out the right FRONTEND_LINK and sameSite line in cookie settings (for backend). Comment out BACKEND_LINK in frontend code

// const FRONTEND_LINK = 'http://localhost:3000';
const FRONTEND_LINK = 'https://fyp-frontend-39b514692c67.herokuapp.com';

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
  user: "xhcanhuxevmwvt",
  host: "ec2-34-193-110-25.compute-1.amazonaws.com",
  database: "d6oro92l93palr",
  password: "0f8dcf3dc534d611c32718a0657466a4b84a58c7a11e6aaa79bfab0025398e5c",
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

async function updateUserDetails(userId, fullname, region, rating, pool) {
  const text = `UPDATE A_USER SET fullname = $2 AND age = $3 AND region = $4 WHERE id = $1`;
  const values = [userId, fullname, age, region];
  return pool.query(text, values);
}

async function updateUserRatings(userId, rating, pool) {
  const text = `UPDATE A_USER SET rating = $2 WHERE id = $1`;
  const values = [userId, rating];
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

// user qr locations
cX1 = 0;
cY1 = 0;
cX2 = 0;
cY2 = 0;

// drawing ready booleans
isDrawingReady1 = false;
isDrawingReady2 = false;

var first = true;

// reset var to indicate to openCV to reset as well
var reset = false;
var reset1 = false;
var reset2 = false;

const QRmutex = new Mutex(); // creates a shared mutex instance
const startMutex = new Mutex();
const drawingMutex = new Mutex();
const nicknameMutex = new Mutex();
const resetMutex = new Mutex();

function hasGameStarted() {
  return ((state1 > 0) && (state2 > 0));
};

function resetToDefault1() {
  // these state variables represent where each player is at. 
  state1 = 0;

  // state updater locks
  state1Updated = false;

  // qr ids
  // qr_id1 = '';

  // user_id
  user_id1 = '';

  // user passes
  pass1 = '';

  // user emojis
  emoji1 = '';

  cX1 = 0;
  cY1 = 0;

  isDrawingReady1 = false;

  reset1 = true;

}

function resetToDefault2() {
  // these state variables represent where each player is at. 
  state2 = 0;

  // state updater locks
  state2Updated = false;

  // qr ids
  // qr_id2 = '';

  // user_id
  user_id2 = '';

  // user passes
  pass2 = '';

  // user emojis
  emoji2 = '';

  cX2 = 0;
  cY2 = 0;

  isDrawingReady2 = false;

  reset2 = true;
}

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
    state1 = 1;
  } else {
    state2 = 1;
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

function getOtherUserIdFromPass(pass) {
  if (pass === pass1) {
    return user_id2;
  }
  return user_id1;
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

async function setOpenCVDataAccordingly(data, state, stateOther, userId, userIdOther, emoji, emojiOther, cX, cY) {
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

  data.cXOther = cX;
  data.cYOther = cY;

  return data;
}

async function setDrawingAccordingly(data, userId) {
  const pool = new Pool(credentials);

  // get drawings and descriptions
  const getDrawingResult = await getUserDrawing(userId, pool);
  if (getDrawingResult && getDrawingResult.rows.length != 0) {
    data.drawing = await getDrawingUriFromBlob(getDrawingResult.rows[0]["datauri"]);
    data.description = getDrawingResult.rows[0]["description"];
  }

  await pool.end();

  return data;
}

async function setNicknameAccordingly(data, userId, userIdOther) {
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

  await pool.end();

  return data;
}

function setOpenCVDataLightAccordingly(data, state, stateOther, cX, cY, emoji, emojiOther, isDrawingReady, isDrawingReadyOther, urlIdOther, reset) {
  data.state = state;
  data.stateOther = stateOther;

  data.emoji = emoji;
  data.emojiOther = emojiOther;

  data.cXOther = cX;
  data.cYOther = cY;

  data.isDrawingReady = isDrawingReady;
  data.isDrawingReadyOther = isDrawingReadyOther;

  data.urlIdOther = urlIdOther;

  data.reset = reset;

  return data;
}

async function setOpenCVData(QRId, data) {
  if (QRId === qr_id1) {
    return setOpenCVDataAccordingly(data, state1, state2, user_id1, user_id2, emoji1, emoji2, cX2, cY2);
  } else {
    return setOpenCVDataAccordingly(data, state2, state1, user_id2, user_id1, emoji2, emoji1, cX1, cY1);
  }
}

function setOpenCVDataLight(QRId, data) {
  if (QRId === qr_id1) {
    return setOpenCVDataLightAccordingly(data, state1, state2, cX2, cY2, emoji1, emoji2, isDrawingReady1, isDrawingReady2, qr_id2, reset1);
  } else {
    return setOpenCVDataLightAccordingly(data, state2, state1, cX1, cY1, emoji2, emoji1, isDrawingReady2, isDrawingReady1, qr_id1, reset2);
  }
}

async function setNickname(QRId, data) {
  if (QRId === qr_id1) {
    return setNicknameAccordingly(data, user_id1, user_id2);
  } else {
    return setNicknameAccordingly(data, user_id2, user_id1);
  }
}

async function setDrawing(QRId, data) {
  if (QRId === qr_id1) {
    return setDrawingAccordingly(data, user_id1);
  } else {
    return setDrawingAccordingly(data, user_id2);
  }
}

function setisReadyDrawing(pass) {
  if (pass == pass1) {
    isDrawingReady1 = true;
  } else {
    isDrawingReady2 = true;
  }
}

function setcXcY(QRId, cX, cY) {
  if (QRId === qr_id1) {
    cX1 = cX;
    cY1 = cY;
  } else {
    cX2 = cX;
    cY2 = cY;
  }
}

function removeReset(QRId) {
  if (QRId === qr_id1) {
    reset1 = false;
  }
  if (QRId === qr_id2) {
    reset2 = false;
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
    result = {url : finalURL, id : String(qr_id)};
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

    const providedState = parseInt(req.query.state);

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
      // state1 += 1;
      if (providedState - state1 === 1) {
        state1 = providedState;
      }
    }
    else if (pass == pass2) {
      console.log('pass 2 matched');
      // incrementState(state2, state2Updated);
      // state2 += 1;
      if (providedState - state2 === 1) {
        state2 = providedState;
      }
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

    const providedState = parseInt(req.query.state);

    if (pass != pass1 && pass != pass2) {     // if token does not match either user's token
      console.log('no passes matched');
      return res
      .status(400)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E004'));  // E004: ID is wrong
    }

    //incrementState(pass);
    
    //Setting and incrementing states of user
    if (pass == pass1) {
      console.log('pass 1 matched');
      // increment only happens once
      // incrementState(state1, state1Updated);
      if (providedState - state1 === 1) {
        state1 = providedState;
      }
      currState = state1;
      otherState = state2;
    }
    else if (pass == pass2) {
      console.log('pass 2 matched');
      // increment only happens once
      // incrementState(state2, state2Updated);
      if (providedState - state2 === 1) {
        state2 = providedState;
      }
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
        secure: process.env.NODE_ENV === "production"
        ,sameSite: 'none' // comment this line for localhost
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

    const release = await drawingMutex.acquire(); // acquires access to the critical path

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

    release();
    await pool.end();

    setisReadyDrawing(pass);

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

    const release = await nicknameMutex.acquire(); // acquires access to the critical path

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

    release();

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
      emojiOther: '',
      cXOther: -1,
      cYOther: -1
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

app.post('/setcXcY', (req, res) => {
  console.log('in POST setcXcY');
  console.log(req.body);
  try {
    if (!req.body.id || !req.body.cX || !req.body.cY) {
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E002'));
    }

    const providedId = req.body.id;
    
    if (doesNotMatchExistingIds(providedId)) {
      console.log('Id does not match existing ids');
      return res
      .status(401)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json(getError('E004'));
    }

    setcXcY(providedId, req.body.cX, req.body.cY);

    return res
      .status(200)
      .setHeader('Access-Control-Allow-Credentials', true)
      .json({message: 'All gucci fam'});

  } catch (error) {
      console.log(error);
      return res
        .status(400)
        .setHeader('Access-Control-Allow-Credentials', true)
        .json(getError('E003'));
  }
})

app.get('/openCVDataLight', async (req, res) => {
  console.log('in GET openCVDataLight');
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
      emoji: '',
      emojiOther: '',
      cXOther: -1,
      cYOther: -1,
      isDrawingReady: false,
      isDrawingReadyOther: false,
      urlIdOther: '',
      reset: false
    };

    data = setOpenCVDataLight(providedId, data);

    removeReset(providedId);

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

app.get('/nickname', async (req, res) => {
  console.log('in GET nickname');
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
      nickname: '',
      nicknameOther: ''
    };

    data = await setNickname(providedId, data);

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

app.get('/drawing', async (req, res) => {
  console.log('in GET drawing');
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
      drawing: '',
      description: ''
    };

    data = await setDrawing(providedId, data);

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
    const otherUserId = getOtherUserIdFromPass(pass);


    const pool = new Pool(credentials);
    const getDrawingResult = await getDrawing({
      userId: otherUserId
    }, pool);
    console.log(getDrawingResult.rows[0]);
    const drawingDesc = await new Response(getDrawingResult.rows[0]["description"]).text();
    await pool.end();
    console.log("Drawing Description: " + drawingDesc);

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

app.post('/share', async (req, res) => {   // save nickname in db
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
    
    const fullName = req.body.name;
    const age = req.body.age;
    const region = req.body.region;
    const userId = getUserIdFromPass(pass);
  
    // DB: Register a new user and get an id, which comes from the RETURNING clause
    
    const pool = new Pool(credentials);

    // get user_id count
    const count = await getUserCount(pool);
    
      
    // const registerResult = await updateUser({
    //   id: String(userId),
    //   fullname: '',
    //   age: '',
    //   region: '',
    //   rating:'',
    // }, pool);

    const updatedUser = await updateUserDetails(userId, fullName, age, region, pool);
    
    const updated_user_id = updatedUser.rows[0]["id"];
    console.log("Updated user details with id: " + updated_user_id);
    // console.log(registerResult.rows[0]);
  
    await pool.end();

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

  app.post('/rating', async (req, res) => {   // save nickname in db
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
      
      // const fullName = req.body.name;
      // const region = req.body.region;
      const rating = req.body.rating;
      const userId = getUserIdFromPass(pass);
    
      // DB: Register a new user and get an id, which comes from the RETURNING clause
      
      const pool = new Pool(credentials);
  
      // get user_id count
      const count = await getUserCount(pool);
      
        
      // const registerResult = await updateUser({
      //   id: String(userId),
      //   fullname: '',
      //   age: '',
      //   region: '',
      //   rating:'',
      // }, pool);
  
      const updatedUser = await updateUserRatings(userId, rating, pool);
      
      const updated_user_id = updatedUser.rows[0]["id"];
      console.log("Updated user rating with id: " + updated_user_id);
      // console.log(registerResult.rows[0]);
    
      await pool.end();
  
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
    

  app.post('/end', async (req, res) => {   // save nickname in db
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

      // first = true;
      const release = await resetMutex.acquire();

      if (pass === pass1) {
        resetToDefault1();
      }
      else {
        first = false;
        resetToDefault2();
      }

      release();
  
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

app.post('/reset', (req, res) => {
  first = true;
  resetToDefault1();
  resetToDefault2();
  return res
    .status(200)
    .setHeader('Access-Control-Allow-Credentials', true)
    .json({message: 'all gucci fam'});
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
  console.log(process.env.NODE_ENV);
  console.log(process.env.PORT);
})