import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Expense, Roomie, CATEGORIES } from './storageService';

export const generateReport = async (expenses: Expense[], roomies: any[], monthLabel: string) => {
  const totalAmount = expenses.reduce((a, b) => a + b.amount, 0);
  
  // ALGORITHM: Calculate Settlement Flow for THIS PERIOD ONLY
  const creditors = roomies.filter(r => r.balance > 0).map(r => ({ ...r }));
  const debtors = roomies.filter(r => r.balance < 0).map(r => ({ ...r, balance: Math.abs(r.balance) }));
  
  const settlements: { from: string, to: string, amount: number }[] = [];
  
  // SETTLEMENT ALGORITHM: Identifies the most efficient money flow to reach zero balance
  let creditorIdx = 0;
  let debtorIdx = 0;
  
  while (creditorIdx < creditors.length && debtorIdx < debtors.length) {
    const creditor = creditors[creditorIdx];
    const debtor = debtors[debtorIdx];
    
    const amount = Math.min(creditor.balance, debtor.balance);
    settlements.push({ from: debtor.name, to: creditor.name, amount });
    
    creditor.balance -= amount;
    debtor.balance -= amount;
    
    if (creditor.balance === 0) creditorIdx++;
    if (debtor.balance === 0) debtorIdx++;
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          body {
            font-family: 'Segoe UI', Calibri, Arial, sans-serif;
            background-color: #FFFFFF;
            color: #333333;
            padding: 20px;
            line-height: 1.5;
          }
          .excel-container {
            border: 1px solid #D9D9D9;
            padding: 25px;
            background-color: #FFFFFF;
          }
          .excel-header {
            border-bottom: 2px solid #217346;
            padding-bottom: 15px;
            margin-bottom: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .excel-title-block h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            color: #217346;
          }
          .excel-title-block p {
            margin: 4px 0 0 0;
            font-size: 11px;
            color: #666666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-table {
            border-collapse: collapse;
            font-size: 11px;
          }
          .meta-table td {
            padding: 4px 8px;
            border: 1px solid #D9D9D9;
          }
          .meta-label {
            background-color: #F2F2F2;
            font-weight: 700;
            color: #555555;
          }
          .section-title {
            font-size: 14px;
            font-weight: 700;
            color: #217346;
            margin-top: 25px;
            margin-bottom: 10px;
            border-left: 4px solid #217346;
            padding-left: 8px;
          }
          .excel-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          .excel-table th {
            background-color: #217346;
            color: #FFFFFF;
            font-weight: 700;
            padding: 8px 10px;
            border: 1px solid #1a5c38;
            text-align: left;
          }
          .excel-table td {
            padding: 8px 10px;
            border: 1px solid #D9D9D9;
          }
          .excel-table tr:nth-child(even) td {
            background-color: #F9FBF9;
          }
          .num-col {
            text-align: right;
            font-family: monospace;
            font-size: 13px;
          }
          .balance-positive {
            color: #1b5e20;
            background-color: #e8f5e9 !important;
            font-weight: 700;
          }
          .balance-negative {
            color: #b71c1c;
            background-color: #ffebee !important;
            font-weight: 700;
          }
          .settlement-card {
            border: 1px dashed #217346;
            background-color: #F4F9F5;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          .settlement-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            border-bottom: 1px solid #E2EFE6;
            font-size: 12px;
          }
          .settlement-row:last-child {
            border-bottom: none;
          }
          .settlement-text {
            color: #333333;
          }
          .settlement-amount {
            font-weight: 700;
            color: #217346;
            font-family: monospace;
            font-size: 14px;
          }
          .footer {
            margin-top: 30px;
            border-top: 1px solid #D9D9D9;
            padding-top: 10px;
            font-size: 10px;
            color: #777777;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="excel-container">
          <div class="excel-header">
            <div class="excel-title-block">
              <h1>RUUMI - REPORTE DE GASTOS</h1>
              <p>HOJA DE LIQUIDACIÓN Y AUDITORÍA DE ROOMIES</p>
            </div>
            <table class="meta-table">
              <tr>
                <td class="meta-label">PERÍODO:</td>
                <td>${monthLabel}</td>
              </tr>
              <tr>
                <td class="meta-label">FECHA INFORME:</td>
                <td>${new Date().toLocaleDateString('es-CL')}</td>
              </tr>
              <tr>
                <td class="meta-label">FOLIO:</td>
                <td>#RU-${Math.floor(Math.random()*10000)}</td>
              </tr>
            </table>
          </div>

          <div class="section-title">AUDITORÍA DE PARTICIPACIÓN DEL MES</div>
          <table class="excel-table">
            <thead>
              <tr>
                <th>ROOMIE</th>
                <th style="text-align: right;">APORTADO (EFECTIVO)</th>
                <th style="text-align: right;">RESPONSABILIDAD (DEBE)</th>
                <th style="text-align: right;">BALANCE MES</th>
              </tr>
            </thead>
            <tbody>
              ${roomies.map(r => `
                <tr>
                  <td style="font-weight: 700; color: #217346;">${r.name.toUpperCase()}</td>
                  <td class="num-col">$${r.totalContributed.toLocaleString('es-CL')}</td>
                  <td class="num-col">$${r.totalResponsibilities.toLocaleString('es-CL')}</td>
                  <td class="num-col ${r.balance < 0 ? 'balance-negative' : 'balance-positive'}">
                    ${r.balance < 0 ? '-' : '+'}$${Math.abs(r.balance).toLocaleString('es-CL')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="section-title">INSTRUCCIONES DE CIERRE (TRANSFERENCIAS RECOMENDADAS)</div>
          <div class="settlement-card">
            ${settlements.length > 0 ? settlements.map(s => `
              <div class="settlement-row">
                <span class="settlement-text">
                  <strong>${s.from.toUpperCase()}</strong> debe transferir a <strong>${s.to.toUpperCase()}</strong>
                </span>
                <span class="settlement-amount">$${s.amount.toLocaleString('es-CL')}</span>
              </div>
            `).join('') : '<div style="color: #217346; font-weight: 700; font-size: 12px;">El período se encuentra perfectamente balanceado. No se requieren transferencias.</div>'}
          </div>

          <div class="section-title">SALDOS HISTÓRICOS ACUMULADOS</div>
          <table class="excel-table" style="max-width: 450px;">
            <thead>
              <tr>
                <th>ROOMIE</th>
                <th style="text-align: right; width: 150px;">SALDO HISTÓRICO</th>
              </tr>
            </thead>
            <tbody>
              ${roomies.map(r => `
                <tr>
                  <td style="font-weight: 700;">${r.name.toUpperCase()}</td>
                  <td class="num-col ${r.historicalBalance < 0 ? 'balance-negative' : 'balance-positive'}">
                    ${r.historicalBalance < 0 ? '-' : '+'}$${Math.abs(r.historicalBalance).toLocaleString('es-CL')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p style="font-size: 10px; color: #777777; font-style: italic; margin-top: -10px; margin-bottom: 20px;">
            * Los saldos históricos incluyen deudas pendientes de meses anteriores que arrastra cada roomie.
          </p>

          <div class="footer">
            <div>REPORTE GENERADO AUTOMÁTICAMENTE POR EL MOTOR DE CUENTAS DE RUUMI v1.0.1</div>
            <div style="font-weight: bold; margin-top: 4px; color: #217346;">DOCUMENTO DE CONTROL INTERNO - SIN VALIDEZ TRIBUTARIA</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};
