const { ethers, chainweb } = require('hardhat');

async function main() {
  const verificationDelay = 10000; // Delay in milliseconds before verification

  // Make sure we're on the first chainweb chain
  const chains = await chainweb.getChainIds();
  await chainweb.switchChain(chains[0]);
  const [deployer] = await ethers.getSigners();
  
  console.log(`Deploying BrandHero contracts with deployer account: ${deployer.address} on network: ${network.name}`);
  console.log('========================================');

  try {
    // Deploy BrandHeroFactory
    console.log('🏭 Deploying BrandHeroFactory...');
    
    const deployed = await chainweb.deployContractOnChains({
      name: 'BrandHeroFactory',
      constructorArgs: [], // Factory has no constructor parameters
    });

    if (deployed.deployments.length === 0) {
      console.log('❌ No contracts deployed');
      return;
    }

    console.log('✅ BrandHeroFactory deployed successfully:');
    deployed.deployments.forEach((deployment) => {
      console.log(`   Chain ${deployment.chain}: ${deployment.address}`);
    });
    console.log('');

    // Test factory by deploying a sample business contract
    console.log('🏪 Testing factory with sample business deployment...');
    
    // Switch to first chain and get factory instance
    await chainweb.switchChain(chains[0]);
    const BrandHeroFactory = await ethers.getContractFactory('BrandHeroFactory');
    const factory = BrandHeroFactory.attach(deployed.deployments[0].address);
    
    // Deploy a test business contract through the factory
    const testBusinessTx = await factory.deployBusinessContract(
      "test-uuid-123", 
      "Test Coffee Shop",
      "A test loyalty program for our coffee shop",
      "testcoffee.eth"
    );
    
    const receipt = await testBusinessTx.wait();
    console.log(`   Sample business deployed in transaction: ${receipt.hash}`);
    
    // Get the deployed business address from events
    const deployEvent = receipt.logs.find(log => {
      try {
        const parsed = factory.interface.parseLog(log);
        return parsed.name === 'BusinessContractDeployed';
      } catch (e) {
        return false;
      }
    });
    
    if (deployEvent) {
      const parsedEvent = factory.interface.parseLog(deployEvent);
      console.log(`   Test BusinessContract deployed at: ${parsedEvent.args.contractAddress}`);
    }
    
    console.log('');

    // Verification process
    await chainweb.runOverChains(async (chainId) => {
      const deployment = deployed.deployments.find(d => d.chain === chainId);

      if (!deployment) {
        console.log(`No deployment found for chain ${chainId}, skipping verification`);
        return;
      }

      const contractAddress = deployment.address;
      const isLocalNetwork = network.name.includes('hardhat') || network.name.includes('localhost');

      if (isLocalNetwork) {
        console.log(`Skipping contract verification for local network: ${network.name}`);
      } else {
        try {
          console.log(`Waiting ${verificationDelay / 1000} seconds before verification...`);

          if (verificationDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, verificationDelay));
          }

          console.log(`Attempting to verify BrandHeroFactory ${contractAddress} on chain ${chainId}...`);
          await run("verify:verify", {
            address: contractAddress,
            constructorArguments: []
          });

          console.log(`✅ BrandHeroFactory successfully verified on chain ${chainId}`);

        } catch (verifyError) {
          console.error(`Error verifying contract on chain ${chainId}:`, verifyError.message);
        }
      }
    });

    console.log("========================================");
    console.log("🎉 BrandHero deployment process completed successfully!");
    console.log("");
    console.log("📋 Deployment Summary:");
    deployed.deployments.forEach((deployment) => {
      console.log(`   Chain ${deployment.chain}: ${deployment.address}`);
    });
    console.log("");
    console.log("🚀 Next steps:");
    console.log("   1. Use the factory to deploy business contracts for real businesses");
    console.log("   2. Business owners can then set up their loyalty programs");
    console.log("   3. Create interaction scripts to manage bounties, rewards, and members");
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });