import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChemicalOrder } from '../types/chemicals';

export const generateChemicalDocument = (type: 'Invoice' | 'SDS' | 'COA' | 'Instructions' | 'Agreement', order: ChemicalOrder) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(173, 151, 79); // Gold-ish color #AD974F
    doc.text('GLOBAL SENTINEL', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('CHEMICAL & INDUSTRIAL DIVISION', pageWidth / 2, 28, { align: 'center' });
    
    doc.setDrawColor(173, 151, 79);
    doc.setLineWidth(0.5);
    doc.line(20, 32, pageWidth - 20, 32);

    // Document Title
    doc.setFontSize(16);
    doc.setTextColor(0);
    const titles = {
        Invoice: 'PROFORMA INVOICE',
        SDS: 'SAFETY DATA SHEET (SDS)',
        COA: 'CERTIFICATE OF ANALYSIS (COA)',
        Instructions: 'SETTLEMENT & PAYMENT INSTRUCTIONS',
        Agreement: 'CONFIDENTIAL BINDING AGREEMENT'
    };
    doc.text(titles[type], 20, 45);

    // Metadata
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(`Document No: ${type.toUpperCase()}-${order.id.slice(0, 8)}`, 20, 52);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 57);
    doc.text(`Order ID: ${order.id}`, 20, 62);

    // Client Info
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('BILL TO:', 20, 75);
    doc.setFontSize(10);
    doc.text(`${order.profile?.full_name || 'Valued Client'}`, 20, 82);
    doc.text(`${order.profile?.email || 'N/A'}`, 20, 87);

    let currentY = 100;

    if (type === 'Invoice') {
        autoTable(doc, {
            startY: currentY,
            head: [['Description', 'Quantity', 'Unit Price', 'Total']],
            body: [[
                order.product?.name || 'Chemical Product',
                `${order.quantity} ${order.product?.unit_type || 'Units'}`,
                `$${order.product?.price_per_unit.toLocaleString()}`,
                `$${order.total_price.toLocaleString()}`
            ]],
            headStyles: { fillColor: [173, 151, 79] }
        });
        currentY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(12);
        doc.text(`Grand Total: $${order.total_price.toLocaleString()}`, pageWidth - 20, currentY, { align: 'right' });
    }

    if (type === 'Instructions') {
        doc.setFontSize(11);
        doc.text('SETTLEMENT DETAILS:', 20, currentY);
        doc.setFontSize(10);
        doc.setTextColor(50);
        const instructions = order.payment_instructions || 'Awaiting specific instructions from Global Sentinel Finance Team.';
        const splitText = doc.splitTextToSize(instructions, pageWidth - 40);
        doc.text(splitText, 20, currentY + 10);
        
        currentY += 20 + (splitText.length * 5);
        doc.setTextColor(200, 0, 0);
        doc.setFontSize(9);
        doc.text('IMPORTANT: Transfers must include the Order ID in the reference field.', 20, currentY);
    }

    if (type === 'Agreement') {
        doc.setFontSize(11);
        doc.text('TERMS OF ENGAGEMENT:', 20, currentY);
        doc.setFontSize(9);
        const terms = [
            '1. CONFIDENTIALITY: Both parties agree to keep pricing and volume data strictly confidential.',
            '2. BINDING NATURE: By placing this order, the buyer enters into a legally binding purchase agreement.',
            '3. COMPLIANCE: All products must be handled according to international hazmat safety standards.',
            '4. DISPUTES: Any legal proceedings shall be governed by international maritime law protocols.'
        ];
        terms.forEach((t, i) => {
            doc.text(t, 20, currentY + 10 + (i * 7));
        });
        currentY += 50;
        doc.text('Authorized Signature (Global Sentinel)', 20, currentY);
        doc.text('__________________________', 20, currentY + 5);
        doc.text('Seal of Authority', pageWidth - 60, currentY);
    }

    if (type === 'SDS') {
        doc.setFontSize(11);
        doc.text('SECTION 1: IDENTIFICATION', 20, currentY);
        doc.setFontSize(10);
        doc.text(`Product Name: ${order.product?.name}`, 20, currentY + 7);
        doc.text(`Chemical Formula: Industry Standard Grade`, 20, currentY + 14);
        
        currentY += 30;
        doc.setFontSize(11);
        doc.text('SECTION 2: HAZARDS IDENTIFICATION', 20, currentY);
        doc.setFontSize(10);
        doc.text('Classification: GHS Compliant - Industrial Grade Chemicals', 20, currentY + 7);
        doc.text('Precautionary Statements: Handle with extreme caution. Use proper PPE.', 20, currentY + 14);
    }

    if (type === 'COA') {
        doc.setFontSize(11);
        doc.text('ANALYTICAL RESULTS:', 20, currentY);
        autoTable(doc, {
            startY: currentY + 5,
            head: [['Parameter', 'Specification', 'Results']],
            body: [
                ['Purity', 'Min 99.5%', '99.8%'],
                ['Moisture', 'Max 0.05%', '0.02%'],
                ['Appearance', 'Clear Liquid / Consistent Powder', 'Conforms'],
                ['Density / Mesh', 'Standard Industry +/- 2%', 'Conforms']
            ],
            headStyles: { fillColor: [173, 151, 79] }
        });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('This is a system-generated document and is valid without physical signature.', pageWidth / 2, footerY, { align: 'center' });
    doc.text('Global Sentinel Group - Secure Infrastructure & Commodities', pageWidth / 2, footerY + 5, { align: 'center' });

    doc.save(`${type}_${order.id.slice(0, 8)}.pdf`);
};
