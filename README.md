# BrandX
A place where businesses could simply hop in to grow their brands. 

## Table of Contents

- [Introduction](#introduction)
- [The Solution](#the-solution)
- [What We Solve](#what-we-solve)
- [Product Flow](#product-flow)
- [Why Artificial Super Intelligence [and line of code]](#why-artificial-super-intelligence-and-line-of-code)
- [Why ENS [and line of code]](#why-ens-and-line-of-code)
- [Why Kadena [and line of code]](#why-kadena-and-line-of-code)
- [Additional Features](#additional-features)
- [GTM](#gtm)
- [Roadmap](#roadmap)
- [Conclusion](#conclusion)

## Introduction

So, how do we do it? Well that’s quite simple, one of the methods we use is Loyalty programs, but wait don’t a bunch of businesses have loyalty programs? Let’s tell you why we are different. 

Normally, businesses have something known as a loyalty program where a few people enroll to do tasks like joining a discord group, like a few posts on X and so on for a few rewards.

These tasks can get repetitive, people do the same tasks over and over again, which could fail to build actual brand interest, and it needs a community manager too. As you just thought - yes, they don’t grow loyalty in ANY way, nor do they grow the brand. 

And most loyalty programs in the web3 space have an EXTREMELY tedious on-boarding phase, which makes it difficult for not so web3 savvy people to be on-boarded.

## The Solution

We saw all these problems and wanted to build something called “BrandX”, an application which could LITERALLY on-board anyone with a simple google sign-in, where a CLUSTER of AI AGENTS, search the ENTIRE internet to identify BOTH the pros and cons of a specific brand. 

For every new business on-boarded, they receive an ENS domain which is received by connecting their actual domain, and for every new member who applies for a loyalty program of a specific business, they get a sub name under that ENS domain. This makes it easy to identify brands and users WITHOUT the hassle of going through a series of wallet addresses

In the first phase an agent cluster searches for reviews, comments, news etc and build a KG which consists of the pros and cons of a brand, using which, another agent comes up with a bunch of metrics, quantifying the current condition of a brand with metrics Finally, a bounty agent interacts with the Knowledge graph and with the metrics generation agent to come up with bounties which could boost the areas where the brands lack in. Some of the bounties might include posting an unboxing video, or displaying the camera capabilities of a mobile phone from a specific brand and so on. 

Brands review this and finalise their bounties and rewards and submit in the frontend, which uses a business factory contract on Kadena and deploys a contract EXCLUSIVELY for that particular business, and also mints NFTs for bounty completion.

This contract consists of various information such as the bounty details, the prize details, the members enrolled in the loyalty program, the bounties completed by them, the prizes claimable by their members, and so on. This makes sure that no data can secretly be altered by companies.

Rewards would be conditionally issued upon bounty completion, and could be claimed easily by a member of their loyalty program by submitting an image proof of them completing their task, which an agent evaluates and writes on-chain that they have completed that task. 

## What We Solve

Brands could now focus on ACTUAL customer sentiments and areas where they lack in and grow accordingly.

Loyalty programs can be scammy, bringing it on-chain increases the trust, and brings an on-chain agreement between a brand and its customers that completing a bounty WILL yield them the promised reward.

Unambiguous objectives not aligned with the actual customer sentiment may fail to grow the brand, but this idea causes a COMPLETE paradigm shift in this space where brands could actually grow, WITHOUT a campaign manager/team, reducing more than 20,000 hours/year for brand analysis and growth

## Product Flow

### Business Onboarding

<img width="1225" height="530" alt="bizON" src="https://github.com/user-attachments/assets/dc9e7287-ed0f-4d2e-8947-16b40f57b84c" />

1. **Initiation:** A business (e.g., `domain: business.eth`) begins the onboarding process.
2. **Google Sign-in:** The business uses **Google Sign-in** to access the BrandX platform.
3. **Profile Creation & ENS Verification:** The business creates its profile and verifies its domain's **ENS (Ethereum Name Service)** ownership within the **Sepolia test network**.
4. **ENS Registry Interaction:** This verification involves a "Check" request to the **ENS Registry** and a "Verify" response from it, confirming domain ownership.

### AI Analysis

<img width="2340" height="1144" alt="darkAIflow" src="https://github.com/user-attachments/assets/bf1c4bd6-fdb4-4da1-acf0-cf41ebe2524b" />

The BrandX system processes brand data through a **sophisticated AI-powered analysis pipeline** that transforms raw brand information into actionable insights:

#### **Input: Brand Details**
You start by providing **brand details** (e.g., brand name, identifiers). These details are passed to the **Orchestrator**, which serves as the central command center for the entire analysis workflow.

#### **Orchestrator Dispatch**
The **Orchestrator** intelligently dispatches tasks to specialized agents. Each agent queries the appropriate **MCP (Model Context Protocol)** server to fetch relevant information from specific data sources.

#### **Data Collection via Agents & MCP Servers**

**a) Web Search Agent**
- Searches the web for comprehensive brand-related data
- Passes results into the pipeline for storage in the Knowledge Graph

**b) Reviews Agents**
- **Positive Reviews Agent** and **Negative Reviews Agent** interact with the Reviews MCP Server
- They fetch and filter positive vs negative brand reviews from various platforms
- Results are categorized and stored in the Knowledge Graph

**c) Reddit Agents**
- **Positive Reddit Threads Agent** and **Negative Reddit Threads Agent** interact with the Reddit MCP Server
- They pull brand-related Reddit discussions, classifying them as positive or negative sentiment
- Results are stored in the Knowledge Graph

**d) Social Media Agents**
- **Positive Socials Agent** and **Negative Socials Agent** interact with the Social Media Comments MCP Server
- They fetch brand mentions/comments from social platforms, classifying them as positive or negative
- Results are stored in the Knowledge Graph

#### **Centralized Knowledge Graph**
All collected and processed results (reviews, Reddit threads, social comments, search results) are stored in the **Brand Data Knowledge Graph**. This forms a **structured and unified data hub** about the brand, creating a comprehensive intelligence repository that continuously learns and updates.

#### **Metrics Generation**
The **Metrics Generator Agent** consumes data from the Knowledge Graph and computes **key performance indicators** including:
- **Sentiment scores**
- **Volume of mentions**
- **Ratio of positive to negative signals**
- **Engagement trends**
- **Brand health metrics**

#### **Bounty Generation**
The **Bounty Generation Agent** takes the computed metrics via **A2A (Agent-to-Agent)** communication and generates **actionable bounties** - specific tasks designed to improve brand performance based on the deep insights gathered from the comprehensive data analysis.

### Customer Onboarding

<img width="1028" height="756" alt="cuss" src="https://github.com/user-attachments/assets/aa664e63-0468-43e5-b69d-3c7c39fa3fef" />

BrandX's customer onboarding is designed to be **user-friendly**, blending **Web2 convenience** with **Web3 benefits**:

1. **User Initiation:** A customer begins their journey on the platform.
2. **Google Sign-in:** The user performs **Google sign-in** for seamless entry, eliminating complex wallet setups.
3. **Loyalty Program Request:** The user requests to join a business's loyalty program.
4. **Member ID Assignment:** The business adds the user as a member with a unique **ENS subdomain ID** (e.g., `user.business.eth`).
5. **ENS Subdomain Minting:** The business mints an **ENS subdomain** for the newly onboarded user.
6. **ENS Registry Update:** The subname is written into the **ENS Registry**, establishing the user's on-chain identity.
7. **Contract Registration:** User details are registered in the **smart contract**, securing their participation on the blockchain.

### Bounties Submission

Once onboarded, customers can actively participate in **bounties** and earn **rewards** through a transparent, verifiable process:

1. **Bounty Completion & Proof Submission:** The user completes a bounty task and submits **proof of completion**.
2. **Verification Process:** The submitted proof is forwarded to the **"Verification Agent"** for evaluation.
3. **Proof Verification:** The Verification Agent evaluates the proof:
   - **Unverified Proof:** If verification fails, the user is prompted to resubmit or correct their submission.
   - **Verified Proof:** If successfully verified, the process continues to reward assignment.
4. **On-Chain Reward Assignment:** Upon successful verification, the system adds points and assigns rewards **ON CHAIN**, ensuring transparent and immutable reward distribution on the blockchain.

## Why Artificial Super Intelligence [and line of code]

We use a cluster of 8 AI agents following the uagents framework, and registered on Agentverse which use 3 MCP servers for brand analysis which perform the following tasks:

- **Web Search Agent**: Searches the internet for news and product releases from the brand
- **Reviews Agents**: Look for positive/negative reviews from Yelp, Amazon Reviews, Google Reviews and so on for a product using the Reviews MCP server
- **Reddit Agents**: Identify positive/negative threads on Reddit for a specific product/brand using the Reddit MCP server
- **Socials Agents**: Look for positive/negative comments on Social media for a specific brand using a Socials MCP server 

All these agents build a Knowledge Graph using meTTa, where we insert various brand sentiments as individual atoms within the KG.

This KG is used by a **Metrics Generator Agent** which generates 20 extensive metrics like `negative_media_coverage_intensity`, `market_leadership_perception`, and so on for a specific brand.

These metrics are sent to the **Bounty Generation Agent's** address using agent-to-agent communication which finally delivers the necessary bounties for building the brand, and also providing data such as "the points increase in the generated metrics upon a certain number of people completing a specific bounty". This shows that we don't stop at giving personalized bounties, but also provide predictive analysis on areas of growth.

This could help the brands take decisions based on which bounties they want to go with first, depending on the target areas they'd like to improve in. Finally, a **Verification Agent** verifies the proof submitted by a loyalty program member after completing a bounty and writes the verdict on-chain.

This immediately triggers the reward to be sent to the customer's address if it's an on-chain company, or if it's an off-chain company, customers could claim their off-chain reward by visiting the retailer directly. ASI makes it possible for us to build a customized, objective-driven loyalty program for every brand we on-board and make brands actually focus on growth.

### Line of Code

**Coming soon - ASI implementation details will be updated.**


## Why ENS [and line of code]

ENS serves as the layer of trust and identity in BrandX's loyalty program ecosystem, addressing two critical challenges in the Web3 business landscape:

### 1. Brand Authenticity Verification & Anti-Counterfeiting

BrandX leverages ENS's DNS import functionality to establish unbreakable links between businesses and their authentic domain ownership. When a business like Apple.com migrates their existing DNS domain to ENS on-chain, it registers their real domain, against their own wallet address.

This DNS-to-ENS migration process (/src/components/ens-domain-migration.tsx) eliminates the possibility of fraudulent businesses impersonating established brands within our platform. Users can trust that when they interact with apple.com on BrandX, they are genuinely engaging with Apple Inc.'s official loyalty program, not a malicious actor. This verification system builds fundamental trust between consumers, brands, and our platform - essential for any successful loyalty ecosystem.

The on-chain nature of this verification means that once established, the business's authentic identity becomes immutable and globally verifiable, providing unprecedented transparency in brand-consumer relationships.

### 2. Decentralized Member Identity & Rich Metadata Resolution

Every loyalty program member receives a unique ENS subdomain (e.g., sarah.apple.eth) that serves as their permanent, portable identity within the BrandX ecosystem. This goes far beyond simple naming - each subdomain becomes a comprehensive identity profile that bridges multiple data sources seamlessly.

Through our custom offchain resolver (/src/app/api/ens/mint-subdomain/route.ts, /src/app/api/ens/verify-subdomain/route.ts), these subdomains resolve rich metadata including loyalty points from Kadena business contracts, social profiles from our database, and standard ENS records like avatars and descriptions (/src/app/api/ens/fetch-subname-details/route.ts). This creates a unified identity layer where a single ENS name unlocks access to cross-chain loyalty data, social connections, and program benefits.

Members can use their ENS subdomain across any ENS-compatible application while maintaining their BrandX identity and loyalty standing. This portability and interoperability transforms traditional siloed loyalty programs into an open, interconnected ecosystem where member identity transcends individual platforms.

### Line of Code

**Offchain/L2 Resolver Contract**

- Deployed Address: [`0x5824Ef215aC14955fD93e0C1E039596FDdb0514D` (Ethereum Sepolia)](https://sepolia.etherscan.io/address/0x5824Ef215aC14955fD93e0C1E039596FDdb0514D)
- [GitHub File Link](https://github.com/SamFelix03/BrandX/blob/main/ENS-offchain-resolver/contracts/contracts/OffchainResolver.sol)

**CCIP-Read Gateway**
- [Hosted Link](https://ccip-read-gateway.onrender.com)
- [Server Implementation](https://github.com/SamFelix03/BrandX/tree/main/ENS-offchain-resolver/ccip-read-gateway/src)

**Documentation**
- [Resolver and Gateway Docs](https://github.com/SamFelix03/BrandX/blob/main/ENS-offchain-resolver/README.md)

**ENS Client API Routes**
- [API Routes](https://github.com/SamFelix03/BrandX/tree/main/frontend/src/app/api/ens)
- [Client Documentation](https://github.com/SamFelix03/BrandX/blob/main/frontend/src/app/api/ens/README.md)

## Why Kadena [and line of code]

Kadena is the backbone that makes BrandX possible. Every time a business sets up their loyalty program through BrandX, we use a Business Factory Contract deployed on Kadena to spin up a dedicated smart contract exclusively for that business. This ensures that all bounty details, enrolled members, task completions, and reward claims are transparent, tamper-proof, and verifiable on-chain. It acts as a trust layer of our platform. By deploying each business's loyalty logic as an isolated contract, we guarantee scalability and security without data conflicts.

Our Smart contracts act as a legal agreement between the business and all its loyalty members. Kadena's Chainweb protocol plays a crucial role here. Since Chainweb is a braided, multi-chain architecture where multiple parallel chains work together, BrandX can scale to onboard thousands of businesses without worrying about congestion or high gas fees. Each business contract can execute simultaneously across chains, giving us massive throughput and predictably low costs, which is vital for loyalty programs with high-frequency interactions like bounty submissions and reward claims. It was like Chainweb was tailor-made for this!

On top of that, Kadena's ecosystem provides the NFT infrastructure we use to mint bounty completion tokens for members. These NFTs act as proof of participation and bounty completion, and the contracts also handle token transfers for token airdrop type rewards.

Basically, our platform is a very good use case for Kadena's RWA tokenization goals, by issuing both ERC721 (NFT) with all the voucher metadata for claiming web2 based bounty rewards and also supporting token airdrops for web3 based rewards.

## NFT Issuance and Token Transfers for RWA Tokenization

BrandX leverages Kadena's robust infrastructure to enable seamless Real World Asset (RWA) tokenization through two primary mechanisms:

### NFT Voucher System
When loyalty members complete bounties that offer web2-based rewards (like discounts, free items, or service credits), the system automatically mints ERC721 NFTs that serve as digital vouchers. These voucher NFTs contain rich metadata including:
- Reward details and redemption instructions
- Validity periods and usage terms
- Business branding elements (colors, images)
- Unique identifiers linking to the specific reward template

This approach transforms traditional loyalty rewards into tradeable, verifiable digital assets that members can hold in their wallets as proof of achievement and future value.

### Token Airdrop Functionality
For web3-native rewards, the contracts facilitate direct ERC20 token transfers to members' wallets upon bounty completion. This enables businesses to:
- Distribute their own utility tokens as rewards
- Integrate with existing DeFi ecosystems
- Provide liquid, transferable value to loyal customers
- Create token-based economies around their brand

## Onboarding the Next Million Retail Users

This dual-token approach (NFT + ERC20) is strategically designed to onboard MSMEs (Micro, Small & Medium Enterprises) and corporations into web3 by providing familiar loyalty mechanics with blockchain benefits:

1. **Familiar UX**: Traditional loyalty programs with blockchain transparency
2. **Gradual Web3 Adoption**: Start with simple rewards, evolve to DeFi integration  
3. **Asset Ownership**: Members truly own their rewards and achievements
4. **Interoperability**: Rewards can be used across different platforms and businesses
5. **Programmable Incentives**: Smart contract automation reduces operational overhead for businesses

## GTM

### Go-to-Market Strategy

BrandX sells **two core outcomes** to brands:

**A) Continuous Reputation Recovery** (signal → action → measurable content)

**B) Modern, High-Engagement Loyalty Layer** (bounties → token rewards → measurable activation)

### Primary Targets & Positioning

**Customer Segment (Who to Sell to First):**
- **Mid-market & large consumer brands** in retail / D2C / FMCG / electronics / gaming
- Brands that already run **social campaigns** and care about **UGC**
- Prioritizing verticals with **frequent physical fulfillment** (F&B, lifestyle, D2C) because bounties like unboxings or delivery videos are natural

**Positioning:**
> "Turning reputation issues and low-loyalty activation into measurable growth, where AI finds the problem, prescribes bounties, and issues on-chain, tradable rewards that convert attention into actions."

**Primary Buyer Personas:**
- **Head of Growth** / **Head of Community** / **Head of CRM**
- **CMOs** at brand/retail chains

## Roadmap

**Goals:** Running pilots, iterating on verification, capturing case studies, shipping dashboard & analytics.

**Deliverables:**

- **Brand Dashboard:** reputation metrics, bounty builder, campaign performance, payout reports
- **AI Validation Improvements:** video verification model, duplicate detection
- **Case Studies** from 3 pilots; marketing package
- **Basic SDK** for integrations + web embed widget
- **Billing & Subscription Workflow;** basic CSM process

## Conclusion

BrandX isn't just another loyalty program platform - it's a complete growth engine for brands. By turning real customer sentiment into measurable insights, generating objective-driven bounties, and bringing transparency through on-chain verification, we eliminate the inefficiencies and trust issues that plague traditional loyalty systems. With the detailed brand analysis from ASI, scalability offered by Kadena's unique Chainweb architecture, and the abstraction offered by ENS, we are able to achieve a user-friendly and powerful brand growth platform.

