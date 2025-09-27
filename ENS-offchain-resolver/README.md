# ENS Offchain Resolver & CCIP-Read Gateway

This document provides comprehensive technical documentation for BrandHero's ENS offchain resolver implementation and CCIP-Read gateway server.

## Why Offchain Resolver is Required

BrandHero's architecture utilizes **Kadena's Chainweb** as the primary Layer 1 blockchain for business applications and scalability. This design choice creates a unique challenge for ENS integration:

### Multi-Chain Data Architecture
- **Primary Chain**: Kadena Chainweb stores business contracts and loyalty program logic
- **Identity Layer**: Ethereum Sepolia hosts ENS domains for identity resolution
- **Database**: Supabase stores detailed user profile information and metadata

### The Redundancy Problem
Storing user data directly on Ethereum Sepolia would create unnecessary redundancy since:
1. Business logic and user points already exist on Kadena contracts
2. Detailed user profiles are efficiently stored in Supabase database
3. Ethereum storage costs would be prohibitive for comprehensive user data

### Solution: Offchain Resolution
The offchain resolver pattern allows ENS names to resolve data from external sources while maintaining ENS protocol compatibility. This enables:
- **Cross-chain data bridging** between Ethereum ENS and Kadena business contracts
- **Cost efficiency** by avoiding redundant on-chain storage
- **Rich metadata support** through database integration
- **Standard ENS compatibility** for existing tooling and applications

## Offchain Resolver Contract

**Deployed Address**: [`0x5824Ef215aC14955fD93e0C1E039596FDdb0514D` (Ethereum Sepolia)](https://sepolia.etherscan.io/address/0x5824Ef215aC14955fD93e0C1E039596FDdb0514D)

### Contract Architecture

The `OffchainResolver.sol` contract implements EIP-3668 (CCIP Read) to redirect ENS queries to an external gateway server.

#### Key Implementation Details

**Constructor & Configuration** (`lines 23-29`)
```solidity
constructor(string memory _url, address[] memory _signers) {
    url = _url;
    for(uint i = 0; i < _signers.length; i++) {
        signers[_signers[i]] = true;
    }
    emit NewSigners(_signers);
}
```
- Initializes gateway URL and authorized signer addresses
- Multiple signers provide redundancy and security

**Resolution Trigger** (`lines 41-52`)
```solidity
function resolve(bytes calldata name, bytes calldata data) external override view returns(bytes memory) {
    bytes memory callData = abi.encodeWithSelector(IResolverService.resolve.selector, name, data);
    string[] memory urls = new string[](1);
    urls[0] = url;
    revert OffchainLookup(
        address(this),
        urls,
        callData,
        OffchainResolver.resolveWithProof.selector,
        abi.encode(callData, address(this))
    );
}
```
- Triggers `OffchainLookup` error to initiate CCIP-Read protocol
- Encodes query parameters for gateway server processing

**Response Verification** (`lines 57-63`)
```solidity
function resolveWithProof(bytes calldata response, bytes calldata extraData) external view returns(bytes memory) {
    (address signer, bytes memory result) = SignatureVerifier.verify(extraData, response);
    require(signers[signer], "SignatureVerifier: Invalid sigature");
    return result;
}
```
- Verifies cryptographic signature from gateway server
- Ensures response authenticity and prevents tampering

## CCIP-Read Gateway Server

The gateway server bridges ENS queries with Kadena contracts and Supabase database to provide comprehensive user data resolution.

Deployed link: https://ccip-read-gateway.onrender.com

### Server Architecture

**Database Interface** (`server.ts:16-28`)
```typescript
export interface Database {
  addr(name: string, coinType: number): PromiseOrResult<{ addr: string; ttl: number }>;
  text(name: string, key: string): PromiseOrResult<{ value: string; ttl: number }>;
  contenthash(name: string): PromiseOrResult<{ contenthash: string; ttl: number }>;
}
```

**Query Processing Pipeline** (`server.ts:67-93`)
```typescript
async function query(db: Database, name: string, data: string): Promise<{ result: BytesLike; validUntil: number }> {
  const { signature, args } = Resolver.parseTransaction({ data });
  
  if (ethers.utils.namehash(name) !== args[0]) {
    throw new Error('Name does not match namehash');
  }

  const handler = queryHandlers[signature];
  const { result, ttl } = await handler(db, name, args.slice(1));
  return {
    result: Resolver.encodeFunctionResult(signature, result),
    validUntil: Math.floor(Date.now() / 1000 + ttl),
  };
}
```

**Cryptographic Signing** (`server.ts:106-119`)
```typescript
let messageHash = ethers.utils.solidityKeccak256(
  ['bytes', 'address', 'uint64', 'bytes32', 'bytes32'],
  [
    '0x1900',
    request?.to,
    validUntil,
    ethers.utils.keccak256(request?.data || '0x'),
    ethers.utils.keccak256(result),
  ]
);
const sig = signer.signDigest(messageHash);
const sigData = hexConcat([sig.r, sig.s, ethers.utils.hexlify(sig.v)]);
return [result, validUntil, sigData];
```

### Data Resolution Implementation

**ContractDatabase Class** (`contract-db.ts`)

#### ENS Name Parsing (`lines 28-41`)
```typescript
function parseENSName(ensName: string): { subdomain: string; businessDomain: string } | null {
  const parts = ensName.split('.');
  if (parts.length === 2) {
    return { subdomain: "", businessDomain: ensName };
  } else {
    const subdomain = parts[0];
    const businessDomain = parts.slice(1).join('.');
    return { subdomain, businessDomain };
  }
}
```

#### Business Contract Integration (`lines 76-103`)
```typescript
async function getUserDataFromContract(contractAddress: string, fullENSName: string): Promise<{ address: string; totalPoints: number; joinedAt: number } | null> {
  const contract = new ethers.Contract(contractAddress, BusinessContract_ABI, rpcProvider);
  const result = await contract.getUserByENSName(fullENSName);
  const [userAddress, totalPoints, ensName, joinedAt] = result;
  
  if (userAddress === ethers.constants.AddressZero) {
    return null;
  }

  return {
    address: userAddress,
    totalPoints: totalPoints.toNumber(),
    joinedAt: joinedAt.toNumber()
  };
}
```

#### Address Resolution Process (`lines 161-202`)
1. **Parse ENS name** into subdomain and business domain components
2. **Query Supabase** for business contract address using business domain
3. **Call Kadena contract** via RPC to get user wallet address and loyalty data
4. **Return formatted response** with TTL caching

#### Text Record Resolution (`lines 204-303`)
The server supports comprehensive ENS text record standards:

**Standard ENS Records (ENSIP-5)**
- `avatar`: Profile picture URL from Supabase
- `description`: User bio from profile data
- `com.twitter`, `com.github`: Social media handles
- `url`: Personal website URL

**BrandHero-Specific Records**
- `points`: Loyalty points from Kadena contract
- `joined`: User registration timestamp
- `business`: Associated business domain
- `contract`: Kadena contract address

**Data Flow**:
```typescript
// Get user data from Kadena contract
const userData = await getUserDataFromContract(contractAddress, name);

// Get profile data from Supabase
const profileData = await getUserProfileData(userData.address);

// Map to ENS text records
switch (key.toLowerCase()) {
  case 'avatar':
    value = profileData?.profile_picture_url || '';
    break;
  case 'points':
    value = userData.totalPoints.toString();
    break;
  // ... additional mappings
}
```

### Deployment Configuration

**Gateway URL**: Connected to the deployed resolver contract
**RPC Provider**: `https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc` (Kadena EVM)
**Database**: Supabase for user profiles and business metadata
**Caching**: 300-second TTL for optimized performance

The system provides seamless ENS resolution while leveraging the scalability benefits of Kadena blockchain and the rich metadata capabilities of traditional databases.