"use client";

import { useEffect, useState } from "react";
import { backendBaseUrl } from "@/lib/urls";
import { getAdminAuthHeaders } from "@/lib/auth";

type BankAccount = {
  bankName: string;
  accountName: string;
  accountNumber: string;
};

type PaymentSetting = {
  provider: "omise" | "stripe" | "manual";
  bankAccounts: BankAccount[];
  promptPayQrImage: string;
  payOnSiteEnabled: boolean;
};

export default function PaymentSettingPage() {
  const [setting, setSetting] = useState<PaymentSetting>({
    provider: "omise",
    bankAccounts: [],
    promptPayQrImage: "",
    payOnSiteEnabled: true,
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSetting = async () => {
    try {
      const response = await fetch(`${backendBaseUrl}/payment-setting`, {
        headers: getAdminAuthHeaders(),
      });
      const data = await response.json();
      if (data.setting) {
        setSetting({
          provider: data.setting.provider || "omise",
          bankAccounts: data.setting.bankAccounts || [],
          promptPayQrImage: data.setting.promptPayQrImage || "",
          payOnSiteEnabled: data.setting.payOnSiteEnabled !== false,
        });
      }
    } catch (error) {
      console.error("Failed to load payment setting:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
  }, []);

  const saveSetting = async () => {
    const response = await fetch(`${backendBaseUrl}/payment-setting`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAdminAuthHeaders(),
      },
      body: JSON.stringify(setting),
    });
    if (response.ok) {
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1200);
    }
  };

  const addBankAccount = () => {
    setSetting((prev) => ({
      ...prev,
      bankAccounts: [
        ...prev.bankAccounts,
        { bankName: "", accountName: "", accountNumber: "" },
      ],
    }));
  };

  const removeBankAccount = (index: number) => {
    setSetting((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((_, i) => i !== index),
    }));
  };

  const updateBankAccount = (
    index: number,
    field: keyof BankAccount,
    value: string
  ) => {
    setSetting((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((acc, i) =>
        i === index ? { ...acc, [field]: value } : acc
      ),
    }));
  };

  const handleQrImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${backendBaseUrl}/uploads`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.path) {
        setSetting((prev) => ({ ...prev, promptPayQrImage: data.path }));
      }
    } catch (error) {
      console.error("Failed to upload QR image:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">
            Payment Gateway
          </h2>
          <p className="text-xs text-slate-400">
            Select the default payment provider for checkout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveSetting}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs text-white"
            disabled={loading}
          >
            Save
          </button>
          {message && (
            <span className="text-xs text-emerald-600">{message}</span>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-4">
        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Omise</p>
            <p className="text-xs text-slate-500">
              Credit/debit, PromptPay, KBank, SCB.
            </p>
          </div>
          <input
            type="radio"
            name="provider"
            value="omise"
            checked={setting.provider === "omise"}
            onChange={() => setSetting((prev) => ({ ...prev, provider: "omise" }))}
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Stripe</p>
            <p className="text-xs text-slate-500">Credit/debit and PromptPay.</p>
          </div>
          <input
            type="radio"
            name="provider"
            value="stripe"
            checked={setting.provider === "stripe"}
            onChange={() => setSetting((prev) => ({ ...prev, provider: "stripe" }))}
          />
        </label>

        <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Manual Payment
            </p>
            <p className="text-xs text-slate-500">
              Bank transfer and pay on site.
            </p>
          </div>
          <input
            type="radio"
            name="provider"
            value="manual"
            checked={setting.provider === "manual"}
            onChange={() => setSetting((prev) => ({ ...prev, provider: "manual" }))}
          />
        </label>
      </div>

      {setting.provider === "manual" && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-sm font-semibold text-slate-700">
            Manual Payment Options
          </h3>

          {/* Pay on Site Toggle */}
          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={setting.payOnSiteEnabled}
              onChange={(e) =>
                setSetting((prev) => ({
                  ...prev,
                  payOnSiteEnabled: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-slate-300"
            />
            <span className="text-sm text-slate-600">
              Enable Pay on Site option
            </span>
          </label>

          {/* PromptPay QR Code */}
          <div className="mt-6">
            <p className="text-sm font-medium text-slate-600">PromptPay QR Code</p>
            <p className="mt-1 text-xs text-slate-400">
              Upload your PromptPay QR code image for customers to scan
            </p>
            <div className="mt-3 flex items-start gap-4">
              {setting.promptPayQrImage && (
                <div className="relative">
                  <img
                    src={`${backendBaseUrl}${setting.promptPayQrImage}`}
                    alt="PromptPay QR"
                    className="h-32 w-32 rounded-lg border border-slate-200 object-contain bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setSetting((prev) => ({ ...prev, promptPayQrImage: "" }))
                    }
                    className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white px-4 py-6 hover:border-blue-400">
                <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="mt-2 text-xs text-slate-500">
                  {uploading ? "Uploading..." : "Upload QR"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQrImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Bank Accounts */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">Bank Accounts</p>
              <button
                type="button"
                onClick={addBankAccount}
                className="rounded-full bg-blue-600 px-3 py-1 text-xs text-white"
              >
                + Add Bank
              </button>
            </div>

            {setting.bankAccounts.length === 0 && (
              <p className="mt-3 text-xs text-slate-400">
                No bank accounts added. Click &quot;Add Bank&quot; to add one.
              </p>
            )}

            <div className="mt-4 space-y-4">
              {setting.bankAccounts.map((account, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      Bank #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeBankAccount(index)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mt-3 grid gap-3">
                    <input
                      type="text"
                      placeholder="Bank Name (e.g., Bangkok Bank)"
                      value={account.bankName}
                      onChange={(e) =>
                        updateBankAccount(index, "bankName", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Account Name"
                      value={account.accountName}
                      onChange={(e) =>
                        updateBankAccount(index, "accountName", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Account Number"
                      value={account.accountNumber}
                      onChange={(e) =>
                        updateBankAccount(index, "accountNumber", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
