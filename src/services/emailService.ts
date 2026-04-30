
/**
 * Client-side service to trigger transactional emails via the Express backend.
 */

export type EmailType = 
  | 'investment-confirmation' 
  | 'withdrawal-request' 
  | 'withdrawal-approved' 
  | 'withdrawal-rejected' 
  | 'roi-update'
  | 'welcome'
  | 'password-reset'
  | 'order-confirmation'
  | 'order-status'
  | 'order-cancelled'
  | 'deal-invitation'
  | 'deal-stage-update'
  | 'contract-ready'
  | 'escrow-initiated'
  | 'funding-confirmed'
  | 'deal-completed'
  | 'deal-rejected';

export async function sendTransactionalEmail(
  type: EmailType, 
  recipientEmail: string, 
  data: any
) {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        recipientEmail,
        data,
      }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.warn('Email service responded with error:', errorData);
    }
    
    return await response.json();
  } catch (error) {
    // Log error silently as requested
    console.error('Email trigger failed:', error);
    return { success: false, error };
  }
}
