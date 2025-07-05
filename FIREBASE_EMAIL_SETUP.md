# Firebase Email Template Configuration Guide

## Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `orther-hiseb`
3. Navigate to **Authentication** in the left sidebar

## Step 2: Configure Email Templates
1. Click on **Templates** tab
2. Find **Password reset** template
3. Click **Edit** button

## Step 3: Configure Email Settings

### Sender Information:
- **Sender name**: `অর্থের হিসেব`
- **Sender email**: `noreply@orther-hiseb.firebaseapp.com`
- **Subject**: `পাসওয়ার্ড রিসেট করুন - অর্থের হিসেব`

### Email Content (HTML):
```html
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>পাসওয়ার্ড রিসেট - অর্থের হিসেব</title>
    <style>
        body {
            font-family: 'Noto Serif Bengali', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8fafc;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            text-align: center;
            padding: 40px 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }
        .content {
            padding: 40px 30px;
        }
        .message {
            color: #374151;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 30px;
            text-align: center;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(34, 197, 94, 0.3);
            transition: all 0.3s ease;
        }
        .reset-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(34, 197, 94, 0.4);
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            text-align: center;
        }
        .warning p {
            color: #92400e;
            font-size: 14px;
            margin: 0;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #6b7280;
            font-size: 14px;
            margin: 5px 0;
        }
        .logo {
            font-size: 32px;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">💰</div>
            <h1>অর্থের হিসেব</h1>
            <p>আপনার পাসওয়ার্ড রিসেট করুন</p>
        </div>
        
        <div class="content">
            <div class="message">
                আপনি আপনার পাসওয়ার্ড রিসেট করার অনুরোধ করেছেন। নিচের বোতামে ক্লিক করে আপনার নতুন পাসওয়ার্ড সেট করুন:
            </div>
            
            <div class="button-container">
                <a href="{{LINK}}" class="reset-button">
                    🔐 পাসওয়ার্ড রিসেট করুন
                </a>
            </div>
            
            <div class="warning">
                <p>⚠️ এই লিংক ১ ঘন্টার জন্য বৈধ থাকবে</p>
            </div>
        </div>
        
        <div class="footer">
            <p>যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।</p>
            <p>ধন্যবাদ,<br><strong>অর্থের হিসেব টিম</strong></p>
        </div>
    </div>
</body>
</html>
```

### Plain Text Version:
```
অর্থের হিসেব - পাসওয়ার্ড রিসেট

আপনি আপনার পাসওয়ার্ড রিসেট করার অনুরোধ করেছেন। নিচের লিংকে ক্লিক করে আপনার নতুন পাসওয়ার্ড সেট করুন:

{{LINK}}

এই লিংক ১ ঘন্টার জন্য বৈধ থাকবে

যদি আপনি এই অনুরোধ না করে থাকেন, তাহলে এই ইমেইল উপেক্ষা করুন।

ধন্যবাদ,
অর্থের হিসেব টিম
```

## Step 4: Save Configuration
1. Click **Save** button
2. Test the email template by sending a password reset email

## Step 5: Additional Settings

### Authorized Domains:
1. Go to **Authentication > Settings**
2. Add your domain to **Authorized domains**:
   - `orther-hiseb.firebaseapp.com`
   - `localhost` (for development)
   - Your custom domain (if any)

### Email Verification:
1. Make sure **Email/Password** is enabled in **Sign-in methods**
2. Enable **Email verification** if needed

## Troubleshooting:

### If emails are not sending:
1. Check **Authentication > Users** to see if users exist
2. Verify **Authorized domains** include your app domain
3. Check **Firebase Console > Usage** for any quota issues
4. Look at browser console for error messages

### If emails are going to spam:
1. Configure SPF records for your domain
2. Use a custom domain for sender email
3. Ensure proper email authentication

## Testing:
1. Create a test user account
2. Try password reset functionality
3. Check email inbox (and spam folder)
4. Verify the reset link works correctly

## Notes:
- The `{{LINK}}` placeholder will be automatically replaced by Firebase
- The email template supports both HTML and plain text
- Bengali fonts will render properly in most email clients
- The button styling works in most modern email clients
