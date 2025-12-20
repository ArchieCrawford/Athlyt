import { useEffect, useState } from "react";
import AuthDetails from "../../components/auth/details";
import AuthMenu from "../../components/auth/menu";
import Screen from "../../components/layout/Screen";

export default function AuthScreen({ route }: any) {
  const mode = route?.params?.mode as "login" | "signup" | undefined;

  const [authPage, setAuthPage] = useState<0 | 1>(0);
  const [detailsPage, setDetailsPage] = useState(false);
  const [menuMessage, setMenuMessage] = useState("");

  useEffect(() => {
    if (mode === "signup") setAuthPage(1);
    if (mode === "login") setAuthPage(0);
  }, [mode]);

  return (
    <Screen>
      {detailsPage ? (
        <AuthDetails
          authPage={authPage}
          setAuthPage={setAuthPage}
          setMenuMessage={setMenuMessage}
          setDetailsPage={setDetailsPage}
        />
      ) : (
        <AuthMenu
          authPage={authPage}
          menuMessage={menuMessage}
          setAuthPage={setAuthPage}
          setDetailsPage={setDetailsPage}
        />
      )}
    </Screen>
  );
}
