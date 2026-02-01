# BPI Community Support Program (CSP) – System Development Workflow
Document for CTO & Technical Engineering Team

## 1. Qualification Criteria (System Rules/Logic Triggers)
A user qualifies for the CSP when the following are true:

1. **Active BPI Membership**
   - Regular Plus/basic Member: ₦10,750 / ₦53,750 activation. Note: the basic of ₦10,750 only allows the member to be able to contribute and build a virtual community; for the support button to be active the member must have upgraded to Regular Plus.
   - Gold / Platinum required for Global Community Support.
2. **Support Contribution Minimum:** Must have contributed ₦500 minimum to a cumulative ₦10,000 support given to other members before qualifying to receive.
3. **Virtual Community Requirements**
   - National CSP: Minimum 10 active full members (direct referrals)
   - Global CSP: Minimum 20 active full members (direct referrals)

**Eligibility Activation Trigger**
- Once the above conditions are met:
  - CSP Support Button changes to Green
  - Support Request Form becomes accessible

## 2. Support Category Types & Requirements

### A. National Community Support
| Requirement            | Value                     |
|------------------------|---------------------------|
| Membership Level       | Regular Plus              |
| Direct Invites         | Min. 10                   |
| Broadcast Duration     | 48 hours                  |
| Minimum Threshold      | ₦10,000                   |
| Notification Scope     | National BPI members      |
| Payout                 | After Management Approval |

### B. Global Community Support
| Requirement            | Value                     |
|------------------------|---------------------------|
| Membership Level       | Gold / Platinum           |
| Direct Invites         | Min. 20                   |
| Broadcast Duration     | 48 hours (Global)         |
| Minimum Threshold      | ₦20,000                   |
| Notification Scope     | All BPI Global Members    |
| Payout                 | After Management Approval |

## 3. Broadcast Time Extension Feature

**Option A – Pay for Additional Time**
| Amount Paid | Extra Time |
|-------------|------------|
| ₦40,000     | +24 hours  |
| ₦60,000     | +48 hours  |
| ₦80,000     | +72 hours  |
| ₦100,000    | Up to 7 days (Cap) |

**Option B – Direct Referrals Reward**
| Additional Direct Referrals | Extra Time |
|-----------------------------|------------|
| 30                          | +24 hours  |
| 40                          | +48 hours  |
| 50                          | +72 hours  |
| 100                         | Up to 7 Days (Cap) |

## 4. Support Request Submission Flow

**User Flow**
1. Support button turns Green (Qualification confirmed)
2. User clicks support request
3. User enters:
   - Purpose of support
   - Requested amount
4. The system sends a confirmation email to the user
5. Request submitted to the BPI Management Panel for approval

**Approval Workflow**
- The management dashboard receives a pending request
- Once approved:
  - Email notification to the recipient
  - Broadcast across member platforms & email alerts
  - Display message on the member dashboard homepage

## 5. Contribution & Wallet System Logic

**Contribution Funding Source**
- BPI Cash Wallet / Cashback Wallet

**Distribution Split**
| Split Percentage | Destination Wallet |
|------------------|--------------------|
| 80%              | Recipient Support Wallet |
| 20%              | Split across system wallets |

**Detailed Split of 20%**
| Allocation | %  | Description |
|------------|----|-------------|
| Admin Wallet | 5% | System administration. |
| Sponsor / Referrer Wallet | 1% | Reward to the direct sponsor |
| State Wallet | 2% | State reps linked to the wallet receive allocations |
| Management Wallet | 5% | Managed manually (add/remove beneficiaries) |
| Reserve Wallet | 7% | In case management wants to support a recipient with no support. |

## 6. Dashboard Display Requirements

**Real-Time CSP Dashboard**
- Live cumulative support for each active beneficiary
- Remaining balance to threshold
- Countdown timer for support window
- Real-time contributors list and amounts (optional editable visibility)
- Wallet balances display

**History Records**
- Full transaction and support history
- Date received, amount received, contributors list
- Next eligible support qualification date (2–3 years after cycle completion & renewal). Also, after the first benefit, the next cycle must meet the Global community support. If this condition is not met, the support button will not open.

## 7. Qualification for Next Cycle
- Eligible again after 2–3 years
- Must have a renewed membership continuously

## 8. System Notification Requirements
| Notification Type            | Trigger                                |
|-----------------------------|----------------------------------------|
| Qualification notice        | Eligibility met                        |
| Support request submitted   | Form completed                         |
| Approval notification       | Management approval                    |
| Broadcast announcement      | To email + dashboard + Telegram + WhatsApp bots |
| Contribution confirmation   | Member contributes                     |
| Countdown expiration notice | 6hrs, 3hrs, 1hr alerts                 |

## 9. Admin Panel Requirements
- Approve / Reject requests
- Edit thresholds/time extensions
- Manage wallets & beneficiaries
- View state wallet ledger
- Export support history report (CSV, PDF)

## 10. Technical Components
| Module             | Notes                                         |
|--------------------|-----------------------------------------------|
| Wallet Engine      | Multi-wallet handling with allocation automation |
| Referral Engine    | Track direct referral data                    |
| Broadcast Engine   | Based on membership level & country           |
| Notification Engine| Email + SMS + WhatsApp + In-app               |
| Countdown Timer    | Adjustable & extendable                       |
| Approval Engine    | Manual admin control                          |
| Logging & Compliance | Full audit trail                            |

## System Architecture (High-Level Flow)
Join BPI → Activate Membership → Build Virtual Community → Contribute Support → Meet Eligibility → Support Button Turns Green → Submit Support Request → Management Approval → Broadcast to Network → Members Contribute → Funds Auto-Split 80/20 → Wallet Distribution → Support Completed → next eligibility in 2-3 years

_End of CSP Technical Workflow Document_
