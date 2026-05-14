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
          @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
          
          body { font-family: 'Space Mono', monospace; background-color: #000; color: #00E5FF; padding: 30px; line-height: 1.4; }
          .border-frame { border: 6px solid #00E5FF; padding: 20px; min-height: 96vh; border-style: double; }
          .header { border-bottom: 2px dashed #FF007A; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 32px; font-weight: 700; color: #FFF; }
          .system-id { font-size: 9px; color: #FF007A; letter-spacing: 2px; }
          .report-meta { display: flex; justify-content: space-between; font-size: 10px; margin-top: 10px; }

          .settlement-zone { background-color: rgba(255, 0, 122, 0.1); border: 2px solid #FF007A; padding: 20px; margin-bottom: 30px; }
          .section-label { background-color: #FF007A; color: #000; padding: 2px 10px; display: inline-block; font-weight: 700; font-size: 12px; margin-bottom: 15px; }

          .instruction-row { border-left: 5px solid #00E5FF; padding: 10px 15px; margin-bottom: 10px; background-color: rgba(0, 229, 255, 0.05); display: flex; justify-content: space-between; align-items: center; }
          .instr-text { font-size: 14px; font-weight: 700; color: #FFF; }
          .instr-amount { font-size: 20px; font-weight: 700; color: #00E5FF; }

          .audit-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid rgba(0, 229, 255, 0.3); }
          .audit-table th { background-color: rgba(0, 229, 255, 0.1); padding: 10px; font-size: 9px; color: #FF007A; text-align: left; }
          .audit-table td { padding: 10px; font-size: 11px; border-bottom: 1px solid rgba(0, 229, 255, 0.1); }

          .historical-box { border: 2px solid #00E5FF; padding: 15px; margin-top: 20px; }

          .footer { margin-top: 40px; border-top: 2px dashed #00E5FF; padding-top: 15px; font-size: 9px; text-align: center; }
          .barcode { margin-top: 20px; letter-spacing: 5px; opacity: 0.4; font-size: 8px; }
        </style>
      </head>
      <body>
        <div class="border-frame">
          <div class="header">
            <div class="system-id">OFFICIAL_PERIOD_SETTLEMENT // RUUMI_OS</div>
            <h1>BOLETA_DE_LIQUIDACIÓN</h1>
            <div class="report-meta">
              <div>PERIOD: ${monthLabel}</div>
              <div>FOLIO: #RU-${Math.floor(Math.random()*10000)}</div>
              <div>DATE: ${new Date().toLocaleDateString('es-CL')}</div>
            </div>
          </div>

          <div class="settlement-zone">
            <div class="section-label">INSTRUCCIONES_DE_CIERRE_PERIODO</div>
            ${settlements.length > 0 ? settlements.map(s => `
              <div class="instruction-row">
                <div class="instr-text">
                  <span style="color: #FF007A;">${s.from.toUpperCase()}</span> 
                  <span style="opacity: 0.6">TRANSFIERE A</span> 
                  <span style="color: #FFF;">${s.to.toUpperCase()}</span>
                </div>
                <div class="instr-amount">$${s.amount.toLocaleString('es-CL')}</div>
              </div>
            `).join('') : '<div style="color: #FFF; font-weight: 700;">EL PERIODO SE ENCUENTRA BALANCEADO.</div>'}
          </div>

          <div class="section-label">AUDITORÍA_DE_PARTICIPACIÓN_DEL_MES</div>
          <table class="audit-table">
            <thead>
              <tr>
                <th>ROOMIE</th>
                <th>APORTADO (EFECTIVO)</th>
                <th>RESPONSABILIDAD (GURÚ)</th>
                <th>BALANCE_MES</th>
              </tr>
            </thead>
            <tbody>
              ${roomies.map(r => `
                <tr>
                  <td style="color: #FFF; font-weight: 700;">${r.name.toUpperCase()}</td>
                  <td>$${r.totalContributed.toLocaleString('es-CL')}</td>
                  <td>$${r.totalResponsibilities.toLocaleString('es-CL')}</td>
                  <td style="color: ${r.balance < 0 ? '#FF007A' : '#00FF41'}">
                    ${r.balance < 0 ? '-' : '+'}$${Math.abs(r.balance).toLocaleString('es-CL')}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="historical-box">
            <div class="section-label" style="margin-top: -25px;">SALDOS_HISTÓRICOS_ACUMULADOS</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
              ${roomies.map(r => `
                <div style="font-size: 10px; display: flex; justify-content: space-between;">
                  <span style="opacity: 0.6">${r.name.toUpperCase()}</span>
                  <span style="color: ${r.historicalBalance < 0 ? '#FF007A' : '#FFF'}; font-weight: 700;">
                    ${r.historicalBalance < 0 ? '-' : '+'}$${Math.abs(r.historicalBalance).toLocaleString('es-CL')}
                  </span>
                </div>
              `).join('')}
            </div>
            <div style="font-size: 8px; opacity: 0.5; margin-top: 10px; font-style: italic;">
              * Los saldos históricos incluyen deudas de meses anteriores que no han sido saldadas en el sistema.
            </div>
          </div>

          <div class="footer">
            <div>ESTE DOCUMENTO ES UN REGISTRO OFICIAL DE LIQUIDACIÓN INTERNA.</div>
            <div>VERIFICADO POR RUUMI_ACCOUNTS_ENGINE // SIN VALOR TRIBUTARIO</div>
            <div class="barcode">|| ||| | |||| | || | ||| || ||| | |||| | || | ||| || ||| | |||| | || | |||</div>
          </div>
        </div>
      </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
};
