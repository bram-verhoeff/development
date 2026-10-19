"use client";

import { AnimatePresence, motion } from "motion/react";

import type { Post } from "@/lib/types";

import { PostCard } from "./PostCard";

// Raster met posts: komen gespreid binnen en schuiven netjes op als er een verdwijnt
export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <AnimatePresence mode="popLayout" initial={true}>
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: Math.min(index, 12) * 0.04 } }}
            exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
