import { getRequest } from "@/lib/api";
import { GetServerSidePropsContext } from "next";
import { getServerSideSitemap } from "next-sitemap";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const posts = await getRequest({ endpoint: "/posts" });
  const newsSitemaps = posts.data?.map((item: Post) => ({
    loc: `${process.env.NEXT_PUBLIC_URL}/${item.slug}`,
    lastmod: item.updatedAt,
    news: {
      title: item.title,
      publicationName: "Dev Community",
      publicationLanguage: item.locale,
      date: new Date(item.createdAt),
    },
  }));

  const fields = [...newsSitemaps];

  return getServerSideSitemap(ctx, fields);
};

export default function Site() {}
