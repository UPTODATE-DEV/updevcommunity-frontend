import { API } from "@/config/url";
import useStore from "@/hooks/useStore";
import AddIcon from "@mui/icons-material/Add";
import CircularProgress from "@mui/material/CircularProgress";
import Fab from "@mui/material/Fab";
import Stack from "@mui/material/Stack";
import axios from "axios";
import dynamic from "next/dynamic";
import qs from "qs";
import React, { useEffect } from "react";
import useSWRInfinite from "swr/infinite";

const HomeFeedSkeleton = dynamic(
  import("@/components/middle/Skeleton").then((mod) => mod.HomeFeedSkeleton),
  { ssr: false }
);
const PostsListSkeleton = dynamic(() => import("@/components/posts/Skeleton").then((mod) => mod.PostsListSkeleton), {
  ssr: false,
});
const QuestionsListSkeleton = dynamic(
  () => import("@/components/questions/Skeleton").then((mod) => mod.QuestionsListSkeleton),
  { ssr: false }
);
const ModalCreation = dynamic(import("@/components/common/ModalCreation"), {
  ssr: false,
  loading: () => <PostsListSkeleton />,
});
const PostCard = dynamic(import("@/components/posts/PostCard"), { ssr: false });
const QuestionCard = dynamic(import("@/components/questions/QuestionCard"), {
  ssr: false,
});

const Empty = dynamic(import("@/components/common/Empty"), {
  ssr: false,
  loading: () => <HomeFeedSkeleton />,
});

const HomeFeed = () => {
  const [open, setOpen] = React.useState(false);
  const session = useStore((state) => state.session?.user);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [endOfPage, setEndOfPage] = React.useState(false);
  const [perPage, setPerPage] = React.useState(5);
  const [type, setType] = React.useState<"QUESTION" | "ARTICLE" | undefined>();

  const handleClose = () => setOpen(false);

  const fetcher = async (url: string, params: any): Promise<any> => {
    const { data } = await axios.get(url, {
      baseURL: API,
    });
    return data;
  };

  const getKey = (pageIndex: number, previousPageData: Post[]) => {
    const params = qs.stringify({ perPage, type });
    if (previousPageData && !previousPageData.length) {
      setEndOfPage(true);
      return null;
    }
    return `/users/${session?.id}/feed?page=${pageIndex + 1}&${params}`;
  };

  // const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<Post[], any>(getKey, fetcher);

  // useEffect(() => {
  //   const handleScroll = () => {
  //     if (window.innerHeight + document.documentElement.scrollTop > document.documentElement.offsetHeight - 400) {
  //       if (!endOfPage) {
  //         setCurrentPage(currentPage + 1);
  //       }
  //     }
  //   };
  //   window.addEventListener("scroll", handleScroll);
  //   return () => window.removeEventListener("scroll", handleScroll);
  // }, [currentPage]);

  // useEffect(() => {
  //   setSize(size + 1);
  // }, [currentPage]);

  /**
   * @maurice 
   */
  const { data, size, setSize, isLoading, isValidating, mutate } = useSWRInfinite<Post[], any>(getKey, fetcher);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop > document.documentElement.offsetHeight - 400) {
        if (!isValidating && !endOfPage) {
          setCurrentPage(currentPage + 1);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isValidating, endOfPage]);

  useEffect(() => {
    if (!isValidating && !endOfPage) {
      setSize(size + 1).then((newSize: any) => {
        if (newSize === size) {
          setEndOfPage(true);
        }
      });
    }
  }, [currentPage]);

  /**
   * @end_fn
   */

  return (
    <Stack spacing={2}>
      {size === 0 && <Empty />}
      {isLoading && <HomeFeedSkeleton />}
      <ModalCreation open={open} handleClose={handleClose} />

      {data?.map((posts: Post[], index: number) => {
        return posts.map((item, i) => (
          <React.Fragment key={item.id}>
            {item.type === "ARTICLE" ? <PostCard data={item} /> : <QuestionCard data={item} />}
          </React.Fragment>
        ));
      })}

      {isValidating && (
        <Stack sx={{ display: "flex", width: 1, my: 6 }} alignItems="center">
          <CircularProgress />
        </Stack>
      )}

      {session && (
        <Fab
          color="primary"
          onClick={() => setOpen(true)}
          aria-label="add"
          sx={{ position: "sticky", bottom: 20, alignSelf: "end" }}
        >
          <AddIcon />
        </Fab>
      )}
    </Stack>
  );
};

export default HomeFeed;
