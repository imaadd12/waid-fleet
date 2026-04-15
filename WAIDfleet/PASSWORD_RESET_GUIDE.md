# 🔐 PASSWORD RESET & RECOVERY GUIDE

## Quick Solutions to Reset Your Login Password

---

## **Option 1: Using the Web Interface (Easiest) ✅**

1. **Go to Login Page**: Navigate to `http://localhost:5176/login`
2. **Click "Forgot password?"** link at the bottom
3. **Enter your details**:
   - Email address (associated with your account)
   - New password (at least 6 characters)
   - Confirm new password
4. **Click "Reset Password"**
5. **Login with new password**

---

## **Option 2: Using API/cURL Command (Terminal)**

Reset password directly using curl:

```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "newPassword": "your-new-password"
  }'
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "newPassword": "NewPassword123"
  }'
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset successfully! You can now login with your new password."
}
```

---

## **Option 3: Using Test Credentials**

We created test drivers during setup. You can use these credentials:

### Test Driver Accounts:
```
1. John Doe
   Email: john@example.com
   Password: password123

2. Jane Smith
   Email: jane@example.com
   Password: password123

3. Mike Johnson
   Email: mike@example.com
   Password: password123
```

---

## **Option 4: Database Direct Access (Advanced)**

If you have MongoDB access:

```javascript
// Connect to MongoDB and reset password
const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

async function resetPassword() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('NewPassword123', salt);
  
  await User.findOneAndUpdate(
    { email: 'your-email@example.com' },
    { password: hashedPassword }
  );
  
  console.log('Password reset successfully!');
}
```

---

## **API Endpoint Details**

**POST** `/api/auth/reset-password`

### Request Body:
```json
{
  "email": "user@example.com",
  "newPassword": "NewPassword123"
}
```

### Response (Success - 200):
```json
{
  "success": true,
  "message": "Password reset successfully! You can now login with your new password."
}
```

### Response (User Not Found - 404):
```json
{
  "message": "User not found"
}
```

### Response (Error - 500):
```json
{
  "message": "Error message here"
}
```

---

## **Password Requirements**

- ✅ Minimum **6 characters** long
- ✅ Can contain letters, numbers, and special characters
- ✅ Must match confirmation password

---

## **Common Issues & Solutions**

| Issue | Solution |
|-------|----------|
| "User not found" | Make sure email address is correct |
| Passwords don't match | Ensure both password fields are identical |
| Still can't login | Wait a moment and try again, cache might need refresh |
| Forgot email too | Check MongoDB directly or contact admin |

---

## **Security Best Practices**

⚠️ **Important:**
- Don't share your password with anyone
- Use strong passwords (mix of letters, numbers, special characters)
- Never reset password on public networks
- Log out when done on shared computers

---

## **Need More Help?**

If you still can't reset your password:
1. Check MongoDB to find your email: `db.users.find({})`
2. Manually hash and update: Use BCryptJS to hash and update DB
3. Contact system administrator

---

**Created:** April 9, 2026
**System:** WAID Fleet Management Dashboard