import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { chainwebEvmTestnet } from '@/lib/chains'
import { BUSINESS_CONTRACT_ABI } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const contractAddress = searchParams.get('contractAddress')
    const userAddress = searchParams.get('userAddress')

    if (!contractAddress) {
      return NextResponse.json(
        { error: 'contractAddress parameter is required' },
        { status: 400 }
      )
    }

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress parameter is required' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      chain: chainwebEvmTestnet,
      transport: http()
    })

    console.log('Fetching user vouchers from contract:', contractAddress, 'for user:', userAddress)

    // Get user data to retrieve owned vouchers
    const userData = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getUserData',
      args: [userAddress as `0x${string}`]
    }) as any

    // getUserData returns: [totalPoints, completedBounties, ownedVouchers, claimedPrizes, ensName, joinedAt]
    const [, , ownedVouchers] = userData
    
    console.log('Owned voucher token IDs:', ownedVouchers.map((id: bigint) => id.toString()))

    // Fetch details for each voucher
    const vouchers = []
    for (const tokenId of ownedVouchers) {
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

        // Get reward template details
        let rewardTemplate = null
        try {
          const templateData = await publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: BUSINESS_CONTRACT_ABI,
            functionName: 'getRewardTemplate',
            args: [rewardTemplateId]
          }) as any

          const { 
            id, name, description, rewardType, pointsValue, active,
            voucherMetadata, validityPeriod, imageUrl, brandColor,
            tokenAddress, tokenAmount
          } = templateData

          // Map reward type enum to readable string
          const rewardTypeMap = ['NONE', 'WEB2_VOUCHER', 'TOKEN_AIRDROP']

          rewardTemplate = {
            id: id?.toString() || rewardTemplateId.toString(),
            name: name || `Reward #${rewardTemplateId}`,
            description: description || 'No description available',
            rewardType: rewardTypeMap[Number(rewardType)] || 'NONE',
            pointsValue: Number(pointsValue) || 0,
            voucherMetadata: voucherMetadata || '',
            validityPeriod: Number(validityPeriod) || 0,
            imageUrl: imageUrl || '',
            brandColor: brandColor || '',
            tokenAddress: tokenAddress || '',
            tokenAmount: tokenAmount?.toString() || '0'
          }
        } catch (error) {
          console.error(`Failed to fetch reward template ${rewardTemplateId}:`, error)
        }

        vouchers.push({
          tokenId: tokenId.toString(),
          rewardTemplateId: rewardTemplateId.toString(),
          claimed: isClaimed,
          template: rewardTemplate
        })
      } catch (error) {
        console.error(`Failed to fetch voucher details for token ${tokenId}:`, error)
        // Add placeholder data for failed vouchers
        vouchers.push({
          tokenId: tokenId.toString(),
          rewardTemplateId: '0',
          claimed: false,
          template: null
        })
      }
    }

    return NextResponse.json({
      success: true,
      vouchers
    })

  } catch (error) {
    console.error('Error fetching user vouchers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user vouchers from contract' },
      { status: 500 }
    )
  }
}