// Contract addresses - these would be updated after deployment
export const CONTRACT_ADDRESSES = {
  FACTORY: "0x9bb2363810156f7b32b255677e8C1852AC1F95E6", // BrandXFactory deployed on Chainweb EVM Testnet 20 Testnet
  // Individual business contract addresses will be stored in database
} as const

export const ENS_RESOLVER_ADDRESS = "0x5824Ef215aC14955fD93e0C1E039596FDdb0514D"
// Reward types mapping to contract enums
export const REWARD_TYPES = {
  NONE: 0,
  WEB2_VOUCHER: 1,
  TOKEN_AIRDROP: 2
} as const

// Factory Contract ABI (simplified - would need full ABI after compilation)
export const FACTORY_ABI = [
  {
    "inputs": [
      { "name": "_uuid", "type": "string" },
      { "name": "_name", "type": "string" },
      { "name": "_description", "type": "string" },
      { "name": "_businessENSDomain", "type": "string" }
    ],
    "name": "deployBusinessContract",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "getOwnerBusinesses",
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllBusinessContracts",
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalBusinesses",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "uuid", "type": "string", "indexed": true },
      { "name": "contractAddress", "type": "address", "indexed": true },
      { "name": "owner", "type": "address", "indexed": true },
      { "name": "name", "type": "string", "indexed": false }
    ],
    "name": "BusinessContractDeployed",
    "type": "event"
  }
] as const

// Business Contract ABI (simplified - key functions for bounty management)
export const BUSINESS_CONTRACT_ABI = [
  // Reward Template Management
  {
    "inputs": [
      { "name": "_name", "type": "string" },
      { "name": "_description", "type": "string" },
      { "name": "_rewardType", "type": "uint8" },
      { "name": "_pointsValue", "type": "uint256" },
      { "name": "_voucherMetadata", "type": "string" },
      { "name": "_validityPeriod", "type": "uint256" },
      { "name": "_imageUrl", "type": "string" },
      { "name": "_brandColor", "type": "string" },
      { "name": "_tokenAddress", "type": "address" },
      { "name": "_tokenAmount", "type": "uint256" }
    ],
    "name": "addRewardTemplate",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Bounty Management
  {
    "inputs": [
      { "name": "_title", "type": "string" },
      { "name": "_description", "type": "string" },
      { "name": "_rewardTemplateId", "type": "uint256" },
      { "name": "_expiry", "type": "uint256" },
      { "name": "_maxCompletions", "type": "uint256" },
      { "name": "_category", "type": "string" },
      { "name": "_difficulty", "type": "string" },
      { "name": "_estimatedReward", "type": "uint256" },
      { "name": "_targetAudience", "type": "string" }
    ],
    "name": "createBounty",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_bountyId", "type": "uint256" }],
    "name": "toggleBounty",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // Prize Management
  {
    "inputs": [
      { "name": "_name", "type": "string" },
      { "name": "_description", "type": "string" },
      { "name": "_pointsCost", "type": "uint256" },
      { "name": "_maxClaims", "type": "uint256" },
      { "name": "_metadata", "type": "string" }
    ],
    "name": "createPrize",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  
  // View Functions
  {
    "inputs": [],
    "name": "getActiveBounties",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveRewards",
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActivePrizes", 
    "outputs": [{ "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_bountyId", "type": "uint256" }],
    "name": "getBounty",
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "title", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "rewardTemplateId", "type": "uint256" },
          { "name": "active", "type": "bool" },
          { "name": "expiry", "type": "uint256" },
          { "name": "maxCompletions", "type": "uint256" },
          { "name": "currentCompletions", "type": "uint256" },
          { "name": "category", "type": "string" },
          { "name": "difficulty", "type": "string" },
          { "name": "estimatedReward", "type": "uint256" },
          { "name": "targetAudience", "type": "string" }
        ]
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_prizeId", "type": "uint256" }],
    "name": "getPrize",
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "name", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "pointsCost", "type": "uint256" },
          { "name": "active", "type": "bool" },
          { "name": "maxClaims", "type": "uint256" },
          { "name": "currentClaims", "type": "uint256" },
          { "name": "metadata", "type": "string" }
        ]
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllMembers",
    "outputs": [{ "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_user", "type": "address" }],
    "name": "getUserData",
    "outputs": [
      { "name": "totalPoints", "type": "uint256" },
      { "name": "completedBounties", "type": "uint256[]" },
      { "name": "ownedVouchers", "type": "uint256[]" },
      { "name": "claimedPrizes", "type": "uint256[]" },
      { "name": "ensName", "type": "string" },
      { "name": "joinedAt", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_rewardId", "type": "uint256" }],
    "name": "getRewardTemplate",
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "components": [
          { "name": "id", "type": "uint256" },
          { "name": "name", "type": "string" },
          { "name": "description", "type": "string" },
          { "name": "rewardType", "type": "uint8" },
          { "name": "pointsValue", "type": "uint256" },
          { "name": "active", "type": "bool" },
          { "name": "voucherMetadata", "type": "string" },
          { "name": "validityPeriod", "type": "uint256" },
          { "name": "imageUrl", "type": "string" },
          { "name": "brandColor", "type": "string" },
          { "name": "tokenAddress", "type": "address" },
          { "name": "tokenAmount", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Loyalty Member Management
  {
    "inputs": [
      { "name": "_user", "type": "address" },
      { "name": "_ensName", "type": "string" }
    ],
    "name": "addLoyaltyMember",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "address" }],
    "name": "loyaltyMembers",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_ensName", "type": "string" }],
    "name": "isENSNameAvailable",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Token to Reward Template mapping
  {
    "inputs": [{ "name": "", "type": "uint256" }],
    "name": "tokenToRewardTemplate",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  
  // ERC721 tokenURI
  {
    "inputs": [{ "name": "tokenId", "type": "uint256" }],
    "name": "tokenURI",
    "outputs": [{ "name": "", "type": "string" }],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Voucher Claim Status
  {
    "inputs": [{ "name": "_tokenId", "type": "uint256" }],
    "name": "claimVoucher",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "name": "_tokenId", "type": "uint256" }],
    "name": "isVoucherClaimed",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "name": "", "type": "uint256" }],
    "name": "voucherClaimed",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Admin address constant
  {
    "inputs": [],
    "name": "ADMIN_ADDRESS",
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  
  // Events
  {
    "inputs": [
      { "indexed": true, "name": "bountyId", "type": "uint256" },
      { "indexed": false, "name": "title", "type": "string" },
      { "indexed": false, "name": "rewardTemplateId", "type": "uint256" }
    ],
    "name": "BountyCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "indexed": true, "name": "rewardId", "type": "uint256" },
      { "indexed": false, "name": "name", "type": "string" },
      { "indexed": false, "name": "rewardType", "type": "uint8" }
    ],
    "name": "RewardTemplateAdded",
    "type": "event"
  },
  {
    "inputs": [
      { "indexed": true, "name": "prizeId", "type": "uint256" },
      { "indexed": false, "name": "name", "type": "string" },
      { "indexed": false, "name": "pointsCost", "type": "uint256" }
    ],
    "name": "PrizeCreated",
    "type": "event"
  },
  {
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "ensName", "type": "string" }
    ],
    "name": "LoyaltyMemberAdded",
    "type": "event"
  },
  {
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "bountyId", "type": "uint256" },
      { "indexed": false, "name": "pointsAwarded", "type": "uint256" },
      { "indexed": false, "name": "hasDirectReward", "type": "bool" }
    ],
    "name": "BountyCompleted",
    "type": "event"
  },
  {
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "prizeId", "type": "uint256" },
      { "indexed": false, "name": "pointsCost", "type": "uint256" }
    ],
    "name": "PrizeClaimed",
    "type": "event"
  },
  {
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": true, "name": "tokenId", "type": "uint256" },
      { "indexed": false, "name": "claimTime", "type": "uint256" }
    ],
    "name": "VoucherClaimed",
    "type": "event"
  }
] as const

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 5920, // Chainweb EVM Testnet 20
  rpcUrl: "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc", // Chainweb EVM Testnet 20 RPC
  blockExplorer: "https://chain-20.evm-testnet-blockscout.chainweb.com"
} as const

// Web2 reward templates (available to all businesses)
export const WEB2_REWARD_TEMPLATES = [
  {
    id: 1,
    name: "10% Off Next Purchase",
    description: "Get 10% discount on your next order",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 50,
    voucherMetadata: JSON.stringify({
      discountPercentage: 10,
      validFor: "any purchase",
      terms: "Valid for 30 days from issuance. Cannot be combined with other offers.",
      excludes: ["gift cards", "shipping fees"]
    }),
    validityPeriod: 30 * 24 * 60 * 60, // 30 days
    imageUrl: "https://api.ez-earn.com/templates/discount-10.png",
    brandColor: "#4F46E5",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 2,
    name: "15% Off Next Purchase",
    description: "Get 15% discount on your next order",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 75,
    voucherMetadata: JSON.stringify({
      discountPercentage: 15,
      validFor: "any purchase",
      terms: "Valid for 60 days from issuance. Minimum purchase $50 required.",
      excludes: ["gift cards", "shipping fees", "sale items"]
    }),
    validityPeriod: 60 * 24 * 60 * 60, // 60 days
    imageUrl: "https://api.ez-earn.com/templates/discount-15.png",
    brandColor: "#059669",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 3,
    name: "20% Off Next Purchase",
    description: "Get 20% discount on your next order",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 100,
    voucherMetadata: JSON.stringify({
      discountPercentage: 20,
      validFor: "any purchase",
      terms: "Valid for 14 days from issuance. Minimum purchase $75 required.",
      excludes: ["gift cards", "shipping fees", "sale items", "subscriptions"]
    }),
    validityPeriod: 14 * 24 * 60 * 60, // 14 days
    imageUrl: "https://api.ez-earn.com/templates/discount-20.png",
    brandColor: "#DC2626",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 4,
    name: "Free Shipping Voucher",
    description: "Get free shipping on your next order",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 30,
    voucherMetadata: JSON.stringify({
      discountType: "free_shipping",
      validFor: "shipping costs",
      terms: "Valid for 45 days from issuance. Applies to standard shipping only.",
      excludes: ["express shipping", "international orders"]
    }),
    validityPeriod: 45 * 24 * 60 * 60, // 45 days
    imageUrl: "https://api.ez-earn.com/templates/free-shipping.png",
    brandColor: "#0891B2",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 5,
    name: "Buy One Get One 50% Off",
    description: "Get 50% off the second item when you buy two",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 80,
    voucherMetadata: JSON.stringify({
      discountType: "bogo_50",
      validFor: "eligible products",
      terms: "Valid for 21 days. 50% discount applies to lower-priced item. Must purchase 2+ items.",
      excludes: ["gift cards", "clearance items", "bundles"]
    }),
    validityPeriod: 21 * 24 * 60 * 60, // 21 days
    imageUrl: "https://api.ez-earn.com/templates/bogo-50.png",
    brandColor: "#7C3AED",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 6,
    name: "$5 Off $25 Purchase",
    description: "Get $5 off when you spend $25 or more",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 40,
    voucherMetadata: JSON.stringify({
      discountType: "fixed_amount",
      discountAmount: 5,
      minimumPurchase: 25,
      validFor: "any purchase",
      terms: "Valid for 30 days. Minimum purchase $25 required. One use per customer.",
      excludes: ["gift cards", "taxes", "shipping"]
    }),
    validityPeriod: 30 * 24 * 60 * 60, // 30 days
    imageUrl: "https://api.ez-earn.com/templates/fixed-5-off-25.png",
    brandColor: "#EA580C",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 7,
    name: "$10 Off $50 Purchase",
    description: "Get $10 off when you spend $50 or more",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 60,
    voucherMetadata: JSON.stringify({
      discountType: "fixed_amount",
      discountAmount: 10,
      minimumPurchase: 50,
      validFor: "any purchase",
      terms: "Valid for 45 days. Minimum purchase $50 required. One use per customer.",
      excludes: ["gift cards", "taxes", "shipping"]
    }),
    validityPeriod: 45 * 24 * 60 * 60, // 45 days
    imageUrl: "https://api.ez-earn.com/templates/fixed-10-off-50.png",
    brandColor: "#16A34A",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 8,
    name: "Free Item Voucher",
    description: "Get a free item from our featured collection",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 120,
    voucherMetadata: JSON.stringify({
      discountType: "free_item",
      validFor: "featured collection items",
      terms: "Valid for 14 days. Choose from eligible items. One free item per voucher.",
      excludes: ["premium items", "limited editions", "custom orders"]
    }),
    validityPeriod: 14 * 24 * 60 * 60, // 14 days
    imageUrl: "https://api.ez-earn.com/templates/free-item.png",
    brandColor: "#DB2777",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 9,
    name: "Early Access Pass",
    description: "Get 24-hour early access to new products and sales",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 90,
    voucherMetadata: JSON.stringify({
      discountType: "early_access",
      validFor: "new releases and sales",
      terms: "Valid for 90 days. Grants 24-hour early access to new products and exclusive sales.",
      excludes: ["clearance items", "third-party products"]
    }),
    validityPeriod: 90 * 24 * 60 * 60, // 90 days
    imageUrl: "https://api.ez-earn.com/templates/early-access.png",
    brandColor: "#9333EA",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 10,
    name: "Loyalty Points Only",
    description: "Earn loyalty points with no additional voucher",
    rewardType: "NONE" as const,
    category: "web2",
    pointsValue: 25,
    voucherMetadata: "",
    validityPeriod: 0,
    imageUrl: "https://api.ez-earn.com/templates/points-only.png",
    brandColor: "#64748B",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  }
] as const

// Web3 reward templates (only for token issuing entities)
export const WEB3_REWARD_TEMPLATES = [
  {
    id: 11,
    name: "100 Token Airdrop",
    description: "Receive 100 project tokens directly to your wallet",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 50,
    voucherMetadata: "",
    validityPeriod: 0,
    imageUrl: "https://api.ez-earn.com/templates/token-airdrop-100.png",
    brandColor: "#F59E0B",
    tokenAddress: "0x0000000000000000000000000000000000000000", // Set by business
    tokenAmount: 100,
    nftMetadata: ""
  },
  {
    id: 12,
    name: "50 Governance Tokens",
    description: "Receive 50 governance tokens for community participation",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 75,
    voucherMetadata: "",
    validityPeriod: 0,
    imageUrl: "https://api.ez-earn.com/templates/governance-token-50.png",
    brandColor: "#8B5CF6",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 50,
    nftMetadata: ""
  },
  {
    id: 13,
    name: "250 Token Bonus",
    description: "Receive 250 bonus tokens for high-value activities",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 100,
    voucherMetadata: "",
    validityPeriod: 0,
    imageUrl: "https://api.ez-earn.com/templates/token-bonus-250.png",
    brandColor: "#10B981",
    tokenAddress: "0x0000000000000000000000000000000000000000", // Set by business
    tokenAmount: 250,
    nftMetadata: ""
  },
  {
    id: 14,
    name: "25 Achievement Tokens",
    description: "Receive 25 special achievement tokens for milestones",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 40,
    voucherMetadata: "",
    validityPeriod: 0,
    imageUrl: "https://api.ez-earn.com/templates/achievement-token-25.png",
    brandColor: "#EF4444",
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 25,
    nftMetadata: ""
  },
  {
    id: 15,
    name: "500 LP Reward Tokens",
    description: "Receive 500 liquidity provider reward tokens",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 150,
    voucherMetadata: "",
    validityPeriod: 0,
    imageUrl: "https://api.ez-earn.com/templates/lp-reward-500.png",
    brandColor: "#3B82F6",
    tokenAddress: "0x0000000000000000000000000000000000000000", // Set by business
    tokenAmount: 500,
    nftMetadata: ""
  }
] as const

// Combined reward templates
export const REWARD_TEMPLATES = [...WEB2_REWARD_TEMPLATES, ...WEB3_REWARD_TEMPLATES] as const

// Default values for forms
export const DEFAULT_VALUES = {
  BOUNTY: {
    maxCompletions: 0, // unlimited
    expiry: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days from now
  },
  PRIZE: {
    pointsCost: 100,
    maxClaims: 0 // unlimited
  }
} as const

// Validation constants
export const VALIDATION = {
  MIN_POINTS: 1,
  MAX_POINTS: 10000,
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 500
} as const