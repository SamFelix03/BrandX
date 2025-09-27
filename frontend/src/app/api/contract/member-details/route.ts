import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { chainwebEvmTestnet } from '@/lib/chains'
import { BUSINESS_CONTRACT_ABI } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get('contractAddress')
    const memberAddress = searchParams.get('memberAddress')

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'contractAddress parameter is required' },
        { status: 400 }
      )
    }

    if (!memberAddress) {
      return NextResponse.json(
        { error: 'memberAddress parameter is required' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      chain: chainwebEvmTestnet,
      transport: http()
    })

    console.log('Fetching member details from contract:', contractAddress, 'for member:', memberAddress)

    // Get user data first to retrieve all arrays
    const userData = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getUserData',
      args: [memberAddress as `0x${string}`]
    }) as any

    // getUserData returns: [totalPoints, completedBounties, ownedVouchers, claimedPrizes, ensName, joinedAt]
    const [totalPoints, completedBountyIds, ownedVoucherIds, claimedPrizeIds, ensName, joinedAt] = userData
    
    console.log('User data:', {
      totalPoints: totalPoints.toString(),
      completedBountyIds: completedBountyIds.map((id: bigint) => id.toString()),
      ownedVoucherIds: ownedVoucherIds.map((id: bigint) => id.toString()),
      claimedPrizeIds: claimedPrizeIds.map((id: bigint) => id.toString()),
      ensName,
      joinedAt: joinedAt.toString()
    })

    // Fetch completed bounty details
    const completedBounties = []
    for (const bountyId of completedBountyIds) {
      try {
        const bountyDetails = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getBounty',
          args: [bountyId]
        }) as any

        const { id, title, description, rewardTemplateId } = bountyDetails

        // Get reward template to find points earned
        let pointsEarned = 0
        try {
          const rewardTemplate = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: BUSINESS_CONTRACT_ABI,
            functionName: 'getRewardTemplate',
            args: [rewardTemplateId]
          }) as any
          pointsEarned = Number(rewardTemplate.pointsValue) || 0
        } catch (err) {
          console.error(`Failed to get reward template ${rewardTemplateId}:`, err)
        }

        // Note: We can't get exact completion time from the contract without additional lookups
        // The contract has bountyCompletionTime mapping but it's private
        completedBounties.push({
          id: id?.toString() || bountyId.toString(),
          title: title || `Bounty #${bountyId}`,
          description: description || 'No description available',
          pointsEarned,
          // completedAt would need to be fetched from events or stored separately
          completedAt: null
        })
      } catch (error) {
        console.error(`Failed to fetch bounty details for ${bountyId}:`, error)
        completedBounties.push({
          id: bountyId.toString(),
          title: `Bounty #${bountyId}`,
          description: 'Details unavailable',
          pointsEarned: 0,
          completedAt: null
        })
      }
    }

    // Fetch owned voucher details
    const ownedVouchers = []
    for (const tokenId of ownedVoucherIds) {
      try {
        // Get the reward template ID for this voucher
        const rewardTemplateId = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'tokenToRewardTemplate',
          args: [tokenId]
        }) as bigint

        // Check if voucher is claimed
        const isClaimed = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'isVoucherClaimed',
          args: [tokenId]
        }) as boolean

        // Get reward template details for name and description
        let name = `Voucher #${tokenId}`
        let description = 'Reward voucher'
        try {
          const templateData = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: BUSINESS_CONTRACT_ABI,
            functionName: 'getRewardTemplate',
            args: [rewardTemplateId]
          }) as any

          name = templateData.name || name
          description = templateData.description || description
        } catch (err) {
          console.error(`Failed to get reward template ${rewardTemplateId}:`, err)
        }

        ownedVouchers.push({
          tokenId: tokenId.toString(),
          name,
          description,
          claimed: isClaimed,
          rewardTemplateId: rewardTemplateId.toString()
        })
      } catch (error) {
        console.error(`Failed to fetch voucher details for token ${tokenId}:`, error)
        ownedVouchers.push({
          tokenId: tokenId.toString(),
          name: `Voucher #${tokenId}`,
          description: 'Details unavailable',
          claimed: false,
          rewardTemplateId: '0'
        })
      }
    }

    // Fetch claimed prize details
    const claimedPrizes = []
    for (const prizeId of claimedPrizeIds) {
      try {
        const prizeDetails = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getPrize',
          args: [prizeId]
        }) as any

        const { id, name, description, pointsCost } = prizeDetails

        claimedPrizes.push({
          id: id?.toString() || prizeId.toString(),
          name: name || `Prize #${prizeId}`,
          description: description || 'No description available',
          pointsCost: Number(pointsCost) || 0,
          // claimedAt would need to be fetched from events or stored separately
          claimedAt: null
        })
      } catch (error) {
        console.error(`Failed to fetch prize details for ${prizeId}:`, error)
        claimedPrizes.push({
          id: prizeId.toString(),
          name: `Prize #${prizeId}`,
          description: 'Details unavailable',
          pointsCost: 0,
          claimedAt: null
        })
      }
    }

    // Generate recent activity based on the data we have
    const recentActivity = []
    
    // Add member joined event
    recentActivity.push({
      type: 'member_joined',
      description: `Joined the loyalty program`,
      timestamp: Number(joinedAt),
      points: null
    })

    // Add bounty completions (most recent first, limited to last 10)
    completedBounties.slice(-10).reverse().forEach(bounty => {
      recentActivity.push({
        type: 'bounty_completed',
        description: `Completed bounty: ${bounty.title}`,
        timestamp: Date.now() / 1000, // Placeholder timestamp
        points: bounty.pointsEarned
      })
    })

    // Add voucher minting events
    ownedVouchers.slice(-5).reverse().forEach(voucher => {
      recentActivity.push({
        type: 'voucher_minted',
        description: `Earned voucher: ${voucher.name}`,
        timestamp: Date.now() / 1000, // Placeholder timestamp
        points: null
      })
    })

    // Add prize claims
    claimedPrizes.slice(-5).reverse().forEach(prize => {
      recentActivity.push({
        type: 'prize_claimed',
        description: `Claimed prize: ${prize.name}`,
        timestamp: Date.now() / 1000, // Placeholder timestamp
        points: -prize.pointsCost
      })
    })

    // Sort by timestamp (most recent first)
    recentActivity.sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({
      success: true,
      completedBounties,
      ownedVouchers,
      claimedPrizes,
      recentActivity: recentActivity.slice(0, 20) // Limit to 20 most recent activities
    })

  } catch (error) {
    console.error('Error fetching member details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch member details from contract' },
      { status: 500 }
    )
  }
}