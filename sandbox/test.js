import { useEffect, useMemo } from "react";

function Component() {
  const fetchData = () => {};
  const fetchData1 = () => {};
  const fetchData2 = () => {};
  useEffect(() => {
    fetchData();
    fetchData1();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fetchData: memoized

  useMemo(() => {
    fetchData2();
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
