'use client';

import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ columns, data, loading, emptyMessage }: any) {
  const [filter, setFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  if (loading) return <LoadingSpinner />;

  const filtered = data?.filter((r: any) =>
    JSON.stringify(r).toLowerCase().includes(filter.toLowerCase())
  );

  const totalPages = Math.ceil((filtered?.length || 0) / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filtered?.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="table-card">
      {/* Table Header / Search */}
      <div className="table-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, maxWidth: 360 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--c-text3, #A3AED0)',
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search table records..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="search-input"
              style={{ paddingLeft: 38 }}
            />
          </div>
        </div>

        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--c-text2, #8F9BBA)' }}>
          Showing <span style={{ color: 'var(--c-text, #2B3674)', fontWeight: 600 }}>{filtered?.length || 0}</span> records
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {columns.map((c: any, i: number) => (
                <th key={i}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!paginatedData?.length ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--c-text3, #A3AED0)' }}>
                  {emptyMessage || 'No records found'}
                </td>
              </tr>
            ) : (
              paginatedData.map((row: any, i: number) => (
                <tr key={i}>
                  {columns.map((c: any, j: number) => (
                    <td key={j}>{c.render ? c.render(row) : row[c.accessor]}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer / Pagination */}
      {totalPages > 1 && (
        <div className="table-footer">
          <div>
            Page {currentPage} of {totalPages}
          </div>
          <div className="pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
            >
              &lt;
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
              ) {
                return (
                  <button
                    key={pageNum}
                    className={pageNum === currentPage ? 'active' : ''}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
              if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                return <span key={pageNum} style={{ padding: '0 4px', color: '#A3AED0' }}>...</span>;
              }
              return null;
            })}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
            >
              &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
