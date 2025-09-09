import React, { useState, useEffect } from "react";
import { Bell, BellOff, Clock, Mail, Smartphone, Settings } from "lucide-react";

const DailyNotifications = ({ summaryStats, onNotificationChange }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("09:00");
  const [notificationMethod, setNotificationMethod] = useState("email");
  const [showSettings, setShowSettings] = useState(false);
  const [lastNotification, setLastNotification] = useState(null);

  // Load settings from memory on component mount
  useEffect(() => {
    const savedSettings = {
      enabled: false,
      time: "09:00",
      method: "email",
      lastNotification: null,
    };

    setIsEnabled(savedSettings.enabled);
    setNotificationTime(savedSettings.time);
    setNotificationMethod(savedSettings.method);
    setLastNotification(savedSettings.lastNotification);
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    const settings = {
      enabled: isEnabled,
      time: notificationTime,
      method: notificationMethod,
      lastNotification,
    };

    // In a real app, you'd save to your backend or localStorage
    // Here we just call the parent callback
    if (onNotificationChange) {
      onNotificationChange(settings);
    }
  }, [
    isEnabled,
    notificationTime,
    notificationMethod,
    lastNotification,
    onNotificationChange,
  ]);

  const handleToggle = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    if (newState) {
      // Simulate setting up notification
      setLastNotification(new Date().toISOString());
      showSuccessMessage("Daily notifications enabled!");
    } else {
      showSuccessMessage("Daily notifications disabled");
    }
  };

  const showSuccessMessage = (message) => {
    // Simple success feedback - in a real app you might use a toast library
    const originalTitle = document.title;
    document.title = `✓ ${message}`;
    setTimeout(() => {
      document.title = originalTitle;
    }, 2000);
  };

  const formatTime = (time24) => {
    const [hours, minutes] = time24.split(":");
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getNextNotificationTime = () => {
    if (!isEnabled) return null;

    const now = new Date();
    const [hours, minutes] = notificationTime.split(":");
    const notificationDate = new Date();
    notificationDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If today's notification time has passed, show tomorrow's time
    if (notificationDate <= now) {
      notificationDate.setDate(notificationDate.getDate() + 1);
    }

    return notificationDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${
              isEnabled
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {isEnabled ? <Bell size={20} /> : <BellOff size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              Daily Sales Notifications
            </h3>
            <p className="text-sm text-gray-500">
              {isEnabled
                ? `Next notification: ${getNextNotificationTime()}`
                : "Get daily reports delivered to you"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Notification settings"
          >
            <Settings size={16} />
          </button>

          <button
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isEnabled ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notification Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock size={16} className="inline mr-1" />
                Notification Time
              </label>
              <input
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isEnabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                {formatTime(notificationTime)} daily
              </p>
            </div>

            {/* Notification Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Method
              </label>
              <select
                value={notificationMethod}
                onChange={(e) => setNotificationMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={!isEnabled}
              >
                <option value="email">📧 Email</option>
                <option value="sms">📱 SMS</option>
                <option value="push">🔔 Push Notification</option>
              </select>
            </div>
          </div>

          {/* Preview */}
          {isEnabled && summaryStats && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Preview of daily report:
              </h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  📊 <strong>Total Sales:</strong> $
                  {summaryStats.totalSales?.toLocaleString() || "0"}
                </p>
                <p>
                  📦 <strong>Orders:</strong> {summaryStats.totalOrders || 0}
                </p>
                <p>
                  💰 <strong>Avg Order Value:</strong> $
                  {summaryStats.avgOrderValue?.toFixed(2) || "0.00"}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Delivered via {notificationMethod} at{" "}
                  {formatTime(notificationTime)}
                </p>
              </div>
            </div>
          )}

          {/* Status Info */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {isEnabled ? (
                <>✅ Notifications active</>
              ) : (
                <>⏸️ Notifications paused</>
              )}
            </span>
            {lastNotification && (
              <span>
                Last set up: {new Date(lastNotification).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {isEnabled && !showSettings && (
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Daily at {formatTime(notificationTime)} via {notificationMethod}
          </span>
          <button
            onClick={() => setShowSettings(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Customize
          </button>
        </div>
      )}
    </div>
  );
};

// Example integration component showing how to use it with your SalesReport
const SalesReportWithNotifications = () => {
  const [notificationSettings, setNotificationSettings] = useState(null);

  // Mock sales data for demo
  const mockSummaryStats = {
    totalSales: 125430.5,
    totalOrders: 89,
    totalQuantity: 245,
    avgOrderValue: 1409.33,
  };

  const handleNotificationChange = (settings) => {
    setNotificationSettings(settings);
    console.log("Notification settings updated:", settings);
    // Here you would typically save to your backend or state management
  };

  return (
    <div>
      <DailyNotifications
        summaryStats={mockSummaryStats}
        onNotificationChange={handleNotificationChange}
      />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Sales Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              ${mockSummaryStats.totalSales.toLocaleString()}
            </div>
            <div className="text-sm text-blue-600">Total Sales</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {mockSummaryStats.totalOrders}
            </div>
            <div className="text-sm text-green-600">Total Orders</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {mockSummaryStats.totalQuantity}
            </div>
            <div className="text-sm text-purple-600">Items Sold</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              ${mockSummaryStats.avgOrderValue.toFixed(2)}
            </div>
            <div className="text-sm text-orange-600">Avg Order Value</div>
          </div>
        </div>
      </div>

      {notificationSettings && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-2">
            Current Notification Settings:
          </h3>
          <pre className="text-xs text-gray-600 bg-white p-2 rounded overflow-auto">
            {JSON.stringify(notificationSettings, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default SalesReportWithNotifications;
