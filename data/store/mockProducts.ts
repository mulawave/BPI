export type ProductType = "physical" | "digital" | "license" | "service" | "utility";

export type RewardType = "CASH" | "CASHBACK" | "BPT" | "UTILITY_TOKEN";

export type RewardValueType = "FIXED" | "PERCENTAGE";

export interface RewardConfig {
  reward_id: string;
  reward_type: RewardType;
  reward_value: number;
  reward_value_type: RewardValueType;
  vesting_rule: "instant" | "delayed" | "milestone";
  max_reward_cap?: number;
  utility_token_symbol?: string;
}

export interface Product {
  product_id: string;
  name: string;
  description: string;
  product_type: ProductType;
  base_price_fiat: number;
  accepted_tokens: string[];
  token_payment_limits: Record<string, number>; // percent per token symbol
  reward_config: RewardConfig[];
  inventory_type: "unlimited" | "limited" | "time-bound";
  status: "active" | "paused" | "retired";
  hero_badge?: string;
  tags?: string[];
  image?: string;
  rating?: number;
  featured?: boolean;
}

export const mockProducts: Product[] = [
  {
    product_id: "bpi-food-pack",
    name: "Community Food Pack",
    description: "Curated essentials for households, prioritized for active members.",
    product_type: "physical",
    base_price_fiat: 25000,
    accepted_tokens: ["BPT", "PACT"],
    token_payment_limits: { BPT: 0.2, PACT: 0.1 },
    reward_config: [
      { reward_id: "rw1", reward_type: "CASHBACK", reward_value: 5, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
      { reward_id: "rw2", reward_type: "BPT", reward_value: 2, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
    ],
    inventory_type: "limited",
    status: "active",
    hero_badge: "Popular",
    tags: ["care", "family"],
    image: "/img/store/placeholder.jpg",
    rating: 4.8,
    featured: true,
  },
  {
    product_id: "bpi-ict-pass",
    name: "ICT Skills Pass (Teens)",
    description: "Access to guided ICT curriculum with mentor office hours.",
    product_type: "digital",
    base_price_fiat: 20000,
    accepted_tokens: ["BPT", "PACT"],
    token_payment_limits: { BPT: 0.3, PACT: 0.3 },
    reward_config: [
      { reward_id: "rw3", reward_type: "CASHBACK", reward_value: 3, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
      { reward_id: "rw4", reward_type: "UTILITY_TOKEN", reward_value: 5, reward_value_type: "PERCENTAGE", vesting_rule: "delayed", utility_token_symbol: "PACT" },
    ],
    inventory_type: "unlimited",
    status: "active",
    hero_badge: "Digital",
    tags: ["skills", "youth"],
    image: "/img/store/ict-pass.jpg",
    rating: 4.9,
    featured: true,
  },
  {
    product_id: "bpi-education-license",
    name: "Education License",
    description: "License for certified education partners to onboard cohorts.",
    product_type: "license",
    base_price_fiat: 150000,
    accepted_tokens: ["BPT"],
    token_payment_limits: { BPT: 0.5 },
    reward_config: [
      { reward_id: "rw5", reward_type: "BPT", reward_value: 4, reward_value_type: "PERCENTAGE", vesting_rule: "milestone", max_reward_cap: 20000 },
    ],
    inventory_type: "time-bound",
    status: "active",
    hero_badge: "License",
    tags: ["education", "license"],
    image: "/img/default.jpg",
    rating: 4.7,
    featured: true,
  },
  {
    product_id: "bpi-early-retirement",
    name: "Early Retirement License",
    description: "Structured plan with periodic rewards and governance participation.",
    product_type: "license",
    base_price_fiat: 300000,
    accepted_tokens: ["BPT", "PACT"],
    token_payment_limits: { BPT: 0.4, PACT: 0.2 },
    reward_config: [
      { reward_id: "rw6", reward_type: "CASH", reward_value: 5, reward_value_type: "PERCENTAGE", vesting_rule: "delayed" },
      { reward_id: "rw7", reward_type: "BPT", reward_value: 3, reward_value_type: "PERCENTAGE", vesting_rule: "milestone" },
    ],
    inventory_type: "limited",
    status: "active",
    hero_badge: "Flagship",
    tags: ["license", "retirement"],
    image: "/img/store/retirement-license.jpg",
    rating: 5.0,
    featured: true,
  },
  {
    product_id: "bpi-training-day",
    name: "Training Day (On-site)",
    description: "Hands-on learning and certification with local facilitators.",
    product_type: "service",
    base_price_fiat: 40000,
    accepted_tokens: ["BPT"],
    token_payment_limits: { BPT: 0.2 },
    reward_config: [
      { reward_id: "rw8", reward_type: "CASHBACK", reward_value: 5, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
    ],
    inventory_type: "limited",
    status: "active",
    hero_badge: "Training",
    tags: ["service", "skill"],
    image: "/img/store/placeholder.jpg",
    rating: 4.6,
    featured: true,
  },
  {
    product_id: "bpi-node-access",
    name: "Node Access (Validator)",
    description: "Access rights and operational support for validation nodes.",
    product_type: "utility",
    base_price_fiat: 120000,
    accepted_tokens: ["PACT"],
    token_payment_limits: { PACT: 0.5 },
    reward_config: [
      { reward_id: "rw9", reward_type: "UTILITY_TOKEN", reward_value: 10, reward_value_type: "PERCENTAGE", vesting_rule: "delayed", utility_token_symbol: "PACT" },
    ],
    inventory_type: "time-bound",
    status: "active",
    hero_badge: "Utility",
    tags: ["node", "utility"],
    image: "/img/default.jpg",
    rating: 4.5,
  },
  {
    product_id: "bpi-health-cover",
    name: "Health Cover Pack",
    description: "Community health support pack with emergency coverage.",
    product_type: "physical",
    base_price_fiat: 60000,
    accepted_tokens: ["BPT", "PACT"],
    token_payment_limits: { BPT: 0.25, PACT: 0.25 },
    reward_config: [
      { reward_id: "rw10", reward_type: "CASHBACK", reward_value: 4, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
      { reward_id: "rw11", reward_type: "BPT", reward_value: 2, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
    ],
    inventory_type: "limited",
    status: "active",
    hero_badge: "Health",
    tags: ["health", "support"],
    image: "/img/store/placeholder.jpg",
    rating: 4.7,
  },
  {
    product_id: "bpi-digital-library",
    name: "Digital Library Pass",
    description: "Unlimited access to curated PDFs, toolkits, and templates.",
    product_type: "digital",
    base_price_fiat: 15000,
    accepted_tokens: ["BPT"],
    token_payment_limits: { BPT: 0.3 },
    reward_config: [
      { reward_id: "rw12", reward_type: "CASHBACK", reward_value: 6, reward_value_type: "PERCENTAGE", vesting_rule: "instant" },
    ],
    inventory_type: "unlimited",
    status: "active",
    hero_badge: "Library",
    tags: ["digital", "content"],
    image: "/img/store/digital-library.jpg",
    rating: 4.8,
  },
];
