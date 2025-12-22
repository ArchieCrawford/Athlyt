import LegalDocument from "./LegalDocument";
import { athleteContentLicenseText } from "../../legal/athleteContentLicense";

export default function AthleteContentLicenseScreen() {
  return (
    <LegalDocument
      title="Athlete Content License"
      content={athleteContentLicenseText}
    />
  );
}
