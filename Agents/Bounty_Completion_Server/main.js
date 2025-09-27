import express from "express"
import cors from "cors"
import { createPublicClient, createWalletClient, http, decodeEventLog } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// --- KADENA CHAINWEB EVM TESTNET CONFIGURATION ---
const KADENA_TESTNET_CHAIN = {
  id: 5920,
  name: 'Kadena Chainweb EVM Testnet 20',
  network: 'kadena-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'KDA',
    symbol: 'KDA',
  },
  rpcUrls: {
    default: { http: ['https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc'] },
    public: { http: ['https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc'] },
  },
  blockExplorers: {
    default: {
      name: 'Kadena Testnet Explorer',
      url: 'http://chain-20.evm-testnet-blockscout.chainweb.com',
    },
  },
  testnet: true,
}

const RPC_URL = "https://evm-testnet.chainweb.com/chainweb/0.0/evm-testnet/chain/20/evm/rpc"
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY
const DEPLOYED_CONTRACT_ADDRESS = "0x97D559E2D0E543fD18Aa69AdE6429Dab7780d0C4"
const PORT = process.env.PORT || 3000

// Validate that private key is loaded from environment
if (!DEPLOYER_PRIVATE_KEY) {
  console.error("❌ DEPLOYER_PRIVATE_KEY not found in environment variables")
  console.error("Please create a .env file with DEPLOYER_PRIVATE_KEY=your_private_key")
  process.exit(1)
}

// Create Express app
const app = express()
app.use(cors())
app.use(express.json())

// --- ABI extracted from BusinessContract ---
const BUSINESS_CONTRACT_ABI = [
  {
    "inputs":[
      {"internalType":"string","name":"_uuid","type":"string"},
      {"internalType":"string","name":"_name","type":"string"},
      {"internalType":"string","name":"_description","type":"string"},
      {"internalType":"address","name":"_owner","type":"address"},
      {"internalType":"string","name":"_businessENSDomain","type":"string"}
    ],
    "stateMutability":"nonpayable",
    "type":"constructor"
  },
  {
    "anonymous":false,
    "inputs":[
      {"indexed":true,"internalType":"address","name":"user","type":"address"},
      {"indexed":true,"internalType":"uint256","name":"bountyId","type":"uint256"},
      {"indexed":false,"internalType":"uint256","name":"pointsEarned","type":"uint256"},
      {"indexed":false,"internalType":"bool","name":"hasDirectReward","type":"bool"}
    ],
    "name":"BountyCompleted",
    "type":"event"
  },
  {
    "inputs":[
      {"internalType":"address","name":"_user","type":"address"},
      {"internalType":"uint256","name":"_bountyId","type":"uint256"}
    ],
    "name":"completeBounty",
    "outputs":[],
    "stateMutability":"nonpayable",
    "type":"function"
  },
  {
    "inputs":[{"internalType":"address","name":"_user","type":"address"}],
    "name":"getUserData",
    "outputs":[
      {"internalType":"uint256","name":"totalPoints","type":"uint256"},
      {"internalType":"uint256[]","name":"completedBounties","type":"uint256[]"},
      {"internalType":"uint256[]","name":"ownedVouchers","type":"uint256[]"},
      {"internalType":"uint256[]","name":"claimedPrizes","type":"uint256[]"},
      {"internalType":"string","name":"ensName","type":"string"},
      {"internalType":"uint256","name":"joinedAt","type":"uint256"}
    ],
    "stateMutability":"view",
    "type":"function"
  }
]

// --------- Utility: format wei -> KDA (human friendly, up to 6 decimal places) ----------
function formatWeiToKda(weiBigInt) {
  const weiPerKda = 10n ** 18n
  const integer = weiBigInt / weiPerKda
  const fractional = weiBigInt % weiPerKda
  // get first 6 decimals
  const first6 = (fractional * 1000000n) / weiPerKda
  let fracStr = first6.toString().padStart(6, "0")
  // trim trailing zeros
  fracStr = fracStr.replace(/0+$/, "")
  return fracStr ? `${integer.toString()}.${fracStr}` : integer.toString()
}

// ---------------- Bounty Completion Logic ----------------
async function completeBounty(contractAddress, userAddress, bountyId) {
  // Normalize private key (trim and ensure 0x prefix)
  let pk = typeof DEPLOYER_PRIVATE_KEY === "string" ? DEPLOYER_PRIVATE_KEY.trim() : DEPLOYER_PRIVATE_KEY
  if (!pk.startsWith("0x")) pk = "0x" + pk

  // Basic length check
  if (pk.length !== 66) {
    throw new Error(`Invalid private key length: ${pk.length}. Expected 66 characters including 0x prefix.`)
  }

  // Derive account
  const account = privateKeyToAccount(pk)
  console.log("Derived account address from private key:", account.address)

  // Setup clients for Kadena testnet
  const publicClient = createPublicClient({
    chain: KADENA_TESTNET_CHAIN,
    transport: http(),
  })
  const walletClient = createWalletClient({
    account,
    chain: KADENA_TESTNET_CHAIN,
    transport: http(),
  })

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address })
  console.log("Deployer balance:", formatWeiToKda(balance), "KDA (approx)")
  
  const result = {
    success: false,
    network: "Kadena Chainweb EVM Testnet 20",
    chainId: KADENA_TESTNET_CHAIN.id,
    accountAddress: account.address,
    balance: formatWeiToKda(balance),
    contractAddress,
    userAddress,
    bountyId: bountyId.toString(),
    transactionHash: null,
    blockNumber: null,
    bountyCompletedEvent: null,
    explorerUrl: null,
    error: null
  }

  // First, simulate the call (this will catch reverts and provide request fee hints)
  let sim
  try {
    sim = await publicClient.simulateContract({
      address: contractAddress,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: "completeBounty",
      args: [userAddress, bountyId],
      account: account.address
    })
    console.log("✅ Transaction simulation successful")
  } catch (err) {
    result.error = `Simulation failed: ${err.message}`
    console.error("❌ Simulation failed (the call would revert or cannot be simulated):", err)
    return result
  }

  // Estimate gas (more reliable for required gas amount)
  let gasEstimate
  try {
    gasEstimate = await publicClient.estimateContractGas({
      address: contractAddress,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: "completeBounty",
      args: [userAddress, bountyId],
      account: account.address
    })
    console.log("Gas estimate (wei units):", gasEstimate.toString())
  } catch (err) {
    result.error = `Failed to estimate gas: ${err.message}`
    console.error("❌ Failed to estimate gas:", err)
    return result
  }

  // Get fee data from simulation or use fallback for Kadena
  let maxFeePerGas = sim?.request?.maxFeePerGas ?? null
  let maxPriorityFeePerGas = sim?.request?.maxPriorityFeePerGas ?? null

  // Fallback: use latest block baseFee to estimate maxFee (adjusted for Kadena testnet)
  if (!maxFeePerGas) {
    try {
      const latestBlock = await publicClient.getBlock({ blockTag: "latest" })
      const base = latestBlock?.baseFeePerGas ?? 1_000_000_000n // 1 gwei fallback
      // Use more conservative multiplier for testnet and add priority fee
      maxPriorityFeePerGas = 1_000_000_000n // 1 gwei priority fee
      maxFeePerGas = base * 2n + maxPriorityFeePerGas
      console.log("Using fallback baseFee * 2 for maxFeePerGas on Kadena testnet")
    } catch (err) {
      // If we can't get block data, use reasonable defaults for Kadena testnet
      maxPriorityFeePerGas = 1_000_000_000n // 1 gwei
      maxFeePerGas = 10_000_000_000n // 10 gwei
      console.log("Using hardcoded defaults for Kadena testnet fees")
    }
  }

  console.log("maxFeePerGas (wei):", maxFeePerGas.toString())
  if (maxPriorityFeePerGas) console.log("maxPriorityFeePerGas (wei):", maxPriorityFeePerGas.toString())

  const totalFeeWei = gasEstimate * maxFeePerGas
  console.log("Estimated total fee (wei):", totalFeeWei.toString())
  console.log("Estimated total fee (approx KDA):", formatWeiToKda(totalFeeWei), "KDA")

  // Check balance again to decide whether to proceed
  const currentBalance = await publicClient.getBalance({ address: account.address })
  if (currentBalance < totalFeeWei) {
    result.error = `Insufficient KDA funds. Balance: ${formatWeiToKda(currentBalance)} KDA, Required: ${formatWeiToKda(totalFeeWei)} KDA`
    console.error("❌ Insufficient funds to pay estimated gas.")
    console.error("Balance:", formatWeiToKda(currentBalance), "KDA; required (estimate):", formatWeiToKda(totalFeeWei), "KDA")
    return result
  }

  // Send the transaction
  try {
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: "completeBounty",
      args: [userAddress, bountyId],
      // pass estimated gas and fee overrides
      gas: gasEstimate,
      maxFeePerGas,
      ...(maxPriorityFeePerGas ? { maxPriorityFeePerGas } : {})
    })

    console.log("✅ Transaction submitted. Hash:", txHash)
    result.transactionHash = txHash
    result.explorerUrl = `${KADENA_TESTNET_CHAIN.blockExplorers.default.url}/tx/${txHash}`

    // Wait for receipt with longer timeout for testnet
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 180_000 // 3 minutes for testnet
    })
    console.log("✅ Transaction mined in block:", receipt.blockNumber?.toString())
    result.blockNumber = receipt.blockNumber?.toString()

    // Try decode logs for BountyCompleted
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: BUSINESS_CONTRACT_ABI,
          eventName: "BountyCompleted",
          data: log.data,
          topics: log.topics
        })
        if (decoded && decoded.eventName === "BountyCompleted") {
          const user = decoded.args.user
          const bountyIdFromEvent = decoded.args.bountyId
          const pointsEarned = decoded.args.pointsEarned
          const hasDirectReward = decoded.args.hasDirectReward
          
          result.bountyCompletedEvent = {
            user,
            bountyId: bountyIdFromEvent.toString(),
            pointsEarned: pointsEarned.toString(),
            hasDirectReward
          }
          console.log(`🎉 BountyCompleted event found: user=${user}, bountyId=${bountyIdFromEvent.toString()}, pointsEarned=${pointsEarned.toString()}, hasDirectReward=${hasDirectReward}`)
          break
        }
      } catch (e) {
        // not the event we care about — ignore
      }
    }

    result.success = true
    return result

  } catch (err) {
    result.error = `Transaction failed: ${err.message}`
    console.error("❌ Error completing bounty:", err)
    return result
  }
}

// Input validation helper
function validateInput(contractAddress, userAddress, bountyId) {
  const errors = []
  
  if (!contractAddress || typeof contractAddress !== 'string') {
    errors.push('contractAddress is required and must be a string')
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    errors.push('contractAddress must be a valid Ethereum address (0x followed by 40 hex characters)')
  }
  
  if (!userAddress || typeof userAddress !== 'string') {
    errors.push('userAddress is required and must be a string')
  } else if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
    errors.push('userAddress must be a valid Ethereum address (0x followed by 40 hex characters)')
  }
  
  if (bountyId === undefined || bountyId === null) {
    errors.push('bountyId is required')
  } else if (!Number.isInteger(Number(bountyId)) || Number(bountyId) < 0) {
    errors.push('bountyId must be a non-negative integer')
  }
  
  return errors
}

// API Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Kadena Bounty Completion Service',
    network: 'Kadena Chainweb EVM Testnet 20',
    chainId: KADENA_TESTNET_CHAIN.id,
    deployedContract: DEPLOYED_CONTRACT_ADDRESS,
    rpcUrl: RPC_URL
  })
})

// Get contract info endpoint
app.get('/contract-info', (req, res) => {
  res.json({
    contractAddress: DEPLOYED_CONTRACT_ADDRESS,
    network: 'Kadena Chainweb EVM Testnet 20',
    chainId: KADENA_TESTNET_CHAIN.id,
    rpcUrl: RPC_URL,
    explorerUrl: KADENA_TESTNET_CHAIN.blockExplorers.default.url,
    contractExplorerUrl: `${KADENA_TESTNET_CHAIN.blockExplorers.default.url}/address/${DEPLOYED_CONTRACT_ADDRESS}`
  })
})

// Complete bounty endpoint (uses deployed contract by default)
app.post('/complete-bounty', async (req, res) => {
  try {
    const { contractAddress = DEPLOYED_CONTRACT_ADDRESS, userAddress, bountyId } = req.body
    
    // Validate input
    const validationErrors = validateInput(contractAddress, userAddress, bountyId)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationErrors
      })
    }
    
    // Convert bountyId to BigInt
    const bountyIdBigInt = BigInt(bountyId)
    
    console.log(`🎯 Processing bounty completion request on Kadena:`)
    console.log(`  Contract: ${contractAddress}`)
    console.log(`  User: ${userAddress}`)
    console.log(`  Bounty ID: ${bountyId}`)
    console.log(`  Network: ${KADENA_TESTNET_CHAIN.name} (Chain ID: ${KADENA_TESTNET_CHAIN.id})`)
    
    // Execute bounty completion
    const result = await completeBounty(contractAddress, userAddress, bountyIdBigInt)
    
    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error in /complete-bounty:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Kadena Bounty Completion Server running on port ${PORT}`)
  console.log(`📋 Health check: http://localhost:${PORT}/health`)
  console.log(`📋 Contract info: http://localhost:${PORT}/contract-info`)
  console.log(`🎯 Complete bounty: POST http://localhost:${PORT}/complete-bounty`)
  console.log(`📖 Expected POST body:`)
  console.log(`   {`)
  console.log(`     "userAddress": "0x...",`)
  console.log(`     "bountyId": 1`)
  console.log(`   }`)
  console.log(`   Note: contractAddress is optional (defaults to deployed contract)`)
  console.log(``)
  console.log(`🌐 Network: ${KADENA_TESTNET_CHAIN.name}`)
  console.log(`🆔 Chain ID: ${KADENA_TESTNET_CHAIN.id}`)
  console.log(`📍 Contract: ${DEPLOYED_CONTRACT_ADDRESS}`)
  console.log(`🔗 Explorer: ${KADENA_TESTNET_CHAIN.blockExplorers.default.url}`)
})
