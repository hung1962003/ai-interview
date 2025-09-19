import Vapi from '@vapi-ai/web';

interface EcommerceOrderConfig {
  publicApiKey: string;
  workflowId: string;
}

function createEcommerceOrderWorkflow(config: EcommerceOrderConfig) {
  const vapi = new Vapi(config.publicApiKey);
  let isConnected = false;
  let currentCustomer: any = null;

  // Setup event listeners for customer service calls
  vapi.on('call-start', () => {
    isConnected = true;
    console.log('E-commerce customer service call started');
  });

  vapi.on('call-end', () => {
    isConnected = false;
    console.log('Customer service call ended');
    processCustomerServiceOutcome();
  });

  vapi.on('message', (message) => {
    if (message.type === 'transcript') {
      console.log(`${message.role}: ${message.transcript}`);
    } else if (message.type === 'function-call') {
      handleCustomerServiceFunction(message.functionCall);
    } else if (message.type === 'workflow-step') {
      console.log('Customer service workflow step:', message.step);
    }
  });

  vapi.on('error', (error) => {
    console.error('Customer service workflow error:', error);
  });

  function handleCustomerServiceFunction(functionCall: { name: string; parameters: Record<string, unknown> }) {
    switch (functionCall.name) {
      case 'lookup_customer':
        console.log('Looking up customer:', functionCall.parameters);
        break;
      case 'track_order':
        console.log('Tracking order:', functionCall.parameters);
        break;
      case 'process_return':
        console.log('Processing return:', functionCall.parameters);
        break;
      default:
        console.log('Customer service function called:', functionCall.name, functionCall.parameters);
    }
  }

  function processCustomerServiceOutcome() {
    console.log('Processing customer service outcome for:', currentCustomer);
  }

  return {
    startCustomerServiceCall: (customerData?: any) => {
      if (!isConnected) {
        currentCustomer = customerData;
        vapi.start(config.workflowId);
      }
    },
    endCall: () => {
      if (isConnected) {
        vapi.stop();
      }
    },
    isConnected: () => isConnected
  };
}

// Usage for e-commerce customer service integration
const customerServiceWorkflow = createEcommerceOrderWorkflow({
  publicApiKey: 'YOUR_PUBLIC_API_KEY',
  workflowId: 'YOUR_WORKFLOW_ID'
});

// Add to your e-commerce site's customer service button
document.getElementById('customer-service-button')?.addEventListener('click', () => {
  customerServiceWorkflow.startCustomerServiceCall({
    customerId: 'current_customer_id',
    currentPage: 'order_tracking',
    context: 'website_support'
  });
});
