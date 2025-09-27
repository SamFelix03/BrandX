import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, createPublicClient } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { BUSINESS_CONTRACT_ABI, NETWORK_CONFIG } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, userAddress, ensName } = await request.json()

    if (!contractAddress || !userAddress || !ensName) {
      return NextResponse.json(
        { error: 'Missing required fields: contractAddress, userAddress, ensName' },
        { status: 400 }
      )
    }

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      )
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(NETWORK_CONFIG.rpcUrl)
    })
    
    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(NETWORK_CONFIG.rpcUrl)
    })

    console.log('Adding member to contract:', contractAddress)
    console.log('User address:', userAddress)
    console.log('ENS name:', ensName)

    // First check if member already exists
    try {
      const isAlreadyMember = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: BUSINESS_CONTRACT_ABI,
        functionName: 'loyaltyMembers',
        args: [userAddress]
      }) as boolean

      if (isAlreadyMember) {
        return NextResponse.json(
          { error: 'User is already a loyalty member' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error checking existing membership:', error)
    }

    // Check if ENS name is available
    try {
      const isENSAvailable = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: BUSINESS_CONTRACT_ABI,
        functionName: 'isENSNameAvailable',
        args: [ensName]
      }) as boolean

      if (!isENSAvailable) {
        return NextResponse.json(
          { error: 'ENS name is already taken' },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('Error checking ENS availability:', error)
    }

    // Simulate the transaction first to catch any revert errors
    const { request: addMemberRequest } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'addLoyaltyMember',
      args: [userAddress as `0x${string}`, ensName],
      account
    })

    // Execute the transaction
    const hash = await walletClient.writeContract(addMemberRequest)

    console.log('Add member transaction hash:', hash)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash,
      timeout: 60_000
    })

    console.log('Add member transaction confirmed:', receipt.transactionHash)

    // Verify the member was added successfully
    const isNowMember = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'loyaltyMembers',
      args: [userAddress]
    }) as boolean

    if (!isNowMember) {
      throw new Error('Member addition failed - member not found after transaction')
    }

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      message: 'Member added successfully to loyalty program'
    })

  } catch (error: any) {
    console.error('Error adding member to contract:', error)
    
    // Parse specific contract errors
    let errorMessage = 'Failed to add member to contract'
    if (error.message?.includes('Member exists')) {
      errorMessage = 'User is already a loyalty member'
    } else if (error.message?.includes('ENS taken')) {
      errorMessage = 'ENS name is already taken'
    } else if (error.message?.includes('Invalid ENS')) {
      errorMessage = 'Invalid ENS name format'
    } else if (error.message?.includes('Empty ENS')) {
      errorMessage = 'ENS name cannot be empty'
    }

    return NextResponse.json(
      { 
        error: errorMessage, 
        details: error.message,
        contractError: error.shortMessage || error.message
      },
      { status: 500 }
    )
  }
}
