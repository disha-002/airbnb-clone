import HostProfileView from "@/components/HostProfileView";

export const metadata = { title: "Profile · Airbnb" };

export default function UserProfilePage({ params }: { params: { id: string } }) {
  return <HostProfileView id={Number(params.id)} />;
}
