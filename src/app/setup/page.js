"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/shared/components";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Redirect to login page after successful setup
        router.push("/login?setup=success");
      } else {
        setError(data.error || "Failed to configure password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Welcome to 9Router</h1>
          <p className="text-text-muted">Set up your admin password to get started</p>
        </div>

        <Card>
          <form onSubmit={handleSetup} className="flex flex-col gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-2">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <span className="font-semibold">Password requirements:</span>
              </p>
              <ul className="text-xs text-blue-600 dark:text-blue-400 mt-2 ml-4 list-disc space-y-1">
                <li>At least 8 characters long</li>
                <li>Contains uppercase letter (A-Z)</li>
                <li>Contains lowercase letter (a-z)</li>
                <li>Contains number (0-9)</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
            >
              Set Password
            </Button>
          </form>
        </Card>

        <div className="text-center mt-6">
          <p className="text-xs text-text-muted">
            This password will be used to access the dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
