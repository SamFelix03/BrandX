import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, decodeEventLog } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import { BUSINESS_CONTRACT_ABI, NETWORK_CONFIG } from '@/lib/constants'

interface PrizeData {
  name: string
  description: string
  pointsCost: number
  maxClaims: number
  metadata: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractAddress, prize, walletAddress } = body as {
      contractAddress: string
      prize: PrizeData
      walletAddress: string
    }

    if (!contractAddress || !prize || !walletAddress) {
      return NextResponse.json(
        { error: 'Contract address, prize data, and wallet address are required' },
        { status: 400 }
      )
    }

    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      )
    }

    console.log('Adding prize to contract:', contractAddress)
    console.log('Prize:', prize.name)

    // Initialize Web3 clients
    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(NETWORK_CONFIG.rpcUrl)
    })

    const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: arbitrumSepolia,
      transport: http(NETWORK_CONFIG.rpcUrl)
    })

    // Create prize on the contract
    const { request: prizeRequest } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'createPrize',
      args: [
        prize.name,
        prize.description,
        BigInt(prize.pointsCost),
        BigInt(prize.maxClaims),
        prize.metadata
      ],
      account
    })

    const prizeHash = await walletClient.writeContract(prizeRequest)
    console.log('Prize creation transaction submitted:', prizeHash)

    // Wait for transaction confirmation
    const prizeReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: prizeHash,
      timeout: 60_000
    })

    console.log('Prize transaction confirmed:', prizeReceipt.transactionHash)

    // Extract prize ID from logs
    let prizeId: bigint | undefined

    for (const log of prizeReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: BUSINESS_CONTRACT_ABI,
          eventName: 'PrizeCreated',
          data: log.data,
          topics: log.topics
        })
        
        if (decoded.eventName === 'PrizeCreated') {
          prizeId = decoded.args.prizeId
          break
        }
      } catch (e) {
        // Skip logs that don't match our event
        continue
      }
    }

    if (!prizeId) {
      throw new Error('Could not extract prize ID from transaction logs')
    }

    console.log('Prize created successfully with ID:', prizeId.toString())

    return NextResponse.json({
      success: true,
      prizeId: prizeId.toString(),
      transactionHash: prizeHash,
      blockNumber: prizeReceipt.blockNumber.toString(),
      gasUsed: prizeReceipt.gasUsed.toString(),
      message: `Prize "${prize.name}" created successfully`
    })

  } catch (error) {
    console.error('Add prize error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add prize',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}