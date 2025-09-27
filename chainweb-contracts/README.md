# Brand Hero Smart Contracts Documentation

**Factory Contract Address:** https://chain-20.evm-testnet-blockscout.chainweb.com/address/0x9bb2363810156f7b32b255677e8C1852AC1F95E6

## Why Kadena?

Kadena is the backbone that makes BrandX possible. Every time a business sets up their loyalty program through Brand Hero, we use a Business Factory Contract deployed on Kadena to spin up a dedicated smart contract exclusively for that business. This ensures that all bounty details, enrolled members, task completions, and reward claims are transparent, tamper-proof, and verifiable on-chain. It acts as a trust layer of our platform. By deploying each business's loyalty logic as an isolated contract, we guarantee scalability and security without data conflicts.

Our Smart contracts act as a legal agreement between the business and all its loyalty members. Kadena's Chainweb protocol plays a crucial role here. Since Chainweb is a braided, multi-chain architecture where multiple parallel chains work together, Brand Hero can scale to onboard thousands of businesses without worrying about congestion or high gas fees. Each business contract can execute simultaneously across chains, giving us massive throughput and predictably low costs, which is vital for loyalty programs with high-frequency interactions like bounty submissions and reward claims. It was like Chainweb was tailor-made for this!

On top of that, Kadena's ecosystem provides the NFT infrastructure we use to mint bounty completion tokens for members. These NFTs act as proof of participation and bounty completion, and the contracts also handle token transfers for token airdrop type rewards.

Basically, Our platform is a very good usecase for Kadena's RWA tokenization goals, by issuing both ERC721 (NFT) with all the voucher metadata for claiming web2 based bounty rewards and also supporting token airdrops for web3 based rewards.

## NFT Issuance and Token Transfers for RWA Tokenization

Brand Hero leverages Kadena's robust infrastructure to enable seamless Real World Asset (RWA) tokenization through two primary mechanisms:

### NFT Voucher System
When loyalty members complete bounties that offer web2-based rewards (like discounts, free items, or service credits), the system automatically mints ERC721 NFTs that serve as digital vouchers. These voucher NFTs contain rich metadata including:
- Reward details and redemption instructions
- Validity periods and usage terms
- Business branding elements (colors, images)
- Unique identifiers linking to the specific reward template

This approach transforms traditional loyalty rewards into tradeable, verifiable digital assets that members can hold in their wallets as proof of achievement and future value.

### Token Airdrop Functionality
For web3-native rewards, the contracts facilitate direct ERC20 token transfers to members' wallets upon bounty completion. This enables businesses to:
- Distribute their own utility tokens as rewards
- Integrate with existing DeFi ecosystems
- Provide liquid, transferable value to loyal customers
- Create token-based economies around their brand

## Onboarding the Next Million Retail Users

This dual-token approach (NFT + ERC20) is strategically designed to onboard MSMEs (Micro, Small & Medium Enterprises) and corporations into web3 by providing familiar loyalty mechanics with blockchain benefits:

1. **Familiar UX**: Traditional loyalty programs with blockchain transparency
2. **Gradual Web3 Adoption**: Start with simple rewards, evolve to DeFi integration  
3. **Asset Ownership**: Members truly own their rewards and achievements
4. **Interoperability**: Rewards can be used across different platforms and businesses
5. **Programmable Incentives**: Smart contract automation reduces operational overhead for businesses

## Contract Architecture

The Brand Hero system consists of two main smart contracts that work together to create a comprehensive loyalty platform:

### 1. BrandXFactory Contract (`BrandXFactory.sol`)

The factory contract serves as the central deployment hub and registry for all business contracts.

#### Key Structures:
```solidity
struct BusinessInfo {
    string uuid;                // Unique identifier for the business
    string name;                // Business display name
    string description;         // Business description
    address contractAddress;    // Deployed contract address
    address owner;              // Business owner wallet
    uint256 deployedAt;         // Deployment timestamp
    bool active;                // Active status flag
}
```

#### Core Functionality:
- **Contract Deployment**: Creates new `BusinessContract` instances for each business
- **Registry Management**: Maintains mappings of owners to their business contracts
- **Event Tracking**: Emits deployment events for transparency

#### Key Mappings:
- `mapping(address => address[]) ownerBusinesses`: Links business owners to their deployed contracts
- `address[] allBusinessContracts`: Global registry of all deployed business contracts

### 2. BusinessContract Contract (`BusinessContract.sol`)

Each business gets their own isolated contract instance with complete control over their loyalty program.

#### Core Data Structures:

##### RewardTemplate Struct:
```solidity
struct RewardTemplate {
    uint256 id;                 // Unique reward ID
    string name;                // "10% off next purchase"
    string description;         // Detailed reward description
    RewardType rewardType;      // NONE, WEB2_VOUCHER, TOKEN_AIRDROP
    uint256 pointsValue;        // Base points awarded
    bool active;                // Active status
    
    // Web2 Voucher Specific
    string voucherMetadata;     // JSON with discount %, terms, etc.
    uint256 validityPeriod;     // Voucher validity duration
    string imageUrl;            // Voucher background image
    string brandColor;          // Brand color for voucher styling
    
    // Web3 Token Specific
    address tokenAddress;       // ERC20 token contract address
    uint256 tokenAmount;        // Amount to airdrop
}
```

##### Bounty Struct:
```solidity
struct Bounty {
    uint256 id;                 // Unique bounty ID
    string title;               // Bounty title
    string description;         // Bounty description
    uint256 rewardTemplateId;   // Links to reward template
    bool active;                // Active status
    uint256 expiry;             // Expiration timestamp
    uint256 maxCompletions;     // Maximum completions (0 = unlimited)
    uint256 currentCompletions; // Current completion count
    
    // Enhanced Classification
    string category;            // "Social Media", "Purchase", "Engagement"
    string difficulty;          // "Easy", "Medium", "Hard"
    uint256 estimatedReward;    // Estimated value
    string targetAudience;      // Target member segment
}
```

##### Prize Struct:
```solidity
struct Prize {
    uint256 id;                 // Unique prize ID
    string name;                // Prize name
    string description;         // Prize description
    uint256 pointsCost;         // Points required to claim
    bool active;                // Active status
    uint256 maxClaims;          // Maximum claims (0 = unlimited)
    uint256 currentClaims;      // Current claim count
    string metadata;            // Prize-specific metadata
}
```

##### UserData Struct:
```solidity
struct UserData {
    uint256 totalPoints;                                // Total points balance
    uint256[] completedBounties;                       // Array of completed bounty IDs
    uint256[] ownedVouchers;                          // Array of owned voucher NFT token IDs
    uint256[] claimedPrizes;                          // Array of claimed prize IDs
    string ensName;                                   // Full ENS name (e.g., "sarah.joescoffee.eth")
    uint256 joinedAt;                                 // Registration timestamp
    mapping(uint256 => uint256) bountyCompletionTime; // Bounty completion timestamps
    mapping(uint256 => uint256) prizeClaimTime;       // Prize claim timestamps
}
```

## Member Management and ENS Integration

### ENS Subdomain System
Each business gets their own ENS domain (e.g., "joescoffee.eth"), and members receive subdomains:
- Format: `{username}.{businessdomain}.eth`
- Example: `sarah.joescoffee.eth`
- Managed through off-chain assignment with on-chain verification

### Member Data Storage:
- **Points Balance**: Accumulated through bounty completion
- **Achievement History**: Complete record of all completed bounties
- **Reward Ownership**: NFT vouchers and claimed prizes
- **ENS Identity**: Blockchain-based identity for the business ecosystem
- **Temporal Tracking**: Join dates and activity timestamps

## RWA Tokenization Features

### Voucher NFT System (Web2 Bridge):
1. **Automatic Minting**: NFTs minted upon bounty completion for WEB2_VOUCHER rewards
2. **Rich Metadata**: Includes business branding, terms, validity periods
3. **Claim Tracking**: On-chain verification of voucher usage
4. **Token URI**: Dynamic metadata generation for each voucher type

### Token Airdrop System (Web3 Native):
1. **Direct Transfers**: Immediate ERC20 token transfers to member wallets
2. **Multi-Token Support**: Support for any ERC20 token
3. **Balance Verification**: Ensures contract has sufficient tokens before transfer
4. **Event Logging**: Complete audit trail of all token distributions

## Security and Access Control

### Permission System:
- **Owner Control**: Business owners have full control over their contracts
- **Member Restrictions**: Members can only interact with assigned functions
- **Bounty Validation**: Multiple checks prevent double-completion and expired bounty claims

### Key Modifiers:
- `onlyOwnerOrAdmin`: Restricts access to business management functions
- `onlyLoyaltyMember`: Ensures only registered members can participate
- `bountyExists` / `rewardExists` / `prizeExists`: Validates entity existence

## Integration Points

### Factory Contract Integration:
- Deploys new business contracts with ENS domain assignment
- Maintains global registry for discovery and management
- Links business owners to their contract instances

### ERC721 Compliance:
- Full ERC721 implementation for voucher NFTs
- Custom tokenURI generation with reward metadata
- Ownership tracking and transfer capabilities

### ERC20 Token Support:
- Interface with any ERC20 token for airdrops
- Balance verification before token transfers
- Event emission for all token movements

This architecture creates a comprehensive loyalty platform that bridges traditional business needs with blockchain capabilities, enabling RWA tokenization through familiar loyalty program mechanics while providing true asset ownership to users.