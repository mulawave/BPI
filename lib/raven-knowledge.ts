export const KNOWLEDGE_BASE: Array<{
  keywords: string[];
  response: string;
  links?: { label: string; href: string }[];
}> = [
  {
    keywords: ["dashboard", "home", "overview", "portfolio"],
    response:
      "Your Dashboard is the central hub showing your Total Portfolio Value, wallet balances, BPI tokens, membership license, and rewards. You can Deposit, Withdraw, Transfer, manage Auto-Debit settings, and upgrade your membership from here.",
    links: [{ label: "Go to Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["wallet", "deposit", "withdraw", "transfer", "balance", "fund"],
    response:
      "Your Wallet supports deposits via multiple payment gateways, withdrawals (including USDT), and transfers between BPI users. You can access these from the Dashboard's Total Portfolio card. Auto-Debit settings are available at /wallet/settings for scheduled payments.",
    links: [
      { label: "Wallet Settings", href: "/wallet/settings" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    keywords: ["store", "shop", "buy", "product", "cart", "checkout", "purchase", "order"],
    response:
      "The BPI Superstore lets you purchase products using fiat, crypto, or hybrid checkout. Browse products, add to cart, and checkout with your preferred payment method. You can also track orders and verify pickups.",
    links: [
      { label: "Visit Store", href: "/store" },
      { label: "My Orders", href: "/store/orders" },
    ],
  },
  {
    keywords: ["csp", "community", "support", "program", "palliative"],
    response:
      "The Community Support Program (CSP) provides structured community assistance, palliative activations, and empowerment initiatives. You can check your CSP eligibility and status from the CSP page.",
    links: [{ label: "CSP Page", href: "/csp" }],
  },
  {
    keywords: ["blog", "news", "article", "magazine", "update"],
    response:
      "The BPI Blog features articles, news, and updates about the platform. You can browse the magazine and read individual posts.",
    links: [{ label: "Read Blog", href: "/blog" }],
  },
  {
    keywords: ["kyc", "verify", "verification", "identity", "document"],
    response:
      "KYC (Know Your Customer) verification is required to unlock full platform access. You'll need to provide personal info, address, a government-issued ID, and a selfie. Verification typically takes 24-48 hours.",
    links: [{ label: "Start KYC", href: "/kyc" }],
  },
  {
    keywords: ["membership", "tier", "upgrade", "elite", "club", "package"],
    response:
      "Membership tiers unlock exclusive benefits and higher earning potential. Visit the Elite Club to explore available tiers and upgrade your membership.",
    links: [{ label: "Elite Club", href: "/elite-club" }],
  },
  {
    keywords: ["empowerment", "empower", "program"],
    response:
      "The Empowerment program provides tools and resources for personal and financial growth. Explore available empowerment initiatives on the Empowerment page.",
    links: [{ label: "Empowerment", href: "/empowerment" }],
  },
  {
    keywords: ["techquiz", "quiz", "cbt", "exam", "school", "test"],
    response:
      "TechQuiz offers computer-based testing (CBT) and quiz competitions for schools and individuals. You can participate in quizzes, view results, and schools can administer exams.",
    links: [{ label: "TechQuiz", href: "/techquiz" }],
  },
  {
    keywords: ["settings", "profile", "account", "password", "2fa", "security"],
    response:
      "Account Settings lets you manage your profile, change your password, enable two-factor authentication (2FA), and configure security preferences.",
    links: [{ label: "Account Settings", href: "/settings" }],
  },
  {
    keywords: ["claim", "code", "pickup", "verify"],
    response:
      "After placing an order in the store, you'll receive a claim code. Use it to verify pickup at designated pickup centers. Go to Pickup Verify and enter your claim code to confirm collection.",
    links: [
      { label: "Verify Pickup", href: "/store/pickup-verify" },
      { label: "Pickup Centers", href: "/store/pickup-centers" },
    ],
  },
  {
    keywords: ["referral", "refer", "invite", "downline", "team"],
    response:
      "You can refer others to BPI using your referral link. Track your referrals, downline activity, and team growth from the Dashboard's community section.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["token", "bpt", "coin", "crypto"],
    response:
      "BPI Token (BPT) is the platform's native token. You can use it for store purchases, staking, and other platform activities. Your BPT balance is shown on the Dashboard.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["reward", "cashback", "rebate", "bonus"],
    response:
      "Rewards include cashback, educational credits, and bonuses earned through platform activity. Your rewards balance is displayed on the Dashboard and can be used in the store.",
    links: [{ label: "Dashboard", href: "/dashboard" }],
  },
  {
    keywords: ["learn", "learning", "education", "guide", "tutorial", "training"],
    response:
      "The Learning Center provides structured guides and tutorials to help you get the most out of BPI. Topics include getting started, wallet management, store usage, CSP, and advanced features.",
    links: [{ label: "Learning Center", href: "/learning" }],
  },
];

export function searchKnowledgeBase(query: string): typeof KNOWLEDGE_BASE {
  const normalized = query.toLowerCase().replace(/[!?.,]/g, "").trim();
  const words = normalized.split(/\s+/);
  const scored = KNOWLEDGE_BASE.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (normalized.includes(kw)) score += 3;
      for (const word of words) {
        if (kw.includes(word) && word.length > 2) score += 1;
      }
    }
    return { entry, score };
  })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.entry);
}

export const RAVEN_CONTEXT = `
About BPI / BeepAgro Africa
BeepAgro Africa is an agro-tech company focused on the adoption and implementation of blockchain and Web 3 technology in the marketing and distribution of its products. Its mission is to empower communities, drive innovation in agriculture, and create sustainable value chains across Africa. BPI believes in a community-first model for sustainable growth, powered by collaboration, training, and mentorship. Programs and services are tailored to uplift, train, and empower millions of Africans, transforming agriculture through innovation and technology.
Contact: BeepHouse 15b Yinusa Adeniji Street, Off Muslim Avenue, Ikeja, Lagos. Phone: +234 706 710 8437. Email: info@beepagro.com. Website: www.beepagro.com

BPI Learning Center modules:
- Getting Started: account registration, dashboard overview, profile & settings.
- Wallet Management: depositing funds, withdrawing funds, transferring between users, auto-debit settings.
- BPI Superstore: browsing the store, checkout process, order tracking, claim code & pickup.
- KYC Verification: KYC overview, document requirements, start verification.
- Membership & Elite Club: membership tiers, upgrade your membership, BPI Token (BPT).
- Community & CSP: CSP overview, referral program, empowerment initiatives.
- TechQuiz & CBT: TechQuiz overview, school administration, CBT exams.
- Blog & News: browse the blog, platform updates and announcements.

RAVEN's role:
RAVEN is the user's personal help, support, and educational assistant on BPI. It can explain platform features, guide users through wallet, store, CSP, blog, KYC, membership, TechQuiz, and account settings, and it can direct users to relevant pages when a topic requires a full guide or form.
`;
