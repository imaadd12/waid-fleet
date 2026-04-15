# 🔧 Technical Implementation Details

## Backend Architecture

### Database Schema (MongoDB)

```javascript
driverSchema = {
  // Personal Information
  name: {
    type: String,
    required: true
  },
  
  phone: {
    type: String,
    required: true,
    unique: true,
    pattern: /^[6-9]\d{9}$/
  },
  
  email: {
    type: String,
    required: true,
    unique: true
  },
  
  password: {
    type: String,
    required: true
    // Hashed with bcrypt, salt rounds: 10
  },
  
  // New KYC Fields
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 70
  },
  
  experience: {
    type: Number,
    required: true,
    min: 0,
    max: 50
    // Years of driving experience
  },
  
  // Document uploads to Cloudinary
  aadharCard: {
    type: String,
    required: true
    // URL: https://res.cloudinary.com/.../drivers/aadhar/...
  },
  
  drivingLicense: {
    type: String,
    required: true
    // URL: https://res.cloudinary.com/.../drivers/license/...
  },
  
  documents: {
    type: [String],
    // Array of Cloudinary URLs for additional documents
  },
  
  // Document numbers
  aadharNumber: {
    type: String,
    required: true,
    pattern: /^\d{12}$/,
    unique: true
  },
  
  licenseNumber: {
    type: String,
    required: true,
    unique: true
  },
  
  licenseExpiry: {
    type: Date,
    required: true
    // Validated: must be > current date
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      pattern: /^\d{6}$/
    }
  },
  
  // Emergency Contact
  emergencyContact: {
    name: String,
    phone: {
      type: String,
      pattern: /^[6-9]\d{9}$/
    },
    relationship: String
  },
  
  // Verification status
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verificationStatus: {
    type: String,
    enum: ["pending", "verified", "rejected"],
    default: "pending"
  },
  
  verificationComments: String,
  verifiedAt: Date,
  
  // Business information
  rentType: {
    type: String,
    enum: ["weekly", "monthly"],
    default: "weekly"
  },
  
  weeklyRent: {
    type: Number,
    default: 0
  },
  
  monthlyRent: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  role: {
    type: String,
    enum: ["admin", "driver"],
    default: "driver"
  },
  
  refreshToken: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes for Performance
```javascript
// Optimized lookups
driverSchema.index({ phone: 1, email: 1 });
driverSchema.index({ isActive: 1, verificationStatus: 1 });
// Enables fast searches by phone/email
// Fast filtering by status
```

---

## API Controllers

### registerDriver() Function Flow

```
1. Receive Request
   ├─ Extract form data (name, phone, email, etc.)
   ├─ Extract uploaded files
   └─ Validate token (JWT)

2. Validate Input with Joi Schema
   ├─ Check required fields
   ├─ Validate formats (phone, email, pincode)
   ├─ Check value ranges (age 18-70, experience 0-50)
   └─ Return 400 if invalid

3. Check for Duplicates
   ├─ Search: phone (unique)
   ├─ Search: email (unique)
   ├─ Search: aadharNumber (unique)
   └─ Return 400 if exists

4. Validate Files
   ├─ Check aadharCard exists
   ├─ Check drivingLicense exists
   └─ Return 400 if missing

5. Upload to Cloudinary
   ├─ Aadhar Card → /drivers/aadhar/
   ├─ Driving License → /drivers/license/
   ├─ Additional Docs → /drivers/documents/
   └─ Get secure URLs

6. Hash Password
   ├─ Generate bcrypt salt
   ├─ Hash password with salt
   └─ Store hashed password

7. Create Driver in MongoDB
   ├─ Insert all fields
   ├─ Set verificationStatus: "pending"
   ├─ Save timestamps
   └─ Return created driver

8. Send Response
   ├─ Status: 201 (Created)
   ├─ Include _id, name, phone, email, verificationStatus
   └─ Exclude password, tokens
```

### getDrivers() Function Flow
```
1. Receive Request with Query Parameters
   ├─ page (default: 1)
   ├─ limit (default: 10)
   ├─ status (filter: active/inactive/pending/verified/rejected)
   └─ search (name/phone/email search)

2. Build Query Filter
   ├─ If status === "active": filter isActive: true
   ├─ If status === "inactive": filter isActive: false
   ├─ If status in [pending, verified, rejected]: filter verificationStatus
   └─ If search: regex search across name, phone, email

3. Execute MongoDB Query
   ├─ Find documents matching filter
   ├─ Exclude sensitive fields (password, refreshToken)
   ├─ Sort by createdAt (newest first)
   ├─ Pagination: skip & limit
   └─ Parallel count query

4. Calculate Pagination Metadata
   ├─ currentPage = page
   ├─ totalPages = ceil(total / limit)
   ├─ totalDrivers = total
   ├─ hasNext = page * limit < total
   └─ hasPrev = page > 1

5. Return Response
   ├─ drivers: [array of drivers]
   └─ pagination: { metadata }
```

---

## Frontend Component Structure

### AddDriver.jsx Component

```javascript
AddDriver Component
├─ State Management
│  ├─ formData (all form fields)
│  ├─ files (uploaded documents)
│  ├─ loading (submission state)
│  ├─ message (success/error message)
│  └─ errors (validation errors object)
│
├─ Event Handlers
│  ├─ handleInputChange() - Update form data
│  ├─ handleFileChange() - Handle file uploads
│  ├─ validateForm() - Client-side validation
│  └─ handleSubmit() - Submit form
│
├─ Validation Rules
│  ├─ Phone: regex pattern check
│  ├─ Email: email format check
│  ├─ Age: number range check
│  ├─ Aadhar: 12-digit check
│  ├─ Pincode: 6-digit check
│  └─ License Expiry: future date check
│
├─ Form Sections (Conditionally Rendered)
│  ├─ Personal Information
│  ├─ Document Information
│  ├─ Document Uploads
│  ├─ Address Information
│  ├─ Emergency Contact
│  ├─ Business Information
│  └─ Submit Button
│
└─ API Integration
   ├─ POST /api/drivers/register
   ├─ FormData with multipart
   ├─ JWT token in header
   └─ Success/error handling
```

### State Structure
```javascript
formData = {
  name: '',
  phone: '',
  email: '',
  password: '',
  age: '',
  experience: '',
  aadharNumber: '',
  licenseNumber: '',
  licenseExpiry: '',
  address: {
    street: '',
    city: '',
    state: '',
    pincode: ''
  },
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  },
  rentType: 'weekly',
  weeklyRent: '',
  monthlyRent: ''
}

files = {
  aadharCard: null,
  drivingLicense: null,
  documents: []
}

errors = {
  name: '',
  phone: '',
  // ... all fields
}
```

---

## File Upload Flow

### Client Side
```
User selects file (input onChange)
  ↓
validateFileType (image/pdf only)
  ↓
updateState (files.aadharCard = File object)
  ↓
displayFileName (✓ aadhar.jpg)
  ↓
includeInFormData (append to FormData)
```

### Server Side (registerDriver)
```
Receive files via multer
  ↓
validate file size (max 5MB)
  ↓
uploadToCloudinary()
  ├─ Create upload stream
  ├─ Specify folder (drivers/aadhar, etc)
  ├─ Set public_id (phone_aadhar_timestamp)
  ├─ Return secure_url on success
  └─ Reject or retry on error
  ↓
Receive Cloudinary URLs
  ↓
Store URLs in MongoDB documents
```

### Cloudinary URL Structure
```
https://res.cloudinary.com/{CLOUD_NAME}/image/upload/
   v{VERSION}/drivers/aadhar/{PUBLIC_ID}.{FORMAT}

Example:
https://res.cloudinary.com/mycloud/image/upload/
   v1704067200/drivers/aadhar/9876543210_aadhar_1704067200.jpg
```

---

## Request/Response Examples

### Register Driver Request
```
POST /api/drivers/register
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data

Multipart Body:
- name: "Raj Kumar"
- phone: "9876543210"
- email: "raj@example.com"
- password: "SecurePass123"
- age: "28"
- experience: "5"
- aadharNumber: "123456789012"
- licenseNumber: "DL0120230001234"
- licenseExpiry: "2026-12-31"
- address: "{\"street\":\"123 Main St\",\"city\":\"Delhi\",\"state\":\"Delhi\",\"pincode\":\"110001\"}"
- emergencyContact: "{\"name\":\"Mother\",\"phone\":\"9876543211\",\"relationship\":\"parent\"}"
- rentType: "weekly"
- weeklyRent: "5000"
- aadharCard: [binary file data]
- drivingLicense: [binary file data]
```

### Register Driver Response (Success)
```json
{
  "success": true,
  "message": "Driver registered successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Raj Kumar",
    "phone": "9876543210",
    "email": "raj@example.com",
    "age": 28,
    "experience": 5,
    "verificationStatus": "pending",
    "createdAt": "2024-01-02T10:30:00Z"
  }
}
```

### Register Driver Response (Error)
```json
{
  "success": false,
  "message": "Phone number already exists or Driver error validation failed"
}
```

---

## Validation Rules Implementation

### Joi Schema
```javascript
const driverRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  age: Joi.number().min(18).max(70).required(),
  experience: Joi.number().min(0).max(50).required(),
  aadharNumber: Joi.string().pattern(/^\d{12}$/).required(),
  licenseNumber: Joi.string().min(10).max(20).required(),
  licenseExpiry: Joi.date().greater('now').required(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().pattern(/^\d{6}$/).required()
  }).required(),
  emergencyContact: Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    relationship: Joi.string().required()
  }).required(),
  rentType: Joi.string().valid('weekly', 'monthly').default('weekly'),
  weeklyRent: Joi.number().min(0).default(0),
  monthlyRent: Joi.number().min(0).default(0)
});
```

### Client-Side Validation Examples
```javascript
// Phone validation
const isValidPhone = /^[6-9]\d{9}$/.test(formData.phone);
// Returns: true for "9876543210", false for "12345678901"

// Aadhar validation
const isValidAadhar = /^\d{12}$/.test(formData.aadharNumber);
// Returns: true for "123456789012", false for "123456789"

// Age validation
const isValidAge = formData.age >= 18 && formData.age <= 70;

// License expiry validation
const isValidExpiry = new Date(formData.licenseExpiry) > new Date();
```

---

## Error Handling Strategy

### Steps Taken
```
1. Joi Validation Error
   → Return 400 with validation error

2. Joi Error Details
   {
     "success": false,
     "message": "error.details[0].message"
     // Example: "Phone number must start with 6-9"
   }

3. Duplicate Detection
   → Check email, phone, aadharNumber
   → Return 400 "Driver already exists..."

4. File Validation
   → Check if files exist
   → Check file size (max 5MB)
   → Check file type (image/*, pdf)
   → Return 400 with specific error

5. Cloudinary Upload Error
   → Try upload, catch error
   → Return 500 "Failed to upload documents"

6. Database Error
   → Catch MongoDB error
   → Return 500 "Error saving driver"
```

---

## Security Implementation

### Password Security
```javascript
// Hashing
const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
// Stored: $2a$10$... (60 characters)
// Original password never stored or logged

// Never returned in API responses
delete driver.password;
```

### JWT Token Validation
```javascript
const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({message: "Not authorized"});
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({message: "Token failed"});
  }
};
```

### Admin Authorization
```javascript
const adminOnly = (req, res, next) => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      message: "Only admins can access this resource"
    });
  }
};
```

---

## Performance Optimizations

### Database Indexes
```javascript
// Speeds up lookups
db.drivers.createIndex({ phone: 1, email: 1 });
db.drivers.createIndex({ isActive: 1, verificationStatus: 1 });

// Query Performance
// Without index: O(n) - scans entire collection
// With index: O(log n) - binary search
```

### Multer Memory Storage
```javascript
// Memory storage (no disk writes)
const storage = multer.memoryStorage();

// Benefits:
// - Faster than disk storage
// - Direct stream to Cloudinary
// - No cleanup needed
```

### Cloudinary Folder Organization
```
drivers/
├─ aadhar/         (Aadhar cards)
├─ license/        (Driving licenses)
└─ documents/      (Additional docs)

Enables:
- Organized management
- Easier filtering
- Better security
- Clear audit trails
```

---

## Testing Suite

### Unit Tests to Implement
```javascript
describe('driverController', () => {
  describe('registerDriver', () => {
    test('should register driver with valid data');
    test('should reject duplicate phone number');
    test('should reject duplicate email');
    test('should validate age range');
    test('should validate aadhar format');
    test('should reject future license expiry');
    test('should upload files to Cloudinary');
    test('should hash password');
  });

  describe('getDrivers', () => {
    test('should return all drivers');
    test('should filter by status');
    test('should search by name');
    test('should paginate results');
  });

  describe('verifyDriver', () => {
    test('should mark driver as verified');
    test('should reject driver with comments');
    test('should set verification timestamp');
  });
});
```

---

This provides complete technical specifications for implementation and maintenance! 