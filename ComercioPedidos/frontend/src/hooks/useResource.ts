import { useEffect, useState } from "react";
import { errorMessage } from "../lib/problem";

export function useResource<T>(load: () => Promise<T>) {
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<{
    load: typeof load;
    revision: number;
    data?: T;
    error: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    load()
      .then((data) => {
        if (active) setResult({ load, revision, data, error: "" });
      })
      .catch((error: unknown) => {
        if (active) setResult({ load, revision, error: errorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [load, revision]);
  const current = result?.load === load && result.revision === revision;
  return {
    data: current ? result.data : undefined,
    error: current ? result.error : "",
    loading: !current,
    refresh: () => setRevision((value) => value + 1),
  };
}
