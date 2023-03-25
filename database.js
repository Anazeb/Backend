const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(':memory:')

const init = () => {


  db.serialize(() => {
    db.run('CREATE TABLE users (userID int NOT NULL PRIMARY KEY, role TEXT, name TEXT, password TEXT)')
    db.run("INSERT INTO users VALUES (1, 'student', 'Liah', 'password')")
    db.run("INSERT INTO users VALUES (2, 'teacher', 'Hannah', '123password')")
    db.run("INSERT INTO users VALUES (3, 'admin', 'Annie', '231password')")
    db.run("INSERT INTO users VALUES (4, 'student', 'Abbe', 'password123')")
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
module.exports = { init }

