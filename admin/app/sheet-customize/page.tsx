'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

// Custom Text Editor for clearer visibility
function TextEditor({ row, column, onRowChange, onClose }: any) {
    return (
        <input
            className="w-full h-full px-2 border-0 focus:ring-2 focus:ring-blue-500 outline-none"
            autoFocus
            value={row[column.key]}
            onChange={(e) => onRowChange({ ...row, [column.key]: e.target.value })}
            onBlur={onClose}
        />
    );
}

const SheetCustomizePage = () => {
    // Spreadsheet ID
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    // We fetch a larger range to safeguard, but we will enforce A-Z columns
    const range = 'Sheet1!A1:Z100';

    const [rows, setRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Helper to generate A-Z columns
    const generateColumns = () => {
        const cols = [];
        for (let i = 0; i < 26; i++) {
            const letter = String.fromCharCode(65 + i); // 65 is 'A'
            cols.push({
                key: i.toString(),
                name: letter,
                editable: true,
                resizable: true,
                renderEditCell: TextEditor,
                width: 100
            });
        }
        return cols;
    };

    // Fetch Data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-airless-spray.rubyshop.co.th/';
            const res = await fetch(`${backendUrl}/api/sheets/${spreadsheetId}?range=${encodeURIComponent(range)}`);

            if (!res.ok) throw new Error('Failed to fetch sheet data');

            const data = await res.json();
            const values = data.values || [];

            // Always use A-Z columns
            const staticCols = generateColumns();
            setColumns(staticCols);

            // Populate rows (handling empty rows/cells)
            // If values is empty, show 50 empty rows
            const rowCount = Math.max(values.length, 50);

            const gridRows = [];
            for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
                const rowData = values[rowIndex] || [];
                const rowObj: any = { id: rowIndex };

                // Map data to column keys '0', '1', '2'...
                for (let colIndex = 0; colIndex < 26; colIndex++) {
                    rowObj[colIndex.toString()] = rowData[colIndex] || '';
                }
                gridRows.push(rowObj);
            }

            setRows(gridRows);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [spreadsheetId, range]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle Edit
    const handleRowsChange = async (newRows: any[], { indexes }: { indexes: number[] }) => {
        const previousRows = [...rows];
        setRows(newRows);

        try {
            setSaving(true);
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://api-airless-spray.rubyshop.co.th/';

            for (const index of indexes) {
                const row = newRows[index];
                const sheetRowNumber = index + 1; // 1-based index (A1 is row 1)

                // Reconstruct full row array for the update
                // We must send data for columns 0 to MAX to preserve data (or at least up to changed cell)
                // Sending the whole A-Z row is simplest for this implementation
                const rowValues = columns.map(col => row[col.key]);

                const sheetName = range.split('!')[0];
                const updateRange = `${sheetName}!A${sheetRowNumber}`;

                await fetch(`${backendUrl}/api/sheets/${spreadsheetId}/values`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        range: updateRange,
                        values: [rowValues]
                    })
                });
            }

        } catch (err: any) {
            console.error('Save failed', err);
            setRows(previousRows);
            setError('Failed to save changes: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container mx-auto h-full flex flex-col">
            <style jsx global>{`
                .rdg {
                    border: 1px solid #e2e8f0;
                    background-color: #fff;
                    font-size: 13px;
                }
                .rdg-cell {
                    border-right: 1px solid #e2e8f0;
                    border-bottom: 1px solid #e2e8f0;
                    color: #334155;
                }
                .rdg-header-row {
                    background-color: #f8fafc;
                    font-weight: 600;
                    color: #475569;
                }
                .rdg-row:hover {
                    background-color: #f1f5f9;
                }
            `}</style>

            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-800">Custom Google Sheet</h1>
                <div className="flex gap-2">
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
                    >
                        Refresh
                    </button>
                    {saving && <span className="text-sm text-blue-600 flex items-center animate-pulse">Saving...</span>}
                </div>
            </div>

            {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md border border-red-200">{error}</div>}

            <div className="flex-grow bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-400">Loading data...</div>
                ) : (
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        onRowsChange={handleRowsChange}
                        className="rdg-light flex-grow"
                        style={{ height: '100%' }}
                        rowHeight={35}
                    />
                )}
            </div>
        </div>
    );
};

export default SheetCustomizePage;
