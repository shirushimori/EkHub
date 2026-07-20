import { useState } from "react";
import { Monitor, Globe, Bell, Moon, Volume2, Shield } from "lucide-react";
import { cn } from "@/lib/cn";

interface SettingItem {
  icon: React.ReactNode;
  label: string;
  description: string;
  type: "toggle" | "select";
  options?: string[];
}

const settings: SettingItem[] = [
  {
    icon: <Monitor className="h-5 w-5" />,
    label: "Video Quality",
    description: "Set default streaming quality",
    type: "select",
    options: ["Auto", "1080p", "720p", "480p", "360p"],
  },
  {
    icon: <Globe className="h-5 w-5" />,
    label: "Language",
    description: "Set preferred language",
    type: "select",
    options: ["English", "Spanish", "Japanese", "Hindi"],
  },
  {
    icon: <Bell className="h-5 w-5" />,
    label: "Notifications",
    description: "Enable push notifications",
    type: "toggle",
  },
  {
    icon: <Moon className="h-5 w-5" />,
    label: "Dark Mode",
    description: "Always on (system default)",
    type: "toggle",
  },
  {
    icon: <Volume2 className="h-5 w-5" />,
    label: "Autoplay",
    description: "Auto-play next episode",
    type: "toggle",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    label: "Content Filter",
    description: "Show mature content",
    type: "toggle",
  },
];

function SettingRow({ setting }: { setting: SettingItem }) {
  const [enabled, setEnabled] = useState(
    setting.label === "Dark Mode" || setting.label === "Autoplay"
  );
  const [selected, setSelected] = useState(setting.options?.[0] || "");

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-secondary">
          {setting.icon}
        </div>
        <div>
          <h3 className="text-sm font-medium text-primary">{setting.label}</h3>
          <p className="text-xs text-secondary">{setting.description}</p>
        </div>
      </div>

      {setting.type === "toggle" ? (
        <button
          onClick={() => setEnabled(!enabled)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors duration-200",
            enabled ? "bg-accent" : "bg-surface"
          )}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200",
              enabled && "translate-x-5"
            )}
          />
        </button>
      ) : (
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-primary focus:border-accent focus:outline-none"
        >
          {setting.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="px-4 py-6 md:px-8">
      <h1 className="mb-1 text-2xl font-bold text-primary">Settings</h1>
      <p className="mb-6 text-sm text-secondary">Customize your experience</p>

      <div className="mx-auto max-w-2xl space-y-3">
        {settings.map((setting) => (
          <SettingRow key={setting.label} setting={setting} />
        ))}
      </div>
    </div>
  );
}
