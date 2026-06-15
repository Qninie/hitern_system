const express = require("express");
const cors = require("cors");
const db = require("./db")

const app = express();

app.use(cors());
app.use(express.json());

const ensureUserColumns = () => {
  const columns = [
    "ADD COLUMN name VARCHAR(255) NULL",
    "ADD COLUMN role VARCHAR(50) DEFAULT 'intern'",
    "ADD COLUMN status VARCHAR(50) DEFAULT 'approved'",
    "ADD COLUMN supervisor_email VARCHAR(255) NULL"
  ]

  columns.forEach((columnSql) => {
    db.query(`ALTER TABLE users ${columnSql}`, (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Unable to update users table:", err.message)
      }
    })
  })
}

db.query(`
  CREATE TABLE IF NOT EXISTS pending_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    supervisor_email VARCHAR(255) NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error("Unable to prepare pending users table:", err.message)
  }
})

ensureUserColumns()

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

  const { email, password, role } = req.body

  if (!email) {
    return res.json({
      success: false,
      message: "Email is required"
    })
  }

  const pendingSql = "SELECT * FROM pending_users WHERE email = ? AND status = 'pending'"

  db.query(pendingSql, [email.toLowerCase()], (pendingErr, pendingResult) => {
    if (pendingErr) {
      return res.status(500).json({ error: pendingErr })
    }

    if (pendingResult.length > 0) {
      return res.json({
        success: false,
        message: "Your account is waiting for HR approval"
      })
    }

    const sql = `
      SELECT * FROM users
      WHERE email = ? AND password = ? AND role = ? AND status = 'approved'
    `

    db.query(sql, [email.toLowerCase(), password, role], (err, result) => {

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
          message: "Invalid login details or account not approved"
        })
      }

    })
  })

})

app.post("/signup-request", (req, res) => {
  const { name, email, password, role, supervisorEmail } = req.body
  const selectedRole = String(role || "").toLowerCase()

  if (!name || !email || !password || !selectedRole) {
    return res.json({
      success: false,
      message: "Name, email, password, and role are required"
    })
  }

  if (!["intern", "supervisor", "hr"].includes(selectedRole)) {
    return res.json({
      success: false,
      message: "Invalid role selected"
    })
  }

  const existingSql = `
    SELECT email FROM users WHERE email = ?
    UNION
    SELECT email FROM pending_users WHERE email = ? AND status = 'pending'
  `

  db.query(existingSql, [email.toLowerCase(), email.toLowerCase()], (existingErr, existingResult) => {
    if (existingErr) {
      return res.status(500).json({ error: existingErr })
    }

    if (existingResult.length > 0) {
      return res.json({
        success: false,
        message: "This Gmail is already registered or waiting for approval"
      })
    }

    const sql = `
      INSERT INTO pending_users (name, email, password, role, supervisor_email, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `

    db.query(
      sql,
      [name, email.toLowerCase(), password, selectedRole, supervisorEmail || null],
      (err) => {
        if (err) {
          return res.status(500).json({ error: err })
        }

        res.json({
          success: true,
          message: "Signup request sent for HR approval"
        })
      }
    )
  })
})

app.listen(5001, () => {
  console.log("Server running on port 5001");
});

// upload document API
app.post("/upload-document", (req, res) => {

  const { title, uploadedBy, needSignature } = req.body

  if (!title || !uploadedBy) {
    return res.json({
      success: false,
      message: "Title and uploader are required"
    })
  }

  const sql = `
    INSERT INTO documents (title, uploaded_by, need_signature, status)
    VALUES (?, ?, ?, 'pending')
  `

  db.query(sql, [title, uploadedBy, Boolean(needSignature)], (err, result) => {

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

  const sql = "SELECT * FROM documents ORDER BY id DESC"

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

app.get("/hr/users", (req, res) => {
  const pendingSql = `
    SELECT id, name, email, role, supervisor_email, created_at
    FROM pending_users
    WHERE status = 'pending'
    ORDER BY created_at DESC
  `

  const activeSql = `
    SELECT users.id, users.name, users.email, users.role, users.supervisor_email,
      COUNT(documents.id) AS document_count
    FROM users
    LEFT JOIN documents ON documents.uploaded_by = users.email
    GROUP BY users.id, users.name, users.email, users.role, users.supervisor_email
    ORDER BY users.role, users.name
  `

  db.query(pendingSql, (pendingErr, pendingUsers) => {
    if (pendingErr) {
      return res.status(500).json({ error: pendingErr })
    }

    db.query(activeSql, (activeErr, activeUsers) => {
      if (activeErr) {
        return res.status(500).json({ error: activeErr })
      }

      res.json({
        success: true,
        pendingUsers,
        activeUsers
      })
    })
  })
})

app.post("/hr/approve-user", (req, res) => {
  const { requestId, status } = req.body
  const nextStatus = String(status || "").toLowerCase()

  if (!["approved", "rejected"].includes(nextStatus)) {
    return res.json({
      success: false,
      message: "Invalid approval status"
    })
  }

  const pendingSql = "SELECT * FROM pending_users WHERE id = ? AND status = 'pending'"

  db.query(pendingSql, [requestId], (pendingErr, pendingResult) => {
    if (pendingErr) {
      return res.status(500).json({ error: pendingErr })
    }

    if (pendingResult.length === 0) {
      return res.json({
        success: false,
        message: "Signup request not found"
      })
    }

    const request = pendingResult[0]

    if (nextStatus === "rejected") {
      return db.query(
        "UPDATE pending_users SET status = 'rejected' WHERE id = ?",
        [requestId],
        (rejectErr) => {
          if (rejectErr) {
            return res.status(500).json({ error: rejectErr })
          }

          res.json({
            success: true,
            message: "User rejected"
          })
        }
      )
    }

    const insertSql = `
      INSERT INTO users (name, email, password, role, status, supervisor_email)
      VALUES (?, ?, ?, ?, 'approved', ?)
    `

    db.query(
      insertSql,
      [request.name, request.email, request.password, request.role, request.supervisor_email],
      (insertErr) => {
        if (insertErr) {
          return res.status(500).json({ error: insertErr })
        }

        db.query(
          "UPDATE pending_users SET status = 'approved' WHERE id = ?",
          [requestId],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ error: updateErr })
            }

            res.json({
              success: true,
              message: "User approved"
            })
          }
        )
      }
    )
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
