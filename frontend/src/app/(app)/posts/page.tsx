import { FileText, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PostCard } from "@/components/posts/PostCard";
import { PostFilters } from "@/components/posts/PostFilters";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { buttonClass } from "@/components/ui/styles";
import { apiFetch } from "@/lib/api";
import { STATUSES, type Brand, type Post } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("nav"))("posts") };
}

type Search = { brand?: string; platform?: string; status?: string; run?: string };

export default async function PostsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const t = await getTranslations("posts");

  const query = new URLSearchParams();
  if (search.brand) query.set("brand_id", search.brand);
  if (search.platform) query.set("platform", search.platform);
  if (search.status) query.set("status", search.status);
  if (search.run) query.set("generation_run_id", search.run);

  const [posts, brands] = await Promise.all([
    apiFetch<Post[]>(`/posts?${query.toString()}`),
    apiFetch<Brand[]>("/brands"),
  ]);

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Link href="/generate" className={buttonClass.gradient}>
            <Sparkles size={16} /> {t("generateMore")}
          </Link>
        }
      />

      {search.run && (
        <div className="mb-5">
          <Alert tone="success">{t("justGenerated", { count: posts.length })}</Alert>
        </div>
      )}

      <PostFilters brands={brands} statuses={STATUSES} />

      {posts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t("empty.title")}
          body={t("empty.body")}
          action={
            <Link href="/generate" className={buttonClass.gradient}>
              <Sparkles size={16} /> {t("empty.action")}
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
