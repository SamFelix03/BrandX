import { NextRequest, NextResponse } from 'next/server'
import { createWalletClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { BUSINESS_CONTRACT_ABI, NETWORK_CONFIG } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { contractAddress, name, description, pointsCost, maxClaims, metadata } = await request.json()

    if (!contractAddress || !name || !description || !pointsCost) {
      return NextResponse.json(
        { error: 'Missing required fields: contractAddress, name, description, pointsCost' },
        { status: 400 }
      )
    }

    const privateKey = process.env.WALLET_PRIVATE_KEY
    if (!privateKey) {
      return NextResponse.json(
        { error: 'Wallet private key not configured' },
        { status: 500 }
      )
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`)
    
    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(NETWORK_CONFIG.rpcUrl)
    })

    console.log('Creating prize on contract:', contractAddress)
    console.log('Prize details:', { name, description, pointsCost, maxClaims, metadata })

    // Call createPrize function
    const hash = await walletClient.writeContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'createPrize',
      args: [
        name,
        description,
        BigInt(pointsCost),
        BigInt(maxClaims || 0), // 0 means unlimited
        metadata || ''
      ]
    })

    console.log('Prize creation transaction hash:', hash)

    return NextResponse.json({
      success: true,
      transactionHash: hash,
      message: 'Prize created successfully'
    })

  } catch (error) {
    console.error('Error creating prize:', error)
    return NextResponse.json(
      { error: 'Failed to create prize', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}