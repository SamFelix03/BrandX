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

    console.log('Fetching bounties from contract:', contractAddress)

    // Get active bounty IDs
    const activeBountyIds = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getActiveBounties'
    }) as bigint[]

    console.log('Active bounty IDs:', activeBountyIds.map(id => id.toString()))

    // Fetch details for each bounty
    const bounties = []
    for (const bountyId of activeBountyIds) {
      try {
        const bountyDetails = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getBounty',
          args: [bountyId]
        }) as any

        // Parse bounty data - getBounty returns a Bounty struct
        const { id, title, description, rewardTemplateId, active, expiry, maxCompletions, currentCompletions } = bountyDetails

        bounties.push({
          id: id?.toString() || bountyId.toString(),
          title: title || `Bounty #${bountyId}`,
          description: description || 'No description available',
          rewardTemplateId: rewardTemplateId?.toString() || '0',
          isActive: active || false,
          expiry: expiry?.toString() || '0',
          maxCompletions: maxCompletions?.toString() || '0',
          currentCompletions: currentCompletions?.toString() || '0'
        })
      } catch (error) {
        console.error(`Failed to fetch bounty ${bountyId}:`, error)
        // Add placeholder data for failed bounties
        bounties.push({
          id: bountyId.toString(),
          title: `Bounty #${bountyId}`,
          description: 'Details unavailable',
          rewardTemplateId: '0',
          isActive: false,
          expiry: '0',
          maxCompletions: '0',
          currentCompletions: '0'
        })
      }
    }

    return NextResponse.json({
      success: true,
      bounties
    })

  } catch (error) {
    console.error('Error fetching bounties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bounties from contract' },
      { status: 500 }
    )
  }
}