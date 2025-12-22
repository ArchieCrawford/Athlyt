import LegalDocument from "./LegalDocument";
import { termsText } from "../../legal/terms";

export default function TermsScreen() {
  return <LegalDocument title="Terms of Service" content={termsText} />;
}
