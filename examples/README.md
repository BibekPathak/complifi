# CompliFi Examples

This directory contains examples demonstrating how to integrate and use the CompliFi compliance solution in your DeFi applications.

## Demo Example

The `demo.js` file provides a comprehensive demonstration of the CompliFi SDK's capabilities, showcasing:

1. Setting up a compliance policy
2. Verifying compliant users
3. Handling non-compliant users (high risk score)
4. Handling users without KYC verification
5. Handling users from restricted jurisdictions

### Prerequisites

Before running the examples, ensure you have:

1. Completed the setup steps in the main project's `QUICKSTART.md`
2. Started the backend server
3. Installed all dependencies

### Running the Demo

To run the demo example:

```bash
# From the project root directory
node examples/demo.js
```

### Expected Output

The demo will output the results of each compliance verification scenario, showing both successful verifications and expected failures with appropriate error messages.

### Integration into Your DeFi Protocol

To integrate CompliFi into your own DeFi protocol:

1. Install the CompliFi SDK:
   ```bash
   npm install complifi-sdk
   ```

2. Initialize the SDK with your connection and wallet:
   ```javascript
   const { CompliFiSDK } = require('complifi-sdk');
   
   const compliFi = new CompliFiSDK({
     connection: yourSolanaConnection,
     wallet: yourWallet,
     backendUrl: 'https://your-complifi-backend.com'
   });
   ```

3. Verify user compliance before executing transactions:
   ```javascript
   async function executeTransaction(userWallet) {
     try {
       // Verify compliance first
       const complianceResult = await compliFi.verifyCompliance(userWallet);
       
       if (complianceResult.isCompliant) {
         // Proceed with transaction
         // ...
       } else {
         // Handle non-compliant user
         console.log(`User is not compliant: ${complianceResult.reason}`);
       }
     } catch (error) {
       console.error('Compliance verification failed:', error);
     }
   }
   ```

## Additional Resources

For more detailed information about the CompliFi solution:

- See the main project README
- Review the SDK documentation
- Check the smart contract implementation in the `programs/complifi` directory