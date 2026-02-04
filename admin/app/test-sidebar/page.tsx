"use client";

import AdminSidebar from "@/app/components/AdminSidebar";

export default function TestSidebar() {
    return (
        <div className="flex min-h-screen bg-slate-100">
            <div className="hidden lg:block">
                <AdminSidebar />
            </div>
            <main className="flex-1 bg-white p-8">
                <h1 className="text-2xl font-bold">Sidebar Debug Page</h1>
                <p className="mt-4">Check for gaps on the left.</p>
                <div className="mt-8 border p-4">
                    Test Content
                </div>
            </main>
        </div>
    );
}
