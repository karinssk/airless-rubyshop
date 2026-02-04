import React from 'react';

const SheetEmbeddedPage = () => {
    // Default Google Sheet ID to display
    // This should ideally be a public sheet or one the user has access to if not published to web
    // For "Publish to Web" sheets, the URL format is different.
    // Assuming standard edit URL for now, but embedded usually works best with "Publish to web" -> Embed
    // OR just standard /edit url in iframe if permissions allow.

    // Example ID - Replace with a real one or env variable
    // We'll use a placeholder if env is missing, but ideally user provides one.
    // Using a demo sheet ID for initial structure if needed, or instructing user to add one.
    const spreadsheetId = process.env.NEXT_PUBLIC_GOOGLE_SHEET_ID || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'; // Class Data demo sheet

    // Construct Embed URL
    // Option A: /edit?rm=minimal (hides headers/toolbars mostly)
    // Option B: /pubhtml?widget=true&headers=false (Published to web)

    // We will use the /edit format as it mirrors the "Calendar" behavior (which is user-specific).
    // Note: User must be willing to log in inside the iframe if it's private.
    const sheetSrc = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?rm=minimal`;

    return (
            <div className="container mx-auto h-full flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-slate-800">Google Sheet Embedded</h1>
                    {/* Instruction Hint */}
                    <span className="text-sm text-gray-500">
                        Displays the Google Sheet directly. ensure you have access.
                    </span>
                </div>

                <div className="flex-grow w-full bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden relative">
                    <iframe
                        src={sheetSrc}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 0
                        }}
                        title="Google Sheet Embedded"
                    ></iframe>
                </div>
            </div>
    );
};

export default SheetEmbeddedPage;
