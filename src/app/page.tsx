'use client';

import { useState, useEffect } from 'react';

interface ATQRegistryItem {
  itemID: string;
  url: string;
  commit: string;
  chainId: string;
}

interface GraphQLResponse {
  data: {
    litems: Array<{
      itemID: string;
      metadata: {
        props: Array<{
          type: string;
          label: string;
          value: string;
        }>;
      };
    }>;
  };
  errors?: Array<{
    message: string;
  }>;
}

export default function Home() {
  const [data, setData] = useState<ATQRegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Use The Graph's decentralized endpoint with API key for better performance
      const apiKey = '96946e4d39db402bfbec6cb240fd1a83';
      const apiEndpoint = `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`;
      
      const query = {
        query: `{
          litems(first: 1000, skip: 0, orderBy: latestRequestSubmissionTime, where: {status: Registered, registryAddress: "0xae6aaed5434244be3699c56e7ebc828194f26dc3"}) {
            itemID
            metadata {
              props {
                type
                label
                value
              }
            }
          }
        }`
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: GraphQLResponse = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e) => e.message).join(', ')}`);
      }

      // Parse the response to extract the required fields
      const parsedData: ATQRegistryItem[] = result.data.litems.map((item) => {
        const url = item.metadata.props.find((prop) => prop.label === 'Github Repository URL')?.value || '';
        const commit = item.metadata.props.find((prop) => prop.label === 'Commit hash')?.value || '';
        const chainId = item.metadata.props.find((prop) => prop.label === 'EVM Chain ID')?.value || '';

        return {
          itemID: item.itemID,
          url,
          commit,
          chainId
        };
      });

      setData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const downloadData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'atq-registry-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateCompliancePrompt = () => {
    const repositories = data.map(item => ({
      url: item.url,
      commit: item.commit,
      chainId: item.chainId
    }));

    return `Please analyze the following ATQ (Address Tag Query) registry repositories for compliance with the Kleros policy at https://cdn.kleros.link/ipfs/QmWbpqfGiA4L1FK4qwSAgyp9u2KMLYc8AWCKKW3pxPuFNP

For each repository, please:
1. Clone the repository and checkout the specific commit
2. Review the code against the policy requirements
3. Check for compliance with the module acceptance criteria
4. Verify the repository structure and dependencies
5. Test the returnTags function if possible

Repositories to analyze:
${repositories.map((repo, index) => 
  `${index + 1}. Repository: ${repo.url}
   Commit: ${repo.commit}
   Chain ID: ${repo.chainId}`
).join('\n\n')}

Please provide a summary table at the end with the following columns:
- Repository URL
- Commit Hash
- Chain ID
- Compliance Status (Compliant/Non-Compliant/Partial)
- Issues Found (list any violations or concerns)
- Notes (additional observations)

Focus on the key requirements from the policy:
- Repository structure (main.mts in src/ folder)
- TypeScript compilation
- Proper use of atq-types package
- Correct returnTags function signature
- GraphQL query implementation
- Error handling
- When checking the endpoints, the Arbitrum gateways are acceptable, focus on checking whether the deployment specific endpoints are used instead of subgraph ID specific ones
- Package.json and tsconfig.json compliance`;
  };

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="neon-spinner h-16 w-16 mx-auto mb-6"></div>
          <p className="text-xl font-semibold text-white mb-2">Loading ATQ Registry data...</p>
          <p className="text-sm text-gray-400">Connecting to The Graph Protocol</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="glass p-6 mb-6 border-red-500/50">
            <div className="text-red-400 text-4xl mb-4">⚠️</div>
            <strong className="font-bold text-red-400 block mb-2">Connection Error</strong>
            <span className="text-gray-300 block sm:inline"> {error}</span>
          </div>
          <button
            onClick={fetchData}
            className="neon-button py-3 px-6 rounded-lg font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="glass p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
            <div>
              <h1 className="text-5xl font-black text-purple-400 mb-4 font-['Orbitron'] tracking-wider">
                ATQ REGISTRY
              </h1>
              <div className="flex items-center gap-4">
                <div className="h-1 w-16 bg-purple-500"></div>
                <p className="text-xl text-gray-300 font-semibold">
                  Total entries: <span className="text-cyan-400 font-bold">{data.length}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowComplianceModal(true)}
                className="neon-button py-3 px-6 rounded-lg font-bold bg-green-600 border-green-500 hover:bg-green-700 hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.5)]"
              >
                Generate Compliance Check
              </button>
              <button
                onClick={downloadData}
                className="neon-button py-3 px-6 rounded-lg font-bold"
              >
                Download Data
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="neon-table min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">
                    Item ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold">
                    Repository URL
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold">
                    Commit Hash
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold">
                    Chain ID
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((item, index) => (
                  <tr key={item.itemID} className="transition-all duration-300 hover:bg-purple-500/10">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-cyan-400">
                      {item.itemID}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neon-link break-all hover:text-cyan-300"
                      >
                        {item.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-300">
                      {item.commit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-pink-300 font-semibold">
                      {item.chainId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-300">
                Showing <span className="text-cyan-400 font-semibold">{startIndex + 1}</span> to <span className="text-cyan-400 font-semibold">{Math.min(endIndex, data.length)}</span> of <span className="text-purple-400 font-semibold">{data.length}</span> entries
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="neon-button px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-400 rounded-lg">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="neon-button px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compliance Check Modal */}
      {showComplianceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="neon-modal max-w-5xl w-full max-h-[85vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-purple-500/30">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 font-['Orbitron']">
                COMPLIANCE CHECK PROMPT
              </h2>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="text-gray-400 hover:text-white text-3xl transition-colors duration-300 hover:scale-110"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="glass p-6 border-cyan-500/30">
                <div className="flex justify-between items-center mb-6">
                  <label className="text-lg font-semibold text-cyan-300">Copy this prompt to ChatGPT:</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateCompliancePrompt());
                      alert('Prompt copied to clipboard!');
                    }}
                    className="neon-button text-sm font-bold py-2 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-400"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-sm text-gray-200 whitespace-pre-wrap font-mono overflow-x-auto leading-relaxed bg-black/30 p-4 rounded-lg border border-purple-500/20">
                  {generateCompliancePrompt()}
                </pre>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-purple-500/30">
              <button
                onClick={() => setShowComplianceModal(false)}
                className="neon-button py-3 px-6 rounded-lg font-bold bg-gradient-to-r from-gray-600 to-gray-700 border-gray-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
