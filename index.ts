import axios from 'axios';
import 'dotenv/config';

interface DuneQueryParameter {
  key: string;
  value: string;
  type: string;
}

interface DuneExecutionResponse {
  execution_id: string;
  state: string;
}

interface DuneResultRow {
  address: string;
  tx_count: number;
  active_days: number;
  first_tx: string;
  last_tx: string;
  wallet_age_days: number;
  unique_recipients: number;
  eth_balance: number;
  unique_tokens: number;
  defi_tx_count: number;
  unique_protocols: number;
  nft_transfers: number;
  unique_nft_collections: number;
  reputation_score: number;
  score_tier: string;
}

interface DuneResultsResponse {
  execution_id: string;
  query_id: number;
  state: string;
  result?: {
    rows: DuneResultRow[];
    metadata: {
      column_names: string[];
      row_count: number;
    };
  };
}

class DuneAnalyticsClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.dune.com/api/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async executeQuery(queryId: number, parameters: DuneQueryParameter[]): Promise<string> {
    try {
      const queryParams = parameters.reduce((acc, param) => {
        acc[param.key] = param.value;
        return acc;
      }, {} as Record<string, string>);

      const response = await axios.post<DuneExecutionResponse>(
        `${this.baseUrl}/query/${queryId}/execute`,
        {
          query_parameters: queryParams,
          performance: 'medium' // Options: 'medium', 'large'
        },
        {
          headers: {
            'X-Dune-API-Key': this.apiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Query execution started. Execution ID: ${response.data.execution_id}`);
      return response.data.execution_id;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to execute query: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check the status of a query execution
   */
  async getExecutionStatus(executionId: string): Promise<DuneResultsResponse> {
    try {
      const response = await axios.get<DuneResultsResponse>(
        `${this.baseUrl}/execution/${executionId}/results`,
        {
          headers: {
            'X-Dune-API-Key': this.apiKey
          }
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get execution status: ${error.response?.data?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Wait for query execution to complete and return results
   */
  async waitForResults(executionId: string, maxWaitTimeMs: number = 180000): Promise<DuneResultRow[]> {
    const startTime = Date.now();
    const pollInterval = 2000; // Poll every 2 seconds

    while (Date.now() - startTime < maxWaitTimeMs) {
      const status = await this.getExecutionStatus(executionId);

      console.log(`Query state: ${status.state}`);

      if (status.state === 'QUERY_STATE_COMPLETED') {
        if (!status.result || !status.result.rows) {
          throw new Error('Query completed but no results returned');
        }
        console.log(`Query completed. Rows returned: ${status.result.metadata.row_count}`);
        return status.result.rows;
      } else if (status.state === 'QUERY_STATE_FAILED') {
        throw new Error('Query execution failed');
      } else if (status.state === 'QUERY_STATE_CANCELLED') {
        throw new Error('Query execution was cancelled');
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error('Query execution timed out');
  }

  /**
   * Execute query and wait for results (convenience method)
   */
  async executeAndWait(queryId: number, parameters: DuneQueryParameter[]): Promise<DuneResultRow[]> {
    const executionId = await this.executeQuery(queryId, parameters);
    return await this.waitForResults(executionId);
  }
}

/**
 * Get reputation score for a wallet address
 */
async function getWalletReputationScore(
  apiKey: string,
  queryId: number,
  walletAddress: string
): Promise<DuneResultRow | null> {
  const client = new DuneAnalyticsClient(apiKey);

  // Prepare query parameters
  const parameters: DuneQueryParameter[] = [
    {
      key: 'wallet_address',
      value: walletAddress,
      type: 'text'
    }
  ];

  console.log(`Fetching reputation score for wallet: ${walletAddress}`);

  try {
    const results = await client.executeAndWait(queryId, parameters);

    if (results.length === 0) {
      console.log('No data found for this wallet address');
      return null;
    }

    return results[0];
  } catch (error) {
    console.error('Error fetching reputation score:', error);
    throw error;
  }
}

/**
 * Format and display reputation score results
 */
function displayReputationScore(result: DuneResultRow): void {
  console.log('\n=== Wallet Reputation Score ===');
  console.log(`Address: ${result.address}`);
  console.log(`\nReputation Score: ${result.reputation_score.toFixed(2)}/100`);
  console.log(`Score Tier: ${result.score_tier}`);
  console.log('\n--- Activity Metrics ---');
  console.log(`Total Transactions: ${result.tx_count}`);
  console.log(`Active Days: ${result.active_days}`);
  console.log(`Wallet Age: ${result.wallet_age_days} days`);
  console.log(`Unique Recipients: ${result.unique_recipients}`);
  console.log('\n--- Asset Holdings ---');
  console.log(`ETH Balance: ${result.eth_balance.toFixed(4)} ETH`);
  console.log(`Unique Tokens: ${result.unique_tokens}`);
  console.log('\n--- DeFi Activity ---');
  console.log(`DeFi Transactions: ${result.defi_tx_count}`);
  console.log(`Unique Protocols: ${result.unique_protocols}`);
  console.log('\n--- NFT Activity ---');
  console.log(`NFT Transfers: ${result.nft_transfers}`);
  console.log(`Unique Collections: ${result.unique_nft_collections}`);
  console.log('\n--- Timeline ---');
  console.log(`First Transaction: ${result.first_tx}`);
  console.log(`Last Transaction: ${result.last_tx}`);
}

// Main execution
async function main() {
  const DUNE_API_KEY = process.env.DUNE_API_KEY || 'your-api-key-here';
  const QUERY_ID = parseInt(process.env.DUNE_QUERY_ID || 'query id here', 10);
  const WALLET_ADDRESS = process.env.WALLET_ADDRESS || 'your wallet-address-here';

  try {
    const result = await getWalletReputationScore(DUNE_API_KEY, QUERY_ID, WALLET_ADDRESS);

    if (result) {
      displayReputationScore(result);
      
      // Return just the reputation score if needed
      console.log(`\nFinal Reputation Score: ${result.reputation_score}`);
    } else {
      console.log('No reputation data available for this wallet');
    }
  } catch (error) {
    console.error('Error in main execution:', error);
    process.exit(1);
  }
}

// Export functions for use as a module
export {
  DuneAnalyticsClient,
  getWalletReputationScore,
  displayReputationScore
};

// Export types separately
export type { DuneQueryParameter, DuneResultRow };

// Run main
main();