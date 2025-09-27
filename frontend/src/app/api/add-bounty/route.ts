import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, decodeEventLog } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { chainwebEvmTestnet } from '@/lib/chains'
import { BUSINESS_CONTRACT_ABI, REWARD_TYPES } from '@/lib/constants'

interface RewardData {
  name: string
  description: string
  rewardType: keyof typeof REWARD_TYPES
  pointsValue: number
  voucherMetadata: string
  validityPeriod: number
  imageUrl: string
  brandColor: string
  tokenAddress: string
  tokenAmount: number
}

interface BountyData {
  title: string
  description: string
  expiry: number
  maxCompletions: number
  category: string
  difficulty: string
  estimatedReward: number | string
  targetAudience: string
  rewardData: RewardData
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { contractAddress, bounty, walletAddress } = body as {
      contractAddress: string
      bounty: BountyData
      walletAddress: string
    }

    if (!contractAddress || !bounty || !walletAddress) {
      return NextResponse.json(
        { error: 'Contract address, bounty data, and wallet address are required' },
        { status: 400 }
      )
    }

    // Validate bounty data fields
    if (!bounty.title || !bounty.description || !bounty.category || !bounty.difficulty || !bounty.targetAudience) {
      return NextResponse.json(
        { error: 'Missing required bounty fields: title, description, category, difficulty, targetAudience' },
        { status: 400 }
      )
    }

    if (typeof bounty.expiry !== 'number' || typeof bounty.maxCompletions !== 'number') {
      return NextResponse.json(
        { error: 'expiry and maxCompletions must be numbers' },
        { status: 400 }
      )
    }

    // Default estimatedReward to 0 if not provided and parse numeric value
    const estimatedReward = (() => {
      if (typeof bounty.estimatedReward === 'number') {
        return bounty.estimatedReward
      }
      if (typeof bounty.estimatedReward === 'string') {
        // Extract numeric value from strings like "1000 points"
        const numericMatch = bounty.estimatedReward.match(/\d+/)
        return numericMatch ? parseInt(numericMatch[0]) : 0
      }
      return 0
    })()

    // Validate reward data if provided
    if (bounty.rewardData) {
      if (!bounty.rewardData.name || !bounty.rewardData.description || !bounty.rewardData.rewardType) {
        return NextResponse.json(
          { error: 'Missing required reward data fields: name, description, rewardType' },
          { status: 400 }
        )
      }

      if (typeof bounty.rewardData.pointsValue !== 'number' || bounty.rewardData.pointsValue < 0) {
        return NextResponse.json(
          { error: 'pointsValue must be a non-negative number' },
          { status: 400 }
        )
      }
    }

    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      )
    }

    console.log('Adding bounty to contract:', contractAddress)
    console.log('Bounty:', bounty.title)
    console.log('Estimated reward (raw):', bounty.estimatedReward, 'type:', typeof bounty.estimatedReward)
    console.log('Estimated reward (parsed):', estimatedReward)

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

    // Step 1: Ensure reward template exists (reuse if matching one found)
    let rewardTemplateId: bigint | undefined

    // Fetch active reward templates
    const activeRewardIds = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getActiveRewards'
    }) as bigint[]

    for (const rid of activeRewardIds) {
      try {
        const rd = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getRewardTemplate',
          args: [rid]
        }) as any

        // Compare key fields to determine equivalence
        const sameType = Number(rd.rewardType) === REWARD_TYPES[bounty.rewardData.rewardType]
        const same =
          (rd.name || '') === bounty.rewardData.name &&
          (rd.description || '') === bounty.rewardData.description &&
          sameType &&
          (rd.pointsValue?.toString?.() || '0') === String(bounty.rewardData.pointsValue) &&
          (rd.voucherMetadata || '') === (bounty.rewardData.voucherMetadata || '') &&
          (rd.validityPeriod?.toString?.() || '0') === String(bounty.rewardData.validityPeriod || 0) &&
          (rd.imageUrl || '') === (bounty.rewardData.imageUrl || '') &&
          (rd.brandColor || '') === (bounty.rewardData.brandColor || '') &&
          (rd.tokenAddress || '').toLowerCase() === (bounty.rewardData.tokenAddress || '').toLowerCase() &&
          (rd.tokenAmount?.toString?.() || '0') === String(bounty.rewardData.tokenAmount || 0)

        if (same && rd.active) {
          rewardTemplateId = rd.id
          break
        }
      } catch (e) {
        continue
      }
    }

    // If not found, add a new reward template
    if (!rewardTemplateId) {
      const { request: rewardRequest } = await publicClient.simulateContract({
        address: contractAddress as `0x${string}`,
        abi: BUSINESS_CONTRACT_ABI,
        functionName: 'addRewardTemplate',
        args: [
          bounty.rewardData.name,
          bounty.rewardData.description,
          REWARD_TYPES[bounty.rewardData.rewardType],
          BigInt(bounty.rewardData.pointsValue || 0),
          bounty.rewardData.voucherMetadata || '',
          BigInt(bounty.rewardData.validityPeriod || 0),
          bounty.rewardData.imageUrl || '',
          bounty.rewardData.brandColor || '',
          (bounty.rewardData.tokenAddress || '0x0000000000000000000000000000000000000000') as `0x${string}`,
          BigInt(bounty.rewardData.tokenAmount || 0)
        ],
        account
      })

      const rewardHash = await walletClient.writeContract(rewardRequest)
      console.log('Reward template transaction submitted:', rewardHash)

      const rewardReceipt = await publicClient.waitForTransactionReceipt({ 
        hash: rewardHash,
        timeout: 240_000
      })

      for (const log of rewardReceipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: BUSINESS_CONTRACT_ABI,
            eventName: 'RewardTemplateAdded',
            data: log.data,
            topics: log.topics
          })
          if (decoded.eventName === 'RewardTemplateAdded') {
            rewardTemplateId = decoded.args.rewardId
            break
          }
        } catch (e) {
          continue
        }
      }

      if (!rewardTemplateId) {
        throw new Error('Could not extract reward template ID from transaction logs')
      }

      console.log('Reward template created with ID:', rewardTemplateId.toString())
    } else {
      console.log('Reusing existing reward template ID:', rewardTemplateId.toString())
    }

    // Step 2: Create bounty using the reward template
    const { request: bountyRequest } = await publicClient.simulateContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'createBounty',
      args: [
        bounty.title,
        bounty.description,
        rewardTemplateId,
        BigInt(bounty.expiry),
        BigInt(bounty.maxCompletions),
        bounty.category,
        bounty.difficulty,
        BigInt(estimatedReward),
        bounty.targetAudience
      ],
      account
    })

    const bountyHash = await walletClient.writeContract(bountyRequest)
    console.log('Bounty creation transaction submitted:', bountyHash)

    // Wait for bounty transaction
    const bountyReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: bountyHash,
      timeout: 240_000
    })

    // Extract bounty ID from logs
    let bountyId: bigint | undefined

    for (const log of bountyReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: BUSINESS_CONTRACT_ABI,
          eventName: 'BountyCreated',
          data: log.data,
          topics: log.topics
        })
        
        if (decoded.eventName === 'BountyCreated') {
          bountyId = decoded.args.bountyId
          break
        }
      } catch (e) {
        continue
      }
    }

    if (!bountyId) {
      throw new Error('Could not extract bounty ID from transaction logs')
    }

    console.log('Bounty created successfully with ID:', bountyId.toString())

    return NextResponse.json({
      success: true,
      bountyId: bountyId.toString(),
      rewardTemplateId: rewardTemplateId.toString(),
      bountyTxHash: bountyHash,
      bountyBlockNumber: bountyReceipt.blockNumber.toString(),
      message: `Bounty "${bounty.title}" created successfully`
    })

  } catch (error) {
    console.error('Add bounty error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to add bounty',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}