const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const bcrypt = require("bcrypt")
require('dotenv').config()
app.set('view-engine, ejs')
const db = require('./database')

db.init()

app.use(express.urlencoded({ extended: false }))
app.use(express.json())

var currentKey = ""
var currentPassword = ""

app.get('/', (req, res) => {
  res.redirect('/identify')
})



app.post('/identify', async (req, res) => {
  let userName = req.body.userId
  var password
  var encryptedpass
  let role = req.body.role
  let userNameExists = false
  if (userName != "") {
    const rest = await db.getName(userName).then(results => {
      if (results.length == 0) {

      }
      else {
        userNameExists = true

        password = results[0]['password']
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

        res.render("start.ejs")


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

app.get('/admin', (req, res) => {
  res.render('admin.ejs')
})



function authenticateToken(req, res, next) {
  if (currentKey == '') {
    res.redirect("identify.ejs")
  }
  else if (jwt.verify(currentKey, process.env.ACCESS_TOEN_SECRET)) {
    next()
  } else {
    res.redirect("identify.ejs")
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

app.listen(8000)