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

    console.log('Fetching members from contract:', contractAddress)

    // Get all member addresses
    const memberAddresses = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getAllMembers'
    }) as string[]

    console.log('Member addresses:', memberAddresses)

    // Fetch user data for each member
    const members = []
    for (const memberAddress of memberAddresses) {
      try {
        const userData = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getUserData',
          args: [memberAddress]
        }) as any

        // getUserData returns: [totalPoints, completedBounties, ownedVouchers, claimedPrizes, ensName, joinedAt]
        const [totalPoints, completedBounties, ownedVouchers, claimedPrizes, ensName, joinedAt] = userData

        members.push({
          address: memberAddress,
          ensName: ensName || 'No ENS',
          totalPoints: totalPoints?.toString() || '0',
          completedBounties: completedBounties?.length || 0,
          ownedVouchers: ownedVouchers?.length || 0,
          claimedPrizes: claimedPrizes?.length || 0,
          joinedAt: joinedAt?.toString() || '0'
        })
      } catch (error) {
        console.error(`Failed to fetch user data for ${memberAddress}:`, error)
        // Add placeholder data for failed member
        members.push({
          address: memberAddress,
          ensName: 'Data unavailable',
          totalPoints: '0',
          completedBounties: 0,
          ownedVouchers: 0,
          claimedPrizes: 0,
          joinedAt: '0'
        })
      }
    }

    return NextResponse.json({
      success: true,
      members,
      totalMembers: memberAddresses.length
    })

  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch members from contract' },
      { status: 500 }
    )
  }
}