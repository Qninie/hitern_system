const express = require("express");
const cors = require("cors");
const db = require("./db")

const app = express();

app.use(cors());
app.use(express.json());

// test route
app.get("/", (req, res) => {
  res.send("Hitern backend is running");
});

// login API
app.post("/login", (req, res) => {

  console.log(req.body)

  if (!req.body) {
    return res.json({
      success: false,
      message: "No data received"
    })
  }

  const { email, password } = req.body

  const userEmail = email.toLowerCase()

  const sql = "SELECT * FROM users WHERE email = ? AND password = ?"

  db.query(sql, [email, password], (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    if (result.length > 0) {
      res.json({
        success: true,
        message: "Login successful",
        user: result[0]
      })
    } else {
      res.json({
        success: false,
        message: "Invalid email or password"
      })
    }

  })

})

app.listen(5001, () => {
  console.log("Server running on port 5001");
});

// upload document API
app.post("/upload-document", (req, res) => {

  const { title, uploadedBy, needSignature } = req.body

  const sql = `
    INSERT INTO documents (title, uploaded_by, need_signature, status)
    VALUES (?, ?, ?, 'pending')
  `

  db.query(sql, [title, uploadedBy, needSignature], (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: "Document uploaded successfully"
    })

  })

  if (needSignature) {
  const notifSql = `
    INSERT INTO notifications (user_id, message)
    VALUES (?, ?)
  `

  db.query(notifSql, [
    2, // example supervisor ID
    "New document requires your signature"
  ])
}

})

app.get("/documents", (req, res) => {

  const sql = "SELECT * FROM documents"

  db.query(sql, (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      documents: result
    })

  })

})

app.post("/approve-document", (req, res) => {

  const { documentId, status } = req.body

  const sql = "UPDATE documents SET status = ? WHERE id = ?"

  db.query(sql, [status, documentId], (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: "Document status updated"
    })

  })

})

app.get("/notifications", (req, res) => {

 res.json({
  notifications: [
   "New document needs signature",
   "Intern uploaded Duty Report Form"
  ]
 })

})

// approve document API
app.post("/approve-document", (req, res) => {
  const { documentId, status } = req.body

  const sql = "UPDATE documents SET status = ? WHERE id = ?"

  db.query(sql, [status, documentId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: "Document status updated"
    })
  })
})