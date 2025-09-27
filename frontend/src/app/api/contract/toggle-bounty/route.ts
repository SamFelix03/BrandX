import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { chainwebEvmTestnet } from '@/lib/chains'
import { BUSINESS_CONTRACT_ABI } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const { contractAddress, bountyId, walletAddress } = await req.json()

    if (!contractAddress || !bountyId || !walletAddress) {
      return NextResponse.json(
        { error: 'contractAddress, bountyId, and walletAddress are required' },
        { status: 400 }
      )
    }

    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      )
    }

    console.log('Toggling bounty:', { contractAddress, bountyId, walletAddress })

    // Initialize Web3 clients
    const publicClient = createPublicClient({
      chain: chainwebEvmTestnet,
      transport: http()
    })

    const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: chainwebEvmTestnet,
      transport: http()
    })

    // Check if bounty exists first
    try {
      await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: BUSINESS_CONTRACT_ABI,
        functionName: 'getBounty',
        args: [BigInt(bountyId)]
      })
    } catch (error) {
      return NextResponse.json(
        { error: 'Bounty does not exist' },
        { status: 404 }
      )
    }

    // Execute toggle bounty transaction
    const { request } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'toggleBounty',
      args: [BigInt(bountyId)],
      account
    })

    const hash = await walletClient.writeContract(request)
    console.log('Toggle bounty transaction hash:', hash)

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      timeout: 240_000 // 60 seconds timeout
    })

    if (receipt.status === 'success') {
      return NextResponse.json({
        success: true,
        transactionHash: hash,
        blockNumber: receipt.blockNumber.toString(),
        message: 'Bounty status toggled successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Transaction failed' },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Error toggling bounty:', error)
    
    // Handle specific contract errors
    if (error.message?.includes('Only owner or admin')) {
      return NextResponse.json(
        { error: 'Only business owner or admin can toggle bounties' },
        { status: 403 }
      )
    }
    
    if (error.message?.includes('Bounty does not exist')) {
      return NextResponse.json(
        { error: 'Bounty does not exist' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to toggle bounty status', details: error.message },
      { status: 500 }
    )
  }
}