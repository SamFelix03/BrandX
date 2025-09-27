import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http, namehash } from 'viem'
import { sepolia } from 'viem/chains'

// ENS Registry address (same on mainnet and Sepolia)
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'

// ENS Registry ABI
const ENS_REGISTRY_ABI = [
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
    const { 
      fullSubdomain, 
      expectedOwner, 
      expectedResolver,
      transactionHash 
    } = await request.json()

    if (!fullSubdomain || !expectedOwner) {
      return NextResponse.json(
        { error: 'Missing required fields: fullSubdomain, expectedOwner' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http()
    })

    console.log(`Verifying ENS subdomain: ${fullSubdomain}`)
    console.log(`Expected owner: ${expectedOwner}`)
    console.log(`Expected resolver: ${expectedResolver}`)

    // Calculate subdomain node
    const subdomainNode = namehash(fullSubdomain)

    // Wait for transaction confirmation if hash provided
    if (transactionHash) {
      console.log(`Waiting for transaction confirmation: ${transactionHash}`)
      try {
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash: transactionHash as `0x${string}`,
          timeout: 60_000
        })
        console.log('Transaction confirmed:', receipt.transactionHash)
      } catch (error) {
        console.warn('Transaction wait failed, proceeding with verification anyway:', error)
      }
    }

    // Verify the subdomain was created correctly
    const [subdomainOwner, subdomainResolver] = await Promise.all([
      publicClient.readContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: 'owner',
        args: [subdomainNode]
      }) as Promise<`0x${string}`>,
      publicClient.readContract({
        address: ENS_REGISTRY_ADDRESS,
        abi: ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [subdomainNode]
      }) as Promise<`0x${string}`>
    ])

    console.log('📋 Verification Results:')
    console.log(`Subdomain owner: ${subdomainOwner}`)
    console.log(`Subdomain resolver: ${subdomainResolver}`)

    // Verify ownership and resolver
    const ownershipCorrect = subdomainOwner.toLowerCase() === expectedOwner.toLowerCase()
    const resolverCorrect = !expectedResolver || 
      subdomainResolver.toLowerCase() === expectedResolver.toLowerCase()

    const verified = ownershipCorrect && resolverCorrect

    if (verified) {
      console.log(`✅ Successfully verified subdomain ${fullSubdomain}`)
    } else {
      console.log(`❌ Verification failed for subdomain ${fullSubdomain}`)
      if (!ownershipCorrect) {
        console.log(`  - Owner mismatch: expected ${expectedOwner}, got ${subdomainOwner}`)
      }
      if (!resolverCorrect) {
        console.log(`  - Resolver mismatch: expected ${expectedResolver}, got ${subdomainResolver}`)
      }
    }

    return NextResponse.json({
      success: true,
      verified,
      subdomain: fullSubdomain,
      owner: subdomainOwner,
      resolver: subdomainResolver,
      ownershipCorrect,
      resolverCorrect,
      transactionHash: transactionHash || null,
      message: verified 
        ? `ENS subdomain ${fullSubdomain} verified successfully`
        : `ENS subdomain ${fullSubdomain} verification failed`
    })

  } catch (error: any) {
    console.error('Error verifying ENS subdomain:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to verify ENS subdomain', 
        details: error.message
      },
      { status: 500 }
    )
  }
}
