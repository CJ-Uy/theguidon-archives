import AdminUploadForm from "@/components/admin/upload-form";

export const metadata = { title: "Upload Issue | Admin" };
export const dynamic = "force-dynamic";

export default function AdminUploadPage() {
  return <AdminUploadForm />;
}
