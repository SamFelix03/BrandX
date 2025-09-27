import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      contractAddress, 
      userAddress, 
      bountyId, 
      bountyDescription, 
      userDescription, 
      imageUrl 
    } = body

    // Validate required fields
    if (!contractAddress || !userAddress || !bountyId || !bountyDescription || !userDescription || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Construct the prompt for AI verification
    const prompt = `The contract address of the business is ${contractAddress}, the user address is ${userAddress}, the bounty id is ${bountyId}, and the description of the bounty is: ${bountyDescription}. The user claims they completed this task with the following description: "${userDescription}"`

    // Call external verification API
    const verificationResponse = await fetch('https://verification-agent-739298578243.us-central1.run.app/chat/image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        image_url: imageUrl
      })
    })

    if (!verificationResponse.ok) {
      throw new Error(`Verification API error: ${verificationResponse.status}`)
    }

    const verificationResult = await verificationResponse.json()
    
    // Parse the AI response - it returns "TRUE" or "FALSE" in the response field
    const isVerified = verificationResult.success && verificationResult.response === "TRUE"
    
    if (isVerified) {
      // TODO: Call smart contract to complete bounty
      // This would involve:
      // 1. Calling the contract's completeBounty function
      // 2. Minting rewards to the user
      // 3. Updating bounty completion count
      
      return NextResponse.json({
        success: true,
        verified: true,
        message: 'Congratulations! Your bounty has been completed successfully.',
        verificationResult
      })
    } else {
      return NextResponse.json({
        success: false,
        verified: false,
        message: 'AI verification failed. Your proof did not match the bounty requirements.',
        verificationResult
      })
    }
  } catch (error) {
    console.error('Bounty completion API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to complete bounty',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}