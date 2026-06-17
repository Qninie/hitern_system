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

app.get("/download/:fileName", (req, res) => {
  const safeName = path.basename(req.params.fileName)
  const filePath = path.join(uploadDir, safeName)

  res.download(filePath, safeName, (err) => {
    if (err && !res.headersSent) {
      res.status(404).send("File not found")
    }
  })
})

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
    "ADD COLUMN document_type VARCHAR(100) NULL",
    "ADD COLUMN description TEXT NULL",
    "ADD COLUMN remarks TEXT NULL",
    "ADD COLUMN reviewed_by VARCHAR(255) NULL",
    "ADD COLUMN signed_file_path VARCHAR(200) NULL"
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
    "ADD COLUMN user_id INT NULL",
    "ADD COLUMN is_read BOOLEAN DEFAULT FALSE",
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

ensureUserColumns()
ensureDocumentColumns()
ensureNotificationColumns()

const notifyUser = (email, role, message) => {
  const targetEmail = email ? String(email).toLowerCase() : null
  const targetRole = role || null

  if (targetEmail) {
    db.query("SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1", [targetEmail], (findErr, users) => {
      const userId = !findErr && users.length > 0 ? users[0].id : null
      db.query(
        "INSERT INTO notifications (user_id, message, is_read, target_email, target_role) VALUES (?, ?, FALSE, ?, ?)",
        [userId, message, targetEmail, targetRole]
      )
    })
    return
  }

  db.query(
    "INSERT INTO notifications (message, is_read, target_email, target_role) VALUES (?, FALSE, ?, ?)",
    [message, null, targetRole]
  )
}

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
      AND LOWER(COALESCE(status, 'active')) IN ('active', 'approved')
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

    res.json({
      success: false,
      message: "Invalid login details or account is inactive"
    })
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

app.get("/supervisors", (req, res) => {
  const sql = `
    SELECT id, name, email
    FROM users
    WHERE LOWER(role) = 'supervisor'
      AND LOWER(COALESCE(status, 'active')) IN ('active', 'approved')
    ORDER BY name, email
  `

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      supervisors: result
    })
  })
})

app.get("/approvers", (req, res) => {
  const { supervisorEmail } = req.query
  const params = []
  const conditions = ["LOWER(role) = 'hr'"]

  if (supervisorEmail) {
    conditions.push("(LOWER(role) = 'supervisor' AND LOWER(email) = ?)")
    params.push(String(supervisorEmail).toLowerCase())
  }

  const sql = `
    SELECT id, name, email, role
    FROM users
    WHERE (${conditions.join(" OR ")})
      AND LOWER(COALESCE(status, 'active')) IN ('active', 'approved')
    ORDER BY FIELD(role, 'supervisor', 'hr'), name, email
  `

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      approvers: result
    })
  })
})

// upload document API
app.post("/upload-document", upload.single("documentFile"), (req, res) => {

  const { title, uploadedBy, needSignature, dueDate, fileName, documentType, description, assignedTo } = req.body
  const savedFileName = req.file ? req.file.filename : fileName
  const requiresSignature = needSignature === true || needSignature === "true" || needSignature === "1"

  if (!title || !uploadedBy) {
    return res.json({
      success: false,
      message: "Title and uploader are required"
    })
  }

  const sql = `
    INSERT INTO documents (title, file_path, uploaded_by, assigned_to, need_signature, status, due_date, document_type, description)
    VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `

  db.query(
    sql,
    [
      title,
      savedFileName || null,
      uploadedBy,
      assignedTo || null,
      requiresSignature,
      dueDate || null,
      documentType || null,
      description || null
    ],
    (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    notifyUser(
      assignedTo || null,
      assignedTo ? "supervisor" : "hr",
      `${uploadedBy} uploaded ${title} for review`
    )

    res.json({
      success: true,
      message: "Document uploaded successfully",
      documentId: result.insertId,
      filePath: savedFileName || null
    })

  })

  if (requiresSignature) {
    notifyUser(
      assignedTo || null,
      assignedTo ? "supervisor" : "hr",
      "New document requires your signature",
    )
  }

})

app.post("/delete-document", (req, res) => {
  const { documentId, email, role } = req.body
  const selectedRole = String(role || "").toLowerCase()

  if (!documentId || !email) {
    return res.json({
      success: false,
      message: "Document ID and user email are required"
    })
  }

  const findSql = "SELECT file_path, uploaded_by FROM documents WHERE id = ?"

  db.query(findSql, [documentId], (findErr, documents) => {
    if (findErr) {
      return res.status(500).json({ error: findErr })
    }

    if (documents.length === 0) {
      return res.json({
        success: false,
        message: "Document not found"
      })
    }

    const document = documents[0]
    const canDelete = selectedRole === "hr" || String(document.uploaded_by || "").toLowerCase() === String(email).toLowerCase()

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete this document"
      })
    }

    db.query("DELETE FROM documents WHERE id = ?", [documentId], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr })
      }

      if (document.file_path) {
        const filePath = path.join(uploadDir, document.file_path)
        fs.unlink(filePath, (unlinkErr) => {
          if (unlinkErr && unlinkErr.code !== "ENOENT") {
            console.error("Unable to delete uploaded file:", unlinkErr.message)
          }
        })
      }

      res.json({
        success: true,
        message: "Document deleted"
      })
    })
  })
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

app.get("/documents/:id", (req, res) => {
  const { id } = req.params
  const { role, email } = req.query
  const selectedRole = String(role || "").toLowerCase()

  let sql = "SELECT * FROM documents WHERE id = ?"
  const params = [id]

  if (selectedRole === "intern" && email) {
    sql += " AND LOWER(uploaded_by) = ?"
    params.push(String(email).toLowerCase())
  }

  if (selectedRole === "supervisor" && email) {
    sql += " AND LOWER(assigned_to) = ?"
    params.push(String(email).toLowerCase())
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    if (result.length === 0) {
      return res.json({
        success: false,
        message: "Document not found"
      })
    }

    res.json({
      success: true,
      document: result[0]
    })
  })
})

app.get("/signature-count", (req, res) => {
  const { role, email } = req.query

  if (String(role || "").toLowerCase() !== "supervisor" || !email) {
    return res.json({
      success: true,
      count: 0
    })
  }

  const sql = `
    SELECT COUNT(*) AS count
    FROM documents
    WHERE LOWER(assigned_to) = ?
      AND need_signature = TRUE
      AND LOWER(COALESCE(status, 'pending')) = 'pending'
  `

  db.query(sql, [String(email).toLowerCase()], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      count: result[0]?.count || 0
    })
  })
})

app.get("/hr/users", (req, res) => {
  const activeSql = `
    SELECT users.id, users.name, users.email, users.role, users.status, users.supervisor_email,
      COUNT(documents.id) AS document_count,
      SUM(CASE WHEN documents.status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
      SUM(CASE WHEN documents.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
      SUM(CASE WHEN documents.status = 'rejected' THEN 1 ELSE 0 END) AS rejected_count
    FROM users
    LEFT JOIN documents ON documents.uploaded_by = users.email
    GROUP BY users.id, users.name, users.email, users.role, users.status, users.supervisor_email
    ORDER BY users.role, users.name
  `

  db.query(activeSql, (activeErr, activeUsers) => {
    if (activeErr) {
      return res.status(500).json({ error: activeErr })
    }

    res.json({
      success: true,
      users: activeUsers,
      activeUsers
    })
  })
})

app.get("/hr/users/:id", (req, res) => {
  const { id } = req.params

  db.query(
    "SELECT id, name, email, role, status, supervisor_email, created_at FROM users WHERE id = ?",
    [id],
    (userErr, users) => {
      if (userErr) {
        return res.status(500).json({ error: userErr })
      }

      if (users.length === 0) {
        return res.json({
          success: false,
          message: "User not found"
        })
      }

      const selectedUser = users[0]
      const selectedRole = String(selectedUser.role || "").toLowerCase()

      if (selectedRole === "intern") {
        const docsSql = "SELECT * FROM documents WHERE LOWER(uploaded_by) = ? ORDER BY id DESC"
        const supervisorSql = "SELECT id, name, email FROM users WHERE LOWER(email) = ? LIMIT 1"

        return db.query(docsSql, [selectedUser.email.toLowerCase()], (docsErr, documents) => {
          if (docsErr) {
            return res.status(500).json({ error: docsErr })
          }

          db.query(supervisorSql, [String(selectedUser.supervisor_email || "").toLowerCase()], (svErr, supervisors) => {
            if (svErr) {
              return res.status(500).json({ error: svErr })
            }

            res.json({
              success: true,
              user: selectedUser,
              documents,
              supervisor: supervisors[0] || null,
              interns: []
            })
          })
        })
      }

      if (selectedRole === "supervisor") {
        const internsSql = `
          SELECT id, name, email, role, status, supervisor_email, created_at
          FROM users
          WHERE LOWER(role) = 'intern' AND LOWER(COALESCE(supervisor_email, '')) = ?
          ORDER BY name, email
        `

        return db.query(internsSql, [selectedUser.email.toLowerCase()], (internErr, interns) => {
          if (internErr) {
            return res.status(500).json({ error: internErr })
          }

          res.json({
            success: true,
            user: selectedUser,
            interns,
            documents: [],
            supervisor: null
          })
        })
      }

      res.json({
        success: true,
        user: selectedUser,
        interns: [],
        documents: [],
        supervisor: null
      })
    }
  )
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
    VALUES (?, ?, ?, ?, 'active', ?)
  `

  db.query(
    "SELECT id FROM users WHERE LOWER(email) = ?",
    [email.toLowerCase()],
    (existingErr, existingUsers) => {
      if (existingErr) {
        return res.status(500).json({ error: existingErr })
      }

      if (existingUsers.length > 0) {
        return res.json({
          success: false,
          message: "This email already exists"
        })
      }

      db.query(
        sql,
        [name, email.toLowerCase(), password, selectedRole, selectedRole === "intern" ? supervisorEmail || null : null],
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
    }
  )
})

app.post("/hr/update-user", (req, res) => {
  const { userId, name, email, role, supervisorEmail, status } = req.body
  const selectedRole = String(role || "").toLowerCase()
  const nextStatus = String(status || "active").toLowerCase()

  if (!userId || !name || !email || !selectedRole) {
    return res.json({
      success: false,
      message: "User ID, name, email, and role are required"
    })
  }

  if (!["intern", "supervisor", "hr"].includes(selectedRole)) {
    return res.json({
      success: false,
      message: "Invalid role selected"
    })
  }

  if (!["active", "inactive", "approved", "deactivated"].includes(nextStatus)) {
    return res.json({
      success: false,
      message: "Invalid account status"
    })
  }

  const normalizedStatus = ["inactive", "deactivated"].includes(nextStatus) ? "inactive" : "active"

  const sql = `
    UPDATE users
    SET name = ?, email = ?, role = ?, status = ?, supervisor_email = ?
    WHERE id = ?
  `

  db.query(
    sql,
    [
      name,
      email.toLowerCase(),
      selectedRole,
      normalizedStatus,
      selectedRole === "intern" ? supervisorEmail || null : null,
      userId
    ],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err })
      }

      res.json({
        success: true,
        message: "User updated"
      })
    }
  )
})

app.post("/hr/reset-password", (req, res) => {
  const { userId, password } = req.body

  if (!userId || !password) {
    return res.json({
      success: false,
      message: "User ID and new password are required"
    })
  }

  db.query("UPDATE users SET password = ? WHERE id = ?", [password, userId], (err) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: "Password reset"
    })
  })
})

app.post("/hr/toggle-user-status", (req, res) => {
  const { userId, status } = req.body
  const nextStatus = String(status || "").toLowerCase()

  if (!userId || !["active", "inactive"].includes(nextStatus)) {
    return res.json({
      success: false,
      message: "User ID and valid status are required"
    })
  }

  db.query("UPDATE users SET status = ? WHERE id = ?", [nextStatus, userId], (err) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: `User ${nextStatus === "active" ? "activated" : "deactivated"}`
    })
  })
})

app.post("/hr/delete-user", (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.json({
      success: false,
      message: "User ID is required"
    })
  }

  db.query("UPDATE users SET status = 'inactive' WHERE id = ?", [userId], (err) => {
    if (err) {
      return res.status(500).json({ error: err })
    }

    res.json({
      success: true,
      message: "User deactivated"
    })
  })
})

app.post("/approve-document", (req, res) => {

  const { documentId, status, remarks, reviewerEmail } = req.body
  const nextStatus = String(status || "").toLowerCase()

  if (!documentId || !["approved", "rejected"].includes(nextStatus)) {
    return res.json({
      success: false,
      message: "Document ID and valid status are required"
    })
  }

  const findSql = "SELECT title, uploaded_by FROM documents WHERE id = ?"
  const sql = "UPDATE documents SET status = ?, remarks = ?, reviewed_by = ? WHERE id = ?"

  db.query(findSql, [documentId], (findErr, documents) => {
    if (findErr) {
      return res.status(500).json({ error: findErr })
    }

    db.query(sql, [nextStatus, remarks || null, reviewerEmail || null, documentId], (err, result) => {

    if (err) {
      return res.status(500).json({ error: err })
    }

    if (documents.length > 0) {
      notifyUser(
        documents[0].uploaded_by,
        "intern",
        `Your document "${documents[0].title}" was ${nextStatus}${remarks ? `: ${remarks}` : ""}`
      )
    }

    res.json({
      success: true,
      message: "Document status updated"
    })

  })
  })

})

app.post("/supervisor/upload-signed-document", upload.single("signedDocument"), (req, res) => {
  const { documentId, reviewerEmail, remarks } = req.body
  const signedFileName = req.file ? req.file.filename : null

  if (!documentId || !reviewerEmail || !signedFileName) {
    return res.json({
      success: false,
      message: "Document, supervisor, and signed file are required"
    })
  }

  const findSql = "SELECT title, uploaded_by FROM documents WHERE id = ?"
  const updateSql = `
    UPDATE documents
    SET signed_file_path = ?, status = 'approved', remarks = ?, reviewed_by = ?
    WHERE id = ?
  `

  db.query(findSql, [documentId], (findErr, documents) => {
    if (findErr) {
      return res.status(500).json({ error: findErr })
    }

    db.query(updateSql, [signedFileName, remarks || "Signed document uploaded", reviewerEmail, documentId], (err) => {
      if (err) {
        return res.status(500).json({ error: err })
      }

      if (documents.length > 0) {
        notifyUser(
          documents[0].uploaded_by,
          "intern",
          `Your document "${documents[0].title}" was signed and approved`
        )
      }

      res.json({
        success: true,
        message: "Signed document uploaded"
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
