import LegalDocument from "./LegalDocument";
import { communityText } from "../../legal/community";

export default function CommunityGuidelinesScreen() {
  return <LegalDocument title="Community Guidelines" content={communityText} />;
}
