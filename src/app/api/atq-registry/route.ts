import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(request: NextRequest) {
  try {
    // Get API key from environment or use fallback
    const apiKey = process.env.THEGRAPH_API_KEY;
    
    let apiEndpoint: string;
    if (apiKey) {
      apiEndpoint = `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/9hHo5MpjpC1JqfD3BsgFnojGurXRHTrHWcUcZPPCo6m8`;
    } else {
      apiEndpoint = 'https://api.studio.thegraph.com/query/61738/legacy-curate-gnosis/v0.1.1';
    }

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

    const data: GraphQLResponse = await response.json();

    if (data.errors) {
      throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
    }

    // Parse the response to extract the required fields
    const parsedData: ATQRegistryItem[] = data.data.litems.map(item => {
      const url = item.metadata.props.find(prop => prop.label === 'Github Repository URL')?.value || '';
      const commit = item.metadata.props.find(prop => prop.label === 'Commit hash')?.value || '';
      const chainId = item.metadata.props.find(prop => prop.label === 'EVM Chain ID')?.value || '';

      return {
        itemID: item.itemID,
        url,
        commit,
        chainId
      };
    });

    return NextResponse.json(parsedData);
  } catch (error) {
    console.error('Error fetching ATQ registry data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ATQ registry data' },
      { status: 500 }
    );
  }
}

