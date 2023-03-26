const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const cookieParser = require("cookie-parser")
const bcrypt = require("bcrypt")
require('dotenv').config()
app.set('view-engine, ejs')
const db = require('./database')
const fs = require('fs')

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
      }
      return results
    }).catch(function (e) {
      console.log(e.message);
      console.log(e.stack);
    });

  }
  console.log("here")
  if (userNameExists == true) {
    try {

      encryptedpass = await bcrypt.hash(req.body.password, 10)

    } catch {
      console.log("error")
    }

    try {
      if (await bcrypt.compare(req.body.password, password)) {

        const token = jwt.sign({ 'username': userName, 'role': role }, process.env.TOKEN)

        const cookieOptions = {
          httpOnly: true,
          maxAge: 86400000
        };
        res.cookie("jwt", token, cookieOptions); // Send JWT in a cookie
        res.status(200)
        if (role === 'student') {
          res.redirect('/users/' + userName)
        }
        else if (role === 'admin') {
          res.redirect('/admin')
        } else if (role === 'teacher') {
          res.redirect('/teacher')
        } else {
          res.sendStatus(401).redirect('/identify')
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
    const token = req.cookies.jwt;
    const dcryptToken = jwt.verify(token, process.env.TOKEN);

    if (roles.includes(dcryptToken.role)) {
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

    if (req.body.password != '' && req.body.userId != '' && req.body.role != '') {
      try {
        dbEncryption = await bcrypt.hash(req.body.password, 10)

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

app.get('/users/:userid', authorizeRole(['student', 'teacher', 'admin']), async (req, res) => {
  const token = req.cookies.jwt;
  const dcryptToken = jwt.verify(token, process.env.TOKEN);
  const user = await db.getName(dcryptToken.username)
  if (!user.length) {
    res.sendStatus(400)
  }
  else if (dcryptToken.role == 'teacher' || dcryptToken.role == 'admin') {
    const checkUser = await db.getName(req.params.userid)
    if (checkUser.length == 0) {
      res.send('No User found')
    }
    else if (checkUser[0].role == 'teacher' || checkUser[0].role == 'admin') {
      res.send('No User found')

    }
    else {
      res.render('student2.ejs', { 'username': req.params.userid })
    }
  }
  else if (req.params.userid !== user[0].name) {
    return res.sendStatus(401)
  }
  else if (user[0].role === 'student') {
    res.render('student2.ejs', { 'username': user[0].name })
  }
})


app.get('/teacher', authorizeRole(['teacher', 'admin']), async (req, res) => {
  res.render('teacher.ejs')
})

app.get('/admin', authorizeRole(['admin']), async (req, res) => {


  const studentData = await db.getRole()
  res.render('admin.ejs', { 'users': studentData })

})


app.listen(8000)