const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const init = () => {


  db.serialize(() => {
    db.run('CREATE TABLE users (userID INTEGER PRIMARY KEY AUTOINCREMENT, role TEXT, name TEXT, password TEXT)')
    // 
    // db.run("INSERT INTO users ('role', 'name', 'password') VALUES ('teacher', 'Hannah', '123password')")
    // db.run("INSERT INTO users ('role', 'name', 'password') VALUES ('admin', 'admin', 'admin')")
    // db.run("INSERT INTO users ('role', 'name', 'password') VALUES ('student', 'Abbe', 'password123')")
  })

  db.all('SELECT * FROM users', (err, result) => {
    if (err) {
      reject(err)
    }
    else {
      console.log(result)
    }
  })
}
function insertData(role, name, encryptedpass) {
  db.run("INSERT INTO users ('role', 'name', 'password') VALUES ($role, $name, $password)", { $role: role, $name: name, $password: encryptedpass }, error => {
    console.log("insert user data. Error is" + error)
  })
  db.all('SELECT * FROM users', (err, result) => {
    if (err) {
      reject(err)
    }
    else {
      console.log(result)
    }
  })

}
const getName = (userName) => {
  return new Promise((resolve, reject) => {

    db.all('SELECT * FROM users WHERE name = ?', [userName], (err, result) => {
      if (err) {
        console.log(err)
        reject(err)
      }
      else {
        console.log(result)
        resolve(result)

      }
    })

  }

  )

}

const addUserInfo = (username, password, role) => {
  return new Promise((resolve, reject) => {
    db.run("INSERT INTO users ( 'role', 'name','password') VALUES (?, ?, ?)", [role, username, password], (err, result) => {
      if (err) {
        console.log("error")
        reject(err)
      }
      else {
        console.log("inserted")
        db.all('SELECT * FROM users', (err, result) => {
          if (err) {
            reject(err)
          }
          else {
            console.log(result)
          }
        })
        resolve(result)
      }
    })

  }

  )

}


module.exports = { init, getName, addUserInfo, insertData }

