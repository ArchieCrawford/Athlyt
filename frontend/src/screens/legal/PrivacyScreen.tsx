import LegalDocument from "./LegalDocument";
import { privacyText } from "../../legal/privacy";

export default function PrivacyScreen() {
  return <LegalDocument title="Privacy Policy" content={privacyText} />;
}
