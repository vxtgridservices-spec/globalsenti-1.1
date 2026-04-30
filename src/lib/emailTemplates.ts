
export const baseEmailTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', Helvetica, Arial, sans-serif; background-color: #000000; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { color: #D4AF37; font-size: 24px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; }
        .card { background-color: #111111; border: 1px solid #333333; border-radius: 8px; padding: 30px; margin-bottom: 30px; }
        .footer { text-align: center; color: #666666; font-size: 12px; margin-top: 40px; border-top: 1px solid #333333; padding-top: 20px; }
        h1 { color: #D4AF37; font-size: 22px; margin-bottom: 20px; }
        p { line-height: 1.6; font-size: 14px; color: #cccccc; }
        .highlight { color: #D4AF37; font-weight: bold; }
        .status-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .status-active { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .status-pending { background-color: rgba(234, 179, 8, 0.2); color: #eab308; }
        .status-rejected { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #222222; padding-bottom: 10px; }
        .detail-label { color: #666666; }
        .detail-value { color: #ffffff; font-weight: 500; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Global Sentinel Group</div>
        </div>
        <div class="card">
            ${content}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} Global Sentinel Group. All rights reserved.<br>
            This is an automated transactional email. For support, please contact your account manager.
        </div>
    </div>
</body>
</html>
`;

export const investmentConfirmationTemplate = (data: {
  userName: string;
  assetName: string;
  units: number;
  amount: number;
  timestamp: string;
}) => baseEmailTemplate(`
    <h1>Investment Confirmed</h1>
    <p>Dear ${data.userName},</p>
    <p>Your investment in <span class="highlight">${data.assetName}</span> has been successfully processed and added to your portfolio.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">Asset</span>
            <span class="detail-value">${data.assetName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Units Purchased</span>
            <span class="detail-value">${data.units}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Invested</span>
            <span class="detail-value">$${data.amount.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Date/Time</span>
            <span class="detail-value">${data.timestamp}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge status-active">Active</span>
        </div>
    </div>
    
    <p>You can view your updated positions in your portal dashboard.</p>
`);

export const withdrawalRequestTemplate = (data: {
  userName: string;
  amount: number;
  timestamp: string;
}) => baseEmailTemplate(`
    <h1>Withdrawal Request Received</h1>
    <p>Dear ${data.userName},</p>
    <p>Your request to withdraw funds has been received and is currently under secondary review.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">Requested Amount</span>
            <span class="detail-value">$${data.amount.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Request Date</span>
            <span class="detail-value">${data.timestamp}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Current Status</span>
            <span class="status-badge status-pending">In Review</span>
        </div>
    </div>
    
    <p>Our settlement team will process your request within 2-3 business days. You will receive an update once the review is complete.</p>
`);

export const withdrawalApprovedTemplate = (data: {
  userName: string;
  amount: number;
  timestamp: string;
}) => baseEmailTemplate(`
    <h1>Withdrawal Approved</h1>
    <p>Dear ${data.userName},</p>
    <p>We are pleased to inform you that your withdrawal request has been approved.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">Approved Amount</span>
            <span class="detail-value">$${data.amount.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Approval Date</span>
            <span class="detail-value">${data.timestamp}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge status-active">Approved</span>
        </div>
    </div>
    
    <p>The funds are being transferred to your settlement account. Please allow 24-48 hours for the transaction to reflect in your account.</p>
`);

export const withdrawalRejectedTemplate = (data: {
  userName: string;
  amount: number;
  timestamp: string;
  reason?: string;
}) => baseEmailTemplate(`
    <h1>Withdrawal Request Update</h1>
    <p>Dear ${data.userName},</p>
    <p>Your recent withdrawal request could not be completed at this time.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">Requested Amount</span>
            <span class="detail-value">$${data.amount.toLocaleString()}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge status-rejected">Rejected</span>
        </div>
    </div>
    
    ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
    
    <p>If you have any questions regarding this decision, please contact our support department or your primary broker.</p>
`);

export const roiUpdateTemplate = (data: {
  userName: string;
  roi: number;
  portfolioValue: number;
  note?: string;
}) => baseEmailTemplate(`
    <h1>Portfolio Update</h1>
    <p>Dear ${data.userName},</p>
    <p>Your investment portfolio performance has been updated.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">New Performance (ROI)</span>
            <span class="detail-value" style="color: #22c55e;">+${data.roi}%</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Portfolio Value</span>
            <span class="detail-value">$${data.portfolioValue.toLocaleString()}</span>
        </div>
    </div>
    
    ${data.note ? `<p><strong>Manager's Note:</strong> ${data.note}</p>` : ''}
    
    <p>Review your detailed performance metrics in the intelligence center.</p>
`);

// --- Authentication Templates ---

export const verificationEmailTemplate = (data: {
  userName: string;
  verificationLink: string;
}) => baseEmailTemplate(`
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 10px 20px; background-color: rgba(212, 175, 55, 0.1); border-radius: 50px; margin-bottom: 20px;">
            <span style="color: #D4AF37; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Security Protocol: Identity Verification</span>
        </div>
        <h1 style="margin-top: 0;">Activate Your Global Sentinel Account</h1>
        <p>Dear ${data.userName},</p>
        <p>Your request for access to the Global Sentinel Group ecosystem has been received. To secure your account and activate your credentials, we requires a mandatory verification of your digital identity.</p>
    </div>
    
    <div style="background-color: #050505; border: 1px solid #333333; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
        <p style="margin-bottom: 25px; color: #ffffff; font-size: 15px;">Please authenticate your email address by clicking the secure link below:</p>
        
        <a href="${data.verificationLink}" style="background-color: #D4AF37; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 4px; font-weight: 900; font-size: 14px; text-transform: uppercase; display: inline-block; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);">Verify My Identity</a>
        
        <p style="margin-top: 25px; font-size: 11px; color: #666666;">This link will expire in 24 hours for security purposes.</p>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222222;">
        <p style="font-size: 13px; font-weight: bold; color: #D4AF37; margin-bottom: 5px;">Why am I receiving this?</p>
        <p style="font-size: 12px; margin-top: 0;">Global Sentinel Group enforces strict multi-layered security protocols (v4.2). Verification ensures that only authorized entities can access our private deal rooms and chemical marketplace.</p>
    </div>
    
    <p style="font-size: 12px; color: #666666; margin-top: 30px; text-align: center;">If the button above doesn't work, copy and paste this URL into your browser:<br>
    <span style="color: #D4AF37; word-break: break-all;">${data.verificationLink}</span></p>
`);

export const welcomeEmailTemplate = (data: {
  userName: string;
}) => baseEmailTemplate(`
    <h1>Welcome to Global Sentinel Group</h1>
    <p>Dear ${data.userName},</p>
    <p>We are pleased to welcome you to the Global Sentinel Group ecosystem—a secure environment for digital asset management and international trade.</p>
    
    <div style="margin: 30px 0; border: 1px solid #333333; border-radius: 8px; padding: 20px; background-color: #050505;">
        <p style="margin: 0 0 10px 0; font-weight: bold; color: #D4AF37;">Your Access is Ready:</p>
        <ul style="color: #cccccc; font-size: 13px; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Explore institutional-grade investment opportunities</li>
            <li style="margin-bottom: 8px;">Access the global chemical marketplace</li>
            <li style="margin-bottom: 8px;">Execute secure transactions with verified partners</li>
        </ul>
    </div>
    
    <p>You can now access your dashboard and complete your verification to begin your journey with us.</p>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="https://globalsentinelgroup.com/portal" style="background-color: #D4AF37; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Access Dashboard</a>
    </div>
`);

export const passwordResetTemplate = (data: {
  userName: string;
  resetLink: string;
}) => baseEmailTemplate(`
    <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 10px 20px; background-color: rgba(212, 175, 55, 0.1); border-radius: 50px; margin-bottom: 20px;">
            <span style="color: #D4AF37; font-weight: bold; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Security Protocol: Credential Recovery</span>
        </div>
        <h1 style="margin-top: 0;">Password Reset Request</h1>
        <p>Dear ${data.userName},</p>
        <p>A request has been initiated to reset the security credentials associated with your Global Sentinel Group account.</p>
    </div>
    
    <div style="background-color: #050505; border: 1px solid #333333; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
        <p style="margin-bottom: 25px; color: #ffffff; font-size: 15px;">To proceed with the credential recovery, please click the secure button below:</p>
        
        <a href="${data.resetLink}" style="background-color: #D4AF37; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 4px; font-weight: 900; font-size: 14px; text-transform: uppercase; display: inline-block; letter-spacing: 1px; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.2);">Reset My Password</a>
        
        <p style="margin-top: 25px; font-size: 11px; color: #666666;">If you did not request this reset, no further action is required. Your account remains secure.</p>
    </div>
    
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #222222; font-size: 12px; color: #666666; text-align: center;">
        For your security, this link will expire in 1 hour. Global Sentinel Group will never ask for your password via email.
    </div>
`);

// --- Chemical Marketplace Templates ---

export const orderConfirmationTemplate = (data: {
  userName: string;
  orderId: string;
  productName: string;
  quantity: string;
  totalPrice: string;
  timestamp: string;
}) => baseEmailTemplate(`
    <h1>Order Confirmation – Chemical Division</h1>
    <p>Dear ${data.userName},</p>
    <p>Your order has been successfully received and is now being prepared for fulfillment.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">Order ID</span>
            <span class="detail-value">#${data.orderId.substring(0, 8)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Product(s)</span>
            <span class="detail-value">${data.productName}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Quantity</span>
            <span class="detail-value">${data.quantity}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Amount</span>
            <span class="detail-value">${data.totalPrice}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Order Date</span>
            <span class="detail-value">${data.timestamp}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge status-pending">Processing</span>
        </div>
    </div>
    
    <p>You can track your order progress in the Chemical Operations dashboard.</p>
`);

export const orderStatusTemplate = (data: {
  userName: string;
  orderId: string;
  status: string;
  message: string;
}) => baseEmailTemplate(`
    <h1>Order Status Update</h1>
    <p>Dear ${data.userName},</p>
    <p>There has been an update regarding your chemical order <span class="highlight">#${data.orderId.substring(0, 8)}</span>.</p>
    
    <div style="margin: 30px 0; background-color: rgba(212, 175, 55, 0.05); border: 1px solid #333333; border-radius: 8px; padding: 20px;">
        <p style="margin: 0; font-size: 16px; text-align: center;">New Status: <span class="highlight">${data.status}</span></p>
    </div>
    
    <p>${data.message}</p>
    
    <p style="margin-top: 30px;">For any inquiries regarding this shipment, please refer to your order detail in the portal.</p>
`);

export const orderCancelledTemplate = (data: {
  userName: string;
  orderId: string;
  reason?: string;
}) => baseEmailTemplate(`
    <h1>Order Update</h1>
    <p>Dear ${data.userName},</p>
    <p>We regret to inform you that your order <span class="highlight">#${data.orderId.substring(0, 8)}</span> has been cancelled.</p>
    
    <div style="margin: 30px 0;">
        <div class="detail-row">
            <span class="detail-label">Order ID</span>
            <span class="detail-value">#${data.orderId.substring(0, 8)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="status-badge status-rejected">Cancelled</span>
        </div>
    </div>
    
    ${data.reason ? `<p><strong>Reason for cancellation:</strong> ${data.reason}</p>` : ''}
    
    <p>A full refund (if applicable) will be processed through your original payment method. If you have questions, please contact our logistics support team.</p>
`);

// --- Deal Room Templates ---

export const dealInvitationTemplate = (data: {
  userName: string;
  dealId: string;
  dealType: string;
}) => baseEmailTemplate(`
    <h1>Deal Room Access Granted</h1>
    <p>Dear ${data.userName},</p>
    <p>You have been granted secure access to a private deal room for transaction <span class="highlight">#${data.dealId.substring(0, 8)}</span> (${data.dealType}).</p>
    
    <div style="margin: 30px 0; border: 1px dashed #D4AF37; padding: 20px; border-radius: 8px;">
        <p style="margin: 0; color: #cccccc; font-size: 13px;">This deal room is a protected environment for secure communication, document exchange, and transaction coordination between you and Global Sentinel Group.</p>
    </div>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="https://globalsentinelgroup.com/portal/deal-room/${data.dealId}" style="background-color: #D4AF37; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Enter Deal Room</a>
    </div>
`);

export const dealStageUpdateTemplate = (data: {
  userName: string;
  dealId: string;
  newStage: string;
  explanation: string;
}) => baseEmailTemplate(`
    <h1>Transaction Status Updated</h1>
    <p>Dear ${data.userName},</p>
    <p>The status of your transaction <span class="highlight">#${data.dealId.substring(0, 8)}</span> has been updated.</p>
    
    <div style="margin: 30px 0; background-color: #111111; border-left: 4px solid #D4AF37; padding: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">New Transaction Stage:</p>
        <p style="margin: 0; font-size: 18px; color: #ffffff; font-weight: bold;">${data.newStage}</p>
    </div>
    
    <p>${data.explanation}</p>
    
    <div style="text-align: center; margin-top: 30px;">
        <a href="https://globalsentinelgroup.com/portal/deal-room/${data.dealId}" style="background-color: #333333; color: #ffffff; padding: 10px 25px; text-decoration: none; border-radius: 4px; font-size: 13px; display: inline-block; border: 1px solid #444444;">View Deal Progress</a>
    </div>
`);

export const contractReadyTemplate = (data: {
  userName: string;
  dealId: string;
}) => baseEmailTemplate(`
    <h1>Contract Ready for Review</h1>
    <p>Dear ${data.userName},</p>
    <p>The transaction terms for deal <span class="highlight">#${data.dealId.substring(0, 8)}</span> have been finalized and the formal agreement is now ready.</p>
    
    <p style="margin: 30px 0;">Please review the contract details and execution requirements inside the secure deal room. Your digital signature or confirmation may be required to proceed.</p>
    
    <div style="text-align: center;">
        <a href="https://globalsentinelgroup.com/portal/deal-room/${data.dealId}" style="background-color: #D4AF37; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Review Agreement</a>
    </div>
`);

export const escrowInitiatedTemplate = (data: {
  userName: string;
  dealId: string;
}) => baseEmailTemplate(`
    <h1>Escrow Process Initiated</h1>
    <p>Dear ${data.userName},</p>
    <p>The escrow process for transaction <span class="highlight">#${data.dealId.substring(0, 8)}</span> has been successfully initiated.</p>
    
    <p style="margin: 30px 0;">To ensure the security of this trade, funds must now be secured in the designated escrow account. Detailed funding instructions and deposit verification steps are available in your deal room.</p>
    
    <div style="text-align: center;">
        <a href="https://globalsentinelgroup.com/portal/deal-room/${data.dealId}" style="background-color: #D4AF37; color: #000000; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px; text-transform: uppercase; display: inline-block;">Proceed to Escrow</a>
    </div>
`);

export const fundingConfirmedTemplate = (data: {
  userName: string;
  dealId: string;
}) => baseEmailTemplate(`
    <h1>Funding Confirmed</h1>
    <p>Dear ${data.userName},</p>
    <p>We are pleased to confirm that the funds for transaction <span class="highlight">#${data.dealId.substring(0, 8)}</span> have been successfully secured in escrow.</p>
    
    <p style="margin: 30px 0;">Transaction execution is now in progress according to the agreed-upon timeline. You will be notified once the final delivery or completion phase is reached.</p>
`);

export const dealCompletedTemplate = (data: {
  userName: string;
  dealId: string;
}) => baseEmailTemplate(`
    <h1>Transaction Completed</h1>
    <p>Dear ${data.userName},</p>
    <p>Transaction <span class="highlight">#${data.dealId.substring(0, 8)}</span> has been successfully completed and closed.</p>
    
    <p style="margin: 30px 0;">Thank you for choosing Global Sentinel Group for your international trade requirements. We look forward to facilitating your future transactions.</p>
    
    <div style="text-align: center;">
        <a href="https://globalsentinelgroup.com/portal/deal-room/${data.dealId}" style="background-color: #333333; color: #ffffff; padding: 10px 25px; text-decoration: none; border-radius: 4px; font-size: 13px; display: inline-block;">View Transaction Summary</a>
    </div>
`);

export const dealRejectedTemplate = (data: {
  userName: string;
  dealId: string;
  reason?: string;
}) => baseEmailTemplate(`
    <h1>Transaction Closed</h1>
    <p>Dear ${data.userName},</p>
    <p>We are informing you that transaction <span class="highlight">#${data.dealId.substring(0, 8)}</span> has been closed without completion.</p>
    
    ${data.reason ? `<div style="margin: 20px 0; padding: 15px; background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); color: #ef4444; font-size: 14px;"><strong>Admin Note:</strong> ${data.reason}</div>` : ''}
    
    <p>If you require further clarification regarding this closure, please contact your account manager or our support department.</p>
`);
