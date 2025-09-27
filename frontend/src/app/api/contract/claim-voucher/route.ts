import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http, createPublicClient } from 'viem'
import { chainwebEvmTestnet } from '@/lib/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { BUSINESS_CONTRACT_ABI } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, tokenId, walletAddress } = await request.json()

    if (!contractAddress || !tokenId || !walletAddress) {
      return NextResponse.json(
        { error: 'contractAddress, tokenId, and walletAddress are required' },
        { status: 400 }
      )
    }

    // Use admin private key from environment
    const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY
    if (!adminPrivateKey) {
      return NextResponse.json(
        { error: 'Admin private key not configured' },
        { status: 500 }
      )
    }

    const account = privateKeyToAccount(adminPrivateKey as `0x${string}`)
    
    const walletClient = createWalletClient({
      account,
      chain: chainwebEvmTestnet,
      transport: http()
    })

    const publicClient = createPublicClient({
      chain: chainwebEvmTestnet,
      transport: http()
    })

    // Check if voucher is already claimed
    const isAlreadyClaimed = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'isVoucherClaimed',
      args: [BigInt(tokenId)]
    }) as boolean

    if (isAlreadyClaimed) {
      return NextResponse.json(
        { error: 'Voucher is already claimed' },
        { status: 400 }
      )
    }

    // Call claimVoucher function
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'claimVoucher',
      args: [BigInt(tokenId)]
    })

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      blockNumber: receipt.blockNumber.toString()
    })

  } catch (error: any) {
    console.error('Error claiming voucher:', error)
    
    // Handle specific contract errors
    if (error.message?.includes('Voucher does not exist')) {
      return NextResponse.json(
        { error: 'Voucher does not exist' },
        { status: 404 }
      )
    }
    
    if (error.message?.includes('Voucher already claimed')) {
      return NextResponse.json(
        { error: 'Voucher is already claimed' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to claim voucher' },
      { status: 500 }
    )
  }
}