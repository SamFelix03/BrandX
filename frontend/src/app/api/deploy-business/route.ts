import { NextRequest, NextResponse } from 'next/server'
import { createPublicClient, createWalletClient, http, decodeEventLog } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arbitrumSepolia } from 'viem/chains'
import { supabase } from '@/lib/supabase'
import { CONTRACT_ADDRESSES, FACTORY_ABI, NETWORK_CONFIG } from '@/lib/constants'

interface Business {
  id: string
  business_name: string
  description?: string
  location?: string
  website?: string
  ens_domain?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { business, walletAddress } = body as {
      business: Business
      walletAddress: string
    }

    if (!business || !walletAddress) {
      return NextResponse.json(
        { error: 'Business data and wallet address are required' },
        { status: 400 }
      )
    }

    if (!process.env.DEPLOYER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: 'Deployer private key not configured' },
        { status: 500 }
      )
    }

    console.log('Deploying contract for business:', business.business_name)
    console.log('ENS Domain:', business.ens_domain)

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

    // Deploy business contract via factory
    const { request: deployRequest } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESSES.FACTORY as `0x${string}`,
      abi: FACTORY_ABI,
      functionName: 'deployBusinessContract',
      args: [
        business.id,
        business.business_name,
        business.description || '',
        business.ens_domain || ''
      ],
      account
    })

    const deployHash = await walletClient.writeContract(deployRequest)
    console.log('Transaction submitted:', deployHash)

    // Wait for transaction confirmation
    const deployReceipt = await publicClient.waitForTransactionReceipt({ 
      hash: deployHash,
      timeout: 60_000 // 60 second timeout
    })

    console.log('Transaction confirmed:', deployReceipt.transactionHash)

    // Extract deployed contract address from event logs
    let contractAddress: string | undefined
    
    console.log('Processing', deployReceipt.logs.length, 'logs from deployment transaction')

    for (const log of deployReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: FACTORY_ABI,
          eventName: 'BusinessContractDeployed',
          data: log.data,
          topics: log.topics
        })
        
        console.log('Decoded event:', decoded.eventName)
        console.log('Event args:', JSON.stringify(decoded.args, null, 2))
        
        if (decoded.eventName === 'BusinessContractDeployed') {
          // Access contractAddress from the decoded event args
          contractAddress = decoded.args.contractAddress as string
          console.log('Extracted contract address from event:', contractAddress)
          break
        }
      } catch (e) {
        console.log('Failed to decode log:', e instanceof Error ? e.message : 'Unknown error')
        continue
      }
    }

    if (!contractAddress) {
      throw new Error('Could not extract contract address from transaction logs')
    }

    console.log('Business contract deployed at:', contractAddress)

    // Update business record with contract address
    const { data, error } = await supabase
      .from('businesses')
      .update({ 
        smart_contract_address: contractAddress,
        deployment_tx_hash: deployHash
      })
      .eq('wallet_address', walletAddress)
      .select()

    if (error) {
      console.error('Database update error:', error)
      return NextResponse.json(
        { error: 'Failed to update business record' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      contractAddress,
      transactionHash: deployHash,
      blockNumber: deployReceipt.blockNumber.toString(),
      gasUsed: deployReceipt.gasUsed.toString(),
      message: 'Business contract deployed successfully - ready for bounties and prizes'
    })

  } catch (error) {
    console.error('Contract deployment error:', error)
    return NextResponse.json(
      { error: 'Failed to deploy business contract' },
      { status: 500 }
    )
  }
}

// Real implementation would look something like this:
/*
import { createPublicClient, createWalletClient, http, parseAbi } from 'viem'
import { sepolia } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'
import { CONTRACT_ADDRESSES, FACTORY_ABI, BUSINESS_CONTRACT_ABI, REWARD_TYPES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    const { business, bounties, prizes, walletAddress } = await request.json()

    // Initialize clients
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(process.env.SEPOLIA_RPC_URL)
    })

    const account = privateKeyToAccount(process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`)
    const walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.SEPOLIA_RPC_URL)
    })

    // Deploy business contract
    const { request: deployRequest } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESSES.FACTORY,
      abi: FACTORY_ABI,
      functionName: 'deployBusinessContract',
      args: [
        business.id,
        business.business_name,
        business.description || '',
        business.ens_domain || ''
      ],
      account
    })

    const deployHash = await walletClient.writeContract(deployRequest)
    const deployReceipt = await publicClient.waitForTransactionReceipt({ hash: deployHash })

    // Extract contract address from logs
    const contractAddress = deployReceipt.logs[0].address

    // Now setup bounties, rewards, and prizes on the deployed contract
    // This would involve multiple contract calls...

    // Update database
    await supabase
      .from('businesses')
      .update({ smart_contract_address: contractAddress })
      .eq('wallet_address', walletAddress)

    return NextResponse.json({
      success: true,
      contractAddress,
      transactionHash: deployHash
    })

  } catch (error) {
    console.error('Deployment error:', error)
    return NextResponse.json({ error: 'Deployment failed' }, { status: 500 })
  }
}
*/