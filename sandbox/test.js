import { useEffect } from "react";

const foo = 42;
function fetchData() {}
useEffect(() => {
  fetchData();
  console.log(foo);
}, []); // eslint-disable-line react-hooks/exhaustive-deps

function Component(props) {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log(count);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

function Component1(props) {
  const [count, setCount] = useState(0);
  const handleClick = useCallback(() => {
    console.log(count);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    props.userId;
    handleClick();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

const config = { url: "/api" };
const list   = [1, 2, 3];
useEffect(() => {
  console.log(config.url);
  console.log(list.length);
}, [config.url]); // eslint-disable-line react-hooks/exhaustive-deps

const flag = true;
const nums = [10, 20];
const doOn = (data) => {};
const doOff = (data) => {};
useEffect(() => {
  if (flag) {
    nums.forEach(n => console.log(n));
  }
  const msg = flag ? "on" : "off";
  switch (msg) {
    case "on":  doOn();  break;
    case "off": doOff(); break;
  }
}, []); // eslint-disable-line react-hooks/exhaustive-deps

const api = { fetch: () => {} };
const process = (data) => {};
useEffect(() => {
  api.fetch().then(res => process(res.data));
}, []); // eslint-disable-line react-hooks/exhaustive-deps