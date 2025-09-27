// Contract addresses - these would be updated after deployment
export const CONTRACT_ADDRESSES = {
  FACTORY: "0xac770220C1824B977953a5663E00Be8f2F9a25Df", // Deployed on Arbitrum Sepolia
  // Individual business contract addresses will be stored in database
} as const

// Reward types mapping to contract enums
export const REWARD_TYPES = {
  NONE: 0,
  WEB2_VOUCHER: 1,
  TOKEN_AIRDROP: 2,
  NFT_REWARD: 3
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
    "inputs": [{ "name": "_uuid", "type": "string" }],
    "name": "getBusinessContract",
    "outputs": [{ "name": "", "type": "address" }],
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
      { "name": "_tokenAddress", "type": "address" },
      { "name": "_tokenAmount", "type": "uint256" },
      { "name": "_nftMetadata", "type": "string" }
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
      { "name": "_maxCompletions", "type": "uint256" }
    ],
    "name": "createBounty",
    "outputs": [{ "name": "", "type": "uint256" }],
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
          { "name": "currentCompletions", "type": "uint256" }
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
          { "name": "tokenAddress", "type": "address" },
          { "name": "tokenAmount", "type": "uint256" },
          { "name": "nftMetadata", "type": "string" }
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
  }
] as const

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 421614, // Arbitrum Sepolia testnet
  rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc", // Arbitrum Sepolia RPC
  blockExplorer: "https://sepolia.arbiscan.io"
} as const

// Web2 reward templates (available to all businesses)
export const WEB2_REWARD_TEMPLATES = [
  {
    id: 1,
    name: "Social Share Bonus",
    description: "50 points + 10% discount for sharing on social media",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 50,
    voucherMetadata: JSON.stringify({
      discountPercentage: 10,
      validFor: "next purchase",
      terms: "Valid for 30 days from issuance",
      excludes: []
    }),
    validityPeriod: 30 * 24 * 60 * 60, // 30 days
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 2,
    name: "Customer Referral",
    description: "75 points + 15% discount for successful referrals",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 75,
    voucherMetadata: JSON.stringify({
      discountPercentage: 15,
      validFor: "next purchase",
      terms: "Valid for 60 days, applies when referred friend makes first purchase",
      excludes: ["gift cards"]
    }),
    validityPeriod: 60 * 24 * 60 * 60, // 60 days
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 3,
    name: "Review & Rating",
    description: "25 points + 5% discount for verified reviews",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 25,
    voucherMetadata: JSON.stringify({
      discountPercentage: 5,
      validFor: "next purchase",
      terms: "Valid for 14 days, requires verified purchase",
      excludes: []
    }),
    validityPeriod: 14 * 24 * 60 * 60, // 14 days
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 4,
    name: "Newsletter Signup",
    description: "20 points for joining the newsletter community",
    rewardType: "NONE" as const,
    category: "web2",
    pointsValue: 20,
    voucherMetadata: "",
    validityPeriod: 0,
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  },
  {
    id: 5,
    name: "First Purchase Welcome",
    description: "100 points + 20% welcome discount for new customers",
    rewardType: "WEB2_VOUCHER" as const,
    category: "web2",
    pointsValue: 100,
    voucherMetadata: JSON.stringify({
      discountPercentage: 20,
      validFor: "first purchase only",
      terms: "Valid for 7 days, new customers only, minimum purchase $25",
      excludes: ["gift cards", "sale items", "subscriptions"]
    }),
    validityPeriod: 7 * 24 * 60 * 60, // 7 days
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: ""
  }
] as const

// Web3 reward templates (only for token issuing entities)
export const WEB3_REWARD_TEMPLATES = [
  {
    id: 6,
    name: "Token Airdrop",
    description: "50 points + 100 project tokens for community engagement",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 50,
    voucherMetadata: "",
    validityPeriod: 0,
    tokenAddress: "0x0000000000000000000000000000000000000000", // Set by business
    tokenAmount: 100,
    nftMetadata: ""
  },
  {
    id: 7,
    name: "Governance NFT",
    description: "75 points + voting rights NFT for active community members",
    rewardType: "NFT_REWARD" as const,
    category: "web3",
    pointsValue: 75,
    voucherMetadata: "",
    validityPeriod: 0,
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: JSON.stringify({
      category: "governance",
      utility: "voting_rights",
      attributes: [
        {"trait_type": "Voting Power", "value": "1"},
        {"trait_type": "Member Tier", "value": "Standard"}
      ]
    })
  },
  {
    id: 8,
    name: "Staking Bonus",
    description: "30 points + 50 bonus tokens for staking participation",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 30,
    voucherMetadata: "",
    validityPeriod: 0,
    tokenAddress: "0x0000000000000000000000000000000000000000", // Set by business
    tokenAmount: 50,
    nftMetadata: ""
  },
  {
    id: 9,
    name: "Achievement Badge",
    description: "40 points + commemorative NFT for milestones",
    rewardType: "NFT_REWARD" as const,
    category: "web3",
    pointsValue: 40,
    voucherMetadata: "",
    validityPeriod: 0,
    tokenAddress: "0x0000000000000000000000000000000000000000",
    tokenAmount: 0,
    nftMetadata: JSON.stringify({
      category: "achievement",
      rarity: "common",
      attributes: [
        {"trait_type": "Achievement Type", "value": "Community"},
        {"trait_type": "Date Earned", "value": "dynamic"}
      ]
    })
  },
  {
    id: 10,
    name: "Liquidity Provider",
    description: "150 points + 200 LP rewards for providing liquidity",
    rewardType: "TOKEN_AIRDROP" as const,
    category: "web3",
    pointsValue: 150,
    voucherMetadata: "",
    validityPeriod: 0,
    tokenAddress: "0x0000000000000000000000000000000000000000", // Set by business
    tokenAmount: 200,
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