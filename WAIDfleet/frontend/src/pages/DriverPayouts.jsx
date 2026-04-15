import { useState } from 'react'
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export function DriverPayouts() {
  const [balance] = useState(4250.00)
  const [transactions] = useState([
    { id: 1, type: 'credit', amount: 1240.00, desc: 'Night Shift Bonus', date: 'Today, 06:15 AM', status: 'completed' },
    { id: 2, type: 'debit', amount: 2000.00, desc: 'Weekly Payout', date: 'Apr 12, 2026', status: 'completed' },
    { id: 3, type: 'credit', amount: 980.00, desc: 'Morning Shift', date: 'Apr 11, 2026', status: 'completed' },
    { id: 4, type: 'credit', amount: 15.00, desc: 'Toll Reimbursement', date: 'Apr 10, 2026', status: 'pending' },
  ])

  return (
    <div className="driver-view-container animate-fade">
      <div style={{ marginBottom: '2.5rem' }}>
         <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Financial Wallet</h3>
         <p style={{ color: '#94a3b8', margin: '4px 0' }}>Manage your earnings and request payouts.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem' }}>
         {/* Balance Card */}
         <div className="glass-card" style={{ padding: '2.5rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.6) 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#10b981' }}>
               <Wallet size={30} />
            </div>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Available Balance</span>
            <div style={{ fontSize: '3rem', fontWeight: 900, margin: '0.5rem 0', color: '#fff' }}>₹{balance.toLocaleString()}</div>
            <button className="duty-toggle off-duty" style={{ width: '100%', marginTop: '1.5rem' }}>Request Immediate Payout</button>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem' }}>Next automatic payout scheduled for Monday.</p>
         </div>

         {/* Transactions */}
         <div className="glass-card" style={{ padding: '2rem' }}>
            <h4 style={{ margin: '0 0 1.5rem', fontSize: '1.1rem', fontWeight: 700 }}>Recent Transactions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               {transactions.map(t => (
                 <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ color: t.type === 'credit' ? '#10b981' : '#f87171' }}>
                      {t.type === 'credit' ? <ArrowDownRight size={20}/> : <ArrowUpRight size={20}/>}
                    </div>
                    <div style={{ flex: 1 }}>
                       <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem' }}>{t.desc}</p>
                       <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.date}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontWeight: 700, fontSize: '1rem', color: t.type === 'credit' ? '#10b981' : '#fff' }}>
                          {t.type === 'credit' ? '+' : '-'}₹{t.amount.toLocaleString()}
                       </div>
                       <div style={{ fontSize: '0.7rem', color: t.status === 'completed' ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                          {t.status === 'completed' ? <CheckCircle size={10}/> : <Clock size={10}/>}
                          {t.status.toUpperCase()}
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  )
}
