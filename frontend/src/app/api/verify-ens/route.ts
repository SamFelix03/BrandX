import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, http } from 'viem'
import { getEnsAddress } from 'viem/ens'
import { mainnet, sepolia } from 'viem/chains'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ens_domain, wallet_address } = body

    console.log('Received request:', { ens_domain, wallet_address })

    if (!ens_domain || !wallet_address) {
      return NextResponse.json(
        { error: 'ens_domain and wallet_address are required' },
        { status: 400 }
      )
    }

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http()
    })

    console.log('Resolving ENS domain:', ens_domain)
    
    // Use viem's built-in getEnsAddress which handles CCIP-Read
    const resolvedAddress = await getEnsAddress(publicClient, {
      name: ens_domain
    })

    console.log('Resolved address:', resolvedAddress)

    if (!resolvedAddress) {
      console.log('Domain did not resolve to any address')
      return NextResponse.json(
        { error: 'ENS domain not found or does not resolve to any address' },
        { status: 400 }
      )
    }

    if (resolvedAddress.toLowerCase() !== wallet_address.toLowerCase()) {
      return NextResponse.json(
        { error: 'ENS domain does not resolve to the connected wallet address' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      resolved_address: resolvedAddress,
      message: 'ENS domain ownership verified'
    })

  } catch (error) {
    console.error('ENS verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify ENS domain ownership' },
      { status: 500 }
    )
  }
}