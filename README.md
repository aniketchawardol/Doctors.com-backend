<h1> # Doctors.com Backend </h1>

## Overview
Doctors.com backend provides API endpoints and functionalities to manage hospital and patient-related operations. This backend supports features like uploading patient reports, submitting reports to specific hospitals, and searching for hospitals from a database.

## Features
- **User Authentication:** Secure authentication using JSON Web Tokens (JWT).
- **File Uploads:** Upload patient reports using Multer middleware, with optional Cloudinary integration for storing files.
- **Hospital Search:** Search for hospitals from the database using efficient queries.
- **Report Submission:** Submit patient reports to a specific hospital.
- **Data Security:** Passwords are hashed using bcrypt.
- **Pagination:** Paginate results for hospital listings and search queries to improve performance and user experience.
- **MongoDB Pipelines:**
  - Fetching all hospitals with aggregation pipelines to include relevant data and support filtering/sorting.
  - Submitting reports by aggregating and validating hospital and patient data.
  - Searching for a specific hospital by its name using optimized text indexes or regex patterns.

---

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repository/doctors.com-backend.git
   cd doctors.com-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following environment variables:
   ```env
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   CLOUDINARY_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

---

## Dependencies

<table class="table-auto border-collapse border border-gray-300 w-full">
  <thead>
    <tr>
      <th class="border border-gray-300 px-4 py-2 text-left">Dependency</th>
      <th class="border border-gray-300 px-4 py-2 text-left">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="border border-gray-300 px-4 py-2">bcrypt</td>
      <td class="border border-gray-300 px-4 py-2">Hashing passwords for secure authentication.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">cloudinary</td>
      <td class="border border-gray-300 px-4 py-2">Storing and managing uploaded reports.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">cookie-parser</td>
      <td class="border border-gray-300 px-4 py-2">Parsing cookies for request handling.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">cors</td>
      <td class="border border-gray-300 px-4 py-2">Enabling Cross-Origin Resource Sharing (CORS).</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">dotenv</td>
      <td class="border border-gray-300 px-4 py-2">Loading environment variables from .env.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">express</td>
      <td class="border border-gray-300 px-4 py-2">Backend framework for handling requests.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">jsonwebtoken</td>
      <td class="border border-gray-300 px-4 py-2">Creating and verifying JWTs for authentication.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">mongoose</td>
      <td class="border border-gray-300 px-4 py-2">MongoDB ODM for data modeling and queries.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">mongoose-aggregate-paginate-v2</td>
      <td class="border border-gray-300 px-4 py-2">Paginating query results in MongoDB.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">multer</td>
      <td class="border border-gray-300 px-4 py-2">Middleware for file uploads.</td>
    </tr>
    <tr>
      <td class="border border-gray-300 px-4 py-2">npm</td>
      <td class="border border-gray-300 px-4 py-2">Node.js package manager.</td>
    </tr>
  </tbody>
</table>


---

## API Endpoints

### Authentication
- **POST** `/api/v1/users/register` - Register a new user.
- **POST** `api/v1/users/login` - Authenticate and log in a user.

### Hospitals
- **GET** `api/v1/hospitals/all` - Fetch a list of hospitals.
- **GET** `api/v1/hospitals/{hospitalID}` - Get details of a specific hospital.
---

## File Uploads
- **Multer** is used to handle file uploads.
- **Cloudinary** is integrated for storing uploaded files securely in the cloud.

---

## Database
The backend uses **MongoDB** as the database, and **Mongoose** is used as the ODM for defining schemas and querying the database.

### Example Schemas
#### User Schema
```javascript
const patientSchema = new Schema(
  {fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,},
    email: {type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true },
    password: {type: String,required: [true, "Password is required"],},
    phonenumber: {type: String,trim: true,},
    profilephoto: {type: String, //cloudinary url},
    reports: {type: [String], //cloudinary url},
    hiddenreports: {type: [String], //cloudinary url},
    hospitals: [{ type: Schema.Types.ObjectId,ref: "Hospital",},],
    dob: { type: String,},
    bloodgroup: { type: String, },
    gender: {type: String,},
    refreshToken: { type: String}},
  {timestamps: true,});
```



---

## Security
- **Password Hashing:** User passwords are securely hashed using bcrypt.
- **JWT:** Tokens are used for secure authentication and session management.

---


## Contributing
Contributions are welcome! Please fork the repository and create a pull request.

Created with ❤️ by Aniket

