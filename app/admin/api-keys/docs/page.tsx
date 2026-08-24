"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Key,
  Code,
  Copy,
  Check,
  Shield,
  Gauge,
  Globe,
  FileText,
  Terminal,
  BookOpen,
} from "lucide-react";

const ENDPOINT = "POST /api/v1/ssc/verify";

const SAMPLE_REQUEST = `{
  "ssc": "ABC-1234-XYZ"
}`;

const SAMPLE_RESPONSE = `{
  "verified": true,
  "member": {
    "ssc": "ABC-1234-XYZ",
    "photo": "https://cdn.bpi.ng/profiles/john.jpg",
    "firstname": "John",
    "lastname": "Doe",
    "fullName": "John Doe",
    "username": "johndoe",
    "gender": "male",
    "phone": "+2348012345678",
    "email": "john@example.com",
    "address": {
      "address": "123 Main St",
      "city": "Lagos",
      "state": "Lagos",
      "zip": "100001",
      "country": "Nigeria"
    },
    "rank": "Newbie",
    "memberSince": "2024-01-15T10:30:00Z",
    "accountActivated": true,
    "membership": {
      "planName": "Regular Plus",
      "activatedAt": "2024-01-20T14:00:00Z",
      "expiresAt": "2025-01-20T14:00:00Z"
    },
    "kyc": {
      "status": "approved",
      "verified": true,
      "verifiedAt": "2024-02-01T09:00:00Z",
      "expiresAt": "2025-02-01T09:00:00Z"
    },
    "wallets": {
      "bpiToken": 1250.5
    }
  }
}`;

const CURL_EXAMPLE = `curl -X POST https://your-bpi-domain.com/api/v1/ssc/verify \\
  -H "Authorization: Bearer bpi_live_yourkeyhere" \\
  -H "Content-Type: application/json" \\
  -d '{"ssc":"ABC-1234-XYZ"}'`;

const JS_EXAMPLE = `const response = await fetch("https://your-bpi-domain.com/api/v1/ssc/verify", {
  method: "POST",
  headers: {
    "Authorization": "Bearer bpi_live_yourkeyhere",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ ssc: "ABC-1234-XYZ" }),
});

const data = await response.json();

if (data.verified) {
  console.log("Member:", data.member.fullName);
  console.log("KYC:", data.member.kyc.status);
  console.log("BPI Token:", data.member.wallets.bpiToken);
} else {
  console.error("Error:", data.error.code, data.error.message);
}`;

const PYTHON_EXAMPLE = `import requests

response = requests.post(
    "https://your-bpi-domain.com/api/v1/ssc/verify",
    headers={
        "Authorization": "Bearer bpi_live_yourkeyhere",
        "Content-Type": "application/json",
    },
    json={"ssc": "ABC-1234-XYZ"},
)

data = response.json()

if data["verified"]:
    member = data["member"]
    print(f"Member: {member['fullName']}")
    print(f"KYC: {member['kyc']['status']}")
    print(f"BPI Token: {member['wallets']['bpiToken']}")
else:
    print(f"Error: {data['error']['code']} - {data['error']['message']}")`;

const PHP_EXAMPLE = `<?php

$ch = curl_init("https://your-bpi-domain.com/api/v1/ssc/verify");
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer bpi_live_yourkeyhere",
        "Content-Type: application/json",
    ],
    CURLOPT_POSTFIELDS => json_encode(["ssc" => "ABC-1234-XYZ"]),
    CURLOPT_RETURNTRANSFER => true,
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if ($data["verified"]) {
    $member = $data["member"];
    echo "Member: " . $member["fullName"] . "\\n";
    echo "KYC: " . $member["kyc"]["status"] . "\\n";
    echo "BPI Token: " . $member["wallets"]["bpiToken"] . "\\n";
} else {
    echo "Error: " . $data["error"]["code"] . " - " . $data["error"]["message"] . "\\n";
}`;

const FIELD_REFERENCE: { field: string; type: string; description: string }[] = [
  { field: "verified", type: "boolean", description: "Always true on success" },
  { field: "member.ssc", type: "string", description: "The SSC code queried" },
  { field: "member.photo", type: "string|null", description: "Absolute URL to profile photo, or null" },
  { field: "member.firstname", type: "string|null", description: "Member's first name" },
  { field: "member.lastname", type: "string|null", description: "Member's last name" },
  { field: "member.fullName", type: "string|null", description: "Concatenated first + last name, or display name" },
  { field: "member.username", type: "string|null", description: "Username" },
  { field: "member.gender", type: "string|null", description: "Gender (male, female, or null)" },
  { field: "member.phone", type: "string|null", description: "Mobile phone number" },
  { field: "member.email", type: "string|null", description: "Email address" },
  { field: "member.address.address", type: "string|null", description: "Street address" },
  { field: "member.address.city", type: "string|null", description: "City" },
  { field: "member.address.state", type: "string|null", description: "State/province" },
  { field: "member.address.zip", type: "string|null", description: "Postal/zip code" },
  { field: "member.address.country", type: "string|null", description: "Country" },
  { field: "member.rank", type: "string", description: "Member rank (Newbie, Bronze, Silver, Gold)" },
  { field: "member.memberSince", type: "ISO 8601", description: "Account creation date" },
  { field: "member.accountActivated", type: "boolean", description: "Whether the account is activated" },
  { field: "member.membership.planName", type: "string|null", description: "Active membership plan name" },
  { field: "member.membership.activatedAt", type: "ISO 8601|null", description: "Membership activation date" },
  { field: "member.membership.expiresAt", type: "ISO 8601|null", description: "Membership expiry date" },
  { field: "member.kyc.status", type: "string", description: "Current KYC status (see KYC table)" },
  { field: "member.kyc.verified", type: "boolean", description: "true only if KYC status is approved" },
  { field: "member.kyc.verifiedAt", type: "ISO 8601|null", description: "When KYC was approved" },
  { field: "member.kyc.expiresAt", type: "ISO 8601|null", description: "KYC expiry date" },
  { field: "member.wallets.bpiToken", type: "number", description: "BPI Token wallet balance" },
];

const KYC_STATUSES: { status: string; description: string }[] = [
  { status: "none", description: "No KYC submission on file" },
  { status: "pending", description: "Submitted, awaiting admin review" },
  { status: "under_review", description: "Being reviewed by an admin" },
  { status: "approved", description: "KYC verified and active" },
  { status: "rejected", description: "KYC was rejected — user may resubmit" },
  { status: "expired", description: "Previously approved but has expired" },
];

const ERROR_CODES: { http: string; code: string; description: string }[] = [
  { http: "400", code: "INVALID_BODY", description: "Request body is not valid JSON or missing ssc field" },
  { http: "400", code: "INVALID_SSC_FORMAT", description: "SSC doesn't match XXX-XXXX-XXX format" },
  { http: "401", code: "UNAUTHORIZED", description: "Missing, invalid, or revoked API key" },
  { http: "404", code: "NOT_FOUND", description: "No account matches the provided SSC" },
  { http: "429", code: "RATE_LIMITED", description: "Rate limit exceeded — see Retry-After header" },
  { http: "500", code: "INTERNAL", description: "Server error — try again later" },
];

function CopyBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <div className="absolute right-3 top-3 flex items-center gap-2">
        {copied && <span className="text-xs text-emerald-400">Copied!</span>}
        <button
          onClick={() => {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="rounded-lg border border-slate-700 bg-slate-800/80 p-1.5 text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 pt-10 text-xs leading-relaxed text-slate-300">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function AdminApiDocsPage() {
  const [activeTab, setActiveTab] = useState<"curl" | "javascript" | "python" | "php">("curl");

  const examples: Record<string, string> = {
    curl: CURL_EXAMPLE,
    javascript: JS_EXAMPLE,
    python: PYTHON_EXAMPLE,
    php: PHP_EXAMPLE,
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
        <Link href="/admin" className="hover:text-gray-700 dark:hover:text-gray-200">Admin</Link>
        <span>/</span>
        <Link href="/admin/api-keys" className="hover:text-gray-700 dark:hover:text-gray-200">API Keys</Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">API Reference</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            SSC Verification API Reference
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Integration guide for external applications verifying BPI members by SSC code.
          </p>
        </div>
        <Link
          href="/admin/api-keys"
          className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-slate-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          <Key className="h-4 w-4" /> Manage Keys
        </Link>
      </div>

      {/* Endpoint */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Terminal className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Endpoint</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">POST</span>
          <code className="text-sm font-mono text-gray-800 dark:text-slate-200">{ENDPOINT}</code>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Base URL: <code className="text-gray-700 dark:text-slate-300">https://your-bpi-domain.com/api/v1</code>
        </p>
      </div>

      {/* Authentication */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Authentication</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          All requests require an admin-issued API key as a Bearer token:
        </p>
        <CopyBlock code={`Authorization: Bearer bpi_live_xxxxxxxxxxxxxxxxxxxxxxxx`} label="auth" />
        <div className="mt-4 space-y-2">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Obtaining an API Key</p>
          <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>A BPI admin navigates to <Link href="/admin/api-keys" className="text-emerald-600 hover:underline">Admin → API Keys</Link></li>
            <li>Clicks <strong>Create Key</strong>, enters an application name and rate limit</li>
            <li>The raw key (<code className="text-xs">bpi_live_...</code>) is displayed <strong>once</strong> — copy and store it securely</li>
            <li>The key can be revoked or reactivated at any time by an admin</li>
          </ol>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">SHA-256 Hashed</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Raw keys are never stored in the database</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-3">
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">Full Audit Trail</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All requests logged with IP, SSC, and status</p>
          </div>
        </div>
      </div>

      {/* Request */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Code className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Request</h2>
        </div>
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Headers</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-3">Header</th>
                <th className="pb-2 pr-3">Required</th>
                <th className="pb-2 pr-3">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 dark:border-slate-800">
                <td className="py-2 pr-3 font-mono text-xs">Authorization</td>
                <td className="py-2 pr-3"><span className="text-rose-600 text-xs font-semibold">Yes</span></td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-400 text-xs">Bearer &lt;api_key&gt;</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 font-mono text-xs">Content-Type</td>
                <td className="py-2 pr-3"><span className="text-rose-600 text-xs font-semibold">Yes</span></td>
                <td className="py-2 pr-3 text-gray-600 dark:text-gray-400 text-xs">application/json</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">Body</p>
        <CopyBlock code={SAMPLE_REQUEST} label="request" />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          SSC must match <code className="text-xs">XXX-XXXX-XXX</code> (alphanumeric). Input is auto-normalized to uppercase.
        </p>
      </div>

      {/* Response */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Response (200)</h2>
        </div>
        <CopyBlock code={SAMPLE_RESPONSE} label="response" />

        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mt-5 mb-2">Field Reference</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-left uppercase text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-3">Field</th>
                <th className="pb-2 pr-3">Type</th>
                <th className="pb-2 pr-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {FIELD_REFERENCE.map((f) => (
                <tr key={f.field} className="border-b border-gray-100 dark:border-slate-800/50">
                  <td className="py-1.5 pr-3 font-mono text-gray-800 dark:text-slate-200">{f.field}</td>
                  <td className="py-1.5 pr-3 font-mono text-emerald-600 dark:text-emerald-400">{f.type}</td>
                  <td className="py-1.5 pr-3 text-gray-600 dark:text-gray-400">{f.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mt-5 mb-2">KYC Status Values</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {KYC_STATUSES.map((k) => (
            <div key={k.status} className="rounded-lg border border-gray-200 dark:border-slate-700 p-2.5">
              <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{k.status}</code>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Errors */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">⚠️</span>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Error Responses</h2>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">All errors return:</p>
        <CopyBlock code={`{\n  "verified": false,\n  "error": {\n    "code": "ERROR_CODE",\n    "message": "Human-readable message"\n  }\n}`} label="error" />
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <th className="pb-2 pr-3">HTTP</th>
                <th className="pb-2 pr-3">Code</th>
                <th className="pb-2 pr-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {ERROR_CODES.map((e) => (
                <tr key={e.code} className="border-b border-gray-100 dark:border-slate-800/50">
                  <td className="py-2 pr-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      e.http === "400" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : e.http === "401" ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                      : e.http === "404" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      : e.http === "429" ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                    }`}>{e.http}</span>
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-800 dark:text-slate-200">{e.code}</td>
                  <td className="py-2 pr-3 text-gray-600 dark:text-gray-400 text-xs">{e.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Rate Limiting</h2>
        </div>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
          <li>• Default: <strong>60 requests/minute</strong> per key (configurable by admin)</li>
          <li>• Sliding 60-second window — count resets as old requests age out</li>
          <li>• Returns <code className="text-xs">429</code> with <code className="text-xs">Retry-After: 60</code> header</li>
          <li>• Rate-limited responses <strong>do not count</strong> against the limit (no lockout loop)</li>
        </ul>
      </div>

      {/* CORS */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">CORS</h2>
        </div>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
          <li>• <code className="text-xs">Access-Control-Allow-Origin: *</code> on all responses</li>
          <li>• <code className="text-xs">OPTIONS</code> preflight handled automatically</li>
          <li>• Allowed methods: <code className="text-xs">POST, OPTIONS</code></li>
          <li>• Allowed headers: <code className="text-xs">Authorization, Content-Type</code></li>
        </ul>
      </div>

      {/* Code Examples */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Code className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Code Examples</h2>
        </div>
        {/* Tabs */}
        <div className="flex gap-1 mb-3 border-b border-gray-200 dark:border-slate-700">
          {(["curl", "javascript", "python", "php"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
            >
              {tab === "curl" ? "curl" : tab === "javascript" ? "JavaScript" : tab === "python" ? "Python" : "PHP"}
            </button>
          ))}
        </div>
        <CopyBlock code={examples[activeTab]} label={activeTab} />
      </div>

      {/* Best Practices */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Best Practices</h2>
        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
          <li>Store API keys in environment variables or a secrets manager — never hardcode in source</li>
          <li>Handle <code className="text-xs">429</code> with exponential backoff using the <code className="text-xs">Retry-After</code> header</li>
          <li>Cache responses locally — SSC data doesn&apos;t change frequently</li>
          <li>Keep your own logs of <code className="text-xs">verified</code> vs errors for debugging</li>
          <li>Always use HTTPS — never send API keys over plain HTTP</li>
          <li>Monitor for <code className="text-xs">401</code>s — if they appear, your key may have been revoked</li>
        </ol>
      </div>
    </div>
  );
}
