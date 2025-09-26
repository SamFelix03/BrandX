import { NextRequest, NextResponse } from 'next/server'

interface BusinessData {
  business_name: string
  description?: string
  location?: string
  website?: string
  ens_domain?: string
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessData } = body as { businessData: BusinessData }

    if (!businessData || !businessData.business_name) {
      return NextResponse.json(
        { error: 'Business data with business_name is required' },
        { status: 400 }
      )
    }

    // AI suggests bounty activities only - business owner will select rewards manually
    const suggestedBounties = [
      {
        title: "Share Your Experience",
        description: `Post about your experience at ${businessData.business_name} on social media and tag us. Help spread the word about our awesome service!`,
        expiry: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days from now
        maxCompletions: 0, // unlimited
        suggested: true
      },
      {
        title: "Refer a Friend",
        description: `Bring a friend to ${businessData.business_name}! When your referred friend makes their first purchase, you both get rewarded.`,
        expiry: 0, // No expiry
        maxCompletions: 10, // limit to 10 referrals per person
        suggested: true
      },
      {
        title: "Write a Review",
        description: `Share your honest feedback about ${businessData.business_name}. Your review helps other customers and helps us improve!`,
        expiry: Math.floor(Date.now() / 1000) + (60 * 24 * 60 * 60), // 60 days from now
        maxCompletions: 1, // one review per customer
        suggested: true
      }
    ]

    // Mock analysis insights
    const analysis = {
      businessType: businessData.description ? "service-based" : "general",
      strengths: [
        "Strong brand presence with ENS domain",
        "Clear business identity"
      ],
      opportunities: [
        "Social media engagement",
        "Customer referral program",
        "Community building"
      ],
      recommendedFocus: "Customer acquisition and social proof"
    }

    return NextResponse.json({
      success: true,
      analysis,
      suggestedBounties,
      message: `Generated ${suggestedBounties.length} bounty suggestions for ${businessData.business_name}`
    })

  } catch (error) {
    console.error('AI bounty suggestion error:', error)
    return NextResponse.json(
      { error: 'Failed to generate bounty suggestions' },
      { status: 500 }
    )
  }
}