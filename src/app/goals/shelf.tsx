import { Redirect } from "expo-router";

export default function Screen() {
  return (
    <Redirect href={{ pathname: "/apk/[page]", params: { page: "shelf" } }} />
  );
}
