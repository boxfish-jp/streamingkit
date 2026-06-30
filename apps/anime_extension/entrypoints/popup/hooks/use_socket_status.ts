import { useCallback, useEffect, useState } from "react";

export const useSocketStatus = (): boolean => {
  const [isConnected, setIsConnected] = useState(false);

  const checkStatus = useCallback(() => {
    chrome.runtime.sendMessage({ type: "getConnectionStatus" }, (response) => {
      setIsConnected(response?.connected ?? false);
    });
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return isConnected;
};
