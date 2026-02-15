import { useState, useEffect, useCallback } from 'react';
import {
    getAllStreams,
    calculateAccrued,
    pauseStream,
    resumeStream,
    cancelStream,
    formatAddress,
    formatRate,
    ethers,
} from '../../services/contractService';

export default function StreamTable({ streams = [], onRefresh }) {
    const [accrued, setAccrued] = useState({});
    const [actionLoading, setActionLoading] = useState({});

    // Separate active and inactive streams
    const activeStreams = streams.filter(s => s.active);
    const inactiveStreams = streams.filter(s => !s.active);

    // Update accrued values every 2 seconds
    useEffect(() => {
        if (streams.length === 0) return;

        const updateAccrued = async () => {
            const newAccrued = {};
            for (const s of streams) {
                if (s.active) {
                    try {
                        const val = await calculateAccrued(s.id);
                        newAccrued[s.id] = ethers.formatEther(val);
                    } catch {
                        newAccrued[s.id] = '0';
                    }
                } else {
                    newAccrued[s.id] = '0'; // Or keep last known? Contract doesn't store "final accrued" easily active false usually means 0 pending
                }
            }
            setAccrued(newAccrued);
        };

        updateAccrued();
        const interval = setInterval(updateAccrued, 2000);
        return () => clearInterval(interval);
    }, [streams]);

    const handleAction = async (id, actionName, actionFn) => {
        setActionLoading((prev) => ({ ...prev, [id]: actionName }));
        try {
            await actionFn(id);
            if (onRefresh) await onRefresh();
            alert(`✅ Stream ${actionName} successful!`);
        } catch (err) {
            console.error(`${actionName} failed:`, err);
            alert(`❌ Failed to ${actionName} stream:\n${err.reason || err.message || 'Unknown error'}`);
        } finally {
            setActionLoading((prev) => ({ ...prev, [id]: null }));
        }
    };

    const handleAudit = (id) => {
        // Placeholder for future history details if needed
        alert(`Audit History for Stream #${id} coming soon.`);
    };

    const renderTable = (data, isHistory = false) => (
        <div style={{ overflowX: 'auto' }}>
            <table className="stream-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Employee</th>
                        <th>Rate (HLUSD/s)</th>
                        {!isHistory && <th>Accrued</th>}
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((stream) => (
                        <tr key={stream.id} style={{ opacity: isHistory ? 0.7 : 1 }}>
                            <td style={{ fontWeight: 600 }}>#{stream.id}</td>
                            <td className="address-cell">{formatAddress(stream.employee)}</td>
                            <td className="rate-cell">{formatRate(stream.ratePerSecond)}</td>
                            {!isHistory && (
                                <td className="accrued-cell">
                                    {accrued[stream.id] ? Number(accrued[stream.id]).toFixed(4) : '0.000'}
                                </td>
                            )}
                            <td>
                                {stream.active ? (
                                    <span className="badge badge-active">Active</span>
                                ) : (
                                    <span className="badge badge-cancelled">Ended</span>
                                )}
                            </td>
                            <td>
                                <div className="actions-group">
                                    {stream.active ? (
                                        <>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => {
                                                    if (confirm('End this stream? It will move to history.'))
                                                        handleAction(stream.id, 'cancel', cancelStream);
                                                }}
                                                disabled={!!actionLoading[stream.id]}
                                            >
                                                {actionLoading[stream.id] === 'cancel' ? <span className="spinner"></span> : '⏹ End'}
                                            </button>
                                        </>
                                    ) : (
                                        // History actions (maybe nothing, or View Details)
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>-</span>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="content-grid" style={{ gridTemplateColumns: '1fr', gap: '2rem' }}>
            {/* Active Streams */}
            <div className="glass-card">
                <div className="card-header">
                    <h2 className="card-title">
                        <span className="card-title-icon">📊</span>
                        Active Streams ({activeStreams.length})
                    </h2>
                    <button className="btn btn-ghost btn-sm" onClick={onRefresh}>
                        🔄 Refresh
                    </button>
                </div>

                {activeStreams.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">💸</div>
                        <p className="empty-state-text">No active streams</p>
                        <p className="empty-state-sub">Create a new stream to get started.</p>
                    </div>
                ) : renderTable(activeStreams)}
            </div>

            {/* History Panel */}
            {inactiveStreams.length > 0 && (
                <div className="glass-card" style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'var(--bg-secondary)' }}>
                    <div className="card-header">
                        <h2 className="card-title" style={{ color: 'var(--text-muted)' }}>
                            <span className="card-title-icon">📜</span>
                            Stream History
                        </h2>
                    </div>
                    {renderTable(inactiveStreams, true)}
                </div>
            )}
        </div>
    );
}
