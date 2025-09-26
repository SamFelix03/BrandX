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

    console.log('Fetching prizes from contract:', contractAddress)

    // Get active prize IDs
    const activePrizeIds = await publicClient.readContract({
      address: contractAddress as `0x${string}`,
      abi: BUSINESS_CONTRACT_ABI,
      functionName: 'getActivePrizes'
    }) as bigint[]

    console.log('Active prize IDs:', activePrizeIds.map(id => id.toString()))

    // Fetch details for each prize
    const prizes = []
    for (const prizeId of activePrizeIds) {
      try {
        const prizeDetails = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: BUSINESS_CONTRACT_ABI,
          functionName: 'getPrize',
          args: [prizeId]
        }) as any

        // Parse prize data - getPrize returns a Prize struct
        const { id, name, description, pointsCost, active, maxClaims, currentClaims, metadata } = prizeDetails

        prizes.push({
          id: id?.toString() || prizeId.toString(),
          name: name || `Prize #${prizeId}`,
          description: description || 'No description available',
          pointsCost: pointsCost?.toString() || '0',
          active: active || false,
          maxClaims: maxClaims?.toString() || '0',
          claimed: currentClaims?.toString() || '0',
          metadata: metadata || ''
        })
      } catch (error) {
        console.error(`Failed to fetch prize ${prizeId}:`, error)
        // Add placeholder data for failed prizes
        prizes.push({
          id: prizeId.toString(),
          name: `Prize #${prizeId}`,
          description: 'Details unavailable',
          pointsCost: '0',
          maxClaims: '0',
          claimed: '0',
          metadata: ''
        })
      }
    }

    return NextResponse.json({
      success: true,
      prizes
    })

  } catch (error) {
    console.error('Error fetching prizes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prizes from contract' },
      { status: 500 }
    )
  }
}