const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt")
require('dotenv').config()
app.set('view-engine, ejs')
const db = require('./database')
const fs = require('fs')



//reading the data from JSON
function readJson() {
  return new Promise((res, rej) => {
    fs.readFile('data.json', async (err, data) => {
      if (err) throw err;
      let users = await JSON.parse(data);
      console.log(users);
      res(users.users)
    });

  }
  )
}

async function populateDatabase() {
  const userData = await readJson()
  console.log(userData)

  userData.forEach(async (element) => {
    let role = element.role
    let name = element.name
    let password = element.password
    encryptedpass = await bcrypt.hash(password, 10)
    console.log(encryptedpass)
    db.insertData(role, name, encryptedpass)

  });

}

db.init()
populateDatabase()
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.use(cookieParser())

var currentKey = ""
var currentPassword = ""

function getCookie() {
  token = req.cookies.jwt
  const decryptedToken = jwt.verify(token, process.env.TOKEN)
  return decryptedToken
}

function postCookie(username) {
  // const token = jwt.sign(username, process.env.TOKEN)


  // const cookieOptions = {
  //   httpOnly: true, // Set cookie to httpOnly it can only be accessed by the server and not by client-side scripts. 
  //   maxAge: 86400000 // Set cookie to expire after 1 day (in milliseconds)
  // };

  // res.cookie("jwt", token, cookieOptions); // Send JWT in a cookie
  // res.
}


app.get('/', (req, res) => {
  res.redirect('/identify')
  getCookie(req)

})



app.post('/identify', async (req, res) => {
  let userName = req.body.userId
  var password
  var encryptedpass
  var userId
  var role
  let userNameExists = false
  if (userName != "") {
    const rest = await db.getName(userName).then(results => {
      if (results.length == 0) {

      }
      else {
        userNameExists = true

        password = results[0]['password']
        userId = results[0]['userID']
        role = results[0]['role']
        console.log(password)

      }
      return results
    }).catch(function (e) {
      console.log(e.message);
      console.log(e.stack);
    });
    // res.render('identify.ejs')
  }
  console.log("here")
  if (userNameExists == true) {
    try {
      console.log(req.body.password)
      encryptedpass = await bcrypt.hash(req.body.password, 10)
      console.log(encryptedpass)
    } catch {
      console.log("error")
    }

    try {
      if (await bcrypt.compare(req.body.password, password)) {
        console.log("teet")
        // var token = jwt.sign(userName, process.env.TOKEN)
        console.log(userName)
        console.log(process.env.TOKEN)
        const token = jwt.sign(userName, process.env.TOKEN)
        console.log("after sign")

        const cookieOptions = {
          httpOnly: true, // Set cookie to httpOnly it can only be accessed by the server and not by client-side scripts. 
          maxAge: 86400000 // Set cookie to expire after 1 day (in milliseconds)
        };
        console.log("before jwt")
        res.cookie("jwt", token, cookieOptions); // Send JWT in a cookie
        console.log("after jwt")
        res.status(200)
        console.log(role)
        if (role === 'student') {
          res.redirect('/users/' + userName + "/?userRole=" + role)
        }
        else if (role === 'admin') {
          console.log("inside")
          res.redirect('/admin')
        } else if (role === 'teacher') {
          res.redirect('/teacher')
        } else {
          res.sendStatus(401).redirect('/identify')
          console.log("error. No such role exist")
        }


      } else {
        res.render("fail.ejs")

      }
    } catch {
      console.log("error")
    }
  } else {

    res.render("fail.ejs")

  }
})



app.get('/identify', (req, res) => {
  res.render('identify.ejs')
})


function authorizeRole(roles) {

  return async (req, res, next) => {
    console.log(roles)
    const userRole = req.query.userRole
    console.log(req.query)
    console.log(req.params)
    if (roles.includes(userRole)) {
      next()
    } else {
      return res.status(401).render('identify.ejs')
    }
  }
}


function authenticateToken(req, res, next) {

  if (currentKey == '') {
    res.redirect("identify.ejs")
  }
  else if (jwt.verify(currentKey, process.env.TOKEN)) {
    next()
  } else {
    res.redirect("identify.ejs")
  }
}

function authorizeToken(req, res, next) {
  const token = req.cookies.jwt;
  if (!token) {
    return res.redirect('/identify')
  }
  try {
    jwt.verify(token, process.env.TOKEN)
    next();
  } catch (error) {
    return res.status(403).redirect('/identify')
  }
}


app.get('/granted', authenticateToken, (req, res) => {
  res.render('start.ejs')
})

app.post('/register', async (req, res) => {

  if (req.method == 'POST') {
    encryptedpass = await bcrypt.hash("12345", 10)
    console.log(encryptedpass)
    encryptedpass = await bcrypt.hash("12345", 10)
    console.log(encryptedpass)

    if (req.body.password != '' && req.body.userId != '' && req.body.role != '') {
      try {
        dbEncryption = await bcrypt.hash(req.body.password, 10)
        console.log(req.body.password)
        console.log(dbEncryption)
        db.addUserInfo(req.body.userId, dbEncryption, req.body.role);
        res.render("identify.ejs")
      } catch {
        console.log("error")
      }
    }
  }

})

app.get('/register', (req, res) => {
  res.render('register.ejs')
})

app.get('/users/:userid', authorizeToken, async (req, res) => {
  console.log(req.params)
  console.log(req.cookies)
  console.log("yayyyyyyyyyyyyyyyyyyy")
  const token = req.cookies.jwt;
  const dcryptToken = jwt.verify(token, process.env.TOKEN);
  console.log(dcryptToken)
  const user = await db.getName(dcryptToken)
  console.log(user)

  if (req.params.userid !== user[0].name) {
    return res.sendStatus(401)
  }
  if (user[0].role === 'student')
    console.log("student 2")
  res.render('student2.ejs', { 'username': user[0].name })
})

app.get('/teacher', authorizeRole(["admin", "teacher"]), async (req, res) => {
  res.render('/teacher.ejs')
})

app.get('/admin', authorizeToken, async (req, res) => {
  console.log(req.params)
  console.log(req.cookies)
  console.log("yayyyyyyyyyyyyyyyyyyy")
  const token = req.cookies.jwt;
  const dcryptToken = jwt.verify(token, process.env.TOKEN);
  console.log(dcryptToken)
  const user = await db.getName(dcryptToken)
  console.log(user)
  console.log(!user.length)
  if (!user.length) {
    return res.sendStatus(401)
  }

  if ("admin" !== user[0].name) {
    return res.sendStatus(401)
  }
  if (user[0].role === 'admin') {
    console.log("admin")
    res.render('admin.ejs', { 'username': user[0].name })
  }
  else {
    return res.sendStatus(401)
  }

  // res.render('admin.ejs')
})

app.listen(8000)