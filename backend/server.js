const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const db = require("./db")

const app = express();
const uploadDir = path.join(__dirname, "uploads")

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")
      cb(null, `${Date.now()}-${safeName}`)
    }
  })
})

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

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

const ensureDocumentColumns = () => {
  const columns = [
    "ADD COLUMN file_path VARCHAR(200) NULL",
    "ADD COLUMN assigned_to VARCHAR(200) NULL",
    "ADD COLUMN due_date DATE NULL",
    "ADD COLUMN document_type VARCHAR(100) NULL"
  ]

  columns.forEach((columnSql) => {
    db.query(`ALTER TABLE documents ${columnSql}`, (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Unable to update documents table:", err.message)
      }
    })
  })
}

const ensureNotificationColumns = () => {
  const columns = [
    "ADD COLUMN target_email VARCHAR(255) NULL",
    "ADD COLUMN target_role VARCHAR(50) NULL"
  ]

  columns.forEach((columnSql) => {
    db.query(`ALTER TABLE notifications ${columnSql}`, (err) => {
      if (err && err.code !== "ER_DUP_FIELDNAME") {
        console.error("Unable to update notifications table:", err.message)
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
ensureDocumentColumns()
ensureNotificationColumns()

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

  const selectedRole = String(role || "").toLowerCase()
  const sql = `
    SELECT * FROM users
    WHERE LOWER(email) = ?
      AND password = ?
      AND LOWER(COALESCE(role, 'intern')) = ?
      AND LOWER(COALESCE(status, 'approved')) = 'approved'
  `

  db.query(sql, [email.toLowerCase(), password, selectedRole], (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    if (result.length > 0) {
      return res.json({
        success: true,
        message: "Login successful",
        user: {
          ...result[0],
          role: result[0].role || selectedRole,
          status: result[0].status || "approved"
        }
      })
    }

    const pendingSql = "SELECT * FROM pending_users WHERE LOWER(email) = ? AND status = 'pending'"

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

      res.json({
        success: false,
        message: "Invalid login details or account not approved"
      })
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
        message: "This email is already registered or waiting for approval"
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

app.get("/profile", (req, res) => {
  const { email } = req.query

  if (!email) {
    return res.json({
      success: false,
      message: "Email is required"
    })
  }

  const sql = "SELECT id, name, email, role, status, supervisor_email, created_at FROM users WHERE LOWER(email) = ?"

  db.query(sql, [email.toLowerCase()], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "Profile not found"
      })
    }

    res.json({
      success: true,
      user: result[0]
    })
  })
})

app.post("/profile", (req, res) => {
  const { currentEmail, name, email, password, supervisorEmail } = req.body

  if (!currentEmail || !name || !email) {
    return res.json({
      success: false,
      message: "Name and email are required"
    })
  }

  const fields = ["name = ?", "email = ?", "supervisor_email = ?"]
  const values = [name, email.toLowerCase(), supervisorEmail || null]

  if (password) {
    fields.push("password = ?")
    values.push(password)
  }

  values.push(currentEmail.toLowerCase())

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE LOWER(email) = ?`

  db.query(sql, values, (err) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    db.query(
      "SELECT id, name, email, role, status, supervisor_email, created_at FROM users WHERE LOWER(email) = ?",
      [email.toLowerCase()],
      (selectErr, result) => {
        if (selectErr) {
          return res.status(500).json({ error: selectErr })
        }

        res.json({
          success: true,
          message: "Profile updated",
          user: result[0]
        })
      }
    )
  })
})

app.listen(5001, () => {
  console.log("Server running on port 5001");
});

// upload document API
app.post("/upload-document", upload.single("documentFile"), (req, res) => {

  const { title, uploadedBy, needSignature, dueDate, fileName, documentType, assignedTo } = req.body
  const savedFileName = req.file ? req.file.filename : fileName

  if (!title || !uploadedBy) {
    return res.json({
      success: false,
      message: "Title and uploader are required"
    })
  }

  const sql = `
    INSERT INTO documents (title, file_path, uploaded_by, assigned_to, need_signature, status, due_date, document_type)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
  `

  db.query(
    sql,
    [
      title,
      savedFileName || null,
      uploadedBy,
      assignedTo || null,
      Boolean(needSignature),
      dueDate || null,
      documentType || null
    ],
    (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    const notificationSql = `
      INSERT INTO notifications (message, target_email, target_role)
      VALUES (?, ?, ?)
    `

    db.query(notificationSql, [
      `${uploadedBy} uploaded ${title}`,
      assignedTo || null,
      assignedTo ? "supervisor" : "hr"
    ])

    res.json({
      success: true,
      message: "Document uploaded successfully"
    })

  })

  if (needSignature) {
    const notifSql = `
      INSERT INTO notifications (message, target_email, target_role)
      VALUES (?, ?, ?)
    `

    db.query(notifSql, [
      "New document requires your signature",
      assignedTo || null,
      assignedTo ? "supervisor" : "hr"
    ])
  }

})

app.get("/documents", (req, res) => {
  const { role, email } = req.query
  const selectedRole = String(role || "").toLowerCase()

  let sql = "SELECT * FROM documents"
  const params = []

  if (selectedRole === "intern" && email) {
    sql += " WHERE LOWER(uploaded_by) = ?"
    params.push(email.toLowerCase())
  }

  if (selectedRole === "supervisor" && email) {
    sql += " WHERE LOWER(assigned_to) = ?"
    params.push(email.toLowerCase())
  }

  sql += " ORDER BY id DESC"

  db.query(sql, params, (err, result) => {

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
      COUNT(documents.id) AS document_count,
      SUM(CASE WHEN documents.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN documents.status = 'pending' THEN 1 ELSE 0 END) AS pending_count
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

app.post("/hr/create-user", (req, res) => {
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

  const sql = `
    INSERT INTO users (name, email, password, role, status, supervisor_email)
    VALUES (?, ?, ?, ?, 'approved', ?)
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
        message: "User created"
      })
    }
  )
})

app.post("/hr/delete-user", (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.json({
      success: false,
      message: "User ID is required"
    })
  }

  db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: "User deleted"
    })
  })
})

app.post("/approve-document", (req, res) => {

  const { documentId, status } = req.body

  const findSql = "SELECT title, uploaded_by FROM documents WHERE id = ?"
  const sql = "UPDATE documents SET status = ? WHERE id = ?"

  db.query(findSql, [documentId], (findErr, documents) => {
    if (findErr) {
      return res.status(500).json({ error: findErr })
    }

    db.query(sql, [status, documentId], (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    if (documents.length > 0) {
      db.query(
        "INSERT INTO notifications (message, target_email, target_role) VALUES (?, ?, ?)",
        [`Your document "${documents[0].title}" was ${status}`, documents[0].uploaded_by, "intern"]
      )
    }

    res.json({
      success: true,
      message: "Document status updated"
    })

  })
  })

})

app.get("/notifications", (req, res) => {
  const { role, email } = req.query
  const selectedRole = String(role || "").toLowerCase()

  let sql = `
    SELECT message, created_at
    FROM notifications
  `
  const params = []

  if (email || selectedRole) {
    sql += " WHERE "
    const conditions = []

    if (email) {
      conditions.push("LOWER(target_email) = ?")
      params.push(email.toLowerCase())
    }

    if (selectedRole) {
      conditions.push("target_role = ?")
      params.push(selectedRole)
    }

    sql += conditions.join(" OR ")
  }

  sql += " ORDER BY created_at DESC LIMIT 20"

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      notifications: result.map((notification) => notification.message)
    })
  })

})
