import useStore from "@/hooks/useStore";
import useUser from "@/hooks/useUser";
import { deleteRequest, getRequest, patchRequest } from "@/lib/api";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DraftsIcon from "@mui/icons-material/Drafts";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryEduIcon from "@mui/icons-material/HistoryEdu";
import QuestionAnswer from "@mui/icons-material/QuestionAnswerSharp";
import TagIcon from "@mui/icons-material/Tag";
import WebStoriesIcon from "@mui/icons-material/WebStories";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Fab from "@mui/material/Fab";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import React from "react";
import { toast } from "react-toastify";
import useStoreNoPersist from "../../hooks/useStoreNoPersist";
import DraftCard from "./DraftCard";
import PostCard from "./PostCard";
import QuestionCard from "./QuestionCard";
import SeriesListCard from "./SeriesListCard";
import Sweetalert2 from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const Swal = withReactContent(Sweetalert2);
const Badges = dynamic(import("./profileTabs/Badges"), {
  ssr: false,
  loading: () => null,
});

const FollowedTags = dynamic(import("./profileTabs/FollowedTags"), {
  ssr: false,
  loading: () => null,
});

const Empty = dynamic(import("@/components/common/Empty"), {
  ssr: false,
  loading: () => null,
});

const CreateSeries = dynamic(import("./CreateSeries"), { ssr: false });

const Dashboard = dynamic(import("./Dashboard"), { ssr: false });

const ProfileTabs = ({ showProfileUser }: { showProfileUser?: User }) => {
  const sessionUser = useStore((state) => state.session?.user);
  const user = useUser(sessionUser?.id);
  const [alert, setAlert] = React.useState(null);

  const { profileTab, setProfileTab, setSeries, series } = useStore(
    (state) => state
  );
  const [posts, setPosts] = React.useState<Post[] | []>([]);
  const [followedTags, setFollowedTags] = React.useState<Tags[] | []>([]);
  const { locale } = useRouter();
  const [badges, setBadges] = React.useState<Badge[] | []>([]);
  const { openAddSeries, setToggleAddSeries, setCurrentSeries } =
    useStoreNoPersist((state) => state);

  const isMobile = useMediaQuery("(min-width:760px)");

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      show: showProfileUser === undefined && user?.role === "AUTHOR",
      icon: <DashboardIcon fontSize='small' />,
    },
    {
      id: "articles",
      label: "Articles",
      show: true,
      icon: <HistoryEduIcon fontSize='small' />,
    },
    {
      id: "posts",
      label: "Posts",
      show: true,
      icon: <QuestionAnswer fontSize='small' />,
    },
    {
      id: "series",
      label: locale === "en" ? "Series" : "Séries",
      show: true,
      icon: <WebStoriesIcon fontSize='small' />,
    },
    {
      id: "tags",
      label: "Tags",
      show: showProfileUser ? false : true,
      icon: <TagIcon fontSize='small' />,
    },
    {
      id: "drafts",
      label: "Drafts",
      show: showProfileUser ? false : true,
      icon: <DraftsIcon fontSize='small' />,
    },
    {
      id: "badges",
      label: locale === "en" ? "Badges" : "Badges",
      show: true,
      icon: <EmojiEventsIcon fontSize='small' />,
    },
  ];

  const questions = posts.filter((el) => !el.draft && el.type === "QUESTION");
  const articles = posts.filter((el) => !el.draft && el.type === "ARTICLE");
  const drafts = posts.filter((el) => el.draft);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setProfileTab(newValue);
  };

  const handleTagClick = async (tag: string) => {
    await patchRequest({ endpoint: `/tags/follow/${tag}/${sessionUser?.id}` });
    setFollowedTags((state) => state.filter((el) => el.tag.name !== tag));
  };

  const handleDeletePost = async (id: string) => {
    Swal.fire({
      title: "Are you sure ?",
      text: "Are you sure you want to delete this post ?",
      icon: "question",
      reverseButtons: true,
      showCancelButton: true,
      confirmButtonText: "Yes!",
      cancelButtonText: "No!",
    }).then(async ({ isConfirmed }) => {
      if (isConfirmed) {
        Swal.showLoading();
        const response = await deleteRequest({ endpoint: `/posts/${id}` });
        if (response.error) {
          toast.error(response.error?.message);
        }
        if (response.data) {
          setPosts(posts.filter((el) => el.id !== response.data?.id) as Post[]);
        }
        Swal.hideLoading();
      }
    });
  };

  const handleDeleteSeries = async (id: string) => {
    const response = await deleteRequest({ endpoint: `/posts/series/${id}` });
    if (response.error) {
      toast.error(response.error?.message);
    }
    setSeries(series.filter((el) => el.id !== id));
  };

  function handleShowCreateSeries() {
    if (openAddSeries) {
      setCurrentSeries(null);
    }
    setToggleAddSeries();
  }

  const handleEditSeries = (seriesId: string) => {
    setToggleAddSeries();
    setCurrentSeries(seriesId);
  };

  const fetchData = async () => {
    const getPosts = getRequest({
      endpoint: `/posts/author/${showProfileUser?.id || sessionUser?.id}`,
    });
    const getSeries = getRequest({
      endpoint: `/posts/series?userId=${
        showProfileUser?.id || sessionUser?.id
      }`,
    });
    const [posts, series] = await Promise.all([getPosts, getSeries]);

    setPosts(posts.data);
    setSeries(series.data);
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  React.useEffect(() => {
    if (!profileTab) {
      if (showProfileUser === undefined && user?.role === "AUTHOR") {
        setProfileTab("dashboard");
      } else {
        setProfileTab("articles");
      }
    }
  }, [user?.role]);

  if (!profileTab) return null;

  return (
    <TabContext value={profileTab}>
      <TabList
        onChange={handleTabChange}
        scrollButtons
        allowScrollButtonsMobile
        variant={isMobile ? "fullWidth" : "scrollable"}
        aria-label='Show reactions'
        sx={{ border: 1, borderColor: "divider", bgcolor: "background.paper" }}
      >
        {tabs
          .filter((el) => el.show)
          .map((item, i) => (
            <Tab
              icon={item.icon}
              key={item.id}
              iconPosition='start'
              sx={{ minHeight: 50 }}
              label={
                <Typography textTransform='capitalize'>{item.label}</Typography>
              }
              value={item.id}
            />
          ))}
      </TabList>
      <TabPanel sx={{ p: 0 }} value={"posts"}>
        <Stack spacing={2}>
          {questions.length === 0 && <Empty />}
          {questions?.map((item, index) => (
            <React.Fragment key={item.id}>
              <QuestionCard
                handleDeletePost={() => handleDeletePost(item.id)}
                data={item}
              />
            </React.Fragment>
          ))}
        </Stack>
      </TabPanel>
      <TabPanel sx={{ p: 0 }} value={"articles"}>
        <Stack spacing={2}>
          {articles.length === 0 && <Empty />}
          {articles?.map((item, index) => (
            <React.Fragment key={item.id}>
              <PostCard
                handleDeletePost={() => handleDeletePost(item.id)}
                data={item}
              />
            </React.Fragment>
          ))}
        </Stack>
      </TabPanel>
      <TabPanel sx={{ p: 0 }} value={"series"}>
        <Stack spacing={2} sx={{ position: "relative" }}>
          {!openAddSeries && series?.length === 0 && <Empty />}
          {openAddSeries && <CreateSeries />}
          {!openAddSeries &&
            series.map((item, index) => (
              <React.Fragment key={item.id}>
                <SeriesListCard
                  handleEditSeries={() => handleEditSeries(item.id)}
                  handleDeleteSeries={() => handleDeleteSeries(item.id)}
                  data={item.posts[0]?.post}
                />
              </React.Fragment>
            ))}

          {!showProfileUser && sessionUser?.id && (
            <Fab
              color={openAddSeries ? "error" : "primary"}
              onClick={handleShowCreateSeries}
              aria-label='add'
              sx={{ position: "sticky", bottom: 20, alignSelf: "flex-end" }}
            >
              {openAddSeries ? <CloseIcon /> : <AddIcon />}
            </Fab>
          )}
        </Stack>
      </TabPanel>
      <Badges userId={showProfileUser?.id || sessionUser?.id} />
      <FollowedTags userId={showProfileUser?.id || sessionUser?.id} />
      {!showProfileUser && (
        <>
          <TabPanel sx={{ p: 0 }} value={"drafts"}>
            <Stack spacing={2}>
              {drafts.length === 0 && <Empty />}
              {drafts?.map((item, index) => (
                <React.Fragment key={item.id}>
                  <DraftCard
                    handleDeletePost={() => handleDeletePost(item.id)}
                    data={item}
                  />
                </React.Fragment>
              ))}
            </Stack>
          </TabPanel>
          {showProfileUser === undefined && user?.role === "AUTHOR" && (
            <TabPanel sx={{ p: 0 }} value={"dashboard"}>
              <Paper variant='outlined' sx={{ p: 2, minHeight: "200px" }}>
                <Dashboard />
              </Paper>
            </TabPanel>
          )}
        </>
      )}
    </TabContext>
  );
};

export default ProfileTabs;
