# 👨‍🚗 Driver Registration Form - Visual Structure

## Complete Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│                  👨‍🚗 Register New Driver                      │
│         Complete driver registration with document           │
│                   verification                              │
└─────────────────────────────────────────────────────────────┘

✅ SUCCESS MESSAGE (if applicable)
[Green background] Driver registered successfully!

═══════════════════════════════════════════════════════════════

📋 PERSONAL INFORMATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Full Name *                    │  Phone Number *           │
│  [Enter full name        ]      │  [10-digit mobile   ] ✗   │
│  Error text (if invalid)        │  Error text (if invalid)  │
│                                 │                           │
│  Email Address *                │  Password *               │
│  [email@example.com    ]        │  [••••••••••]             │
│  Error text (if invalid)        │  Error text (if invalid)  │
│                                 │                           │
│  Age *                          │  Driving Experience *     │
│  [28              ▼]            │  [5 years      ▼]         │
│  18-70 years                    │  0-50 years               │
│  Error text (if invalid)        │  Error text (if invalid)  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

📄 DOCUMENT INFORMATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Aadhar Number *                │  License Number *         │
│  [123456789012        ]         │  [DL0120230001234]        │
│  12-digit Aadhar required       │  Error text (if invalid)  │
│  Error text (if invalid)        │                           │
│                                 │                           │
│  License Expiry Date *                                      │
│  [2026-12-31           ▼]                                   │
│  Must not be expired                                        │
│  Error text (if invalid)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

📎 DOCUMENT UPLOADS
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Aadhar Card * (Image/PDF)      │  Driving License *       │
│  ┌─────────────────────────┐    │  ┌─────────────────────┐ │
│  │ 📁 Click to upload      │    │  │ 📁 Click to upload  │ │
│  └─────────────────────────┘    │  └─────────────────────┘ │
│  ✓ aadhar_card.jpg              │  ✓ license.pdf          │
│  Error text (if invalid)        │  Error text (if invalid)│
│                                 │                         │
│  Additional Documents (Optional, max 5)                    │
│  ┌──────────────────────────────────────────────┐          │
│  │ 📁 Click to upload                          │          │
│  └──────────────────────────────────────────────┘          │
│  ✓ insurance_certificate.pdf                              │
│  ✓ training_certificate.jpg                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

🏠 ADDRESS INFORMATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Street Address * (Full width field)                        │
│  [123 Main Street, Apartment 4B    ]                        │
│  Error text (if invalid)                                    │
│                                                             │
│  City *                         │  State *                  │
│  [Delhi           ]             │  [Delhi       ]           │
│  Error text                     │  Error text               │
│                                 │                           │
│  Pincode *                      │                           │
│  [110001          ]             │                           │
│  6-digit code                   │                           │
│  Error text (if invalid)        │                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

🚨 EMERGENCY CONTACT
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Contact Name *                 │  Contact Phone *          │
│  [Mother            ]           │  [9876543211       ]      │
│  Error text                     │  Error text               │
│                                 │                           │
│  Relationship * (Dropdown)      │                           │
│  [Select relationship ▼]        │                           │
│  ├─ Parent                      │                           │
│  ├─ Spouse                      │                           │
│  ├─ Sibling                     │                           │
│  ├─ Friend                      │                           │
│  └─ Other                       │                           │
│  Error text (if invalid)        │                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

💼 BUSINESS INFORMATION
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Rent Type *                    │                           │
│  [Weekly ▼] or [Monthly ▼]      │                           │
│                                 │                           │
│  Weekly Rent (₹)                │  (If Weekly Selected)    │
│  [₹ 5000              ]         │                           │
│  Enter weekly amount            │                           │
│                                 │                           │
│  Monthly Rent (₹)               │  (If Monthly Selected)   │
│  [₹ 20000             ]         │                           │
│  Enter monthly amount           │                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════

             [✅ REGISTER DRIVER] or [🚗 Registering...]

                            (Full Width Button)
```

---

## Color Scheme

```
Primary Colors:
├─ Gradient Background: #667eea → #764ba2 (Purple)
├─ Form Background: #FFFFFF (White)
├─ Text Primary: #2d3748 (Dark Gray)
├─ Text Secondary: #718096 (Medium Gray)
└─ Text Tertiary: #a0aec0 (Light Gray)

State Colors:
├─ Success: #c6f6d5 (Light Green) → #22543d (Dark Green)
├─ Error: #fed7d7 (Light Red) → #742a2a (Dark Red)
├─ Warning: #fef5e7 (Light Yellow) → #7d6608 (Dark Yellow)
├─ Disabled: #e2e8f0 (Very Light Gray)
└─ Focus: 0 0 0 3px rgba(102, 126, 234, 0.1) (Blue Glow)

Borders:
├─ Normal: #e1e5e9 (Light Border)
├─ Focus: #667eea (Purple Border)
├─ Error: #e53e3e (Red Border)
└─ Dashed: #cbd5e0 (File Upload)
```

---

## Responsive Breakpoints

### Desktop (1024px+)
```
┌─────────────────────────────────────────┐
│  Full Name *         │  Phone Number *   │
│  [Text Field ]       │  [Text Field ]    │
└─────────────────────────────────────────┘
3-4 columns per row
```

### Tablet (768px - 1023px)
```
┌──────────────────────────┐
│  Full Name *          │  Phone *    │
│  [Text Field ]        │  [Text]     │
└──────────────────────────┘
2 columns per row
```

### Mobile (375px - 767px)
```
┌─────────────────────┐
│  Full Name *        │
│  [Text Field ]      │
│                     │
│  Phone Number *     │
│  [Text Field ]      │
└─────────────────────┘
1 column per row
```

---

## Form States

### 1. Initial State
```
✓ All fields empty
✓ All labels visible
✓ No error messages
✓ Submit button enabled
✓ All fields have gray borders
```

### 2. Focus State
```
✓ Border color changes to purple (#667eea)
✓ Blue glow around field
✓ Cursor in field
✓ Label remains visible
```

### 3. Error State
```
✓ Border color changes to red (#e53e3e)
✓ Red glow around field
✓ Error text appears below field
✓ Red background on upload box (if file error)
✓ Submit button remains enabled
```

### 4. Valid State
```
✓ Green success message (if just validated)
✓ Gray border (normal)
✓ No error text
✓ All validation passed
```

### 5. Submission State
```
✓ Submit button shows "🚗 Registering Driver..."
✓ Button disabled (opacity: 0.6)
✓ Cursor: not-allowed
✓ All fields disabled
✓ Loading spinner visible (optional)
```

### 6. Success State
```
✓ Green banner at top: "✅ Driver registered successfully!"
✓ All fields cleared
✓ Form resets to initial state
✓ Optional: Close button on success message
```

### 7. Error State
```
✓ Red banner at top: "❌ Registration failed"
✓ Error message displayed
✓ Form data preserved
✓ All fields still editable
```

---

## Interactive Elements

### File Upload
```
Before Upload:
┌─────────────────────────────────┐
│ 📁 Click to upload              │
│ (Drag files here)               │
└─────────────────────────────────┘

After Hover:
┌─────────────────────────────────┐
│ 📁 Click to upload              │ (Border changes to purple)
│ (Drag files here)               │ (Background becomes lighter)
└─────────────────────────────────┘

After Selection:
┌─────────────────────────────────┐
│ ✓ aadhar_card.jpg              │ (Green checkmark + filename)
└─────────────────────────────────┘
```

### Dropdown Fields
```
┌─────────────────────────────────┐
│ Select relationship ▼           │ (Closed)
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Select relationship ▲           │ (Open)
├─ Parent                        │
├─ Spouse                        │
├─ Sibling                       │
├─ Friend                        │
└─ Other                         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Parent                ▼         │ (Selected)
└─────────────────────────────────┘
```

### Submit Button
```
Normal:
┌─────────────────────────────┐
│   ✅ Register Driver        │ (Cursor: pointer)
└─────────────────────────────┘
Gradient: Purple to Pink

Hover:
┌─────────────────────────────┐
│   ✅ Register Driver        │ (Lifted up 2px)
└─────────────────────────────┘        (Stronger shadow)

Disabled:
┌─────────────────────────────┐
│   ✅ Register Driver        │ (Grayed out)
└─────────────────────────────┘ (Cursor: not-allowed)
```

---

## Typography

```
Form Header
├─ Size: 2rem (32px)
├─ Weight: 700 (Bold)
├─ Color: #2d3748
└─ Margin: 0 0 0.5rem

Form Description
├─ Size: 1.1rem (17.6px)
├─ Weight: 400
├─ Color: #718096
└─ Margin: 0

Section Headers
├─ Size: 1.3rem (20.8px)
├─ Weight: 600
├─ Color: #2d3748
├─ Icon: Yes (emoji)
└─ Margin: 0 0 1.5rem

Field Labels
├─ Size: 0.9rem (14.4px)
├─ Weight: 600
├─ Color: #4a5568
├─ Asterisk: * (if required)
└─ Margin: 0 0 0.5rem

Error Text
├─ Size: 0.8rem (12.8px)
├─ Weight: 500
├─ Color: #e53e3e (Red)
└─ Margin: 0.25rem 0 0

Input/Select
├─ Size: 1rem (16px)
├─ Weight: 400
├─ Color: Default (input)
├─ Padding: 0.75rem 1rem
└─ Line-height: 1.5
```

---

## Spacing & Layout

```
Form Padding:        2rem (32px)
Section Margin:      2.5rem (40px) bottom
Section Padding:     2rem (32px) bottom
Form Grid Gap:       1.5rem (24px)
Form Group Margin:   1.5rem (24px) bottom

Mobile:
Form Padding:        1rem (16px)
Section Margin:      2rem (32px) bottom
Section Padding:     1.5rem (24px) bottom
Form Grid Gap:       1rem (16px)
```

---

## Shadow & Depth

```
Card Shadow:         0 4px 12px rgba(0, 0, 0, 0.05)
Card Border:         1px solid #e1e5e9
Button Shadow:       0 4px 12px rgba(102, 126, 234, 0.3)
Button Hover Shadow: 0 8px 24px rgba(102, 126, 234, 0.4)
Focus Glow:          0 0 0 3px rgba(102, 126, 234, 0.1)
Error Glow:          0 0 0 3px rgba(229, 62, 62, 0.1)
```

---

## Animation Timings

```
Transitions: 0.2s (Fast - borders, colors)
Button Hover: 0.3s (Smooth - transform, shadow)
All Easing:   ease (Smooth acceleration)
```

This provides a complete visual specification of the driver registration form!