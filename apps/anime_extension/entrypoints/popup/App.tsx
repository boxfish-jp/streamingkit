import type { ScriptSetting } from "~/models/script_setting";
import { useSocketStatus } from "./hooks/use_socket_status";
import { useStorageState } from "./hooks/use_storage_state";
import "./App.css";

const DEFAULT_SCRIPT_SETTINGS: ScriptSetting[] = [
  {
    name: "u-next",
    site: "https://video.u-next.play.jp/play/",
    enabled: false,
    defaultOff: true,
  },
];

function App() {
  const [hubUrl, setHubUrl] = useStorageState("anime_hub_url", "");
  const [settings, setSettings] = useStorageState(
    "script_settings",
    DEFAULT_SCRIPT_SETTINGS,
  );
  const isConnected = useSocketStatus();

  const updateScriptSetting = (
    name: string,
    enabled: boolean,
    defaultOff: boolean,
  ) => {
    setSettings(
      settings.map((s) =>
        s.name === name ? { ...s, enabled, defaultOff } : s,
      ),
    );
  };

  return (
    <div className="popup">
      <h1>Anime Extension</h1>

      <div className="status">
        <span className={`dot ${isConnected ? "connected" : "disconnected"}`} />
        <span>{isConnected ? "接続中" : "切断中"}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th></th>
            <th>情報取得</th>
            <th>デフォルトでオフ</th>
          </tr>
        </thead>
        <tbody>
          {settings.map((setting) => (
            <tr key={setting.name}>
              <td>{setting.name}</td>
              <td>
                <input
                  type="checkbox"
                  checked={setting.enabled}
                  onChange={(e) =>
                    updateScriptSetting(
                      setting.name,
                      e.target.checked,
                      setting.defaultOff,
                    )
                  }
                />
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={setting.defaultOff}
                  onChange={(e) =>
                    updateScriptSetting(
                      setting.name,
                      setting.enabled,
                      e.target.checked,
                    )
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="url-setting">
        <label>
          <span>hub接続URL</span>
          <input
            type="text"
            value={hubUrl}
            onChange={(e) => setHubUrl(e.target.value)}
            placeholder="http://localhost:8888"
          />
        </label>
      </div>
    </div>
  );
}

export default App;
