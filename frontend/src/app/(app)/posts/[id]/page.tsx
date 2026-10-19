import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PostEditor } from "@/components/posts/PostEditor";
import { PostSidePanel } from "@/components/posts/PostSidePanel";
import { PlatformBadge } from "@/components/ui/Badges";
import { ApiError, apiFetch } from "@/lib/api";
import type { PostDetail } from "@/lib/types";

// Claude kan er even over doen; geef de server actions op deze pagina ruim de tijd (seconden)
export const maxDuration = 300;

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("posts"))("detailTitle") };
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("posts");

  let post: PostDetail;
  try {
    post = await apiFetch<PostDetail>(`/posts/${Number(id)}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 422)) notFound();
    throw e;
  }

  return (
    <div>
      <Link href="/posts" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
        <ArrowLeft size={16} /> {t("backToPosts")}
      </Link>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold sm:text-3xl">{post.brand_name}</h1>
        <PlatformBadge platform={post.platform} />
      </div>

      {/* key: na herschrijven of terugzetten opnieuw vullen met de nieuwe tekst */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <PostEditor key={post.updated_at} post={post} />
        <PostSidePanel post={post} />
      </div>
    </div>
  );
}
