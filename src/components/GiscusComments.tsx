"use client";

import Giscus from "@giscus/react";

export default function GiscusComments() {
  return (
    <div className="mt-10 border-t pt-10">
      <Giscus
        id="comments"
        repo="sushant-lessgo/blog-comments"
        repoId="R_kgDOOepHyw"
        category="General"
        categoryId="DIC_kwDOOepHy84CpZFa"
        mapping="pathname"
        reactionsEnabled="1"
        emitMetadata="0"
        inputPosition="bottom"
        theme="preferred_color_scheme"
        lang="en"
      />
    </div>
  );
}
