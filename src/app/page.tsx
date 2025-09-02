'use client';

import { useState, useEffect } from 'react';

interface ATQRegistryItem {
  itemID: string;
  url: string;
  commit: string;
  chainId: string;
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

      const result = await response.json();

      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      // Parse the response to extract the required fields
      const parsedData: ATQRegistryItem[] = result.data.litems.map((item: any) => {
        const url = item.metadata.props.find((prop: any) => prop.label === 'Github Repository URL')?.value || '';
        const commit = item.metadata.props.find((prop: any) => prop.label === 'Commit hash')?.value || '';
        const chainId = item.metadata.props.find((prop: any) => prop.label === 'EVM Chain ID')?.value || '';

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ATQ Registry data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={fetchData}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ATQ Registry Viewer</h1>
              <p className="text-gray-600">Total entries: {data.length}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowComplianceModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Generate Compliance Check
              </button>
              <button
                onClick={downloadData}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                Download Data
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Repository URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commit Hash
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chain ID
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((item, index) => (
                  <tr key={item.itemID} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {item.itemID}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {item.url}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {item.commit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.chainId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md">
                  {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Compliance Check Prompt</h2>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="bg-gray-100 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-medium text-gray-700">Copy this prompt to ChatGPT:</label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generateCompliancePrompt());
                      alert('Prompt copied to clipboard!');
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono overflow-x-auto">
                  {generateCompliancePrompt()}
                </pre>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={() => setShowComplianceModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded transition-colors"
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
