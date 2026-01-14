# Receipt Download Locations - Quick Guide

## 📥 Where to Find Your Transaction Receipts

We've implemented **4 different ways** to access and download your transaction receipts:

---

### 1. **Wallet Timeline Modal** (Most Common)
**Location:** Dashboard → Cash Wallet Balance → "View Timeline"

**Features:**
- Green "Receipt" button appears on every completed deposit/withdrawal
- Click to open receipt in new tab
- Available for:
  - ✅ Completed deposits
  - ✅ Completed cash withdrawals

**How to Use:**
1. Go to your dashboard
2. Click on your Cash Wallet balance card
3. Transaction cards show a green "Receipt" button for completed transactions
4. Click to download/view

---

### 2. **BPT Wallet Timeline Modal**
**Location:** Dashboard → BPT Wallet Balance → "View Timeline"

**Features:**
- Green "Receipt" button for completed BPT withdrawals
- Same functionality as cash wallet timeline
- Available for:
  - ✅ Completed BPT withdrawals

**How to Use:**
1. Go to your dashboard
2. Click on your BPT Wallet balance card
3. Find completed withdrawal transactions
4. Click the green "Receipt" button

---

### 3. **Notifications Modal**
**Location:** Dashboard → Bell Icon (Top Right) → Click on notification

**Features:**
- Deposit/withdrawal completion notifications include receipt links
- Click notification to open reading pane
- Green "Download Receipt" button appears if notification contains receipt link
- Opens receipt in new tab

**How to Use:**
1. Click the bell icon in the top navigation
2. Find a deposit or withdrawal completion notification
3. Click the notification to open details
4. Click the "Download Receipt" button

---

### 4. **Dedicated Receipts Page** ⭐ NEW
**Location:** Navigate to `/receipts`

**Features:**
- **Centralized hub** for all your receipts
- Filter by:
  - Transaction type (all, deposits only, withdrawals only)
  - Date range (today, last 7 days, last 30 days, last year, all time)
  - Search by reference, ID, or description
- **Statistics Dashboard:**
  - Total receipts count
  - Deposit receipts count
  - Withdrawal receipts count
- Large, prominent "Receipt" download button for each transaction
- Shows transaction details: date, amount, reference, description

**How to Use:**
1. Navigate to `/receipts` in your browser
2. Use filters to find specific receipts
3. Click the green "Receipt" button on any transaction
4. Receipt opens in new tab

---

## 🧾 Receipt Details

### Deposit Receipts
- **Header:** Blue gradient with BeepAgro logo
- **Shows:**
  - Deposit amount
  - 7.5% VAT charge
  - Total paid
  - Transaction ID & reference
  - Customer details (name, email)
  - Payment date & time
  - Company details (BeepAgro Africa)

### Withdrawal Receipts
- **Header:** Red gradient with BeepAgro logo
- **Shows:**
  - Withdrawal amount
  - 2.5% processing fee
  - Net amount
  - Transaction ID & reference
  - Bank/wallet details (depending on withdrawal type)
  - Customer details
  - Status badge
  - Company details

---

## 🎯 Receipt Availability

**Receipts are ONLY available for:**
- ✅ **Completed deposits** (status: completed)
- ✅ **Completed withdrawals** (status: completed)

**Receipts are NOT available for:**
- ❌ Pending transactions
- ❌ Failed transactions
- ❌ Rejected transactions
- ❌ Internal transfers
- ❌ VAT transactions (these are shown on parent deposit receipts)
- ❌ Fee transactions (these are shown on withdrawal receipts)

---

## 💡 Pro Tips

1. **Bookmark the Receipts Page:** Add `/receipts` to your bookmarks for quick access
2. **Print Receipts:** Receipts are print-ready - just use browser's print function (Ctrl+P)
3. **Save as PDF:** Use browser's "Print to PDF" option to save receipts
4. **Filter by Date:** Use the receipts page date filter to find receipts for tax purposes
5. **Search by Reference:** If you know the transaction reference, use search to find it instantly
6. **Notification Links:** Deposit/withdrawal completion notifications contain direct receipt links

---

## 🔗 Direct Receipt URLs

If you know your transaction ID, you can access receipts directly:

- **Deposit Receipt:** `/api/receipt/deposit/{transactionId}`
- **Withdrawal Receipt:** `/api/receipt/withdrawal/{transactionId}`

**Note:** You must be logged in and own the transaction to view the receipt.

---

## 📱 Mobile Access

All receipt download locations are fully responsive and work on mobile devices:
- Tap the green "Receipt" buttons
- Receipt opens in new mobile browser tab
- Pinch to zoom for better viewing
- Use browser share button to save or send

---

## 🛡️ Security

- **Authentication Required:** Must be logged in to view receipts
- **Ownership Verification:** Can only view receipts for your own transactions
- **Secure Links:** Receipt URLs expire when you log out
- **No Public Access:** Receipt links are not publicly shareable

---

## Need Help?

If you can't find a receipt:
1. Check that the transaction status is "completed"
2. Look in all 4 locations listed above
3. Use the receipts page search/filter feature
4. Check your notifications for receipt links
5. Contact support with your transaction ID

---

**Last Updated:** January 8, 2026  
**Version:** 1.0
