import { useCallback, useEffect, useState } from "react";

export const useStorageState = <T>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] => {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    chrome.storage.local.get([key], (result: Record<string, unknown>) => {
      setValue((result[key] as T) ?? defaultValue);
    });
  }, [key, defaultValue]);

  const setValueAndPersist = useCallback(
    (newValue: T) => {
      setValue(newValue);
      chrome.storage.local.set({ [key]: newValue });
    },
    [key],
  );

  return [value, setValueAndPersist];
};
