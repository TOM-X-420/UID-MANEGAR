import React from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/Header";
import { Sidebar } from "../components/Sidebar";
import { useAdminStats, useAdminLogs } from "@workspace/api-client-react";
import { useState } from "react";

export function AdminPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: stats } = useAdminStats();
  const { data: logsData } = useAdminLogs();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header onMenuOpen={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-bold text-yellow-400">{t("adminPanel")}</h2>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(
            [
              ["totalStats", stats?.totalVisits ?? 0],
              ["uniqueIps", stats?.uniqueIps ?? 0],
              ["todayVisits", stats?.todayVisits ?? 0],
              ["dataProcessed", stats?.dataProcessed ?? 0],
            ] as [string, number][]
          ).map(([key, value]) => (
            <div
              key={key}
              className="bg-gray-800 rounded p-4 text-center"
            >
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-gray-400 mt-1">{t(key)}</div>
            </div>
          ))}
        </div>

        {/* Logs Table */}
        <section>
          <h3 className="text-lg font-semibold mb-2">Activity Logs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-800 text-gray-300">
                  <th className="px-3 py-2 text-left">ID</th>
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-left">Action</th>
                  <th className="px-3 py-2 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {logsData?.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-gray-700 hover:bg-gray-800"
                  >
                    <td className="px-3 py-2">{log.id}</td>
                    <td className="px-3 py-2">{log.ipAddress}</td>
                    <td className="px-3 py-2">{log.actionType}</td>
                    <td className="px-3 py-2">{log.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!logsData?.logs.length && (
              <p className="text-gray-500 text-center py-4">{t("noEntries")}</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
