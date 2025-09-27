import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

// Official ENS Registry address (same on mainnet and Sepolia)
const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// Configuration for different networks
const NETWORK_CONFIG = {
  mainnet: {
    chainId: 1,
    chainName: 'homestead',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY', // Replace with your Infura key
  },
  sepolia: {
    chainId: 11155111,
    chainName: 'sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/b4880ead6a9a4f77a6de39dec6f3d0d0',
  }
};

export async function GET(request: NextRequest) {
  try {
    // Extract name from URL parameters
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const network = searchParams.get('network') || 'sepolia'; // Default to sepolia
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name parameter is required' },
        { status: 400 }
      );
    }

    // Validate network
    if (!NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG]) {
      return NextResponse.json(
        { error: 'Invalid network. Use "mainnet" or "sepolia"' },
        { status: 400 }
      );
    }

    const config = NETWORK_CONFIG[network as keyof typeof NETWORK_CONFIG];

    // Create provider with ENS support
    const provider = new ethers.providers.JsonRpcProvider(config.rpcUrl, {
      chainId: config.chainId,
      name: config.chainName,
      ensAddress: ENS_REGISTRY_ADDRESS,
    });

    console.log(`Resolving ${name} on ${network} network...`);

    // Get resolver for the name
    let resolver = await provider.getResolver(name);
    
    if (!resolver) {
      return NextResponse.json({
        name,
        network,
        resolver: null,
        message: 'No resolver found for this name'
      });
    }

    // Fetch data exactly like index.ts
    let ethAddress = await resolver.getAddress();
    let content = await resolver.getContentHash();
    let email = await resolver.getText('email');

    const results = {
      name,
      network,
      resolver: {
        address: resolver.address
      },
      ethAddress,
      content,
      email,
      metadata: {
        timestamp: new Date().toISOString(),
        ensRegistry: ENS_REGISTRY_ADDRESS
      }
    };

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('ENS resolution error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to resolve ENS name',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Also support POST requests with JSON body
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, network = 'sepolia' } = body;
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required in request body' },
        { status: 400 }
      );
    }

    // Create a new URL with query parameters and call GET
    const url = new URL(request.url);
    url.searchParams.set('name', name);
    url.searchParams.set('network', network);
    
    const newRequest = new NextRequest(url.toString(), {
      method: 'GET',
      headers: request.headers,
    });
    
    return GET(newRequest);
    
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Invalid JSON body',
        details: error.message 
      },
      { status: 400 }
    );
  }
}
