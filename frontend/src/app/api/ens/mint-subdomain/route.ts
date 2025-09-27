import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, namehash, keccak256, toHex } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

// ENS Registry address (same on mainnet and Sepolia)
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

// ENS Registry ABI
const ENS_REGISTRY_ABI = [
  {
    name: 'setSubnodeRecord',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'bytes32' },
      { name: 'owner', type: 'address' },
      { name: 'resolver', type: 'address' },
      { name: 'ttl', type: 'uint64' }
    ],
    outputs: []
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }]
  },
  {
    name: 'resolver',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ name: '', type: 'address' }]
  }
] as const

export async function POST(request: NextRequest) {
  try {
    const { parentDomain, subdomain, userAddress, resolverAddress } = await request.json()

    if (!parentDomain || !subdomain || !userAddress) {
      return NextResponse.json(
        { error: 'Missing required fields: parentDomain, subdomain, userAddress' },
        { status: 400 }
      )
    }

    // Use default resolver if not provided
    const RESOLVER_ADDRESS = resolverAddress || "0xeEe706A6Ef4a1f24827a58fB7bE6a07c6F219d1A"
    
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http()
    })

    console.log(`Minting ENS subdomain: ${subdomain}.${parentDomain}`)
    console.log(`User address: ${userAddress}`)
    console.log(`Resolver address: ${RESOLVER_ADDRESS}`)

    // Calculate namehashes
    const parentNode = namehash(parentDomain)
    const subdomainLabel = keccak256(toHex(subdomain))
    const fullSubdomain = `${subdomain}.${parentDomain}`
    const subdomainNode = namehash(fullSubdomain)

    console.log(`Parent node: ${parentNode}`)
    console.log(`Subdomain label: ${subdomainLabel}`)
    console.log(`Subdomain node: ${subdomainNode}`)

    // Return transaction data for frontend to sign
    // The frontend will handle wallet connection and signing
    return NextResponse.json({
      success: true,
      transactionData: {
        to: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: 'setSubnodeRecord',
        args: [
          parentNode,                           // Parent domain node
          subdomainLabel,                       // Subdomain label hash  
          userAddress,                          // Owner (the user)
          RESOLVER_ADDRESS,                     // Resolver address
          0                                    // TTL (0 = no expiry)
        ]
      },
      verificationData: {
        parentNode,
        subdomainNode,
        expectedOwner: userAddress,
        expectedResolver: RESOLVER_ADDRESS,
        fullSubdomain
      },
      message: 'Transaction data prepared for ENS subdomain creation'
    })


  } catch (error: any) {
    console.error('Error creating ENS subdomain:', error)
    
    // Parse specific ENS errors
    let errorMessage = 'Failed to create ENS subdomain'
    if (error.message?.includes('execution reverted')) {
      errorMessage = 'ENS transaction reverted - check domain ownership and permissions'
    } else if (error.message?.includes('insufficient funds')) {
      errorMessage = 'Insufficient funds for ENS transaction'
    } else if (error.message?.includes('nonce too low')) {
      errorMessage = 'Transaction nonce error - please retry'
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        ensError: error.shortMessage || error.message
      },
      { status: 500 }
    )
  }
}
