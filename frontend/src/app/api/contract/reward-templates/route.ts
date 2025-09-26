import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { arbitrumSepolia } from 'viem/chains'
import { BUSINESS_CONTRACT_ABI, NETWORK_CONFIG } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get('contractAddress')

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'contractAddress parameter is required' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      chain: arbitrumSepolia,
      transport: http(NETWORK_CONFIG.rpcUrl)
    })

    console.log('Fetching reward templates from contract:', contractAddress)

    // Get active reward IDs
    const activeRewardIds = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getActiveRewards'
    }) as bigint[]

    console.log('Active reward IDs:', activeRewardIds.map(id => id.toString()))

    // Fetch details for each reward template
    const rewardTemplates = []
    for (const rewardId of activeRewardIds) {
      try {
        const rewardDetails = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getRewardTemplate',
          args: [rewardId]
        }) as any

        // Parse reward template data
        const { 
          id, name, description, rewardType, pointsValue, active,
          voucherMetadata, validityPeriod, tokenAddress, tokenAmount, nftMetadata
        } = rewardDetails

        // Map reward type enum to readable string
        const rewardTypeMap = ['NONE', 'WEB2_VOUCHER', 'TOKEN_AIRDROP', 'NFT_REWARD']

        rewardTemplates.push({
          id: id?.toString() || rewardId.toString(),
          name: name || `Reward #${rewardId}`,
          description: description || 'No description available',
          rewardType: rewardTypeMap[Number(rewardType)] || 'NONE',
          pointsValue: pointsValue?.toString() || '0',
          active: active || false,
          voucherMetadata: voucherMetadata || '',
          validityPeriod: validityPeriod?.toString() || '0',
          tokenAddress: tokenAddress || '',
          tokenAmount: tokenAmount?.toString() || '0',
          nftMetadata: nftMetadata || ''
        })
      } catch (error) {
        console.error(`Failed to fetch reward template ${rewardId}:`, error)
        // Add placeholder data for failed reward templates
        rewardTemplates.push({
          id: rewardId.toString(),
          name: `Reward #${rewardId}`,
          description: 'Details unavailable',
          rewardType: 'NONE',
          pointsValue: '0',
          active: false,
          voucherMetadata: '',
          validityPeriod: '0',
          tokenAddress: '',
          tokenAmount: '0',
          nftMetadata: ''
        })
      }
    }

    return NextResponse.json({
      success: true,
      rewardTemplates
    })

  } catch (error) {
    console.error('Error fetching reward templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reward templates from contract' },
      { status: 500 }
    )
  }
}