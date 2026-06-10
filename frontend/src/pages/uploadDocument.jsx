import { useState } from "react"
import axios from "axios"

function UploadDocument() {

  const [title, setTitle] = useState("")
  const [needSignature, setNeedSignature] = useState(false)

const handleUpload = async () => {

    const res = await axios.post("http://localhost:5001/upload-document", {
      title: title,
      uploadedBy: "intern@test.com",
      needSignature: needSignature
    })

    console.log(res.data)

    if (res.data.success) {
      alert("Document uploaded!")
    } else {
      alert("Upload failed")
    }
  }
  

  return (
    <div>
      <h2>Upload Document</h2>

      <input
        placeholder="Document Title"
        onChange={(e) => setTitle(e.target.value)}
      />

      <br /><br />

      <label>
        <input
          type="checkbox"
          onChange={(e) => setNeedSignature(e.target.checked)}
        />
        Need Supervisor Signature
      </label>

      <br /><br />

      <button onClick={handleUpload}>Upload</button>
    </div>
  )
}

export default UploadDocument