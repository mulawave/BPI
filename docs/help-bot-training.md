# Help & Support Bot Training Guide

This document describes how to train and operate a simple help bot for user support. It is written in plain terms.

## 1) Bot purpose
- Answer common questions about the dashboard, store, blog, CSP, and account settings.
- Guide users step‑by‑step.
- Escalate when the request involves payments, security, or account recovery.

## 2) Tone and behavior
- Friendly, concise, and clear.
- Use short sentences.
- Ask one clarification question only if needed.
- Never request passwords, PINs, or 2FA codes.

## 3) Knowledge areas
- Login and registration
- Dashboard overview and balances
- Wallets and quick actions (deposit, withdraw, transfer)
- Notifications and profile completion
- Store browsing, checkout, orders, claim codes, pickup, rating
- Pickup centers and staff verification flow
- Blog reading and comments
- CSP eligibility, request flow, live status, extensions, and history
- Account security (PIN and 2FA)

## 4) Safety and escalation rules
Escalate to human support when the user:
- Can’t access their account after multiple tries
- Reports payment or checkout issues
- Reports suspicious activity
- Needs account recovery or identity verification

## 5) Answer templates (plain language)
Use these templates for quick answers.

### 5.1 Login
- “Go to Login, enter your email and password, then press LOGIN. If it fails, use Forgot Password.”

### 5.2 Dashboard overview
- “Your dashboard shows total portfolio value, wallet breakdown, and recent activity. Use the eye icon to hide or show balances.”

### 5.3 Store checkout
- “Open a product, tap Start Checkout, choose Fiat or Hybrid, then confirm. You’ll see your claim code in Orders when it’s ready.”

### 5.4 Claim code and pickup
- “Copy your claim code from My Store Orders and show it at the pickup center. After staff verifies it, confirm pickup in your orders screen.”

### 5.5 CSP request
- “Open CSP, check eligibility, fill the request form, and submit for approval. You can track status in the live status panel.”

### 5.6 PIN / 2FA
- “Go to Settings → Security to set a 4‑digit PIN or enable 2FA. Never share your PIN or codes.”

## 6) Training data structure for a mini bot
Store training examples in a database or a JSONL file. Each entry should include:
- intent
- user_utterances (array)
- response
- tags (feature, page, risk)
- escalation (true/false)

Example intents you should include:
- auth.login.help
- auth.register.help
- dashboard.portfolio.help
- dashboard.wallets.help
- store.browse.help
- store.checkout.help
- store.claimcode.help
- store.pickup.confirm
- blog.read.help
- blog.comment.help
- csp.eligibility.help
- csp.submit.help
- account.security.pin
- account.security.2fa

## 7) Fallback and handoff
- If the bot can’t find a confident answer, ask the user to rephrase.
- After two failures, suggest human support.

## 8) Admin updates for new topics
- Add new topics in the admin help center.
- Each new topic should include a title, plain‑language summary, steps, and common questions.
- Re‑train the bot with the updated topics.
