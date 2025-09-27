# ENS Integration Technical Implementation

This document outlines BrandX's technical implementation of Ethereum Name Service (ENS) for business domain migration and loyalty program member subdomain management.

## Why ENS?

ENS serves as the cornerstone of trust and identity in BrandX's loyalty program ecosystem, addressing two critical challenges in the Web3 business landscape:

### 1. Authentic Brand Verification & Anti-Counterfeiting

BrandX leverages ENS's DNS import functionality to establish unbreakable links between businesses and their authentic domain ownership. When a business like Apple.com migrates their existing DNS domain to ENS on-chain, it creates cryptographic proof of their legitimate identity that cannot be spoofed or counterfeited.

This DNS-to-ENS migration process (`/src/components/ens-domain-migration.tsx`) eliminates the possibility of fraudulent businesses impersonating established brands within our platform. Users can trust that when they interact with apple.com on BrandX, they are genuinely engaging with Apple Inc.'s official loyalty program, not a malicious actor. This verification system builds fundamental trust between consumers, brands, and our platform - essential for any successful loyalty ecosystem.

The on-chain nature of this verification means that once established, the business's authentic identity becomes immutable and globally verifiable, providing unprecedented transparency in brand-consumer relationships.

### 2. Decentralized Member Identity & Rich Metadata Resolution

Every loyalty program member receives a unique ENS subdomain (e.g., sarah.apple.eth) that serves as their permanent, portable identity within the BrandX ecosystem. This goes far beyond simple naming - each subdomain becomes a comprehensive identity profile that bridges multiple data sources seamlessly.

Through our custom offchain resolver (`/src/app/api/ens/mint-subdomain/route.ts`, `/src/app/api/ens/verify-subdomain/route.ts`), these subdomains resolve rich metadata including loyalty points from Kadena business contracts, social profiles from our database, and standard ENS records like avatars and descriptions (`/src/app/api/ens/fetch-subname-details/route.ts`). This creates a unified identity layer where a single ENS name unlocks access to cross-chain loyalty data, social connections, and program benefits.

Members can use their ENS subdomain across any ENS-compatible application while maintaining their BrandX identity and loyalty standing. This portability and interoperability transforms traditional siloed loyalty programs into an open, interconnected ecosystem where member identity transcends individual platforms.

ENS enables BrandX to deliver both uncompromising brand authenticity and rich, portable member identities - creating a loyalty program infrastructure that builds trust, prevents fraud, and empowers users with true ownership of their digital identity.

## DNS to ENS Migration Process

Businesses onboarding to BrandX migrate their existing DNS domains to ENS on Ethereum Sepolia testnet through a structured 5-step process:

### Example: Apple.com Domain Migration

1. **DNS Configuration Access**
   - Business accesses their domain registrar's DNS management interface (e.g., GoDaddy, Namecheap, Cloudflare)

2. **DNSSEC Enablement**
   - DNSSEC is enabled in DNS settings to ensure cryptographic domain security

3. **TXT Record Addition**
   - A specific TXT record is added to DNS:
     - **Type**: TXT
     - **Name**: _ens
     - **Data**: a={walletAddress}
   - Example for Apple.com: `a=0x742d35Cc6634C0532925a3b8D8431A76Fb53C8d9`

4. **Sepolia ETH Acquisition**
   - Business obtains Sepolia testnet ETH from Google's Web3 faucet for transaction fees

5. **On-chain Domain Import**
   - Business navigates to `https://sepolia.app.ens.domains/apple.com/import`
   - Selects "Import on-chain" to complete the ENS registration process

The migration component (`/src/components/ens-domain-migration.tsx:57-83`) includes real-time domain verification through the `/api/verify-ens` endpoint, ensuring proper DNS configuration before proceeding.

## Loyalty Program Subdomain Minting

Once domain migration is complete, businesses can mint ENS subdomains for loyalty program members. Each subdomain represents a unique member identity within the business ecosystem.

### Member Details Resolution

The system retrieves loyalty program member details through ENS resolution using our custom offchain resolver and CCIP-Read gateway. The fetch process (`/src/app/api/ens/fetch-subname-details/route.ts`) performs standard ENS resolution to extract comprehensive member information:

- **Standard ENS Records**: ETH address, content hash, avatar, description, URL
- **Social Media Integration**: Discord, GitHub, Twitter handles via text records
- **Contact Information**: Email addresses stored in ENS text records
- **Network Support**: Configurable for both Mainnet and Sepolia networks
- **Custom Resolver Integration**: Leverages the assigned custom resolver to bridge ENS queries with BrandX's member database

The resolution process queries the ENS Registry to locate the subdomain's resolver, then performs standard ENS text record lookups to retrieve all associated member metadata, ensuring seamless integration with existing ENS infrastructure.

### Technical Architecture

- **Blockchain**: Ethereum Sepolia testnet
- **ENS Registry**: `0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e`
- **Custom Resolver**: `0x5824Ef215aC14955fD93e0C1E039596FDdb0514D`
- **Data Storage**: Dual storage in Supabase and Kadena Chainweb business contracts

### Subdomain Minting Implementation

The minting process (`/src/app/api/ens/mint-subdomain/route.ts`) performs the following operations:

1. **Input Validation** (lines 42-49)
   - Validates required parameters: `parentDomain`, `subdomain`, `userAddress`
   - Optional `resolverAddress` defaults to custom resolver

2. **Cryptographic Calculations** (lines 63-71)
   ```typescript
   const parentNode = namehash(parentDomain)
   const subdomainLabel = keccak256(toHex(subdomain))
   const subdomainNode = namehash(fullSubdomain)
   ```

3. **Transaction Preparation** (lines 75-97)
   - Generates unsigned transaction data for frontend wallet signing
   - Calls ENS Registry's `setSubnodeRecord` function with parameters:
     - Parent domain namehash
     - Subdomain label hash
     - User address (owner)
     - Custom resolver address
     - TTL value (0 for no expiry)

4. **Official ENS Registry Registration**
   - All subdomains are registered in the official ENS Registry on Sepolia
   - Maintains ENS protocol compliance and interoperability

### Subdomain Verification

The verification endpoint (`/src/app/api/ens/verify-subdomain/route.ts`) ensures successful subdomain creation:

1. **Transaction Confirmation** (lines 54-66)
   - Waits for blockchain transaction confirmation with 240-second timeout
   - Handles transaction receipt validation

2. **On-chain Verification** (lines 68-82)
   - Queries ENS Registry for subdomain owner and resolver
   - Validates ownership matches expected user address
   - Confirms resolver points to custom resolver address

3. **Verification Results** (lines 88-119)
   - Returns comprehensive verification status including:
     - Ownership validation
     - Resolver configuration
     - Transaction hash confirmation
     - Success/failure messaging

## Data Architecture

### Dual Storage Strategy

1. **Supabase Database**: Stores complete member profile data, transaction history, and business relationships
2. **Kadena Chainweb**: Maintains business contract state and loyalty program logic

### Custom Resolver Functionality

The custom resolver (`0x5824Ef215aC14955fD93e0C1E039596FDdb0514D`) bridges ENS subdomain resolution with BrandX's data infrastructure, enabling:
- Member identity resolution
- Loyalty program data access
- Business-specific subdomain management

## Security Considerations

- All operations use Ethereum Sepolia testnet for development/testing
- DNSSEC validation ensures domain ownership authenticity
- Custom resolver implementation maintains data integrity
- Transaction confirmation timeouts prevent hanging operations
- Comprehensive error handling for blockchain interaction failures